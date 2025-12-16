/**

 * Premium Enable Command — GlimpZ Project

 * Author: Aman

 */

const { EmbedBuilder } = require("discord.js");

const {

  getUserPremium,

  enableServerPremium,

  getServerPremium

} = require("../utils/premiumManager");

module.exports = {

  name: "premium-enable",

  description: "Enable premium features for this server using your premium.",

  usage: "!premium-enable",

  async execute(message) {

    const guildId = message.guild.id;

    const userId = message.author.id;

    try {

      const userPremium = getUserPremium(userId);

      if (!userPremium) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ff4444")

              .setTitle("⛔ No Active Premium")

              .setDescription("You don’t have an active premium plan. Redeem one using `!premium-activate <code>`.")

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      const existing = getServerPremium(guildId);

      if (existing) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ffcc00")

              .setTitle("⚠️ Already Premium")

              .setDescription(`This server already has **${existing.tier}** tier premium enabled by <@${existing.owner}>.`)

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      const result = enableServerPremium(guildId, userId);

      if (!result.success) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ff4444")

              .setTitle("❌ Failed to Enable Premium")

              .setDescription(result.reason)

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#00ff99")

            .setTitle("✅ Premium Enabled")

            .setDescription(

              `**Server:** ${message.guild.name}\n**Tier:** ${result.tier}\n**Limit:** ${result.limit} servers\n\nPremium is now active!`

            )

            .setFooter({ text: "Premium Manager System" })

            .setTimestamp(),

        ],

      });

    } catch (err) {

      console.error("Error in premium-enable.js:", err);

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#ff0000")

            .setTitle("❌ Error")

            .setDescription("An unexpected error occurred while enabling premium.")

            .setFooter({ text: "Premium Manager System" }),

        ],

      });

    }

  },

};