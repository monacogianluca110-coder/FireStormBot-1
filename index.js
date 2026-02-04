require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActivityType,
  EmbedBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // ✅ NECESSARIO per il welcome
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ─────────────────────────────
// COMMAND LOADER
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
// WELCOME SYSTEM (quando entra un membro)
// ─────────────────────────────
const WELCOME_CHANNEL_ID = "723915326332469250";
const WELCOME_GIF =
  "https://i.pinimg.com/originals/81/11/da/8111dadeee2521a210a29f2b734fcf92.gif";

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const avatar = member.user.displayAvatarURL({ size: 256 });

    const embed = new EmbedBuilder()
      .setTitle("🔥 Benvenuto in FireStorm™!")
      .setDescription(
        [
          `Hey ${member}, benvenuto/a nella community!`,
          "",
          "✨ **Qui dentro si gioca, si chatta e si spacca insieme.**",
          "",
          "📌 **Prima di iniziare:**",
          "• Leggi le **regole** e rispetta tutti 💜",
          "• Dai un’occhiata ai **link utili**",
          "• Presentati in chat e divertiti 😎",
          "",
          "👮 Se ti serve aiuto, tagga lo staff.",
        ].join("\n")
      )
      .setThumbnail(avatar)
      .setImage(WELCOME_GIF) // ✅ GIF sotto
      .setFooter({ text: "FireStorm™ • Sistema di Benvenuto" })
      .setTimestamp();

    await channel.send({
      content: `👋 ${member} — benvenuto/a!`,
      embeds: [embed],
    });
  } catch (err) {
    console.error("Welcome error:", err);
  }
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

client.login(process.env.TOKEN);
