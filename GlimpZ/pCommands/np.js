const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const NoPrefix = require("../../database/models/NoPrefix");
const NpCode = require("../../database/models/NpCode");
const config = require("../config");
const emojis = require("../emojis.json");
const fs = require("fs");
const path = require("path");
const ms = require("ms");

const accessPath = path.join(__dirname, "..", "npAccess.json");

function loadAccess() {
  try {
    return JSON.parse(fs.readFileSync(accessPath, "utf8"));
  } catch {
    return { allowed: [] };
  }
}

module.exports = {
  name: "np",
  aliases: [],
  description: "Manage no-prefix access (Owner or Authorized Users only)",

  async execute(message, args) {
    const accessData = loadAccess();
    const authorId = message.author.id;
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === "claim") {
      return handleClaim(message, args);
    }

    if (
      message.author.id !== config.OWNER_ID &&
      !accessData.allowed.includes(authorId)
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`❌ You are not authorized to use this command.`);
      return message.reply({ embeds: [embed] });
    }

    if (!subCommand || !["add", "list", "remove", "gen", "codes"].includes(subCommand)) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(`Invalid usage!\n\n**Available commands:**\n\`np add @user\` - Grant no-prefix access\n\`np list\` - List all no-prefix users\n\`np remove @user\` - Revoke no-prefix access\n\`np gen <time> [np_duration]\` - Generate a claimable code\n\`np codes\` - List active codes\n\`np claim <code>\` - Claim no-prefix with a code`);
      return message.reply({ embeds: [embed] });
    }

    if (subCommand === "add") return handleAdd(message, args);
    if (subCommand === "list") return handleList(message);
    if (subCommand === "remove") return handleRemove(message, args);
    if (subCommand === "gen") return handleGen(message, args);
    if (subCommand === "codes") return handleCodes(message);
  },
};

