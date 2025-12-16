const { MessageFlags } = require("discord.js");

module.exports = {

  name: "join",

  description: "Make the bot join your voice channel and stay there permanently.",

  async execute(message) {

    try {

      // user must be in VC

      const voiceChannel = message.member?.voice?.channel;

      if (!voiceChannel) {

        return message.reply({

          content: "❌ You must be in a voice channel to use this command!",

          flags: MessageFlags.IsPersistent,

        });

      }

      // connect bot using Poru

      const player = message.client.poru.players.get(message.guild.id) ||

        message.client.poru.createConnection({

          guildId: message.guild.id,

          voiceChannel: voiceChannel.id,

          textChannel: message.channel.id,

          deaf: true,

        });

      await player.connect();

      return message.reply({

        content: `✅ Joined **${voiceChannel.name}**`,

        flags: MessageFlags.IsPersistent,

      });

    } catch (error) {

      console.error("Join command error:", error);

      return message.reply({

        content: "⚠️ Failed to join the voice channel.",

        flags: MessageFlags.IsPersistent,

      });

    }

  },

};