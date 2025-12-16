const { EmbedBuilder } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl delete',
    aliases: ['playlist-delete', 'pldelete', 'pl-delete'],
    description: 'Delete one of your playlists',
    
    async execute(message, args) {
        const playlistName = args.join(' ');
        
        if (!playlistName) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Please provide a playlist name to delete!`);
            return message.reply({ embeds: [embed] });
        }

        const userId = message.author.id;

        const playlist = await Playlist.findOne({ 
            where: { userId, name: playlistName } 
        });
        
        if (!playlist) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Playlist **${playlistName}** not found!`);
            return message.reply({ embeds: [embed] });
        }

        await PlaylistTrack.destroy({ where: { playlistId: playlist.id } });
        await playlist.destroy();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`${emojis.success} Deleted playlist **${playlistName}**!`);
        
        return message.reply({ embeds: [embed] });
    },
};
