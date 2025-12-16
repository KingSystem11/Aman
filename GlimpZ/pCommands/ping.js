const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    name: 'ping',
    description: 'Check the bot\'s latency',
    
    async execute(message) {
        const sent = await message.reply({ 
            content: 'Pinging...',
            fetchReply: true
        });

        const wsLatency = message.client.ws.ping;
        const editLatency = sent.createdTimestamp - message.createdTimestamp;
        const uptime = Math.floor(message.client.uptime / 1000);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('**Pong!**')
            .addFields(
                { name: `${emojis.dots} Websocket Latency`, value: `\`${wsLatency}ms\``, inline: true },
                { name: `${emojis.dots} Edit Response`, value: `\`${editLatency}ms\``, inline: true },
                { name: `${emojis.dots} Uptime`, value: `\`${uptime}s\``, inline: true }
            );

        await sent.edit({ content: null, embeds: [embed] });
    },
};
