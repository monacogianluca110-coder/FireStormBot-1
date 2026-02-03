const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.commands = new Map();

  const basePath = path.join(__dirname, "..", "commands");

  for (const category of fs.readdirSync(basePath)) {
    const categoryPath = path.join(basePath, category);

    for (const cmdFolder of fs.readdirSync(categoryPath)) {
      const cmdPath = path.join(categoryPath, cmdFolder);

      const file = fs.readdirSync(cmdPath).find(f => f.endsWith(".js"));
      if (!file) continue;

      const command = require(path.join(cmdPath, file));
      client.commands.set(command.name, command);
    }
  }

  console.log(`✅ Comandi caricati: ${client.commands.size}`);
};
