/**

 * Premium Revoke Command — GlimpZ Project

 * Author: Aman

 */

const { EmbedBuilder } = require("discord.js");

const { getUserPremium, revokeUserPremium } = require("../utils/premiumManager");

const owners = ["1113808268960206928", "832640702802296882"]; // 🟡 Add all owner IDs here

module.exports = {

  name: "prevoke",

  description: "Revoke a user's premium access.",

  usage: "!prevoke <@user or userID>",

  cooldown: 3,

  async execute(message, args) {

    try {

      // 🧾 Owner Check

      if (!owners.includes(message.author.id)) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ff4444")

              .setTitle("⛔ Access Denied")

              .setDescription("Only bot owners can revoke premium access.")

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      // 🧩 Argument Check

      if (!args[0]) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ffcc00")

              .setTitle("⚠️ Invalid Usage")

              .setDescription("Correct usage:\n`!prevoke <@user or userID>`")

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      // 👤 Get User

      const user = message.mentions.users.first() ||

                   (await message.client.users.fetch(args[0]).catch(() => null));

      if (!user) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ffcc00")

              .setTitle("⚠️ Invalid User")

              .setDescription("Please mention a valid user or provide a valid ID.")

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      // 🔍 Check if user actually has premium

      const premiumData = getUserPremium(user.id);

      if (!premiumData) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ffaa00")

              .setTitle("⚠️ No Active Premium")

              .setDescription("That user does not currently have any active premium plan.")

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      // ❌ Revoke Premium

      const revoked = revokeUserPremium(user.id);

      if (!revoked) {

        return message.reply({

          embeds: [

            new EmbedBuilder()

              .setColor("#ff0000")

              .setTitle("❌ Error")

              .setDescription("Failed to revoke premium. Please check logs.")

              .setFooter({ text: "Premium Manager System" }),

          ],

        });

      }

      // ✅ Success

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#00ff99")

            .setTitle("✅ Premium Revoked")

            .setDescription(`Successfully revoked **${premiumData.tier}** premium from **${user.tag}**.`)

            .setFooter({ text: "Premium Manager System" })

            .setTimestamp(),

        ],

      });

    } catch (err) {

      console.error("[Prevoked Command Error]:", err);

      return message.reply({

        embeds: [

          new EmbedBuilder()

            .setColor("#ff0000")

            .setTitle("❌ Unexpected Error")

            .setDescription("An unexpected error occurred while revoking premium.")

            .setFooter({ text: "Premium Manager System" }),

        ],

      });

    }

  },

};