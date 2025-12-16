const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    name: 'resume',
    description: 'Resume the paused song',

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

        if (member.voice.channel.id !== player.voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You must be in the same voice channel as the bot!`);
            return message.reply({ embeds: [embed] });
        }

        if (!player.isPaused) {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`${emojis.resume} The music is already playing.`);
            return message.reply({ embeds: [embed] });
        }

        player.pause(false);
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`${emojis.resume} Resumed.`);
        
        return message.reply({ embeds: [embed] });
    },
};
