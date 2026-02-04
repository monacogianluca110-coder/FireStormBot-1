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
      .setImage("https://i.pinimg.com/originals/5d/d8/0f/5dd80fe00a06651f3200aea753987f50.gif")
      .setFooter({ text: "FireStorm™ • Rules Panel" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    return message.reply(`✅ Pannello regole inviato in <#${RULES_CHANNEL_ID}>`);
  },
};

