const { EmbedBuilder } = require('discord.js');
const Favorite = require('../../database/models/Favorite');
const emojis = require('../emojis.json');

module.exports = {
    name: 'fav remove',
    aliases: ['favremove', 'favoriteremove', 'fav-remove'],
    description: 'Remove a song from your favorites',

    async execute(message, args) {
        const userId = message.author.id;
        const name = args.join(' ');

        if (!name) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Please provide the song name to remove!`);
            return message.reply({ embeds: [embed] });
        }

        const favorites = await Favorite.findAll({
            where: { userId },
        });

        if (!favorites || favorites.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You don't have any favorites to remove!`);
            return message.reply({ embeds: [embed] });
        }

        const favorite = favorites.find(f => 
            f.title.toLowerCase().includes(name.toLowerCase())
        );

        if (!favorite) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} Could not find that song in your favorites!`);
            return message.reply({ embeds: [embed] });
        }

        await favorite.destroy();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`${emojis.success} Removed **${favorite.title}** from your favorites!`);
        
        return message.reply({ embeds: [embed] });
    },
};
