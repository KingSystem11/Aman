/**

 * Premium Disable Command — GlimpZ Project

 * Author: Aman

 */

const { EmbedBuilder } = require("discord.js");

const { getUserPremium, disableServerPremium, getServerPremium } = require("../utils/premiumManager");

module.exports = {

  name: "premium-disable",

  description: "Disable premium features for this server.",

  usage: "!premium-disable",

  async execute(message) {

    const guildId = message.guild.id;

    const userId = message.author.id;

    const serverPremium = getServerPremium(guildId);

    if (!serverPremium) {

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#ffcc00")

            .setTitle("⚠️ No Premium Found")

            .setDescription("This server does not have premium enabled.")

            .setFooter({ text: "Premium Manager System" }),

        ],

      });

    }

    if (serverPremium.owner !== userId) {

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#ff4444")

            .setTitle("⛔ Permission Denied")

            .setDescription("Only the user who activated premium can disable it.")

            .setFooter({ text: "Premium Manager System" }),

        ],

      });

    }

    const disabled = disableServerPremium(guildId, userId);

    if (!disabled) {

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#ff0000")

            .setTitle("❌ Error")

            .setDescription("Something went wrong while disabling premium.")

            .setFooter({ text: "Premium Manager System" }),

        ],

      });

    }

    return message.reply({

      embeds: [

        new EmbedBuilder()

          .setColor("#00ff99")

          .setTitle("✅ Premium Disabled")

          .setDescription(`Premium has been successfully disabled for **${message.guild.name}**.`)

          .setFooter({ text: "Premium Manager System" }),

      ],

    });

  },

};