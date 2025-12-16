const fs = require('fs');

const path = require('path');

function clearModuleCache(filePath) {

  const resolved = require.resolve(filePath);

  if (require.cache[resolved]) delete require.cache[resolved];

}

function reloadPrefixCommands(client, folderPath) {

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));

  for (const file of files) {

    const fullPath = path.join(folderPath, file);

    clearModuleCache(fullPath);

    const cmd = require(fullPath);

    if (cmd.name && cmd.execute) {

      client.prefixCommands.set(cmd.name, cmd);

    }

  }

  console.log(`[♻️] Prefix commands hot-reloaded`);

}

module.exports = { reloadPrefixCommands };