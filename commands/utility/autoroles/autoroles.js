const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "autoroles",
  description: "Crea il pannello auto-ruoli nel canale dedicato",
  async execute(message) {
    try {
      const CHANNEL_ID = "1468729208804081917";

      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply("❌ Non hai i permessi per usare questo comando.");
      }

      const channel = await message.guild.channels.fetch(CHANNEL_ID).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return message.reply("❌ Canale auto-ruoli non trovato o non è un canale testuale.");
      }

      const bigImage =
        "https://i.pinimg.com/736x/f2/d3/76/f2d37690c60e1ae187be8f85f2b3c105.jpg";
      const thumbGif =
        "https://i.pinimg.com/originals/1e/5d/ec/1e5dec87180146cea1d6fe16a0981636.gif";

      const embed = new EmbedBuilder()
        .setTitle("🎭 Auto-Ruoli — FireStorm™")
        .setDescription(
          [
            "Seleziona i ruoli che vuoi avere cliccando i bottoni qui sotto.",
            "",
            "✅ Puoi attivare/disattivare i ruoli quando vuoi.",
            "⚠️ Pannello ufficiale FireStorm™.",
            "",
            "📌 **Ruoli in arrivo…** (li aggiungiamo appena mi dai gli ID)",
          ].join("\n")
        )
        .setThumbnail(thumbGif) // piccolo in alto a destra
        .setImage(bigImage) // grande sotto
        .setFooter({ text: "FireStorm™ • Auto-Ruoli" })
        .setTimestamp();

      // Placeholder: bottoni disabilitati finché non mettiamo i ruoli veri
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ar:placeholder1")
          .setLabel("Ruolo 1 (in arrivo)")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("ar:placeholder2")
          .setLabel("Ruolo 2 (in arrivo)")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("ar:placeholder3")
          .setLabel("Ruolo 3 (in arrivo)")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await channel.send({ embeds: [embed], components: [row] });
      return message.reply(`✅ Pannello auto-ruoli inviato in <#${CHANNEL_ID}>`);
    } catch (err) {
      console.error("AUTOROLES ERROR:", err);
      return message.reply("❌ Errore durante la creazione del pannello auto-ruoli.");
    }
  },
};
