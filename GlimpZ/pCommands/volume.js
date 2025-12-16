const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    name: 'volume',
    aliases: ['vol'],
    description: 'Set music volume',

    async execute(message, args) {
        try {
            const { client, member, guild } = message;

            const userChannel = member.voice.channel;
            if (!userChannel) {
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

            const botChannelId = player.voiceChannel;
            if (botChannelId && userChannel.id !== botChannelId) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} You must be in the same voice channel as the bot!\n🎵 I am currently in: <#${botChannelId}>`);
                return message.reply({ embeds: [embed] });
            }

            if (!args[0]) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Please provide a volume level (1-100)!`);
                return message.reply({ embeds: [embed] });
            }

            const level = parseInt(args[0]);
            if (isNaN(level) || level < 1 || level > 100) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription(`${emojis.error} Volume must be between 1 and 100!`);
                return message.reply({ embeds: [embed] });
            }

            player.setVolume(level);

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`${emojis.volume} Volume set to **${level}**.`);

            return message.reply({ embeds: [embed] });

        } catch (err) {
            console.error("Volume Command Error:", err);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Something went wrong while setting volume.`);
            return message.reply({ embeds: [errorEmbed] });
        }
    },
};
