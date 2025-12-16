/**
 * Premium Status Command
 * Author: Aman (GlimpZ Project)
 * Description: Displays the user's premium tier, expiry date, and server activations.
 */

const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getUserPremium } = require('../utils/premiumManager'); // ✅ Correct relative path

// Path to premium data file
const dataPath = path.join(__dirname, '../data/premiumData.json');

module.exports = {
  name: 'premium-status',
  aliases: ['pstatus', 'premiumstats', 'premiuminfo'],
  description: 'Check your premium status, tier, and expiry time.',
  usage: '!premium-status',
  cooldown: 3,

  async execute(message) {
    try {
      // 🔍 Check if premium data file exists
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(path.dirname(dataPath), { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify({ users: {}, codes: [] }, null, 2));
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      const userId = message.author.id;

      // 🧩 Check user premium record
      const userPremium = data.users[userId];

      if (!userPremium) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ffcc00')
              .setTitle('💤 No Active Premium Found')
              .setDescription('You don’t currently have an active premium plan.\n\nUse `!premium-activate <code>` to activate premium.')
              .setFooter({ text: 'Premium Manager System' }),
          ],
        });
      }

      // 🕒 Calculate remaining time
      const expiresTimestamp = userPremium.expires;
      const remainingMs = expiresTimestamp - Date.now();
      const remainingDays = Math.max(Math.floor(remainingMs / (1000 * 60 * 60 * 24)), 0);

      // 🏷️ Tier details
      const tierColors = {
        Bronze: '#cd7f32',
        Silver: '#c0c0c0',
        Gold: '#ffd700',
        Platinum: '#00ffff',
      };

      const color = tierColors[userPremium.tier] || '#00ff99';
      const expiresFormatted = `<t:${Math.floor(expiresTimestamp / 1000)}:F>`;
      const activatedFormatted = `<t:${Math.floor(userPremium.activated / 1000)}:F>`;

      // 💾 Number of servers premium is activated on
      const serverCount = userPremium.servers ? userPremium.servers.length : 0;

      // 📜 Build Embed
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`💎 Premium Status — ${message.author.username}`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**👤 User ID:** \`${userId}\`\n**💎 Tier:** ${userPremium.tier}\n**📅 Activated:** ${activatedFormatted}\n**⌛ Expires:** ${expiresFormatted}\n**⏱️ Remaining:** ${remainingDays} days\n**🌐 Servers Activated:** ${serverCount}`
        )
        .setFooter({ text: 'Premium Manager System — GlimpZ' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in premium-status.js:', error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Unexpected Error')
            .setDescription('Something went wrong while fetching your premium status. Please try again later.')
            .setFooter({ text: 'Premium Manager System' }),
        ],
      });
    }
  },
};