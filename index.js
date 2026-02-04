require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Events, ActivityType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ─────────────────────────────
// LOAD COMMANDS (da cartelle)
// ─────────────────────────────
client.commands = new Map();

const commandsRoot = path.join(__dirname, "commands");
for (const category of fs.readdirSync(commandsRoot)) {
  const categoryPath = path.join(commandsRoot, category);

  for (const commandFolder of fs.readdirSync(categoryPath)) {
    const commandPath = path.join(categoryPath, commandFolder);

    const file = fs.readdirSync(commandPath).find((f) => f.endsWith(".js"));
    if (!file) continue;

    const command = require(path.join(commandPath, file));
    if (!command?.name || typeof command.execute !== "function") continue;

    client.commands.set(command.name, command);
  }
}

console.log(`✅ Comandi caricati: ${client.commands.size}`);

// ─────────────────────────────
// READY + STATUS
// ─────────────────────────────
client.once(Events.ClientReady, () => {
  console.log(`🔥 FireStorm online come ${client.user.tag}`);

  client.user.setActivity("Comandi • !info", {
    type: ActivityType.Watching,
  });
});

// ─────────────────────────────
// PREFIX HANDLER ( ! e f! )
// ─────────────────────────────
const DEFAULT_PREFIX = "!";
const MUSIC_PREFIX = "f!";

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // accetta SOLO questi due prefissi
  let prefixUsed = null;
  if (message.content.startsWith(MUSIC_PREFIX)) prefixUsed = MUSIC_PREFIX;
  else if (message.content.startsWith(DEFAULT_PREFIX)) prefixUsed = DEFAULT_PREFIX;
  else return;

  const args = message.content.slice(prefixUsed.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(err);
    message.channel.send("❌ Errore durante il comando.");
  }
});

client.login(process.env.TOKEN);
