const { EmbedBuilder } = require('discord.js');
const { hasControlPermission } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    name: 'move',
    description: 'Move a track to a different position in the queue',

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

        if (player.queue.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} The queue is empty!`);
            return message.reply({ embeds: [embed] });
        }

        if (!args[0] || !args[1]) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Please provide both from and to positions! Usage: \`,move <from> <to>\``);
            return message.reply({ embeds: [embed] });
        }

        const fromPos = parseInt(args[0]);
        const toPos = parseInt(args[1]);

        if (isNaN(fromPos) || isNaN(toPos) || fromPos < 1 || toPos < 1) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Invalid positions! Please provide valid numbers.`);
            return message.reply({ embeds: [embed] });
        }

        if (fromPos > player.queue.length || toPos > player.queue.length) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Invalid position! Queue has **${player.queue.length}** tracks.`);
            return message.reply({ embeds: [embed] });
        }

        if (fromPos === toPos) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Source and destination positions are the same!`);
            return message.reply({ embeds: [embed] });
        }

        const track = player.queue[fromPos - 1];
        player.queue.splice(fromPos - 1, 1);
        player.queue.splice(toPos - 1, 0, track);
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`${emojis.move} Moved **[${track.info.title}](${track.info.uri})** from position ${fromPos} to ${toPos}.`);
        
        return message.reply({ embeds: [embed] });
    },
};
