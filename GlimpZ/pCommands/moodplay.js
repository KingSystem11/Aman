const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.json');

const moodData = {
    sad: {
        emoji: '😢',
        title: 'Sad Mode Activated',
        description: 'Playing soft, emotional & lo-fi tracks to match your feelings.',
        color: 0x5865F2,
        queries: [
            'sad songs playlist',
            'emotional hindi songs',
            'broken heart songs',
            'sad lo-fi beats',
            'sad acoustic songs'
        ]
    },
    happy: {
        emoji: '😊',
        title: 'Happy Mode Activated',
        description: 'Playing upbeat, cheerful & positive vibes to brighten your day!',
        color: 0xFFD700,
        queries: [
            'happy songs playlist',
            'feel good music',
            'upbeat pop songs',
            'happy hindi songs',
            'good vibes playlist'
        ]
    },
    enjoy: {
        emoji: '🎉',
        title: 'Party Mode Activated',
        description: 'Playing party, EDM & remix tracks to get the party started!',
        color: 0xFF1493,
        queries: [
            'party songs playlist',
            'edm party mix',
            'bollywood party songs',
            'dance hits',
            'club music playlist'
        ]
    },
    birthday: {
        emoji: '🎂',
        title: 'Birthday Mode Activated',
        description: 'Playing birthday songs to celebrate the special day!',
        color: 0xFF69B4,
        queries: [
            'happy birthday songs',
            'birthday party songs',
            'birthday celebration music',
            'birthday songs hindi',
            'birthday bash playlist'
        ]
    },
    focus: {
        emoji: '🎯',
        title: 'Focus Mode Activated',
        description: 'Playing calm instrumental & lo-fi tracks to help you concentrate.',
        color: 0x00CED1,
        queries: [
            'focus music',
            'study music playlist',
            'lo-fi hip hop beats',
            'concentration music',
            'instrumental focus'
        ]
    },
    sleep: {
        emoji: '😴',
        title: 'Sleep Mode Activated',
        description: 'Playing calm, ambient & relaxing tracks to help you sleep.',
        color: 0x191970,
        queries: [
            'sleep music',
            'relaxing sleep sounds',
            'ambient sleep music',
            'calm piano music',
            'sleep meditation music'
        ]
    },
    workout: {
        emoji: '💪',
        title: 'Workout Mode Activated',
        description: 'Playing high-energy, bass boosted tracks to fuel your workout!',
        color: 0xFF4500,
        queries: [
            'workout music playlist',
            'gym motivation songs',
            'high energy workout',
            'bass boosted workout',
            'fitness music'
        ]
    },
    romantic: {
        emoji: '❤️',
        title: 'Romantic Mode Activated',
        description: 'Playing love songs & romantic tracks for the perfect mood.',
        color: 0xFF1744,
        queries: [
            'romantic songs playlist',
            'love songs hindi',
            'romantic ballads',
            'couple songs',
            'romantic acoustic'
        ]
    },
    chill: {
        emoji: '😌',
        title: 'Chill Mode Activated',
        description: 'Playing relaxing lo-fi & chill tracks for a laid-back vibe.',
        color: 0x87CEEB,
        queries: [
            'chill music playlist',
            'lo-fi chill beats',
            'relaxing music',
            'chill vibes',
            'chill hop music'
        ]
    },
    funk: {
        emoji: '🕺',
        title: 'Funk Mode Activated',
        description: 'Playing groovy funk & disco tracks to get you moving!',
        color: 0x9932CC,
        queries: [
            'funk music playlist',
            'disco funk',
            'groovy music',
            'funky beats',
            'retro funk songs'
        ]
    },
    gaming: {
        emoji: '🎮',
        title: 'Gaming Mode Activated',
        description: 'Playing epic gaming soundtracks & electronic beats!',
        color: 0x7B68EE,
        queries: [
            'gaming music playlist',
            'epic gaming soundtrack',
            'ncs gaming music',
            'gaming beats',
            'electronic gaming mix'
        ]
    },
    devotional: {
        emoji: '🙏',
        title: 'Devotional Mode Activated',
        description: 'Playing spiritual & devotional songs for inner peace.',
        color: 0xFFA500,
        queries: [
            'devotional songs hindi',
            'bhajan playlist',
            'spiritual music',
            'morning bhajan',
            'aarti songs'
        ]
    },
    motivational: {
        emoji: '🔥',
        title: 'Motivation Mode Activated',
        description: 'Playing motivational & inspiring tracks to boost your energy!',
        color: 0xFF6347,
        queries: [
            'motivational songs',
            'inspirational music',
            'powerful motivation playlist',
            'success music',
            'never give up songs'
        ]
    },
    lofi: {
        emoji: '🎧',
        title: 'Lo-Fi Mode Activated',
        description: 'Playing lo-fi hip hop beats for relaxation & study.',
        color: 0x8B4513,
        queries: [
            'lo-fi hip hop',
            'lo-fi beats to study',
            'chillhop music',
            'lo-fi jazz',
            'lo-fi rain'
        ]
    },
    retro: {
        emoji: '📻',
        title: 'Retro Mode Activated',
        description: 'Playing classic oldies & retro hits from the golden era!',
        color: 0xDAA520,
        queries: [
            'retro songs playlist',
            'old hindi songs',
            '80s 90s hits',
            'classic bollywood',
            'retro remix'
        ]
    }
};

