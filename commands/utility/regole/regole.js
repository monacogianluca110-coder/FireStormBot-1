// commands/utility/regole/regole.js
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "regole",
  description: "Posta il pannello regole nel canale regole",
  async execute(message) {
    const RULES_CHANNEL_ID = "828023898964492368";

    // (Opzionale) solo admin/mod possono usarlo
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("❌ Non hai i permessi per usare questo comando.");
    }

    const channel = message.guild.channels.cache.get(RULES_CHANNEL_ID);
    if (!channel) return message.reply("❌ Non trovo il canale regole.");

    const embed = new EmbedBuilder()
      .setTitle("📜 FireStorm™ — Regolamento Ufficiale")
      .setDescription(
        [
          "Benvenuto su **FireStorm™**. Per mantenere il server pulito e sicuro, il rispetto delle regole è obbligatorio.",
          "",
          "**1) Rispetto & comportamento**",
          "• Vietati insulti, flame, provocazioni, razzismo, discriminazioni e molestie.",
          "",
          "**2) Spam & pubblicità**",
          "• Niente flood, ping a caso, chain, copypasta ripetute.",
          "• Pubblicità / inviti / promo solo se autorizzati dallo staff.",
          "",
          "**3) Contenuti vietati**",
          "• Vietato NSFW, gore, contenuti disturbanti o illegali.",
          "",
          "**4) Sicurezza**",
          "• Vietati scam, IP logger, link sospetti, richieste di dati personali.",
          "",
          "**5) Canali vocali**",
          "• Niente urla, disturbi, soundboard spam, microfono “tossico”.",
          "",
          "**6) Staff & sanzioni**",
          "• Le decisioni dello staff vanno rispettate.",
          "• In caso di problemi: contatta lo staff o apri un ticket (se presente).",
          "",
          "✅ **Entrando e restando nel server, accetti automaticamente queste regole.**",
        ].join("\n")
      )
      .setImage("https://chatgpt.com/backend-api/estuary/content?id=file_000000007e3c7246b03f0dec49b40bbc&ts=492683&p=fs&cid=1&sig=3e5afc00361a49b26acb1deeafa4760b0edc6de8721da5efe81c2fec59642f22&v=0")
      .setFooter({ text: "FireStorm™ • Rules Panel" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    return message.reply(`✅ Pannello regole inviato in <#${RULES_CHANNEL_ID}>`);
  },
};

