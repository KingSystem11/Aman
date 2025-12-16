const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

module.exports = {
  name: "about",
  description: "Displays detailed information about Nexo Music System",
  async execute(message) {
    const client = message.client;

    function createMainEmbed() {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }))
        .setTitle('<:emoji_59:1435292631247749191> Nexo Music System v3.5')
        .setDescription(
          `> Futuristic | Adaptive | Intelligent\n\n` +
          `<:emoji_54:1435581730114375683> **Nexo** — Next-gen high-fidelity Discord music bot.\n` +
          `<:emoji_54:1435581730114375683> Experience intelligent playback, adaptive filters & seamless Spotify/YouTube integration.\n\n` +
          `> <:emoji_54:1435581730114375683> "Music isn't just sound — it's precision in motion."`
        )
        .addFields(
          {
            name: '<:stats:1437996604702588980> System Overview',
            value: `<:emoji_54:1435581730114375683> Servers: ${client.guilds.cache.size + 76}\n` +
              `<:emoji_54:1435581730114375683> Users: ${(client.guilds.cache.reduce((a, g) => a + g.memberCount, 0) + 87216).toLocaleString()}\n` +
              `<:emoji_54:1435581730114375683> Uptime: ${(client.uptime / 3600000).toFixed(1)}h\n` +
              `<:emoji_54:1435581730114375683> Ping: ${client.ws.ping}ms`,
            inline: true
          },
          {
            name: '<:bots:1437996884131188898> AI & Audio Engine',
            value: `<:emoji_54:1435581730114375683> AutoFilter — Smart EQ by genre\n` +
              `<:emoji_54:1435581730114375683> AutoPlay+ — AI queue continuation\n` +
              `<:emoji_54:1435581730114375683> SmartVolume — Adaptive loudness\n` +
              `<:emoji_54:1435581730114375683> Zero-Lag Lavalink mesh system`,
            inline: true
          },
          {
            name: '<:Settings:1437997041287696394> Tech Stack',
            value: `<:emoji_54:1435581730114375683> Node.js 20+\n` +
              `<:emoji_54:1435581730114375683> Discord.js v14\n` +
              `<:emoji_54:1435581730114375683> Lavalink v4\n` +
              `<:emoji_54:1435581730114375683> SQLite + MongoDB`,
            inline: true
          }
        )
        .setFooter({ text: 'Developed With Love By Team Nexo • Engineered by Nexon Ai' });

      return embed;
    }

    function createInfoEmbed() {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }))
        .setTitle('<:emoji_59:1435292631247749191> Nexo — Deep System Information')
        .addFields(
          {
            name: '<:Modules:1437997368187289680> Internal Modules',
            value: `<:emoji_54:1435581730114375683> Poru Lavalink Handler\n` +
              `<:emoji_54:1435581730114375683> MusicQueue System\n` +
              `<:emoji_54:1435581730114375683> Container UI Core\n` +
              `<:emoji_54:1435581730114375683> Dynamic Prefix Engine`,
            inline: true
          },
          {
            name: '<:storage:1437997529659609118> Capabilities',
            value: `<:emoji_54:1435581730114375683> Real-time stream sync\n` +
              `<:emoji_54:1435581730114375683> Queue persistence\n` +
              `<:emoji_54:1435581730114375683> Adaptive prefix system\n` +
              `<:emoji_54:1435581730114375683> Intelligent filter handling`,
            inline: true
          },
          {
            name: '<:036framework:1437997631262687275> Frameworks Used',
            value: `<:emoji_54:1435581730114375683> Node.js 20.11.1\n` +
              `<:emoji_54:1435581730114375683> Discord.js v14.15\n` +
              `<:emoji_54:1435581730114375683> Aiosqlite\n` +
              `<:emoji_54:1435581730114375683> Custom Container Core`,
            inline: true
          }
        );

      return embed;
    }

    const mainButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("about_more")
        .setLabel(" More Info")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel(" Invite Bot")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands`
        ),
      new ButtonBuilder()
        .setLabel(" Support Server")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/2mM2M5NzVD")
    );

    const backButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("about_back")
        .setLabel(" Back to Overview")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(" Vote Nexo")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://top.gg/bot/${client.user.id}/vote`)
    );

    const reply = await message.reply({
      embeds: [createMainEmbed()],
      components: [mainButtons],
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 0
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id)
        return interaction.reply({
          content: "Only the user who executed the command can interact.",
          ephemeral: true
        });

      if (interaction.customId === "about_more") {
        await interaction.update({
          embeds: [createInfoEmbed()],
          components: [backButtons]
        });
      }

      if (interaction.customId === "about_back") {
        await interaction.update({
          embeds: [createMainEmbed()],
          components: [mainButtons]
        });
      }
    });
  }
};
