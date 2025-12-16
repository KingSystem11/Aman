// pCommands/npaccess.js

const fs = require('fs');

const path = require('path');

const accessPath = path.join(__dirname, '..', 'npAccess.json');

function loadAccess() {

  try {

    return JSON.parse(fs.readFileSync(accessPath, 'utf8'));

  } catch (e) {

    return { allowed: [] };

  }

}

function saveAccess(data) {

  fs.writeFileSync(accessPath, JSON.stringify(data, null, 2));

}

module.exports = {

  name: 'npaccess',

  aliases: ['npacc'],

  description: 'Manage who can grant NoPrefix access to others.',

  async execute(message, args) {

    // Only allow in guilds

    if (!message.guild) return message.reply('This command only works in servers.');

    const authorId = message.author.id;

    const data = loadAccess();

    // Only allowed users can use this command

    if (!data.allowed.includes(authorId)) {

      return message.reply('❌ You are not authorized to use this command.');

    }

    const sub = (args[0] || '').toLowerCase();

    const target = message.mentions.users.first();

    if (!sub) {

      return message.reply('⚙️ Usage: `!npaccess <add|remove|list> [@user]`');

    }

    if (sub === 'add') {

      if (!target) return message.reply('⚠️ Mention a user to give access. Example: `!npaccess add @User`');

      if (data.allowed.includes(target.id)) return message.reply('⚠️ That user already has access.');

      data.allowed.push(target.id);

      saveAccess(data);

      return message.reply(`✅ Added **${target.tag}** to NoPrefix Access list.`);

    }

    if (sub === 'remove') {

      if (!target) return message.reply('⚠️ Mention a user to remove. Example: `!npaccess remove @User`');

      if (!data.allowed.includes(target.id)) return message.reply('⚠️ That user does not have access.');

      data.allowed = data.allowed.filter(id => id !== target.id);

      saveAccess(data);

      return message.reply(`✅ Removed **${target.tag}** from NoPrefix Access list.`);

    }

    if (sub === 'list') {

      if (!data.allowed.length) return message.reply('📜 No one currently has NoPrefix access.');

      const list = data.allowed.map(id => `<@${id}>`).join(', ');

      return message.reply(`👑 Users with NoPrefix Access:\n${list}`);

    }

    return message.reply('⚙️ Usage: `!npaccess <add|remove|list> [@user]`');

  }

};