const { EmbedBuilder } = require('discord.js');
const { hasControlPermission } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    name: 'skip',
    description: 'Skip the current song',

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

        if (!hasControlPermission(message, player)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Only the requester, admins, or server managers can control the music!`);
            return message.reply({ embeds: [embed] });
        }

        if (!player.currentTrack) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} There is no track to skip!`);
            return message.reply({ embeds: [embed] });
        }

        player.skip();
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`${emojis.skip} Skipped the current track.`);
        
        return message.reply({ embeds: [embed] });
    },
};
