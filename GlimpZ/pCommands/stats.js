const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "stats",
  description: "Displays Nexo advanced system statistics",
  aliases: ["statistics", "botinfo"],
  async execute(message) {
    const { client } = message;

    const totalGuilds = client.guilds.cache.size + 76;
    const totalUsers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0) + 87216;
    const totalChannels = client.channels.cache.size;

    const uptime = Math.floor(client.uptime / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const nodes = client.poru?.nodes?.size || 0;
    const activePlayers = client.poru?.players?.size || 0;

    function createStatsEmbed(isRefreshed = false) {
      const wsLatency = client.ws.ping;
      const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const latencyHealth =
        wsLatency < 80 ? "<a:GreenDot:1438002543325085746> Excellent" : wsLatency < 150 ? "<a:yellow_dot:1438002750297210979> Stable" : "<a:RedDot:1438002450085707846> High";

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }))
        .setTitle(` Nexo — System Status Dashboard${isRefreshed ? ' (Refreshed)' : ''}`)
        .addFields(
          {
            name: '<:emoji_54:1435581730114375683> Bot Identity',
            value: `<:emoji_54:1435581730114375683> Username: **${client.user.username}**\n` +
              `<:emoji_54:1435581730114375683> ID: \`${client.user.id}\`\n` +
              `<:emoji_54:1435581730114375683> Version: Nexo v3.5`,
            inline: true
          },
          {
            name: ' Network Overview',
            value: `<:emoji_54:1435581730114375683> Servers: \`${totalGuilds}\`\n` +
              `<:emoji_54:1435581730114375683> Users: \`${totalUsers.toLocaleString()}\`\n` +
              `<:emoji_54:1435581730114375683> Channels: \`${totalChannels}\`\n` +
              `<:emoji_54:1435581730114375683> Uptime: \`${uptimeString}\``,
            inline: true
          },
          {
            name: ' Music Engine',
            value: `<:emoji_54:1435581730114375683> Active Players: \`${activePlayers}\`\n` +
              `<:emoji_54:1435581730114375683> Lavalink Nodes: \`${nodes}\`\n` +
              `<:emoji_54:1435581730114375683> Engine Health: **${latencyHealth}**`,
            inline: true
          },
          {
            name: ' System Resources',
            value: `<:emoji_54:1435581730114375683> Memory Usage: \`${memory} MB\`\n` +
              `<:emoji_54:1435581730114375683> Websocket Latency: \`${wsLatency}ms\`\n` +
              `<:emoji_54:1435581730114375683> Node.js: \`${process.version}\`\n` +
              `<:emoji_54:1435581730114375683> Container Runtime: **Stable**`,
            inline: false
          }
        )
        .setFooter({ text: 'Developed with love by Team Nexo • Engineered by KingSystem11' });

      return embed;
    }

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel(" Refresh Stats")
        .setCustomId("refresh_stats")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(" Back to About")
        .setCustomId("back_about")
        .setStyle(ButtonStyle.Primary)
    );

    const sent = await message.reply({
      embeds: [createStatsEmbed()],
      components: [buttonRow],
      fetchReply: true
    });

    const collector = sent.createMessageComponentCollector({ time: 0 });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id)
        return interaction.reply({
          content: "Only you can interact with this dashboard.",
          ephemeral: true
        });

      if (interaction.customId === "refresh_stats") {
        await interaction.update({
          embeds: [createStatsEmbed(true)],
          components: [buttonRow]
        });
      }

      if (interaction.customId === "back_about") {
        await interaction.reply({
          content: "Use `.about` to return to the overview panel.",
          ephemeral: true
        });
      }
    });
  }
};