module.exports = {
    name: 'moodplay',
    description: 'Play music based on your mood',
    aliases: ['mood', 'mplay', 'mp'],
    usage: '<mood>',
    examples: ['moodplay happy', 'mood sad', 'mp focus'],

    async execute(message, args) {
        const { client, member, guild, channel } = message;

        const userVC = member.voice.channel;
        if (!userVC) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You need to be in a voice channel to use Mood Play!`);
            return message.reply({ embeds: [embed] });
        }

        const botVC = guild.members.me.voice.channel;
        if (botVC && userVC.id !== botVC.id) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You are not in the same voice channel as me!\n🎧 I'm currently in: <#${botVC.id}>`);
            return message.reply({ embeds: [embed] });
        }

        if (!args || args.length === 0) {
            const moodList = Object.entries(moodData)
                .map(([key, data]) => `${data.emoji} \`${key}\``)
                .join(' • ');

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🎧 Mood Play')
                .setDescription('Play music based on your mood! Just tell me how you\'re feeling.\n\n**Usage:** `moodplay <mood>`')
                .addFields({
                    name: '🎭 Available Moods',
                    value: moodList
                })
                .setFooter({ text: 'Example: moodplay happy • moodplay sad • moodplay focus' });
            return message.reply({ embeds: [embed] });
        }

        const moodInput = args[0].toLowerCase();
        const mood = moodData[moodInput];

        if (!mood) {
            const moodList = Object.entries(moodData)
                .map(([key, data]) => `${data.emoji} \`${key}\``)
                .join(' • ');

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Unknown mood: \`${moodInput}\`\n\n**Available Moods:**\n${moodList}`);
            return message.reply({ embeds: [embed] });
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor(mood.color)
            .setDescription(`${mood.emoji} **${mood.title}**\n\n${emojis.music} Loading ${moodInput} music for you...`);

        const loadingMsg = await message.reply({ embeds: [loadingEmbed] });

        const randomQuery = mood.queries[Math.floor(Math.random() * mood.queries.length)];

        let res;
        try {
            res = await client.poru.resolve({ query: randomQuery, requester: message.author });
        } catch (e) {
            console.error('Mood Play resolve error:', e);
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Failed to load mood music: ${e?.message || 'Unknown error'}`);
            return loadingMsg.edit({ embeds: [embed] });
        }

        if (!res || res.loadType === 'error' || res.loadType === 'empty') {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} No music found for this mood. Try again!`);
            return loadingMsg.edit({ embeds: [embed] });
        }

        let player = client.poru.players.get(guild.id);
        if (!player) {
            player = client.poru.createConnection({
                guildId: guild.id,
                voiceChannel: userVC.id,
                textChannel: channel.id,
                deaf: true,
            });
        }

        if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;

        let tracksAdded = 0;

        if (res.loadType === 'playlist' || res.loadType === 'PLAYLIST_LOADED') {
            const tracks = res.tracks.slice(0, 25);
            for (const track of tracks) {
                track.info.requester = message.author;
                player.queue.add(track);
                tracksAdded++;
            }
        } else if (res.tracks && res.tracks.length > 0) {
            const tracks = res.tracks.slice(0, 15);
            for (const track of tracks) {
                track.info.requester = message.author;
                player.queue.add(track);
                tracksAdded++;
            }
        }

        if (!player.isPlaying && player.isConnected) {
            player.play();
        }

        const successEmbed = new EmbedBuilder()
            .setColor(mood.color)
            .setTitle(`${mood.emoji} ${mood.title}`)
            .setDescription(`${mood.description}\n\n${emojis.success} Added **${tracksAdded}** tracks to the queue!`)
            .addFields({
                name: '🎵 Now Playing',
                value: `Mood: **${moodInput.charAt(0).toUpperCase() + moodInput.slice(1)}**`
            })
            .setFooter({ text: 'Tip: Use skip to change tracks • Use stop to end the session' });

        return loadingMsg.edit({ embeds: [successEmbed] });
    }
};
