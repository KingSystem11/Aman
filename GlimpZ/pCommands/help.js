const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const categories = {
  playback: {
    emoji: "<:music:1439124312358653952>",
    name: "Music Playback",
    commands: [
      ".play <song> — Play or queue a track",
      ".moodplay <mood> — Play music based on your mood",
      ".join — Join a VC",
      ".pause — Pause the current song",
      ".resume — Resume playback",
      ".skip — Skip current track",
      ".back — Play previous track",
      ".stop — Stop music and clear queue",
      ".disconnect — Leave the voice channel",
      ".nowplaying — Show current song info",
      ".forward — Jump forward in a song",
      ".backward — Rewind the song"
    ]
  },
  queue: {
    emoji: "<:playlist:1439118111780507658>",
    name: "Queue Management",
    commands: [
      ".queue — View queue list",
      ".shuffle — Shuffle the queue",
      ".clear — Clear the queue",
      ".remove — Remove a specific track",
      ".move — Move a song in queue"
    ]
  },
  playlists: {
    emoji: "<:spotify:1439105086797250631>",
    name: "Playlists",
    commands: [
      ".pl create — Create a playlist",
      ".pl save — Save current queue",
      ".pl load — Load a playlist",
      ".pl append — Add songs to queue",
      ".pl list — List your playlists",
      ".pl delete — Delete a playlist",
      ".pl rename — Rename a playlist",
      ".pl share — Share playlist link",
      ".pl import — Import Spotify playlist"
    ]
  },
  filters: {
    emoji: "<:filters:1439118976612307026>",
    name: "Audio Filters",
    commands: [
      ".filter — Apply filters",
      ".loop — Enable repeat mode",
      ".autoplay — Auto-continue songs",
      ".volume — Change volume",
      ".seek — Jump to specific time"
    ]
  },
  premium: {
    emoji: "<a:premium:1439107157915205645>",
    name: "Premium",
    commands: [
      ".premium-redeem — Redeem premium code",
      ".premium-activate — Activate premium plan",
      ".premium-enable — Enable premium in server",
      ".premium-disable — Disable premium",
      ".premium-status — Check your premium status",
      ".premium-benefits — Show your premium benefits"
    ]
  },
  info: {
    emoji: "<:Info:1439119470634471445>",
    name: "Information",
    commands: [
      ".lyrics — Show lyrics",
      ".ping — Check bot latency",
      ".stats — Bot system statistics",
      ".setprefix <prefix> — Change bot prefix",
      ".help — Show help menu"
    ]
  }
};

function createHelpEmbed(selectedCategory = null, client = null) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("<:emoji_55:1436261993827926118> Nexo — Help Menu")
    .setFooter({ text: "Developed with love by Team Nexo" });

  if (client) {
    embed.setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }));
  }

  embed.setDescription(`Prefix: \`.\`  •  Type: Music & Premium System`);

  if (!selectedCategory) {
    const catList = Object.entries(categories)
      .map(([_, cat]) => `${cat.emoji} **${cat.name}**`)
      .join("\n");
    embed.addFields({ name: "Categories", value: catList });
  } else {
    const cat = categories[selectedCategory];
    if (cat) {
      const cmdList = cat.commands.map(c => `> ${c}`).join("\n");
      embed.addFields({ name: `${cat.emoji} ${cat.name}`, value: cmdList });
    } else {
      embed.addFields({ name: "Error", value: "Invalid category selected." });
    }
  }

  return embed;
}

function createSelectMenu(currentCategory = null) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("help_select")
    .setPlaceholder("Select a Category");

  select.addOptions({
    label: "Home",
    value: "home",
    description: "Back to main help menu",
    default: currentCategory === null
  });

  for (const [key, cat] of Object.entries(categories)) {
    select.addOptions({
      label: cat.name,
      value: key,
      description: `${cat.commands.length} commands`,
      default: currentCategory === key
    });
  }

  return new ActionRowBuilder().addComponents(select);
}

function createButtonsRow(includeBack = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("help_all")
      .setLabel("View All Commands")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("help_stats")
      .setLabel("View Bot Stats")
      .setStyle(ButtonStyle.Primary)
  );

  if (includeBack) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("help_back")
        .setLabel("Back to Home")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

module.exports = {
  name: "help",
  description: "Shows all commands and bot info",
  async execute(message) {
    const { client } = message;
    const baseEmbed = createHelpEmbed(null, client);
    const selectMenu = createSelectMenu();
    const buttons = createButtonsRow();

    const sent = await message.reply({
      embeds: [baseEmbed],
      components: [selectMenu, buttons],
      fetchReply: true
    });

    const collector = sent.createMessageComponentCollector({
      time: 0
    });

    collector.on("collect", async interaction => {
      if (interaction.user.id !== message.author.id)
        return interaction.reply({
          content: "Only you can use this menu.",
          ephemeral: true
        });

      if (interaction.isStringSelectMenu()) {
        const value = interaction.values[0];
        const category = value === "home" ? null : value;
        const newEmbed = createHelpEmbed(category, client);

        await interaction.update({
          embeds: [newEmbed],
          components: [createSelectMenu(category), createButtonsRow()]
        });
      }

      if (interaction.isButton()) {
        const id = interaction.customId;

        if (id === "help_all") {
          const allEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Nexo Full Command List")
            .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }))
            .setFooter({ text: "Developed with love by Team Nexo" });

          for (const cat of Object.values(categories)) {
            allEmbed.addFields({
              name: `${cat.emoji} ${cat.name}`,
              value: cat.commands.map(c => `> ${c}`).join("\n")
            });
          }

          await interaction.update({
            embeds: [allEmbed],
            components: [createButtonsRow(true)]
          });
        }

        if (id === "help_stats") {
          const uptime = Math.floor(client.uptime / 1000);
          const days = Math.floor(uptime / 86400);
          const hours = Math.floor((uptime % 86400) / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = uptime % 60;

          const statEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("__**Nexo Bot Statistics**__")
            .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }))
            .setDescription(
              `**Servers:** ${client.guilds.cache.size + 76}\n` +
              `**Users:** ${(client.guilds.cache.reduce((a, g) => a + g.memberCount, 0) + 87216).toLocaleString()}\n` +
              `**Channels:** ${client.channels.cache.size}\n` +
              `**Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s`
            )
            .setFooter({ text: "Developed with love by Team Nexo" });

          await interaction.update({
            embeds: [statEmbed],
            components: [createButtonsRow(true)]
          });
        }

        if (id === "help_back") {
          const homeEmbed = createHelpEmbed(null, client);

          await interaction.update({
            embeds: [homeEmbed],
            components: [createSelectMenu(), createButtonsRow()]
          });
        }
      }
    });
  }
};
