const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.commands = new Map();
  client.slashCommands = new Map();

  const basePath = path.join(__dirname, "..", "commands");

  let normalCount = 0;
  let slashCount = 0;

  for (const category of fs.readdirSync(basePath)) {
    const categoryPath = path.join(basePath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const cmdFolder of fs.readdirSync(categoryPath)) {
      const cmdPath = path.join(categoryPath, cmdFolder);
      if (!fs.statSync(cmdPath).isDirectory()) continue;

      const file = fs.readdirSync(cmdPath).find(f => f.endsWith(".js"));
      if (!file) continue;

      const command = require(path.join(cmdPath, file));

      if (command?.name && typeof command.execute === "function") {
        client.commands.set(command.name.toLowerCase(), command);
        normalCount++;
      }

      if (command?.data && typeof command.execute === "function") {
        client.slashCommands.set(command.data.name.toLowerCase(), command);
        slashCount++;
      }
    }
  }

  console.log(`✅ Comandi normali caricati: ${normalCount}`);
  console.log(`✅ Slash commands caricati: ${slashCount}`);
};
