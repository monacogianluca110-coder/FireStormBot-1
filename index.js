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
    GatewayIntentBits.GuildExpressions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.User,
    Partials.GuildMember,
  ],
});

client.prefix = "!";
client.commands = new Map();
client.slashCommands = new Map();

// ─────────────────────────────
// LOAD COMMANDS (commands/)
// supporta:
// - module.exports = { name, execute }
// - module.exports = { data, execute }
// struttura:
// commands/categoria/comando/file.js
// ─────────────────────────────
const commandsRoot = path.join(__dirname, "commands");

let loadedPrefix = 0;
let loadedSlash = 0;

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

        // Prefix command
        if (command?.name && typeof command.execute === "function") {
          client.commands.set(command.name.toLowerCase(), command);
          loadedPrefix++;
        }

        // Slash command
        if (command?.data && typeof command.execute === "function") {
          const slashName = command.data?.name;
          if (slashName) {
            client.slashCommands.set(slashName.toLowerCase(), command);
            loadedSlash++;
          }
        }
      } catch (err) {
        console.error(`❌ Errore caricando comando ${category}/${commandFolder}/${file}`);
        console.error(err);
      }
    }
  }
}

console.log(`✅ Caricati ${loadedPrefix} comandi normali`);
console.log(`✅ Caricati ${loadedSlash} slash commands`);

// ─────────────────────────────
// LOAD EVENTS (events/)
// ogni file deve esportare:
// module.exports = { name, execute }
// oppure:
// module.exports = { name, once: true, execute }
// ─────────────────────────────
const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));
  console.log("📦 Eventi trovati:", files.length ? files.join(", ") : "nessuno");

  for (const file of files) {
    try {
      const event = require(path.join(eventsPath, file));

      if (!event?.name || typeof event.execute !== "function") {
        console.log(`❌ Evento non valido: ${file}`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      console.log(`✅ Evento caricato: ${file}`);
    } catch (err) {
      console.error(`❌ Errore evento: ${file}`);
      console.error(err);
    }
  }
} else {
  console.log("⚠️ Cartella events/ non trovata");
}

// ─────────────────────────────
// LOAD LOGS SYSTEM (logs/*.js)
// ogni file deve esportare:
// module.exports = (client) => {}
// ─────────────────────────────
const logsPath = path.join(__dirname, "logs");

if (fs.existsSync(logsPath)) {
  const logFiles = fs.readdirSync(logsPath).filter((f) => f.endsWith(".js"));
  console.log("📚 Logs trovati:", logFiles.length ? logFiles.join(", ") : "nessuno");

  for (const file of logFiles) {
    try {
      const logModule = require(path.join(logsPath, file));

      if (typeof logModule !== "function") {
        console.log(`❌ Log non valido: ${file}`);
        continue;
      }

      logModule(client);
      console.log(`✅ Log caricato: ${file}`);
    } catch (err) {
      console.error(`❌ Errore caricando log: ${file}`);
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

  client.user.setActivity("Comandi • !info • /ticketpanel", {
    type: ActivityType.Watching,
  });

  const TEST_CH = "1455214028170334278";

  try {
    const ch = await client.channels.fetch(TEST_CH).catch(() => null);

    if (ch) {
      await ch.send("✅ TEST: posso scrivere nei logs (server-log).");
      console.log("✅ Test scrittura log OK");
    } else {
      console.log("⚠️ Canale test non trovato");
    }
  } catch (e) {
    console.error("❌ Test scrittura log FALLITO:", e?.message || e);
  }
});

// ─────────────────────────────
// SAFETY
// ─────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// ─────────────────────────────
// DEBUG TOKEN
// ─────────────────────────────
console.log("TOKEN caricato?", process.env.TOKEN ? "SI" : "NO");

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
