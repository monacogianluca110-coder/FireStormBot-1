require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsRoot = path.join(__dirname, "commands");

function loadCommandsFromTree(rootDir) {
  if (!fs.existsSync(rootDir)) return;

  for (const entry of fs.readdirSync(rootDir)) {
    const fullPath = path.join(rootDir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadCommandsFromTree(fullPath);
      continue;
    }

    if (!entry.endsWith(".js")) continue;

    try {
      const command = require(fullPath);

      if (command?.data && typeof command.data.toJSON === "function") {
        commands.push(command.data.toJSON());
        console.log(`✅ Slash trovato: ${fullPath}`);
      }
    } catch (err) {
      console.error(`❌ Errore caricando ${fullPath}`);
      console.error(err);
    }
  }
}

loadCommandsFromTree(commandsRoot);

if (!process.env.TOKEN) {
  console.error("❌ TOKEN mancante nelle variabili ambiente.");
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error("❌ CLIENT_ID mancante nelle variabili ambiente.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🚀 Deploy di ${commands.length} comandi slash...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Comandi slash deployati con successo.");
  } catch (error) {
    console.error("❌ Errore durante il deploy dei comandi:");
    console.error(error);
  }
})();
