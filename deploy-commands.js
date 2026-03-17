require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

function scanCommands(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanCommands(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;

    try {
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);

      if (command?.data && typeof command.execute === "function") {
        commands.push(command.data.toJSON());
        console.log(`✅ Slash trovata: ${command.data.name}`);
      }
    } catch (err) {
      console.error(`❌ Errore leggendo comando: ${fullPath}`);
      console.error(err);
    }
  }
}

if (!process.env.TOKEN) {
  console.error("❌ TOKEN mancante nel file .env");
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error("❌ CLIENT_ID mancante nel file .env");
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.error("❌ GUILD_ID mancante nel file .env");
  process.exit(1);
}

if (!fs.existsSync(commandsPath)) {
  console.error("❌ Cartella commands/ non trovata");
  process.exit(1);
}

scanCommands(commandsPath);

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🔄 Registro ${commands.length} slash command...`);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Slash command registrati con successo.");
  } catch (error) {
    console.error("❌ Errore nel deploy dei comandi:");
    console.error(error);
  }
})();
