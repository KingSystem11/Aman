const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { customFilter } = require('poru');
const emojis = require('../emojis.json');

module.exports = {
    name: 'filter',
    description: 'Apply audio filter (equalizer)',
    
    async execute(message) {
        const { client, member, guild } = message;
        
        if (!member.voice.channel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You need to be in a voice channel!`);
            return message.reply({ embeds: [embed] });
        }

        const player = client.poru.players.get(guild.id);
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} No music is currently playing!`);
            return message.reply({ embeds: [embed] });
        }

        if (!(player.filters instanceof customFilter)) {
            player.filters = new customFilter(player);
        }

        const filterList = [
            { id: 'nightcore', label: 'Nightcore', description: 'Speed up with higher pitch', emoji: emojis.nightcore },
            { id: 'vaporwave', label: 'Vaporwave', description: 'Slow down with lower pitch', emoji: emojis.vaporwave },
            { id: 'bassboost', label: 'Bassboost', description: 'Enhanced bass frequencies', emoji: emojis.bassboost },
            { id: 'eightD', label: '8D Audio', description: 'Surround sound effect', emoji: emojis.eightD },
            { id: 'karaoke', label: 'Karaoke', description: 'Remove vocals from track', emoji: emojis.karaoke },
            { id: 'vibrato', label: 'Vibrato', description: 'Vibrating sound effect', emoji: emojis.vibrato },
            { id: 'tremolo', label: 'Tremolo', description: 'Volume oscillation effect', emoji: emojis.tremolo },
            { id: 'slowed', label: 'Slowed', description: 'Slower playback speed', emoji: emojis.slowed },
            { id: 'distortion', label: 'Distortion', description: 'Distorted audio effect', emoji: emojis.distortion },
            { id: 'pop', label: 'Pop', description: 'Optimized for pop music', emoji: emojis.pop },
            { id: 'soft', label: 'Soft', description: 'Softer, mellower sound', emoji: emojis.soft },
            { id: 'reset', label: 'Reset Filters', description: 'Clear all applied filters', emoji: emojis.error },
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('filter_select')
            .setPlaceholder('Choose an audio filter...')
            .addOptions(
                filterList.map(filter => ({
                    label: filter.label,
                    description: filter.description,
                    value: filter.id,
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`${emojis.filter} Audio Filters`)
            .setDescription('Select a filter from the dropdown below to apply to your music:')
            .setFooter({ text: 'Powered by KingSystem11 Development' });

        const filterMsg = await message.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true,
        });

        if (player.filterCollector) player.filterCollector.stop();
        const collector = filterMsg.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 0,
        });
        player.filterCollector = collector;

        const invokerId = message.author?.id ?? message.user?.id ?? message.member?.id;

        collector.on('collect', async (selectInt) => {
            if (selectInt.user.id !== invokerId) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Only the command user can use this menu!`);
                return selectInt.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (!(player.filters instanceof customFilter)) {
                player.filters = new customFilter(player);
            }

            const filterId = selectInt.values[0];

            if (filterId === 'reset') {
                player.filters.clearFilters(true);
                await player.filters.updateFilters();
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} All filters have been reset!`);
                await selectInt.reply({ embeds: [embed], ephemeral: true });
                return;
            }
            let applied = false;
            
            switch (filterId) {
                case 'nightcore':
                    player.filters.setNightcore(true);
                    applied = true;
                    break;
                case 'vaporwave':
                    player.filters.setVaporwave(true);
                    applied = true;
                    break;
                case 'bassboost':
                    player.filters.setBassboost(true);
                    applied = true;
                    break;
                case 'eightD':
                    player.filters.set8D(true);
                    applied = true;
                    break;
                case 'karaoke':
                    player.filters.setKaraoke(true);
                    applied = true;
                    break;
                case 'vibrato':
                    player.filters.setVibrato(true);
                    applied = true;
                    break;
                case 'tremolo':
                    player.filters.setTremolo(true);
                    applied = true;
                    break;
                case 'slowed':
                    player.filters.setSlowmode(true);
                    applied = true;
                    break;
                case 'distortion':
                    player.filters.setDistortion(true);
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
                    applied = true;
                    break;
            }

            if (applied) {
                await player.filters.updateFilters();
                const filterName = filterList.find(f => f.id === filterId)?.label || filterId;
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`${emojis.success} Applied **${filterName}** filter!`);
                await selectInt.reply({ embeds: [embed], ephemeral: true });
            }
        });

        player.on('destroy', () => {
            if (player.filterCollector) player.filterCollector.stop();
            player.filterCollector = null;
        });
    },
};
