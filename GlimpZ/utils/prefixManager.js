/**
 * Prefix Manager System — GlimpZ Project
 * Author: Aman
 * Description: Handles saving, loading, and managing server-specific command prefixes.
 */

const fs = require("fs");
const path = require("path");

// ✅ Folder & File Setup
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const prefixFile = path.join(dataDir, "prefixes.json");

// ✅ Create prefixes.json if missing
if (!fs.existsSync(prefixFile)) {
  fs.writeFileSync(prefixFile, JSON.stringify({}, null, 2));
}

// 🧩 Default Prefix
const defaultPrefix = "!"; // You can change this to "." or any other symbol

// 🧱 Load Prefix Data
function loadPrefixes() {
  try {
    const raw = fs.readFileSync(prefixFile, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[PrefixManager] Failed to load prefixes.json:", err);
    return {};
  }
}

// 💾 Save Prefix Data
function savePrefixes(data) {
  try {
    if (!data || typeof data !== "object") {
      console.warn("[PrefixManager] Tried to save invalid data — skipping save.");
      return false;
    }
    fs.writeFileSync(prefixFile, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[PrefixManager] Failed to save prefixes.json:", err);
    return false;
  }
}

// 🔍 Get Prefix for a Guild
function getPrefix(guildId) {
  const data = loadPrefixes();
  return data[guildId] || defaultPrefix;
}

// ➕ Set Prefix for a Guild
function setPrefix(guildId, newPrefix) {
  if (!guildId || typeof newPrefix !== "string" || !newPrefix.length) {
    console.warn("[PrefixManager] Invalid prefix or guild ID provided.");
    return false;
  }

  const data = loadPrefixes();
  data[guildId] = newPrefix;
  savePrefixes(data);
  return true;
}

// 🔄 Reset Prefix to Default
function resetPrefix(guildId) {
  const data = loadPrefixes();
  if (!data[guildId]) return false;

  delete data[guildId];
  savePrefixes(data);
  return true;
}

// 🔧 List All Prefixes (for debugging or owner use)
function listAllPrefixes() {
  return loadPrefixes();
}

// ✅ Export All Functions
module.exports = {
  getPrefix,
  setPrefix,
  resetPrefix,
  listAllPrefixes,
  defaultPrefix
};