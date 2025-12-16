/**
 * Premium Activation Command
 * Author: Aman (GlimpZ Project)
 * Description: Allows users to redeem a premium code and activate premium features.
 */

const { EmbedBuilder } = require('discord.js');
const {
  getUserPremium,
  addUserPremium,
  savePremiumData,
  parseDuration,
} = require('../utils/premiumManager');
const fs = require('fs');
const path = require('path');

// ✅ Path for premium data
const dataPath = path.join(__dirname, '../data/premiumData.json');

module.exports = {
  name: 'premium-activate',
  aliases: ['predeem', 'redeem', 'activate'],
  description: 'Redeem a premium code to activate premium features.',
  usage: '!premium-activate <code>',
  cooldown: 3,

  async execute(message, args) {
    try {
      // 🧩 Load data file
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify({ users: {}, codes: [] }, null, 2));
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

      // 🚨 Argument Check
      if (!args[0]) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ffcc00')
              .setTitle('⚠️ Invalid Usage')
              .setDescription('Please provide a premium code.\n\n**Example:**\n`!premium-activate ABC123X`')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      const code = args[0].trim().toUpperCase();
      const codeData = data.codes.find(c => c.code === code);

      // 🚫 Invalid or Used Code
      if (!codeData) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff4444')
              .setTitle('❌ Invalid Code')
              .setDescription('That code does not exist or has already been redeemed.')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      // 🕐 Expired Code
      if (codeData.expires && codeData.expires < Date.now()) {
        data.codes = data.codes.filter(c => c.code !== code);
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ff4444')
              .setTitle('⌛ Code Expired')
              .setDescription('This premium code has expired. Please contact support or buy a new one.')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      // 💎 Activate Premium
      const userId = message.author.id;
      const now = Date.now();
      const tier = codeData.tier || 'Bronze';
      const durationMs = codeData.duration || parseDuration('1m'); // default 1 month
      const expires = now + durationMs;

      if (!data.users[userId]) {
        data.users[userId] = {
          tier,
          activated: now,
          expires,
          servers: [],
        };
      } else {
        // If user already has premium, extend it
        data.users[userId].tier = tier;
        data.users[userId].expires = Math.max(data.users[userId].expires, expires);
      }

      // 🗑️ Remove used code
      data.codes = data.codes.filter(c => c.code !== code);

      // 💾 Save changes
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      // 🥳 Success Embed
      const embed = new EmbedBuilder()
        .setColor('#00ff99')
        .setTitle('✅ Premium Activated Successfully!')
        .setDescription(
          `🎟️ **Code:** ${code}\n💎 **Tier:** ${tier}\n🕒 **Expires:** <t:${Math.floor(expires / 1000)}:F>\n\nEnjoy your premium features!`
        )
        .setFooter({ text: 'Premium Manager System' });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in premium-activate.js:', error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Unexpected Error')
            .setDescription('An internal error occurred while activating premium. Please try again later.')
            .setFooter({ text: 'Premium Manager System' }),
        ],
      });
    }
  },
};