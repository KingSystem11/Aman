const { PermissionFlagsBits } = require('discord.js');

function formatDuration(ms) {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function createProgressBar(player) {
    if (!player.currentTrack || !player.currentTrack.info.length) return '';
    if (player.currentTrack.info.isStream) return '`00:00|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔴 LIVE`';

    const current = player.position;
    const total = player.currentTrack.info.length;
    const size = 25;

    let percent = Math.round((current / total) * size);
    if (percent < 0) percent = 0;
    if (percent > size) percent = size;

    const empty = size - percent;
    const safeEmpty = empty < 0 ? 0 : empty;

    const progress = '▬'.repeat(percent) + '🔵' + '▬'.repeat(safeEmpty);
    return `\`${formatDuration(current)}|${progress}|${formatDuration(total)}\``;
}

function hasControlPermission(interactionOrMessage, player) {
    if (!player.currentTrack) return false;
    
    const member = interactionOrMessage.member;
    const userId = interactionOrMessage.user?.id || interactionOrMessage.author?.id;
    
    if (member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    const requesterId = player.currentTrack.info.requester?.id;
    if (userId === requesterId) return true;

    return false;
}

function isNodeAvailable(client) {
    if (!client.poru || !client.poru.nodes) return false;
    const nodes = Array.from(client.poru.nodes.values());
    return nodes.some(node => {
        if (node.isConnected === true) return true;
        if (node.connected === true) return true;
        if (node.state === 'CONNECTED' || node.state === 1) return true;
        if (node.ws && node.ws.readyState === 1) return true;
        return false;
    });
}

function getAvailableNode(client) {
    if (!client.poru || !client.poru.nodes) return null;
    const nodes = Array.from(client.poru.nodes.values());
    return nodes.find(node => {
        if (node.isConnected === true) return true;
        if (node.connected === true) return true;
        if (node.state === 'CONNECTED' || node.state === 1) return true;
        if (node.ws && node.ws.readyState === 1) return true;
        return false;
    }) || null;
}

function cleanupPlayer(player) {
    if (!player) return;
    
    if (player.updateInterval) {
        clearInterval(player.updateInterval);
        player.updateInterval = null;
    }
    
    if (player.buttonCollector) {
        try {
            player.buttonCollector.stop('cleanup');
        } catch (e) {}
        player.buttonCollector = null;
    }
    
    if (player.selectCollector) {
        try {
            player.selectCollector.stop('cleanup');
        } catch (e) {}
        player.selectCollector = null;
    }
    
    if (player.nowPlayingMessage && player.nowPlayingMessage.deletable) {
        player.nowPlayingMessage.delete().catch(() => {});
        player.nowPlayingMessage = null;
    }
    
    player._moodplayActive = false;
    player._moodplayMood = null;
    player._lastPlayedTrack = null;
    player._autoplayHistory = null;
}

function ensureActivePlayer(client, guildId, userVoiceChannelId, textChannelId) {
    let player = client.poru.players.get(guildId);
    
    if (player) {
        if (!player.isConnected || player.voiceChannel !== userVoiceChannelId) {
            cleanupPlayer(player);
            try {
                player.destroy();
            } catch (e) {}
            player = null;
        }
    }
    
    if (!player) {
        player = client.poru.createConnection({
            guildId: guildId,
            voiceChannel: userVoiceChannelId,
            textChannel: textChannelId,
            deaf: true,
        });
    } else {
        player.textChannel = textChannelId;
        if (player.voiceChannel !== userVoiceChannelId) {
            player.voiceChannel = userVoiceChannelId;
        }
    }
    
    if (player.autoplayEnabled === undefined) {
        player.autoplayEnabled = false;
    }
    
    return player;
}

async function safeResolve(client, query, requester) {
    if (!isNodeAvailable(client)) {
        throw new Error('No Lavalink nodes are currently available. Please try again in a moment.');
    }
    
    return await client.poru.resolve({ query, requester });
}

module.exports = {
    formatDuration,
    createProgressBar,
    hasControlPermission,
    isNodeAvailable,
    getAvailableNode,
    cleanupPlayer,
    ensureActivePlayer,
    safeResolve
};