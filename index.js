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
// LOAD COMMANDS
// supporta:
// commands/categoria/file.js
// commands/categoria/sottocartella/file.js
// ─────────────────────────────
const commandsRoot = path.join(__dirname, "commands");

let loadedPrefix = 0;
let loadedSlash = 0;

function loadCommandFile(filePath) {
  try {
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);

    if (command?.name && typeof command.execute === "function") {
      client.commands.set(command.name.toLowerCase(), command);
      loadedPrefix++;
    }

    if (command?.data && typeof command.execute === "function") {
      const slashName = command.data?.name;
      if (slashName) {
        client.slashCommands.set(slashName.toLowerCase(), command);
        loadedSlash++;
      }
    }
  } catch (err) {
    console.error(`❌ Errore caricando comando: ${filePath}`);
    console.error(err);
  }
}

function scanCommands(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanCommands(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      loadCommandFile(fullPath);
    }
  }
}

if (fs.existsSync(commandsRoot)) {
  scanCommands(commandsRoot);
} else {
  console.log("⚠️ Cartella commands/ non trovata");
}

console.log(`✅ Caricati ${loadedPrefix} comandi normali`);
console.log(`✅ Caricati ${loadedSlash} slash commands`);

// ─────────────────────────────
// LOAD EVENTS
// ogni file in events/ deve esportare:
// {
//   name: "interactionCreate",
//   once: false,
//   async execute(...args, client) {}
// }
// ─────────────────────────────
const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"));
  console.log("📦 Eventi trovati:", files.length ? files.join(", ") : "nessuno");

  for (const file of files) {
    try {
      const filePath = path.join(eventsPath, file);
      delete require.cache[require.resolve(filePath)];
      const event = require(filePath);

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
// LOAD LOGS SYSTEM
// ogni file in logs/ deve esportare una funzione:
// module.exports = (client) => { ... }
// ─────────────────────────────
const logsPath = path.join(__dirname, "logs");

if (fs.existsSync(logsPath)) {
  const logFiles = fs.readdirSync(logsPath).filter((f) => f.endsWith(".js"));
  console.log("📚 Logs trovati:", logFiles.length ? logFiles.join(", ") : "nessuno");

  for (const file of logFiles) {
    try {
      const filePath = path.join(logsPath, file);
      delete require.cache[require.resolve(filePath)];
      const logModule = require(filePath);

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
// PREFIX HANDLER
// ─────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message || !message.guild) return;
    if (message.author?.bot) return;
    if (!message.content?.startsWith(client.prefix)) return;

    const args = message.content.slice(client.prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName);
    if (!command || typeof command.execute !== "function") return;

    await command.execute(message, args, client);

    client.emit("commandSuccess", {
      interaction: null,
      message,
      commandName,
      args,
      type: "prefix",
    });
  } catch (err) {
    console.error("❌ Errore comando prefix:", err);

    client.emit("commandError", {
      interaction: null,
      message,
      commandName: message?.content || "unknown",
      args: [],
      type: "prefix",
      error: err,
    });

    try {
      await message.channel.send("❌ Errore durante il comando.");
    } catch {}
  }
});

// ─────────────────────────────
// SLASH HANDLER
// esegue solo le slash commands
// i bottoni/select menu restano ai tuoi eventi tipo ticketSystem.js
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName.toLowerCase());
    if (!command || typeof command.execute !== "function") return;

    await command.execute(interaction, client);

    client.emit("commandSuccess", {
      interaction,
      message: null,
      commandName: interaction.commandName,
      args: [],
      type: "slash",
    });
  } catch (err) {
    console.error("❌ Errore slash command:", err);

    client.emit("commandError", {
      interaction,
      message: null,
      commandName: interaction?.commandName || "unknown",
      args: [],
      type: "slash",
      error: err,
    });

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "❌ Errore durante il comando.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ Errore durante il comando.",
          ephemeral: true,
        });
      }
    } catch {}
  }
});

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

console.log("TOKEN caricato?", process.env.TOKEN ? "SI" : "NO");

client.login(process.env.TOKEN);
