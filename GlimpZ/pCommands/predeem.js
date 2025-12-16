const { redeemKey } = require('../utils/premiumManager');

module.exports = {

  name: 'redeem',

  description: 'Redeem a premium code',

  async execute(message, args) {

    const code = args[0];

    if (!code) return message.reply('❌ Please provide a premium code.');

    const res = redeemKey(message.author.id, code);

    if (!res.success) return message.reply(`⚠️ ${res.message}`);

    return message.reply(`🎉 ${res.message}`);

  },

};