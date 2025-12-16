const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { getGuildPrefix } = require("../index");

const taglines = [
  "Elevate your server's vibe ",
  "Your beats. Your way. ",
  "Powered by passion, driven by sound ",
  "Nexo — redefining Discord music ",
  "Unleash your sound with Nexo "
];

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const mention1 = `<@${client.user.id}>`;
    const mention2 = `<@!${client.user.id}>`;
    const content = message.content.trim();

    if (
      (content === mention1 || content === mention2) &&
      !message.reference
    ) {
      const prefix = getGuildPrefix
        ? getGuildPrefix(message.guild.id)
        : ".";

      const tagline = taglines[Math.floor(Math.random() * taglines.length)];

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 128 }))
        .setTitle(`Hey, ${message.author.username}!`)
        .setDescription(
          `I'm **${client.user.username}**, your musical companion in **${message.guild.name}**!\n\n` +
          `> ${tagline}\n\n` +
          `**Prefix:** \`${prefix}\`\n` +
          `**Get Started:** Try \`${prefix}play <song>\`\n` +
          `**Help:** Use \`${prefix}help\` to explore features\n` +
          `**Change Prefix:** \`${prefix}setprefix <new>\``
        )
        .setFooter({ text: `Developed with love by Team Nexo | Uptime: ${Math.floor(client.uptime / 60000)} mins` });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(" Invite Bot")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`
          ),
        new ButtonBuilder()
          .setLabel(" Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/2mM2M5NzVD"),
        new ButtonBuilder()
          .setLabel(" Vote Me")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://top.gg/bot/${client.user.id}/vote`)
      );

      await message.reply({
        embeds: [embed],
        components: [buttons]
      });
    }
  }
};
