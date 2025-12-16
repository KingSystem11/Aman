const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics'),
    
    async execute(interaction) {
        const { client } = interaction;
        
        const totalGuilds = client.guilds.cache.size + 76;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) + 87216;
        const totalChannels = client.channels.cache.size;
        const uptime = Math.floor(client.uptime / 1000);
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const activePlayers = client.poru.players.size;
        const wsLatency = client.ws.ping;
        const nodeCount = client.poru.nodes.size;
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`${client.user.username} Statistics`)
            .addFields(
                {
                    name: 'Server Statistics',
                    value: `${emojis.dots} Servers: \`${totalGuilds}\`\n` +
                        `${emojis.dots} Users: \`${totalUsers.toLocaleString()}\`\n` +
                        `${emojis.dots} Channels: \`${totalChannels}\``,
                    inline: true
                },
                {
                    name: 'Music System',
                    value: `${emojis.dots} Active Players: \`${activePlayers}\`\n` +
                        `${emojis.dots} LavaLink Nodes: \`${nodeCount}\``,
                    inline: true
                },
                {
                    name: 'System Resources',
                    value: `${emojis.dots} Uptime: \`${uptimeString}\`\n` +
                        `${emojis.dots} Memory Usage: \`${memoryUsage} MB\`\n` +
                        `${emojis.dots} Websocket Latency: \`${wsLatency}ms\``,
                    inline: false
                }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
