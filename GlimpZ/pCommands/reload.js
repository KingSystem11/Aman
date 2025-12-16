const { reloadPrefixCommands } = require('../utils/reloader');

const path = require('path');

const OWNER_IDS = ["1113808268960206928"];

module.exports = {

  name: "reload",

  description: "Reloads all commands without restarting the bot",

  

  async execute(message) {

    if (!OWNER_IDS.includes(message.author.id)) return message.reply("❌ You can’t use this.");

    const folderPath = path.join(__dirname);

    reloadPrefixCommands(message.client, folderPath);

    return message.reply("✅ Commands reloaded successfully — no restart needed!");

  }

};