/**
 * Premium Manager System — GlimpZ Project
 * Author: Aman
 * Description: Handles all premium-related data, validation, and server linking.
 */

const fs = require("fs");
const path = require("path");

// ✅ Data file path (make sure /data folder exists)
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dataFile = path.join(dataDir, "premiumData.json");

// ✅ Initialize file if missing
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ users: {} }, null, 2));
}

// 🧩 Load Premium Data
function loadData() {
  try {
    const raw = fs.readFileSync(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[PremiumManager] Failed to load premiumData.json:", err);
    return { users: {} };
  }
}

// 💾 Save Premium Data (Safe)
function savePremiumData(data) {
  try {
    if (!data || typeof data !== "object") {
      console.warn("[PremiumManager] Tried to save invalid data — skipping save.");
      return false;
    }
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[PremiumManager] Failed to save premiumData.json:", err);
    return false;
  }
}

// 🕓 Duration Parser
function parseDuration(durationStr) {
  if (!durationStr) return null;
  const map = {
    d: 86400000, // 1 day
    w: 604800000, // 1 week
    month: 2592000000, // 30 days
    months: 2592000000,
    y: 31536000000, // 1 year
    lifetime: Infinity,
  };

  const match = durationStr.match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (!map[unit]) return null;
  return map[unit] === Infinity ? Infinity : value * map[unit];
}

// ➕ Add User Premium
function addUserPremium(userId, tier, duration) {
  const data = loadData();
  const expires = duration === Infinity ? Infinity : Date.now() + duration;

  data.users[userId] = {
    tier,
    expires,
    servers: [],
  };

  savePremiumData(data);
  return true;
}

// 🔍 Get User Premium
function getUserPremium(userId) {
  const data = loadData();
  const user = data.users[userId];
  if (!user) return null;
  if (user.expires !== Infinity && Date.now() > user.expires) {
    delete data.users[userId];
    savePremiumData(data);
    return null;
  }
  return user;
}

// ⏳ Extend Premium
function extendUserPremium(userId, duration) {
  const data = loadData();
  const user = data.users[userId];
  if (!user) return false;

  const additional = duration === Infinity ? Infinity : duration;
  if (user.expires === Infinity || additional === Infinity) {
    user.expires = Infinity;
  } else {
    user.expires += additional;
  }

  savePremiumData(data);
  return true;
}

// ❌ Revoke Premium
function revokeUserPremium(userId) {
  const data = loadData();
  if (!data.users[userId]) return false;

  delete data.users[userId];
  savePremiumData(data);
  return true;
}

// 🧹 Cleanup Expired Premiums
function cleanupExpired() {
  const data = loadData();
  const now = Date.now();
  let changed = false;

  for (const userId in data.users) {
    const user = data.users[userId];
    if (user.expires !== Infinity && now > user.expires) {
      delete data.users[userId];
      changed = true;
    }
  }

  if (changed) savePremiumData(data);
}

// 🏷️ Server Premium Management
function enableServerPremium(serverId, userId) {
  const data = loadData();
  const user = data.users[userId];
  if (!user) return { success: false, reason: "User does not have premium." };

  if (!user.servers) user.servers = [];

  const tierLimits = { Bronze: 5, Silver: 10, Gold: 30, Platinum: 50 };
  const limit = tierLimits[user.tier] || 0;

  if (user.servers.length >= limit) {
    return { success: false, reason: `You have reached your ${user.tier} tier limit of ${limit} servers.` };
  }

  if (user.servers.includes(serverId)) {
    return { success: false, reason: "Premium already enabled for this server." };
  }

  user.servers.push(serverId);
  savePremiumData(data);
  return { success: true, tier: user.tier, limit };
}

function disableServerPremium(serverId, userId) {
  const data = loadData();
  const user = data.users[userId];
  if (!user || !user.servers) return false;

  user.servers = user.servers.filter(id => id !== serverId);
  savePremiumData(data);
  return true;
}

function getServerPremium(serverId) {
  const data = loadData();
  for (const userId in data.users) {
    const user = data.users[userId];
    if (user.servers && user.servers.includes(serverId)) {
      return { owner: userId, tier: user.tier, expires: user.expires };
    }
  }
  return null;
}

// ✅ Export All Functions
module.exports = {
  loadData,
  savePremiumData,
  parseDuration,
  addUserPremium,
  getUserPremium,
  extendUserPremium,
  revokeUserPremium,
  cleanupExpired,
  enableServerPremium,
  disableServerPremium,
  getServerPremium
};