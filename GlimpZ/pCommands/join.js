const { MessageFlags } = require("discord.js");
const { isNodeAvailable, ensureActivePlayer, cleanupPlayer } = require('../helpers/musicHelpers');

module.exports = {
  name: "join",
  description: "Make the bot join your voice channel and stay there permanently.",

  async execute(message) {
    try {
      const voiceChannel = message.member?.voice?.channel;

      if (!voiceChannel) {
        return message.reply({
          content: "❌ You must be in a voice channel to use this command!",
        });
      }

      if (!isNodeAvailable(message.client)) {
        return message.reply({
          content: "❌ Music server is currently unavailable. Please try again in a moment.",
        });
      }

      let existingPlayer = message.client.poru.players.get(message.guild.id);
      
      if (existingPlayer && existingPlayer.voiceChannel !== voiceChannel.id) {
        cleanupPlayer(existingPlayer);
        try {
          existingPlayer.destroy();
        } catch (e) {}
        existingPlayer = null;
      }

      const player = ensureActivePlayer(
        message.client,
        message.guild.id,
        voiceChannel.id,
        message.channel.id
      );

      await player.connect();

      return message.reply({
        content: `✅ Joined **${voiceChannel.name}**`,
      });

    } catch (error) {
      console.error("Join command error:", error);
      return message.reply({
        content: "⚠️ Failed to join the voice channel.",
      });
    }
  },
};