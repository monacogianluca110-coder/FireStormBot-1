const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require("discord.js");

module.exports = (client) => {
  const AI_CHANNEL_ID = process.env.AI_CHANNEL_ID || "1469303591708790814";
  const LOG_CHANNEL_ID = process.env.AI_LOG_CHANNEL_ID || "1469305064064684092";

  async function log(guild, text) {
    try {
      const ch = guild.channels.cache.get(LOG_CHANNEL_ID) || await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
      if (ch && ch.isTextBased()) ch.send(text).catch(() => null);
    } catch {}
  }

  // (opzionale) comando admin per postare il pannello: !aipanel
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.content !== "!aipanel") return;
    if (!message.member.permissions.has("ManageGuild")) return;

    const ch = await message.guild.channels.fetch(AI_CHANNEL_ID).catch(() => null);
    if (!ch || !ch.isTextBased()) return message.reply("❌ Canale AI non trovato.");

    const embed = new EmbedBuilder()
      .setColor(0xff2d2d)
      .setTitle("🤖 Parla con l’AI — FireStorm™")
      .setDescription(
        [
          "Clicca il bottone qui sotto per aprire **il tuo thread privato** con l’AI.",
          "",
          "⏳ Anti-spam: 1 messaggio ogni **3 secondi**",
          "🧹 Se non scrivi per **5 minuti**, il thread si chiude da solo",
          "🚫 Niente richieste illegali / niente dati personali",
        ].join("\n")
      )
      .setFooter({ text: "FireStorm™ • AI Chat" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ai_open_thread")
        .setLabel("Apri chat AI")
        .setStyle(ButtonStyle.Primary)
    );

    await ch.send({ embeds: [embed], components: [row] });
    return message.reply("✅ Pannello AI inviato.");
  });

  // Bottone: crea thread per utente
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "ai_open_thread") return;

    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const guild = interaction.guild;
    if (!guild) return interaction.editReply("❌ Solo in un server.");

    const aiChannel = await guild.channels.fetch(AI_CHANNEL_ID).catch(() => null);
    if (!aiChannel || aiChannel.type !== ChannelType.GuildText) {
      return interaction.editReply("❌ Canale AI non trovato o non testuale.");
    }

    // evita thread multipli: se esiste già un thread attivo con il nome, lo riusa
    const threadName = `ai-${interaction.user.username}`.slice(0, 90);

    // prova a trovare un thread esistente dell’utente (tra gli attivi)
    const active = await aiChannel.threads.fetchActive().catch(() => null);
    if (active) {
      const existing = active.threads.find(t =>
        t.name.startsWith("ai-") && t.ownerId === client.user.id && t.name === threadName
      );
      if (existing) {
        await log(guild, `🔁 ${interaction.user.tag} ha riaperto thread esistente: ${existing.name} (${existing.id})`);
        return interaction.editReply(`✅ Hai già un thread attivo: <#${existing.id}>`);
      }
    }

    const thread = await aiChannel.threads.create({
      name: threadName,
      autoArchiveDuration: 60, // archivio automatico Discord (minuti) - noi facciamo anche “close” a 5 min
      reason: `AI thread for ${interaction.user.tag}`,
    });

    // aggiungi l’utente al thread
    await thread.members.add(interaction.user.id).catch(() => null);

    await log(guild, `🧵 Thread AI creato per ${interaction.user.tag}: ${thread.name} (${thread.id})`);

    await thread.send(
      `👋 Ciao ${interaction.user}!\nScrivi qui la tua domanda. (Anti-spam: 1 msg ogni 3s • chiusura dopo 5 min di inattività)`
    );

    return interaction.editReply(`✅ Thread creato: <#${thread.id}>`);
  });
};
