const fs = require("fs");
const path = require("path");

module.exports = (client) => {
  client.commands = new Map();
  client.slashCommands = new Map();

  const basePath = path.join(__dirname, "..", "commands");

  if (!fs.existsSync(basePath)) {
    console.log("⚠️ Cartella commands non trovata");
    return;
  }

  let prefixCount = 0;
  let slashCount = 0;

  for (const category of fs.readdirSync(basePath)) {
    const categoryPath = path.join(basePath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const cmdFolder of fs.readdirSync(categoryPath)) {
      const cmdPath = path.join(categoryPath, cmdFolder);
      if (!fs.statSync(cmdPath).isDirectory()) continue;

      const file = fs.readdirSync(cmdPath).find((f) => f.endsWith(".js"));
      if (!file) continue;

      try {
        const command = require(path.join(cmdPath, file));

        // Comando normale
        if (command?.name && typeof command.execute === "function") {
          client.commands.set(command.name.toLowerCase(), command);
          prefixCount++;
        }

        // Slash command
        if (command?.data && typeof command.execute === "function") {
          const slashName = command.data?.name;
          if (slashName) {
            client.slashCommands.set(slashName.toLowerCase(), command);
            slashCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Errore caricando comando: ${category}/${cmdFolder}/${file}`);
        console.error(err);
      }
    }
  }

  console.log(`✅ Comandi normali caricati: ${prefixCount}`);
  console.log(`✅ Slash commands caricati: ${slashCount}`);
};
