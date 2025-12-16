const { getUserPremium } = require('../utils/premiumManager');

module.exports = {

  name: 'premium-stats',

  description: 'View your premium statistics',

  async execute(message) {

    const userPremiums = getUserPremium(message.author.id);

    if (!userPremiums.length)

      return message.reply('❌ You don’t have any premium history.');

    const total = userPremiums.length;

    const servers = userPremiums.reduce((a, b) => a + b.activatedServers.length, 0);

    const highestTier = userPremiums.map(u => u.tier).sort((a, b) => ['bronze','silver','gold','platinum'].indexOf(b) - ['bronze','silver','gold','platinum'].indexOf(a))[0];

    message.reply(`📊 **Your Premium Stats**\n\nTotal Activations: ${servers}\nTotal Plans Redeemed: ${total}\nHighest Tier: ${highestTier.toUpperCase()}`);

  },

};