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
// LOAD EVENTS (separati) + LOGS
// ─────────────────────────────
const eventsPath = path.join(__dirname, "eventi");

if (!fs.existsSync(eventsPath)) {
  console.log("⚠️ Cartella eventi/ NON trovata:", eventsPath);
} else {
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));
  console.log("📦 Eventi trovati:", eventFiles.length ? eventFiles.join(", ") : "nessuno");

  for (const file of eventFiles) {
    try {
      require(path.join(eventsPath, file))(client);
      console.log("✅ Evento caricato:", file);
    } catch (e) {
      console.log("❌ Errore caricando evento:", file);
      console.error(e);
    }
  }
}

// ─────────────────────────────
// LOAD COMMANDS + LOGS
// ─────────────────────────────
client.commands = new Map();

const commandsRoot = path.join(__dirname, "commands");

if (!fs.existsSync(commandsRoot)) {
  console.log("⚠️ Cartella commands/ NON trovata:", commandsRoot);
} else {
  let loaded = 0;

  for (const category of fs.readdirSync(commandsRoot)) {
    const categoryPath = path.join(commandsRoot, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const commandFolder of fs.readdirSync(categoryPath)) {
      const commandPath = path.join(categoryPath, commandFolder);
      if (!fs.statSync(commandPath).isDirectory()) continue;

      const file = fs.readdirSync(commandPath).find((f) => f.endsWith(".js"));
      if (!file) continue;

      try {
        const command = require(path.join(commandPath, file));
        if (!command?.name || typeof command.execute !== "function") continue;

        client.commands.set(command.name.toLowerCase(), command);
        loaded++;
      } catch (e) {
        console.log("❌ Errore caricando comando:", path.join(category, commandFolder));
        console.error(e);
      }
    }
  }

  console.log(`✅ Caricati ${loaded} comandi`);
}

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
  try {
    if (message.author.bot || !message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = client.commands.get(commandName);
    if (!command) return;

    await command.execute(message, args);
  } catch (err) {
    console.error("❌ Command error:", err);
    try {
      await message.channel.send("❌ Errore durante l’esecuzione del comando.");
    } catch {}
  }
});

// ─────────────────────────────
// PROCESS ERROR HANDLERS (super utili su Railway)
// ─────────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("❌ unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
if (!process.env.TOKEN) {
  console.log("❌ TOKEN mancante. Metti TOKEN nelle Variables di Railway o in .env");
} else {
  client.login(process.env.TOKEN);
}