async function handleGen(message, args) {
  const timeArg = args[1];
  const npDurationArg = args[2] || "lifetime";

  if (!timeArg) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Please specify code validity time!\nUsage: \`np gen <time> [np_duration]\`\n\nExamples:\n\`np gen 1h\` - Code valid for 1 hour, grants lifetime NP\n\`np gen 24h 1month\` - Code valid for 24 hours, grants 1 month NP\n\nValid durations: 1day, 1week, 1month, 3month, 6month, 1year, 3year, lifetime`);
    return message.reply({ embeds: [embed] });
  }

  const codeValidityMs = ms(timeArg);
  if (!codeValidityMs || codeValidityMs < 60000) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Invalid time format! Use formats like: 1h, 30m, 1d, 12h\nMinimum validity: 1 minute`);
    return message.reply({ embeds: [embed] });
  }

  const validDurations = ["1day", "1week", "1month", "3month", "6month", "1year", "3year", "lifetime"];
  const npDuration = npDurationArg.toLowerCase();
  if (!validDurations.includes(npDuration)) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Invalid no-prefix duration!\nValid options: 1day, 1week, 1month, 3month, 6month, 1year, 3year, lifetime`);
    return message.reply({ embeds: [embed] });
  }

  let durationMs = null;
  let durationText = "Lifetime";
  switch (npDuration) {
    case "1day":
      durationMs = 24 * 60 * 60 * 1000;
      durationText = "1 Day";
      break;
    case "1week":
      durationMs = 7 * 24 * 60 * 60 * 1000;
      durationText = "1 Week";
      break;
    case "1month":
      durationMs = 30 * 24 * 60 * 60 * 1000;
      durationText = "1 Month";
      break;
    case "3month":
      durationMs = 90 * 24 * 60 * 60 * 1000;
      durationText = "3 Months";
      break;
    case "6month":
      durationMs = 180 * 24 * 60 * 60 * 1000;
      durationText = "6 Months";
      break;
    case "1year":
      durationMs = 365 * 24 * 60 * 60 * 1000;
      durationText = "1 Year";
      break;
    case "3year":
      durationMs = 3 * 365 * 24 * 60 * 60 * 1000;
      durationText = "3 Years";
      break;
  }

  let code;
  let attempts = 0;
  do {
    code = NpCode.generateCode();
    const existing = await NpCode.findOne({ where: { code } });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  const expiresAt = new Date(Date.now() + codeValidityMs);

  await NpCode.create({
    code,
    duration: durationText,
    durationMs,
    createdBy: message.author.id,
    createdByUsername: message.author.username,
    expiresAt,
    isUsed: false,
  });

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle("No-Prefix Code Generated")
    .setDescription(`**Code:** \`${code}\`\n\n**Grants:** ${durationText} No-Prefix\n**Valid Until:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>\n\nUsers can claim with: \`np claim ${code}\``)
    .setFooter({ text: `Generated by ${message.author.username}` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleClaim(message, args) {
  const codeArg = args[1];

  if (!codeArg) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Please provide a code!\nUsage: \`np claim <code>\``);
    return message.reply({ embeds: [embed] });
  }

  const codeRecord = await NpCode.findValidCode(codeArg);
  if (!codeRecord) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Invalid or expired code!`);
    return message.reply({ embeds: [embed] });
  }

  const existing = await NoPrefix.findOne({ where: { userId: message.author.id } });
  
  let expiresAt = null;
  let isTimeAdded = false;
  let previousExpiry = null;

  if (existing) {
    if (existing.expiresAt === null) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`You already have lifetime no-prefix access!`);
      return message.reply({ embeds: [embed] });
    }
    
    if (codeRecord.durationMs === null) {
      existing.expiresAt = null;
      existing.duration = "Lifetime";
      await existing.save();
      expiresAt = null;
    } else {
      previousExpiry = new Date(existing.expiresAt);
      const baseTime = previousExpiry > new Date() ? previousExpiry.getTime() : Date.now();
      expiresAt = new Date(baseTime + parseInt(codeRecord.durationMs));
      existing.expiresAt = expiresAt;
      existing.duration = `Extended (+${codeRecord.duration})`;
      await existing.save();
      isTimeAdded = true;
    }
  } else {
    if (codeRecord.durationMs) {
      expiresAt = new Date(Date.now() + parseInt(codeRecord.durationMs));
    }

    await NoPrefix.create({
      userId: message.author.id,
      username: message.author.username,
      grantedBy: codeRecord.createdBy,
      grantedByUsername: codeRecord.createdByUsername,
      expiresAt,
      duration: codeRecord.duration,
    });
  }

  codeRecord.isUsed = true;
  codeRecord.claimedBy = message.author.id;
  codeRecord.claimedByUsername = message.author.username;
  codeRecord.claimedAt = new Date();
  await codeRecord.save();

  let description;
  if (isTimeAdded) {
    description = `You have successfully extended your no-prefix access!\n\n**Added:** ${codeRecord.duration}\n**New Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`;
  } else if (expiresAt === null) {
    description = `You have successfully ${existing ? 'upgraded to' : 'claimed'} lifetime no-prefix access!`;
  } else {
    description = `You have successfully claimed no-prefix access!\n\n**Duration:** ${codeRecord.duration}\n**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle(isTimeAdded ? "No-Prefix Extended!" : "No-Prefix Claimed!")
    .setDescription(description)
    .setFooter({ text: `Code: ${codeRecord.code}` })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function handleCodes(message) {
  const codes = await NpCode.findAll({
    where: { isUsed: false },
    order: [["createdAt", "DESC"]],
  });

  const validCodes = [];
  for (const code of codes) {
    if (new Date() < new Date(code.expiresAt)) {
      validCodes.push(code);
    } else {
      await code.destroy();
    }
  }

  if (validCodes.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`No active codes found!`);
    return message.reply({ embeds: [embed] });
  }

  let description = "";
  for (const code of validCodes.slice(0, 10)) {
    description += `**\`${code.code}\`** - ${code.duration} NP\nExpires: <t:${Math.floor(new Date(code.expiresAt).getTime() / 1000)}:R>\n\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("Active No-Prefix Codes")
    .setDescription(description)
    .setFooter({ text: `${validCodes.length} active code(s)` });

  return message.reply({ embeds: [embed] });
}

async function handleAdd(message, args) {
  const targetUser = message.mentions.users.first();

  if (!targetUser) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Please mention a user!\nUsage: \`np add @user\``);
    return message.reply({ embeds: [embed] });
  }

  if (targetUser.bot) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`You cannot grant no-prefix access to bots!`);
    return message.reply({ embeds: [embed] });
  }

  const existing = await NoPrefix.findOne({ where: { userId: targetUser.id } });
  if (existing) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`[${targetUser.username}](https://discord.com/users/${targetUser.id}) already has no-prefix access!`);
    return message.reply({ embeds: [embed] });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`np_duration_${targetUser.id}`)
    .setPlaceholder("Select duration")
    .addOptions([
      { label: "1 Day", description: "Access for 1 day", value: "1day" },
      { label: "1 Week", description: "Access for 1 week", value: "1week" },
      { label: "1 Month", description: "Access for 1 month", value: "1month" },
      { label: "3 Months", description: "Access for 3 months", value: "3month" },
      { label: "6 Months", description: "Access for 6 months", value: "6month" },
      { label: "1 Year", description: "Access for 1 year", value: "1year" },
      { label: "3 Years", description: "Access for 3 years", value: "3year" },
      { label: "Lifetime", description: "Access forever", value: "lifetime" },
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("Grant No-Prefix Access")
    .setDescription(`User: [${targetUser.username}](https://discord.com/users/${targetUser.id})\n\nSelect how long to grant no-prefix access:`);

  const response = await message.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== message.author.id)
      return i.reply({ content: "Only the command user can select!", ephemeral: true });

    const duration = i.values[0];
    let expiresAt = null;
    let durationText = "Lifetime";
    const now = new Date();

    switch (duration) {
      case "1day":
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        durationText = "1 Day";
        break;
      case "1week":
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        durationText = "1 Week";
        break;
      case "1month":
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        durationText = "1 Month";
        break;
      case "3month":
        expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        durationText = "3 Months";
        break;
      case "6month":
        expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        durationText = "6 Months";
        break;
      case "1year":
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        durationText = "1 Year";
        break;
      case "3year":
        expiresAt = new Date(now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);
        durationText = "3 Years";
        break;
    }

    await NoPrefix.create({
      userId: targetUser.id,
      username: targetUser.username,
      grantedBy: message.author.id,
      grantedByUsername: message.author.username,
      expiresAt: expiresAt,
      duration: durationText,
    });

    const successEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setDescription(`✅ Successfully granted no-prefix access to [${targetUser.username}](https://discord.com/users/${targetUser.id})\n\n**Duration:** ${durationText}${
        expiresAt ? `\n**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ""
      }`);

    await i.update({
      embeds: [successEmbed],
      components: [],
    });

    collector.stop();
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      const timeoutEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`Selection timed out!`);
      await response.edit({
        embeds: [timeoutEmbed],
        components: [],
      }).catch(() => {});
    }
  });
}

async function handleList(message) {
  const users = await NoPrefix.findAll({ order: [["createdAt", "DESC"]] });
  if (!users || users.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`No users have no-prefix access!`);
    return message.reply({ embeds: [embed] });
  }

  const createListPage = async (page = 1) => {
    const itemsPerPage = 5;
    const totalPages = Math.ceil(users.length / itemsPerPage) || 1;
    page = Math.max(1, Math.min(page, totalPages));
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentPageUsers = users.slice(start, end);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`nplist_prev_${page}`)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId(`nplist_next_${page}`)
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages)
    );

    let description = '';
    for (let i = 0; i < currentPageUsers.length; i++) {
      const user = currentPageUsers[i];
      try {
        const discordUser = await message.client.users.fetch(user.userId);
        const guildMember = await message.guild.members.fetch(user.userId).catch(() => null);

        description += `**${start + i + 1}.** [${user.username}](https://discord.com/users/${user.userId})\n`;
        description += `Account Created: <t:${Math.floor(discordUser.createdTimestamp / 1000)}:R>`;
        if (guildMember) {
          description += `\nJoined Server: <t:${Math.floor(guildMember.joinedTimestamp / 1000)}:R>`;
        }
        description += '\n\n';
      } catch {
        description += `**${start + i + 1}.** [${user.username}](https://discord.com/users/${user.userId})\n\n`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle("No-Prefix Users")
      .setDescription(description)
      .setFooter({ text: `Page ${page}/${totalPages} • ${users.length} total users` });

    return {
      embeds: [embed],
      components: [buttons],
      fetchReply: true,
    };
  };

  const response = await message.reply(await createListPage(1));
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== message.author.id)
      return i.reply({ content: `Only the command user can navigate!`, ephemeral: true });

    const customId = i.customId;
    const currentPage = parseInt(customId.split("_")[2]);
    let newPage = currentPage;
    if (customId.startsWith("nplist_prev")) newPage = currentPage - 1;
    else if (customId.startsWith("nplist_next")) newPage = currentPage + 1;
    await i.update(await createListPage(newPage));
  });

  collector.on("end", () => response.edit({ components: [] }).catch(() => {}));
}

async function handleRemove(message, args) {
  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`Please mention a user!\nUsage: \`np remove @user\``);
    return message.reply({ embeds: [embed] });
  }

  const record = await NoPrefix.findOne({ where: { userId: targetUser.id } });
  if (!record) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setDescription(`[${targetUser.username}](https://discord.com/users/${targetUser.id}) does not have no-prefix access!`);
    return message.reply({ embeds: [embed] });
  }

  await record.destroy();

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setDescription(`✅ Successfully revoked no-prefix access from [${targetUser.username}](https://discord.com/users/${targetUser.id})`);
  return message.reply({ embeds: [embed] });
}
