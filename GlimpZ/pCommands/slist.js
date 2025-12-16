const {

  EmbedBuilder,

  ActionRowBuilder,

  ButtonBuilder,

  ButtonStyle,

  ComponentType,

} = require("discord.js");

// 👑 MULTIPLE BOT OWNERS SUPPORTED

const BOT_OWNERS = [

  "1113808268960206928",

  "832640702802296882",

  // Add more owners here if needed

];

module.exports = {

  name: "slist",

  description: "Show a paginated list of all servers the bot is in (Owner-only)",

  async execute(message) {

    try {

      // ✅ OWNER CHECK

      if (!BOT_OWNERS.includes(message.author.id)) {

        return message.reply({

          content: "❌ You are not authorized to use this command.",

        });

      }

      const guilds = message.client.guilds.cache.map((g) => g);

      if (!guilds.length) {

        return message.reply("😶 The bot is not in any servers yet.");

      }

      // ✅ SORT BY JOIN DATE (oldest first)

      guilds.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);

      // ✅ SPLIT INTO PAGES OF 5

      const perPage = 5;

      const totalPages = Math.ceil(guilds.length / perPage);

      let page = 0;

      // Function to generate embed for a page

      const generateEmbed = (pageIndex) => {

        const start = pageIndex * perPage;

        const currentGuilds = guilds.slice(start, start + perPage);

        const embed = new EmbedBuilder()

          .setTitle(`📜 GlimpZ Server List (Page ${pageIndex + 1}/${totalPages})`)

          .setColor("#5865F2")

          .setFooter({

            text: `Total Servers: ${guilds.length} • Requested by ${message.author.tag}`,

            iconURL: message.author.displayAvatarURL(),

          });

        let desc = "";

        for (const guild of currentGuilds) {

          const icon = guild.iconURL({ size: 64 }) || "https://cdn.discordapp.com/embed/avatars/0.png";

          const joinedAt = guild.joinedAt

            ? `<t:${Math.floor(guild.joinedAt.getTime() / 1000)}:R>`

            : "Unknown";

          desc += `**${guild.name}**\n🕓 Joined: ${joinedAt}\n🖼️ [Icon Link](${icon})\n\n`;

        }

        embed.setDescription(desc);

        const currentIcon = currentGuilds[0]?.iconURL({ size: 256 });

        if (currentIcon) embed.setThumbnail(currentIcon);

        return embed;

      };

      // ✅ INITIAL EMBED + BUTTONS

      const row = new ActionRowBuilder().addComponents(

        new ButtonBuilder()

          .setCustomId("prev")

          .setLabel("⬅️ Back")

          .setStyle(ButtonStyle.Secondary)

          .setDisabled(true),

        new ButtonBuilder()

          .setCustomId("next")

          .setLabel("Next ➡️")

          .setStyle(ButtonStyle.Primary)

          .setDisabled(totalPages === 1)

      );

      const msg = await message.reply({

        embeds: [generateEmbed(page)],

        components: [row],

      });

      // ✅ COLLECTOR FOR BUTTONS

      const collector = msg.createMessageComponentCollector({

        componentType: ComponentType.Button,

        time: 5 * 60 * 1000, // 5 min

      });

      collector.on("collect", async (interaction) => {

        if (!BOT_OWNERS.includes(interaction.user.id)) {

          return interaction.reply({

            content: "❌ Only the bot owner can use these buttons.",

            ephemeral: true,

          });

        }

        if (interaction.customId === "next" && page < totalPages - 1) {

          page++;

        } else if (interaction.customId === "prev" && page > 0) {

          page--;

        }

        // Update buttons state

        const updatedRow = new ActionRowBuilder().addComponents(

          new ButtonBuilder()

            .setCustomId("prev")

            .setLabel("⬅️ Back")

            .setStyle(ButtonStyle.Secondary)

            .setDisabled(page === 0),

          new ButtonBuilder()

            .setCustomId("next")

            .setLabel("Next ➡️")

            .setStyle(ButtonStyle.Primary)

            .setDisabled(page === totalPages - 1)

        );

        await interaction.update({

          embeds: [generateEmbed(page)],

          components: [updatedRow],

        });

      });

      collector.on("end", async () => {

        // Disable buttons when time expires

        const disabledRow = new ActionRowBuilder().addComponents(

          new ButtonBuilder()

            .setCustomId("prev")

            .setLabel("⬅️ Back")

            .setStyle(ButtonStyle.Secondary)

            .setDisabled(true),

          new ButtonBuilder()

            .setCustomId("next")

            .setLabel("Next ➡️")

            .setStyle(ButtonStyle.Primary)

            .setDisabled(true)

        );

        await msg.edit({ components: [disabledRow] }).catch(() => {});

      });

    } catch (err) {

      console.error("Error in slist command:", err);

      await message.reply("⚠️ An error occurred while fetching the server list.");

    }

  },

};