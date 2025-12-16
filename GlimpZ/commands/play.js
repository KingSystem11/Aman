const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../helpers/musicHelpers');
const config = require('../config');
const emojis = require('../emojis.json');

function detectPlatform(query) {
    const q = query.toLowerCase();
    if (q.includes('spotify.com') || q.includes('spotify:')) return 'Spotify';
    if (q.includes('music.apple.com') || q.includes('itunes.apple.com')) return 'Apple Music';
    if (q.includes('soundcloud.com') || q.includes('snd.sc')) return 'SoundCloud';
    if (q.includes('deezer.com') || q.includes('deezer.page.link')) return 'Deezer';
    if (q.includes('youtube.com') || q.includes('youtu.be') || q.includes('music.youtube.com')) return 'YouTube';
    return null;
}

function isPlaylistUrl(query, platform) {
    const q = query.toLowerCase();
    switch (platform) {
        case 'Spotify':
            return /spotify\.com\/(playlist|album)/i.test(q) || /spotify:(playlist|album):/i.test(q);
        case 'Apple Music':
            return /music\.apple\.com\/.*\/(playlist|album)/i.test(q);
        case 'SoundCloud':
            return /soundcloud\.com\/.*\/(sets|albums)/i.test(q);
        case 'Deezer':
            return /deezer\.com\/.*\/(playlist|album)/i.test(q);
        case 'YouTube':
            return /[?&]list=/i.test(q);
        default:
            return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or add it to the queue')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Song title or URL (YouTube, Spotify, Apple Music, SoundCloud, Deezer)')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    
    async autocomplete(interaction) {
        const { client } = interaction;
        const focusedValue = interaction.options.getFocused();

        const platform = detectPlatform(focusedValue);
        if (platform) {
            const truncatedUrl = focusedValue.length > 55 ? focusedValue.slice(0, 52) + '...' : focusedValue;
            return interaction.respond([{ 
                name: `Play ${platform}: ${truncatedUrl}`, 
                value: focusedValue 
            }]);
        } else if (/^https?:\/\//.test(focusedValue)) {
            const truncatedUrl = focusedValue.length > 70 ? focusedValue.slice(0, 67) + '...' : focusedValue;
            return interaction.respond([{ 
                name: `Play from URL: ${truncatedUrl}`, 
                value: focusedValue 
            }]);
        }

        if (!client._musicAutocompleteCache) client._musicAutocompleteCache = new Map();
        const searchCache = client._musicAutocompleteCache;

        if (searchCache.has(focusedValue)) {
            return interaction.respond(searchCache.get(focusedValue));
        }

        if (!focusedValue || focusedValue.trim().length === 0) {
            return interaction.respond([]);
        }

        if (!client.poru || typeof client.poru.resolve !== 'function') {
            return interaction.respond([]);
        }

        try {
            let source = config.MUSIC.DEFAULT_PLATFORM || 'ytsearch';
            const res = await client.poru.resolve({ query: focusedValue, source: source, requester: interaction.user });
            if (!res || !res.tracks || !Array.isArray(res.tracks) || res.tracks.length === 0) {
                return interaction.respond([]);
            }
            const choices = res.tracks.slice(0, config.MUSIC.AUTOCOMPLETE_LIMIT).map((choice) => ({
                name: `${choice.info.title.length > 85 ? choice.info.title.slice(0, 82) + '…' : choice.info.title} [${formatDuration(choice.info.length)}]`,
                value: choice.info.uri,
            }));
            searchCache.set(focusedValue, choices);
            return interaction.respond(choices);
        } catch (e) {
            return interaction.respond([]);
        }
    },

    async execute(interaction) {
        const { client, member, guild, options, channel } = interaction;
        
        if (!member.voice.channel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You need to be in a voice channel to play music!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();
        const query = options.getString('search');
        const platform = detectPlatform(query);

        if (platform === 'Spotify' && (!config.SPOTIFY.CLIENT_ID || !config.SPOTIFY.CLIENT_SECRET)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Spotify is not configured by the bot owner.`);
            return interaction.editReply({ embeds: [embed] });
        }

        if (platform && !config.MUSIC.SOURCES?.[platform.replace(' ', '_').toUpperCase()]) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} ${platform} is not enabled.`);
            return interaction.editReply({ embeds: [embed] });
        }

        let res;
        try {
            res = await client.poru.resolve({ query, requester: interaction.user });
        } catch (e) {
            console.error('Poru resolve error:', e);
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Failed to search: ${e?.message || 'Unknown error'}`);
            return interaction.editReply({ embeds: [embed] });
        }

        const isExternalPlaylist = platform && isPlaylistUrl(query, platform);
        if (isExternalPlaylist) {
            if (!res || (res.loadType !== 'PLAYLIST_LOADED' && res.loadType !== 'playlist') || !Array.isArray(res.tracks) || res.tracks.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} No results found or invalid playlist.`);
                return interaction.editReply({ embeds: [embed] });
            }

            const player = client.poru.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            });

            if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;

            for (const track of res.tracks) {
                track.info.requester = interaction.user;
                player.queue.add(track);
            }

            if (!player.isPlaying && player.isConnected) player.play();

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`${emojis.music} ${platform} Playlist: ${res.playlistInfo?.name || 'Playlist'}`)
                .setDescription(`Added **${res.tracks.length}** tracks to the queue!`);
            
            return interaction.editReply({ embeds: [embed] });
        }

        if (res.loadType === 'search') {
            const filteredTracks = res.tracks.filter((track) => !track.info.isStream && track.info.length > 70000);
            if (!filteredTracks.length) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} No results found (filtered out shorts).`);
                return interaction.editReply({ embeds: [embed] });
            }
            res.tracks = filteredTracks;
        }

        if (res.loadType === 'error') {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Failed to load: ${res.exception?.message || 'Unknown error'}`);
            return interaction.editReply({ embeds: [embed] });
        }

        if (res.loadType === 'empty') {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} No results found.`);
            return interaction.editReply({ embeds: [embed] });
        }

        const player = client.poru.createConnection({
            guildId: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
            deaf: true,
        });

        if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;

        if (res.loadType === 'playlist' || res.loadType === 'PLAYLIST_LOADED') {
            for (const track of res.tracks) {
                track.info.requester = interaction.user;
                player.queue.add(track);
            }

            if (!player.isPlaying && player.isConnected) player.play();

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`${emojis.music} Playlist ${res.playlistInfo?.name || 'Playlist'}`)
                .setDescription(`Added **${res.tracks.length}** tracks to the queue!`);

            return interaction.editReply({ embeds: [embed] });
        } else {
            const track = res.tracks[0];
            track.info.requester = interaction.user;
            player.queue.add(track);

            if (!player.isPlaying && player.isConnected) player.play();

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`${emojis.success} Added **[${track.info.title}](${track.info.uri})** to the queue!`);

            return interaction.editReply({ embeds: [embed] });
        }
    },
};
