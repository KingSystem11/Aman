/**
 * Premium Extend Command
 * Author: Aman (GlimpZ Project)
 * Description: Allows an owner to extend an existing user's premium duration safely.
 */

const { EmbedBuilder } = require('discord.js');
const { extendUserPremium, getUserPremium, savePremiumData, parseDuration } = require('../utils/premiumManager');
const owners = ["1113808268960206928", "832640702802296882"]; // 🟡 Add all bot owner IDs here

module.exports = {
  name: 'pextend',
  description: 'Extend a user’s premium time',
  usage: '!pextend <@user or ID> <duration>',
  aliases: ['premiumextend', 'extendpremium'],
  cooldown: 3,

  async execute(message, args) {
    try {
      // ✅ Owner Verification
      if (!owners.includes(message.author.id)) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff4444')
              .setTitle('⛔ Access Denied')
              .setDescription('Only bot owners can extend user premium durations.')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      // ✅ Check Arguments
      if (!args[0] || !args[1]) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ffcc00')
              .setTitle('⚠️ Invalid Usage')
              .setDescription('Correct Usage:\n`!pextend <@user or userID> <duration>`\n\n**Examples:**\n`!pextend @User 1month`\n`!pextend 123456789012345678 7d`')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      const user = message.mentions.users.first() ||
        (await message.client.users.fetch(args[0]).catch(() => null));
      if (!user) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ffcc00')
              .setTitle('⚠️ Invalid User')
              .setDescription('Please mention a valid user or provide a correct user ID.')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      const duration = parseDuration(args[1]);
      if (!duration) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ffcc00')
              .setTitle('⚠️ Invalid Duration')
              .setDescription('Please provide a valid duration like:\n`1d`, `1w`, `1month`, `3months`, `1y`, etc.`')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      // ✅ Fetch Current Premium
      const userPremium = getUserPremium(user.id);
      if (!userPremium) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ffcc00')
              .setTitle('⚠️ No Premium Found')
              .setDescription(`**${user.username}** doesn’t have any active premium to extend.`)
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      // ✅ Extend Premium Duration
      const success = extendUserPremium(user.id, duration);
      if (!success) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff4444')
              .setTitle('❌ Extend Failed')
              .setDescription('An unknown error occurred while extending this user’s premium.')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      await savePremiumData();

      // ✅ Confirmation Embed
      const embed = new EmbedBuilder()
        .setColor('#33cc66')
        .setTitle('🎉 Premium Extended Successfully!')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**User:** ${user.username}\n` +
          `**Tier:** ${userPremium.tier}\n` +
          `**Added Duration:** ${args[1]}\n` +
          `**New Expiry:** <t:${Math.floor(userPremium.expires / 1000)}:R>`
        )
        .setTimestamp()
        .setFooter({ text: 'Premium Manager System' });

      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error(`[PEXTEND Command Error]:`, err);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 Internal Error')
            .setDescription('Something went wrong while extending premium. Please check console logs.')
            .setFooter({ text: 'Premium Manager System' }),
        ],
      });
    }
  },
};