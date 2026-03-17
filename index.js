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
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildExpressions, // emoji + sticker
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.User,
    Partials.GuildMember,
  ],
});

// ─────────────────────────────
// LOAD EVENTS (events/)
// ─────────────────────────────
const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));
  console.log("📦 Eventi trovati:", files.length ? files.join(", ") : "nessuno");

  for (const file of files) {
    try {
      require(path.join(eventsPath, file))(client);
      console.log("✅ Evento caricato:", file);
    } catch (err) {
      console.error("❌ Errore evento:", file);
      console.error(err);
    }
  }
} else {
  console.log("⚠️ Cartella events/ non trovata");
}

// ─────────────────────────────
// LOAD COMMANDS (commands/)
// ─────────────────────────────
client.commands = new Map();
const commandsRoot = path.join(__dirname, "commands");

let loaded = 0;

if (fs.existsSync(commandsRoot)) {
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
      } catch (err) {
        console.error(`❌ Errore caricando comando ${category}/${commandFolder}/${file}`);
        console.error(err);
      }
    }
  }
}

console.log(`✅ Caricati ${loaded} comandi`);

// ─────────────────────────────
// LOAD LOGS SYSTEM (logs/*.js)
// ─────────────────────────────
const logsPath = path.join(__dirname, "logs");

if (fs.existsSync(logsPath)) {
  const logFiles = fs.readdirSync(logsPath).filter((f) => f.endsWith(".js"));
  console.log("📚 Logs trovati:", logFiles.length ? logFiles.join(", ") : "nessuno");

  for (const file of logFiles) {
    try {
      require(path.join(logsPath, file))(client);
      console.log("✅ Log caricato:", file);
    } catch (err) {
      console.error("❌ Errore caricando log:", file);
      console.error(err);
    }
  }
} else {
  console.log("⚠️ Cartella logs/ non trovata");
}

// ─────────────────────────────
// READY
// ─────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`🔥 FireStorm online come ${client.user.tag}`);

  client.user.setActivity("Comandi • !info", {
    type: ActivityType.Watching,
  });

  // Test scrittura
  const TEST_CH = "1455214028170334278";
  try {
    const ch = await client.channels.fetch(TEST_CH);
    if (ch) {
      await ch.send("✅ TEST: posso scrivere nei logs (server-log).");
      console.log("✅ Test scrittura log OK");
    }
  } catch (e) {
    console.error("❌ Test scrittura log FALLITO:", e?.message || e);
  }
});

// ─────────────────────────────
// PREFIX HANDLER
// ─────────────────────────────
const PREFIX = "!";

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);

    // utile per logs/commands.js se vuoi segnare anche il successo
    client.emit("commandSuccess", {
      interaction: null,
      message,
      commandName,
      args,
      type: "prefix",
    });
  } catch (err) {
    console.error("❌ Errore comando:", err);

    client.emit("commandError", {
      interaction: null,
      message,
      commandName,
      args,
      type: "prefix",
      error: err,
    });

    try {
      await message.channel.send("❌ Errore durante il comando.");
    } catch {}
  }
});

// ─────────────────────────────
// SAFETY (Railway / VPS)
// ─────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
