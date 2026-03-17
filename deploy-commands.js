require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

for (const category of fs.readdirSync(commandsPath)) {
  const categoryPath = path.join(commandsPath, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;

  for (const cmdFolder of fs.readdirSync(categoryPath)) {
    const cmdPath = path.join(categoryPath, cmdFolder);
    if (!fs.statSync(cmdPath).isDirectory()) continue;

    const file = fs.readdirSync(cmdPath).find(f => f.endsWith(".js"));
    if (!file) continue;

    const command = require(path.join(cmdPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

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
    console.error(error);
  }
})();
