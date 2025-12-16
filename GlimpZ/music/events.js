const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder, StringSelectMenuBuilder } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const { MusicCard } = require('../helpers/MusicCard');
const Favorite = require('../../database/models/Favorite');
const config = require('../config');
const emojis = require('../emojis.json');


const musicCard = new MusicCard();

function setupMusicEvents(client) {
    client.poru.on('trackStart', async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (!channel) return;

        player._lastPlayedTrack = track;
        
        if (!player._autoplayHistory) {
            player._autoplayHistory = new Set();
        }
        if (track.info?.identifier) {
            player._autoplayHistory.add(track.info.identifier);
        }

        if (player.nowPlayingMessage && player.nowPlayingMessage.deletable) {
            try {
                await player.nowPlayingMessage.delete().catch(() => {});
            } catch (e) {}
            player.nowPlayingMessage = null;
        }

        if (player.updateInterval) clearInterval(player.updateInterval);

        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('newTrack');
            } catch (e) {}
            player.buttonCollector = null;
        }

        const duration = track.info.length || 0;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const requester = track.info.requester;
        const requesterMention = requester ? `<@${requester.id}>` : 'Unknown';
        const authorName = track.info.author || 'Unknown Artist';
        const trackTitle = track.info.title || 'Unknown Track';

        const nowPlayingText = `${emojis.music} **Now Playing...**\n\n` +
            `**Author:** ${authorName}\n` +
            `**Title:** [${trackTitle}](${track.info.uri})\n` +
            `**Requested By:** ${requesterMention}\n` +
            `**Duration:** \`${durationStr}\``;

        function getFirstControlButtonRow(isPaused, disabled = false) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause_resume')
                    .setEmoji(isPaused ? emojis.play : emojis.pause)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setEmoji(emojis.skip)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setEmoji(emojis.stop)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_loop')
                    .setEmoji(emojis.loop)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_autoplay')
                    .setEmoji(emojis.autoplay)
                    .setStyle(player.autoplayEnabled ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled)
            );
        }

        function getSecondControlButtonRow(disabled = false) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('music_lyrics')
                    .setEmoji(emojis.lyrics)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setEmoji(emojis.queue)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_shuffle')
                    .setEmoji(emojis.shuffle)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId('music_favorite_add')
                    .setEmoji(emojis.favorite)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disabled)
            );
        }

        function getFilterSelectRow(disabled = false) {
            const filterOptions = [
                { label: 'Nightcore', description: 'Speed up with higher pitch', value: 'nightcore' },
                { label: 'Vaporwave', description: 'Slow down with lower pitch', value: 'vaporwave' },
                { label: 'Bassboost', description: 'Enhanced bass frequencies', value: 'bassboost' },
                { label: '8D Audio', description: 'Surround sound effect', value: 'eightD' },
                { label: 'Karaoke', description: 'Remove vocals from track', value: 'karaoke' },
                { label: 'Vibrato', description: 'Vibrating sound effect', value: 'vibrato' },
                { label: 'Tremolo', description: 'Volume oscillation effect', value: 'tremolo' },
                { label: 'Slowed', description: 'Slower playback speed', value: 'slowed' },
                { label: 'Distortion', description: 'Distorted audio effect', value: 'distortion' },
                { label: 'Pop', description: 'Optimized for pop music', value: 'pop' },
                { label: 'Soft', description: 'Softer, mellower sound', value: 'soft' },
                { label: 'Reset Filters', description: 'Clear all applied filters', value: 'reset' },
            ];

            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('music_filter_select')
                    .setPlaceholder('Select a filter...')
                    .setDisabled(disabled)
                    .addOptions(filterOptions)
            );
        }

        let firstControlButtonRow = getFirstControlButtonRow(false, false);
        let secondControlButtonRow = getSecondControlButtonRow(false);
        let filterSelectRow = getFilterSelectRow(false);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(nowPlayingText);
        
        let musicCardAttachment = null;

        
        if (config.MUSIC.ARTWORK_STYLE === 'MusicCard') {
            
            try {
                let isLiked = false;
                try {
                    const trackIdentifier = track.info?.identifier || track.identifier;
                    if (trackIdentifier && track.info.requester?.id) {
                        const favorite = await Favorite.findOne({
                            where: {
                                userId: track.info.requester.id,
                                identifier: trackIdentifier
                            }
                        });
                        isLiked = !!favorite;
                    }
                } catch (err) {}

                const guild = channel.guild;
                const guildIcon = guild?.iconURL({ extension: 'png', size: 128 });

                const imageBuffer = await musicCard.generateNowPlayingCard({
                    track: track,
                    position: player.position || 0,
                    isLiked: isLiked,
                    guildName: guild?.name || 'Discord Server',
                    guildIcon: guildIcon,
                    player: player
                });

                
                musicCardAttachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.png' });
                embed.setImage('attachment://nowplaying.png');
            } catch (error) {
                console.error('Error generating MusicCard:', error);
            }
        } else {
            
            if (track.info.artworkUrl || track.info.image) {
                embed.setImage(track.info.artworkUrl || track.info.image);
            }
        }

        try {
            const messageOptions = {
                embeds: [embed],
                components: [filterSelectRow, firstControlButtonRow, secondControlButtonRow],
            };

            
            if (musicCardAttachment) {
                messageOptions.files = [musicCardAttachment];
            }

            const message = await channel.send(messageOptions);
            player.nowPlayingMessage = message;

            const buttonFilter = (i) => i.isButton() && i.message.id === message.id && i.guildId === player.guildId && i.customId.startsWith('music_');
            const buttonCollector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: buttonFilter,
            });
            player.buttonCollector = buttonCollector;

            const selectFilter = (i) => i.isStringSelectMenu() && i.message.id === message.id && i.customId === 'music_filter_select';
            const selectCollector = message.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                filter: selectFilter,
            });

            selectCollector.on('collect', async (interaction) => {
                if (!interaction.member.voice.channelId || interaction.member.voice.channelId !== player.voiceChannel) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} You must be in the same voice channel as the bot!`);
                    return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }

                const { customFilter } = require('poru');
                if (!(player.filters instanceof customFilter)) {
                    player.filters = new customFilter(player);
                }

                const filterId = interaction.values[0];
                let applied = false;
                let filterName = filterId;

                try {
                    switch (filterId) {
                        case 'reset':
                            player.filters.clearFilters(true);
                            await player.filters.updateFilters();
                            const resetEmbed = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setDescription(`${emojis.success} All filters have been reset!`);
                            return interaction.reply({ embeds: [resetEmbed], ephemeral: true });
                        case 'nightcore':
                            player.filters.setNightcore(true);
                            filterName = 'Nightcore';
                            applied = true;
                            break;
                        case 'vaporwave':
                            player.filters.setVaporwave(true);
                            filterName = 'Vaporwave';
                            applied = true;
                            break;
                        case 'bassboost':
                            player.filters.setBassboost(true);
                            filterName = 'Bassboost';
                            applied = true;
                            break;
                        case 'eightD':
                            player.filters.set8D(true);
                            filterName = '8D Audio';
                            applied = true;
                            break;
                        case 'karaoke':
                            player.filters.setKaraoke(true);
                            filterName = 'Karaoke';
                            applied = true;
                            break;
                        case 'vibrato':
                            player.filters.setVibrato(true);
                            filterName = 'Vibrato';
                            applied = true;
                            break;
                        case 'tremolo':
                            player.filters.setTremolo(true);
                            filterName = 'Tremolo';
                            applied = true;
                            break;
                        case 'slowed':
                            player.filters.setSlowmode(true);
                            filterName = 'Slowed';
                            applied = true;
                            break;
                        case 'distortion':
                            player.filters.setDistortion(true);
                            filterName = 'Distortion';
                            applied = true;
                            break;
                        case 'pop':
                            player.filters.setEqualizer([
                                { band: 1, gain: 0.35 },
                                { band: 2, gain: 0.25 },
                                { band: 3, gain: 0.0 },
                                { band: 4, gain: -0.25 },
                                { band: 5, gain: -0.3 },
                                { band: 6, gain: -0.2 },
                                { band: 7, gain: -0.1 },
                                { band: 8, gain: 0.15 },
                                { band: 9, gain: 0.25 },
                            ]);
                            filterName = 'Pop';
                            applied = true;
                            break;
                        case 'soft':
                            player.filters.setEqualizer([
                                { band: 0, gain: 0 },
                                { band: 1, gain: 0 },
                                { band: 2, gain: 0 },
                                { band: 3, gain: 0 },
                                { band: 4, gain: 0 },
                                { band: 5, gain: 0 },
                                { band: 6, gain: 0 },
                                { band: 7, gain: 0 },
                                { band: 8, gain: -0.25 },
                                { band: 9, gain: -0.25 },
                                { band: 10, gain: -0.25 },
                                { band: 11, gain: -0.25 },
                                { band: 12, gain: -0.25 },
                                { band: 13, gain: -0.25 },
                            ]);
                            filterName = 'Soft';
                            applied = true;
                            break;
                    }

                    if (applied) {
                        await player.filters.updateFilters();
                        const successEmbed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setDescription(`${emojis.success} Applied **${filterName}** filter!`);
                        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
                    }
                } catch (error) {
                    console.error('Filter error:', error);
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} Failed to apply filter!`);
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            });

            buttonCollector.on('collect', async (interaction) => {
                if (!interaction.member.voice.channelId || interaction.member.voice.channelId !== player.voiceChannel) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`${emojis.error} You must be in the same voice channel as the bot!`);
                    return interaction.reply({ 
                        embeds: [errorEmbed], 
                        ephemeral: true 
                    });
                }

                try {
                    switch (interaction.customId) {
                        case 'music_pause_resume': {
                            player.pause(!player.isPaused);
                            const state = player.isPaused ? `${emojis.pause} Music paused.` : `${emojis.resume} Music resumed.`;
                            const embed = new EmbedBuilder()
                                .setColor(0x5865F2)
                                .setDescription(state);
                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: true 
                            });
                            break;
                        }
                        case 'music_skip': {
                            if (!player.currentTrack) {
                                const embed = new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription(`${emojis.error} Nothing to skip!`);
                                return interaction.reply({ 
                                    embeds: [embed], 
                                    ephemeral: true 
                                });
                            }
                            player.skip();
                            const embed = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setDescription(`${emojis.skip} Skipped the current track.`);
                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: true 
                            });
                            break;
                        }
                        case 'music_stop': {
                            player.queue.clear();
                            player.destroy();
                            const embed = new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription(`${emojis.stop} Stopped music and cleared the queue.`);
                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: true 
                            });
                            break;
                        }
                        case 'music_loop': {
                            let msg;
                            if (player.loop === 'NONE' || !player.loop) {
                                player.setLoop('TRACK');
                                msg = `${emojis.loopTrack} Loop track enabled.`;
                            } else if (player.loop === 'TRACK') {
                                player.setLoop('QUEUE');
                                msg = `${emojis.loop} Queue repeat enabled.`;
                            } else {
                                player.setLoop('NONE');
                                msg = `${emojis.error} Loop disabled.`;
                            }
                            const embed = new EmbedBuilder()
                                .setColor(0x5865F2)
                                .setDescription(msg);
                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: true 
                            });
                            break;
                        }
                        case 'music_autoplay': {
                            player.autoplayEnabled = !player.autoplayEnabled;
                            const embed = new EmbedBuilder()
                                .setColor(0x5865F2)
                                .setDescription(`${emojis.autoplay} Autoplay ${player.autoplayEnabled ? 'enabled' : 'disabled'}.`);
                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: true 
                            });
                            
                            break;
                        }
                        case 'music_lyrics': {
                            await interaction.deferReply({ ephemeral: true });
                            
                            try {
                                if (!player.currentTrack) {
                                    const embed = new EmbedBuilder()
                                        .setColor(0xFF0000)
                                        .setDescription(`${emojis.error} No track is currently playing!`);
                                    return interaction.editReply({ embeds: [embed] });
                                }

                                const track = player.currentTrack;
                            let artist, titleForSearch;
                            const separators = ['-', '–', '|'];
                            let potentialSplit = null;
                            const originalTitle = track.info.title || '';

                            for (const sep of separators) {
                                if (originalTitle.includes(sep)) {
                                    potentialSplit = originalTitle.split(sep);
                                    break;
                                }
                            }

                            if (potentialSplit && potentialSplit.length >= 2) {
                                artist = potentialSplit[0].trim();
                                titleForSearch = potentialSplit.slice(1).join(' ').trim();
                            } else {
                                artist = track.info.author || '';
                                titleForSearch = originalTitle;
                            }

                            const cleanUpRegex = /official|lyric|video|audio|mv|hd|hq|ft|feat/gi;
                            artist = artist.replace(cleanUpRegex, '').trim();
                            titleForSearch = titleForSearch.replace(cleanUpRegex, '').trim();
                            titleForSearch = titleForSearch.replace(/\(.*?\)|\[.*?\]/g, '').trim();

                            let lyrics = null;
                            let foundRecord = null;
                            let embedArtist = artist;
                            let embedTitle = titleForSearch;

                            try {
                                const params = new URLSearchParams();
                                if (titleForSearch) {
                                    params.set('track_name', titleForSearch);
                                } else if (originalTitle) {
                                    params.set('q', originalTitle);
                                }

                                if (artist) params.set('artist_name', artist);

                                const headers = {
                                    'User-Agent': 'AeroX-Music Bot v1.0',
                                };

                                const lrclibUrl = `https://lrclib.net/api/search?${params.toString()}`;
                                const response = await fetch(lrclibUrl, { headers });
                                
                                if (response.status === 200) {
                                    const list = await response.json();
                                    if (Array.isArray(list) && list.length > 0) {
                                        foundRecord = list.find(record => {
                                            return (
                                                record.trackName &&
                                                record.artistName &&
                                                record.trackName.toLowerCase().includes(titleForSearch.toLowerCase()) &&
                                                record.artistName.toLowerCase().includes(artist.toLowerCase())
                                            );
                                        }) || list[0];

                                        if (foundRecord && (foundRecord.plainLyrics || foundRecord.syncedLyrics)) {
                                            lyrics = foundRecord.plainLyrics || foundRecord.syncedLyrics;
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error('LRCLIB API request failed:', e);
                            }

                            if (!lyrics && artist && titleForSearch) {
                                try {
                                    const lyricsOvhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(titleForSearch)}`;
                                    const response = await fetch(lyricsOvhUrl);
                                    
                                    if (response.status === 200) {
                                        const data = await response.json();
                                        if (data && data.lyrics) {
                                            lyrics = data.lyrics;
                                            foundRecord = { source: 'lyrics.ovh' };
                                        }
                                    }
                                } catch (e) {
                                    console.error('Lyrics.ovh API request failed:', e);
                                }
                            }

                            if (!lyrics && config.GENIUS && config.GENIUS.API_KEY) {
                                try {
                                    const Genius = require('genius-lyrics');
                                    const searchQuery = `${artist} ${titleForSearch}`.trim();
                                    
                                    if (searchQuery.length > 0) {
                                        const geniusClient = new Genius.Client(config.GENIUS.API_KEY);
                                        const searches = await geniusClient.songs.search(searchQuery);
                                        
                                        if (searches && searches.length > 0) {
                                            const song = searches[0];
                                            const songLyrics = await song.lyrics();
                                            
                                            if (songLyrics) {
                                                lyrics = songLyrics;
                                                embedArtist = song.artist.name;
                                                embedTitle = song.title;
                                                foundRecord = { source: 'genius' };
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error('Genius API failed:', e.message);
                                }
                            }

                            if (!lyrics) {
                                try {
                                    const embed = new EmbedBuilder()
                                        .setColor(0xFF0000)
                                        .setDescription(`${emojis.error} Could not find lyrics for this song.`);
                                    return await interaction.editReply({ embeds: [embed] });
                                } catch (editError) {
                                    console.error('Failed to send lyrics not found message:', editError);
                                }
                            }

                            const trimmedLyrics = lyrics.length > 3900 ? lyrics.substring(0, 3897) + '...' : lyrics;

                            if (foundRecord && foundRecord.source !== 'genius') {
                                embedArtist = foundRecord.artistName || embedArtist;
                                embedTitle = foundRecord.trackName || embedTitle;
                            }

                            const lyricsSource = foundRecord?.source === 'genius' ? 'genius.com' : foundRecord?.source === 'lyrics.ovh' ? 'lyrics.ovh' : 'lrclib.net';
                            
                            const lyricsEmbed = new EmbedBuilder()
                                .setColor(0x5865F2)
                                .setTitle(`${emojis.lyrics} ${embedArtist} - ${embedTitle}`)
                                .setURL(track.info.uri)
                                .setDescription(trimmedLyrics)
                                .setFooter({ text: `Source: ${lyricsSource}` });

                            return interaction.editReply({ embeds: [lyricsEmbed] });
                            } catch (lyricsError) {
                                console.error('Error in lyrics button handler:', lyricsError);
                                try {
                                    const errorEmbed = new EmbedBuilder()
                                        .setColor(0xFF0000)
                                        .setDescription(`${emojis.error} An error occurred while fetching lyrics.`);
                                    await interaction.editReply({ embeds: [errorEmbed] });
                                } catch (finalError) {
                                    console.error('Failed to send error message:', finalError);
                                }
                            }
                            break;
                        }
                        case 'music_queue': {
                            const currentPlayer = client.poru.players.get(interaction.guildId);
                            if (!currentPlayer || !currentPlayer.currentTrack) {
                                const embed = new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription(`${emojis.error} No music is currently playing!`);
                                return interaction.reply({ 
                                    embeds: [embed], 
                                    ephemeral: true 
                                });
                            }
                            
                            const command = client.commands.get('queue');
                            if (command) {
                                await command.execute(interaction);
                            }
                            break;
                        }
                        case 'music_shuffle': {
                            if (player.queue.length === 0) {
                                const embed = new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription(`${emojis.error} The queue is empty!`);
                                return interaction.reply({ 
                                    embeds: [embed], 
                                    ephemeral: true 
                                });
                            }
                            player.queue.shuffle();
                            const embed = new EmbedBuilder()
                                .setColor(0x00FF00)
                                .setDescription(`${emojis.shuffle} Queue shuffled.`);
                            await interaction.reply({ 
                                embeds: [embed], 
                                ephemeral: true 
                            });
                            break;
                        }
                        case 'music_favorite_add': {
                            const favoriteAddCommand = client.commands.get('favoriteadd');
                            if (favoriteAddCommand) {
                                await favoriteAddCommand.execute(interaction);
                            }
                            break;
                        }
                    }
                } catch (error) {
                    console.error('Button interaction error:', error);
                }
            });

            
            player.updateInterval = setInterval(async () => {
                    if (!player.currentTrack || !player.nowPlayingMessage?.editable) {
                        clearInterval(player.updateInterval);
                        return;
                    }

                    const updatedFirstControlButtonRow = getFirstControlButtonRow(player.isPaused, false);
                    const updatedSecondControlButtonRow = getSecondControlButtonRow(false);

                    const updatedEmbed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setDescription(nowPlayingText);

                    let updatedMusicCardAttachment = null;

                    
                    if (config.MUSIC.ARTWORK_STYLE === 'MusicCard') {
                        
                        try {
                            let isLiked = false;
                            try {
                                const trackIdentifier = track.info?.identifier || track.identifier;
                                if (trackIdentifier && track.info.requester?.id) {
                                    const favorite = await Favorite.findOne({
                                        where: {
                                            userId: track.info.requester.id,
                                            identifier: trackIdentifier
                                        }
                                    });
                                    isLiked = !!favorite;
                                }
                            } catch (err) {}

                            const guild = channel.guild;
                            const guildIcon = guild?.iconURL({ extension: 'png', size: 128 });

                            const imageBuffer = await musicCard.generateNowPlayingCard({
                                track: track,
                                position: player.position || 0,
                                isLiked: isLiked,
                                guildName: guild?.name || 'Discord Server',
                                guildIcon: guildIcon,
                                player: player
                            });

                            
                            updatedMusicCardAttachment = new AttachmentBuilder(imageBuffer, { name: 'nowplaying.png' });
                            updatedEmbed.setImage('attachment://nowplaying.png');
                        } catch (error) {
                            console.error('Error updating MusicCard:', error);
                        }
                    } else {
                        
                        if (track.info.artworkUrl || track.info.image) {
                            updatedEmbed.setImage(track.info.artworkUrl || track.info.image);
                        }
                    }

                    try {
                        const updatedFilterSelectRow = getFilterSelectRow(false);
                        const editOptions = {
                            embeds: [updatedEmbed],
                            components: [updatedFilterSelectRow, updatedFirstControlButtonRow, updatedSecondControlButtonRow],
                        };

                        
                        if (updatedMusicCardAttachment) {
                            editOptions.files = [updatedMusicCardAttachment];
                        }

                        await player.nowPlayingMessage.edit(editOptions);
                    } catch (e) {
                        clearInterval(player.updateInterval);
                    }
                }, 5000);
        } catch (e) {
            console.error('Error sending now playing message:', e);
        }
    });

    client.poru.on('trackEnd', async (player, track, data) => {
        if (player.updateInterval) {
            clearInterval(player.updateInterval);
            player.updateInterval = null;
        }
        
        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('trackEnd');
            } catch (e) {}
            player.buttonCollector = null;
        }
        
        if (player.selectCollector) {
            try {
                player.selectCollector.stop('trackEnd');
            } catch (e) {}
            player.selectCollector = null;
        }
    });

    client.poru.on('queueEnd', async (player) => {
        if (player.updateInterval) {
            clearInterval(player.updateInterval);
            player.updateInterval = null;
        }
        
        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('queueEnd');
            } catch (e) {}
            player.buttonCollector = null;
        }
        
        if (player.selectCollector) {
            try {
                player.selectCollector.stop('queueEnd');
            } catch (e) {}
            player.selectCollector = null;
        }
        
        if (player.nowPlayingMessage && player.nowPlayingMessage.deletable) {
            try {
                await player.nowPlayingMessage.delete().catch(() => {});
            } catch (e) {}
            player.nowPlayingMessage = null;
        }
        
        player._moodplayActive = false;
        player._moodplayMood = null;
        
        if (!player.autoplayEnabled) {
            const channel = client.channels.cache.get(player.textChannel);
            if (channel) {
                const idleEmbed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription(`${emojis.music} Queue finished! Use \`.play\` to add more songs or \`.stop\` to disconnect.`);
                await channel.send({ embeds: [idleEmbed] }).catch(() => {});
            }
            
            setTimeout(() => {
                const currentPlayer = client.poru.players.get(player.guildId);
                if (currentPlayer && !currentPlayer.isPlaying && currentPlayer.queue.length === 0) {
                    currentPlayer.destroy();
                }
            }, 180000);
            
            return;
        }

        const lastTrack = player._lastPlayedTrack || player.currentTrack;
        
        if (!lastTrack || !lastTrack.info) return;

        try {
            const channel = client.channels.cache.get(player.textChannel);
            if (!channel) return;

            const trackTitle = lastTrack.info.title || '';
            const trackArtist = lastTrack.info.author || '';
            const trackUri = lastTrack.info.uri || '';
            
            let resolve;
            
            if (trackUri && trackUri.includes('youtube.com')) {
                resolve = await client.poru.resolve({ 
                    query: `https://music.youtube.com/watch?v=${lastTrack.info.identifier}&list=RD${lastTrack.info.identifier}`,
                    source: 'ytmsearch',
                    requester: lastTrack.info.requester 
                });
            }
            
            if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
                const searchQuery = `${trackTitle} ${trackArtist}`.trim();
                resolve = await client.poru.resolve({ 
                    query: searchQuery,
                    source: 'ytmsearch',
                    requester: lastTrack.info.requester 
                });
            }
            
            if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription(`${emojis.autoplay} Autoplay couldn't find related tracks. Use \`/play\` to add more songs!`);
                await channel.send({ embeds: [embed] }).catch(() => {});
                return;
            }

            const maxAutoplayTracks = 6;
            const addedTracks = [];
            const seenTracks = new Set();
            
            const normalizeTitle = (title) => {
                return title.toLowerCase()
                    .replace(/\s*\(.*?\)\s*/g, '')
                    .replace(/\s*\[.*?\]\s*/g, '')
                    .replace(/[^\w\s]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            };
            
            const lastTrackNormalized = normalizeTitle(trackTitle);
            seenTracks.add(lastTrackNormalized);
            
            if (!player._autoplayHistory) {
                player._autoplayHistory = new Set();
            }
            
            for (const track of resolve.tracks) {
                if (addedTracks.length >= maxAutoplayTracks) break;
                
                const currentTitle = normalizeTitle(track.info?.title || '');
                const trackId = track.info?.identifier;
                
                if (trackId && player._autoplayHistory.has(trackId)) {
                    continue;
                }
                
                if (!seenTracks.has(currentTitle) && currentTitle && track.info?.author) {
                    addedTracks.push(track);
                    seenTracks.add(currentTitle);
                }
            }
            
            if (addedTracks.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription(`${emojis.autoplay} Autoplay found only duplicates. Use \`/play\` to add more songs!`);
                await channel.send({ embeds: [embed] }).catch(() => {});
                return;
            }

            for (const track of addedTracks) {
                player.queue.add(track);
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(
                    `${emojis.autoplay} **Autoplay Active**\n\n` +
                    `Added ${addedTracks.length} similar track${addedTracks.length > 1 ? 's' : ''} to queue\n` +
                    `Based on: **${trackTitle}**`
                );
            await channel.send({ embeds: [embed] }).catch(() => {});
            
            if (player.isConnected && !player.isPlaying) {
                try {
                    player.play();
                } catch (err) {
                    console.error('[Autoplay] Error starting playback:', err);
                }
            }
            
        } catch (error) {
            console.error('[Autoplay] Error:', error);
            const channel = client.channels.cache.get(player.textChannel);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Autoplay encountered an error. Use \`/play\` to continue!`);
                await channel.send({ embeds: [embed] }).catch(() => {});
            }
        }
    });

    client.poru.on('playerDestroy', (player) => {
        if (player.updateInterval) {
            clearInterval(player.updateInterval);
            player.updateInterval = null;
        }
        
        if (player.buttonCollector) {
            try {
                player.buttonCollector.stop('destroy');
            } catch (e) {}
            player.buttonCollector = null;
        }
        
        if (player.selectCollector) {
            try {
                player.selectCollector.stop('destroy');
            } catch (e) {}
            player.selectCollector = null;
        }
        
        if (player.nowPlayingMessage) {
            try {
                if (player.nowPlayingMessage.deletable) {
                    player.nowPlayingMessage.delete().catch(() => {});
                }
            } catch (e) {}
            player.nowPlayingMessage = null;
        }
        
        if (player._autoplayHistory) {
            player._autoplayHistory.clear();
            player._autoplayHistory = null;
        }
        
        player._moodplayActive = false;
        player._moodplayMood = null;
        player._lastPlayedTrack = null;
    });
}

module.exports = { setupMusicEvents };
