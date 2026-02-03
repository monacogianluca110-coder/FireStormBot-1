require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType
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

  // 🔥 STATUS VISIBILE NEL PROFILO (COME PRIMA)
  client.user.setActivity("!info", {
    type: ActivityType.Comandi
  });

  // ── Register Slash Command /info
  const commands = [
    new SlashCommandBuilder()
      .setName("info")
      .setDescription("Mostra le informazioni del bot")
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash command /info registrato");
  } catch (error) {
    console.error("❌ Errore registrazione slash:", error);
  }
});

// ─────────────────────────────
// MESSAGE COMMAND (!info)
// ─────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  if (message.content.trim().toLowerCase() === "!info") {
    await message.reply(
      "```🔥 FireStorm™\nBot ufficiale del server.\nUsa i comandi per scoprire tutto.```"
    );
  }
});

// ─────────────────────────────
// SLASH COMMAND (/info)
// ─────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "info") {
    await interaction.reply(
      "🔥 **FireStorm™**\nBot ufficiale del server.\nUsa `!info` per i comandi."
    );
  }
});

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
client.login(process.env.TOKEN);

