require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

// 🤖 Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // NECESSARIO per !
  ],
});

// 📦 Loader comandi
client.commands = new Map();

const commandsPath = path.join(__dirname, "commands");

for (const category of fs.readdirSync(commandsPath)) {
  const categoryPath = path.join(commandsPath, category);

  for (const commandFolder of fs.readdirSync(categoryPath)) {
    const commandPath = path.join(categoryPath, commandFolder);

    const commandFile = fs
      .readdirSync(commandPath)
      .find(file => file.endsWith(".js"));

    if (!commandFile) continue;

    const command = require(path.join(commandPath, commandFile));
    client.commands.set(command.name, command);
  }
}

console.log(`✅ Comandi caricati: ${client.commands.size}`);

// ⚡ Ready + Status
client.once("ready", () => {
  console.log(`🤖 Bot online come ${client.user.tag}`);

  client.user.setActivity("Comandi • !info", {
    type: "WATCHING", 
  });
});

// 💬 Prefix commands
const PREFIX = "!";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.channel.send("❌ Errore durante il comando.");
  }
});

// 🔐 Login
client.login(process.env.TOKEN);
