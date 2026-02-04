const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "autoroles",
  description: "Crea/Aggiorna il pannello auto-ruoli",
  async execute(message) {
    try {
      const CHANNEL_ID = "1468729208804081917";

      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply("❌ Non hai i permessi per usare questo comando.");
      }

      const channel = await message.guild.channels.fetch(CHANNEL_ID).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return message.reply("❌ Canale auto-ruoli non trovato o non testuale.");
      }

      const bigImage =
        "https://i.pinimg.com/736x/f2/d3/76/f2d37690c60e1ae187be8f85f2b3c105.jpg";
      const thumbGif =
        "https://i.pinimg.com/originals/1e/5d/ec/1e5dec87180146cea1d6fe16a0981636.gif";

      const embed = new EmbedBuilder()
        .setTitle("🎭 Auto-Ruoli — FireStorm™")
        .setDescription(
          [
            "Scegli i ruoli che vuoi avere cliccando i bottoni qui sotto.",
            "",
            "✅ Clicca di nuovo per **rimuovere** un ruolo.",
            "⚠️ Pannello ufficiale FireStorm™.",
          ].join("\n")
        )
        .setThumbnail(thumbGif)
        .setImage(bigImage)
        .setFooter({ text: "FireStorm™ • Auto-Ruoli" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ar:1468734679942435011")
          .setLabel("Ruolo Test 1")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ar:1468734851543863347")
          .setLabel("Ruolo Test 2")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("ar:1468734884880056411")
          .setLabel("Ruolo Test 3")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ar:1468734927716618301")
          .setLabel("Ruolo Test 4")
          .setStyle(ButtonStyle.Danger)
      );

      // ✅ Cerca un vecchio pannello del bot e modificalo invece di crearne uno nuovo
      const lastMsgs = await channel.messages.fetch({ limit: 20 }).catch(() => null);
      let panelMsg = null;

      if (lastMsgs) {
        panelMsg = lastMsgs.find((m) => {
          const isMe = m.author?.id === message.client.user.id;
          const hasEmbedTitle = m.embeds?.[0]?.title === "🎭 Auto-Ruoli — FireStorm™";
          return isMe && hasEmbedTitle;
        });
      }

      if (panelMsg) {
        await panelMsg.edit({ embeds: [embed], components: [row] });
        return message.reply(`✅ Pannello aggiornato in <#${CHANNEL_ID}>`);
      } else {
        await channel.send({ embeds: [embed], components: [row] });
        return message.reply(`✅ Pannello creato in <#${CHANNEL_ID}>`);
      }
    } catch (err) {
      console.error("AUTOROLES ERROR:", err);
      return message.reply("❌ Errore durante la creazione del pannello auto-ruoli.");
    }
  },
};
