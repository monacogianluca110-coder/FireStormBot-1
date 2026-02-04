require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// ─────────────────────────────
// CLIENT
// ─────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // ✅ necessario per welcome
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ─────────────────────────────
// LOAD EVENTS (separati)
// ─────────────────────────────
const eventsPath = path.join(__dirname, "eventi");
if (fs.existsSync(eventsPath)) {
  for (const file of fs.readdirSync(eventsPath)) {
    if (!file.endsWith(".js")) continue;
    require(path.join(eventsPath, file))(client);
  }
}

// ─────────────────────────────
// LOAD COMMANDS
// ─────────────────────────────
client.commands = new Map();

const commandsRoot = path.join(__dirname, "commands");

for (const category of fs.readdirSync(commandsRoot)) {
  const categoryPath = path.join(commandsRoot, category);

  for (const commandFolder of fs.readdirSync(categoryPath)) {
    const commandPath = path.join(categoryPath, commandFolder);

    const file = fs.readdirSync(commandPath).find(f => f.endsWith(".js"));
    if (!file) continue;

    const command = require(path.join(commandPath, file));
    if (!command?.name || typeof command.execute !== "function") continue;

    client.commands.set(command.name.toLowerCase(), command);
  }
}

console.log(`✅ Loaded ${client.commands.size} commands`);

// ─────────────────────────────
// READY
// ─────────────────────────────
client.once(Events.ClientReady, () => {
  console.log(`🔥 FireStorm online as ${client.user.tag}`);

  client.user.setActivity("Comandi • !info", {
    type: ActivityType.Watching,
  });
});

// ─────────────────────────────
// PREFIX HANDLER
// ─────────────────────────────
const PREFIX = "!";

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error("Command error:", err);
    message.channel.send("❌ Errore durante l’esecuzione del comando.");
  }
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
