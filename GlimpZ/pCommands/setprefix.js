const { EmbedBuilder } = require("discord.js");
const { getPrefix, setPrefix } = require("../utils/prefixManager");

module.exports = {
  name: "setprefix",
  aliases: ["changeprefix"],
  description: "Change the bot prefix for this server",
  usage: "<new prefix>",

  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ You need `Administrator` permission to change the prefix.");
    }

    const newPrefix = args[0];
    if (!newPrefix)
      return message.reply("⚠️ Please provide a new prefix.\nExample: `!setprefix +`");

    if (newPrefix.length > 3)
      return message.reply("❌ Prefix should not be longer than 3 characters.");

    const oldPrefix = getPrefix(message.guild.id);
    setPrefix(message.guild.id, newPrefix);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("🔧 Prefix Updated")
      .setDescription(
        `<:emoji_54:1435581730114375683> Server: **${message.guild.name}**\n<:emoji_54:1435581730114375683> Old Prefix: \`${oldPrefix}\`\n<:emoji_54:1435581730114375683> New Prefix: \`${newPrefix}\`\n\nNow you can use commands like:\n\`${newPrefix}play <song>\` or \`${newPrefix}help\`.`
      );

    await message.reply({ embeds: [embed] });

    console.log(`🔧 Prefix changed in ${message.guild.name} (${message.guild.id}) → ${newPrefix}`);
  },
};
