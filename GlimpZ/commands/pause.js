const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing song'),

    async execute(interaction) {
        const { client, member, guild } = interaction;
        
        if (!member.voice.channel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You need to be in a voice channel!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const player = client.poru.players.get(guild.id);
        
        if (!player) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} No music is currently playing!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (member.voice.channel.id !== player.voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`${emojis.error} You must be in the same voice channel as the bot!`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (player.isPaused) {
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`${emojis.pause} The music is already paused.`);
            return interaction.reply({ embeds: [embed] });
        }

        player.pause(true);
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`${emojis.pause} Music paused.`);
        
        return interaction.reply({ embeds: [embed] });
    },
};
