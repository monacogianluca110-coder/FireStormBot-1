require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

function scanCommands(dirPath) {
  for (const entry of fs.readdirSync(dirPath)) {
    const entryPath = path.join(dirPath, entry);
    const stat = fs.statSync(entryPath);

    if (stat.isDirectory()) {
      scanCommands(entryPath);
    } else if (entry.endsWith(".js")) {
      const command = require(entryPath);
      if (command?.data) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

scanCommands(commandsPath);

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🔄 Registro ${commands.length} slash command...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash command registrati con successo.");
  } catch (error) {
    console.error("❌ Errore nel deploy dei comandi:");
    console.error(error);
  }
})();
