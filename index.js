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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ─────────────────────────────
// LOAD EVENTS (USA /events)
// ─────────────────────────────
const eventsPath = path.join(__dirname, "events");

if (!fs.existsSync(eventsPath)) {
  console.log("❌ Cartella events/ NON trovata:", eventsPath);
} else {
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
  console.log("📦 Eventi trovati:", files.length ? files.join(", ") : "nessuno");

  for (const file of files) {
    try {
      require(path.join(eventsPath, file))(client);
      console.log("✅ Evento caricato:", file);
    } catch (err) {
      console.error("❌ Errore caricando evento:", file);
      console.error(err);
    }
  }
}

// ─────────────────────────────
// LOAD COMMANDS
// ─────────────────────────────
client.commands = new Map();
const commandsRoot = path.join(__dirname, "commands");

let loaded = 0;

for (const category of fs.readdirSync(commandsRoot)) {
  const categoryPath = path.join(commandsRoot, category);
  if (!fs.statSync(categoryPath).isDirectory()) continue;

  for (const commandFolder of fs.readdirSync(categoryPath)) {
    const commandPath = path.join(categoryPath, commandFolder);
    if (!fs.statSync(commandPath).isDirectory()) continue;

    const file = fs.readdirSync(commandPath).find(f => f.endsWith(".js"));
    if (!file) continue;

    const command = require(path.join(commandPath, file));
    if (!command?.name || typeof command.execute !== "function") continue;

    client.commands.set(command.name.toLowerCase(), command);
    loaded++;
  }
}

console.log(`✅ Caricati ${loaded} comandi`);

// ─────────────────────────────
// READY
// ─────────────────────────────
client.once(Events.ClientReady, () => {
  console.log(`🔥 FireStorm online come ${client.user.tag}`);
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
    console.error("❌ Command error:", err);
    message.channel.send("❌ Errore durante il comando.");
  }
});

// ─────────────────────────────
// SAFETY (Railway)
// ─────────────────────────────
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
