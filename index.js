const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// ─────────────────────────────
// CLIENT
// ─────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ─────────────────────────────
// READY
// ─────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`🔥 FireStorm online come ${client.user.tag}`);

  client.user.setActivity("FireStorm 🔥", { type: 3 }); // WATCHING

  // ── Register Slash Command /ping
  const commands = [
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Risposta di test del bot")
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash command /ping registrato");
  } catch (error) {
    console.error("❌ Errore registrazione slash:", error);
  }
});

// ─────────────────────────────
// MESSAGE COMMAND (!ping)
// ─────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  if (message.content.trim().toLowerCase() === "!ping") {
    await message.reply("🔥 Pong! FireStorm operativo.");
  }
});

// ─────────────────────────────
// SLASH COMMAND (/ping)
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("🔥 Pong! FireStorm operativo (slash).");
  }
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);
