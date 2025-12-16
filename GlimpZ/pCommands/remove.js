const { EmbedBuilder } = require('discord.js');
const { hasControlPermission } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    name: 'remove',
    description: 'Remove a song from queue',

    async execute(message, args) {
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

        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Please provide a position number!`);
            return message.reply({ embeds: [embed] });
        }

        const position = parseInt(args[0]);
        
        if (isNaN(position) || position < 1 || position > player.queue.length) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Invalid position! Queue has **${player.queue.length}** tracks.`);
            return message.reply({ embeds: [embed] });
        }

        const removed = player.queue.remove(position - 1);
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`${emojis.remove} Removed **[${removed[0].info.title}](${removed[0].info.uri})** from position ${position}.`);
        
        return message.reply({ embeds: [embed] });
    },
};
