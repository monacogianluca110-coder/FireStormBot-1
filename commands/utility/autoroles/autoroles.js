const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");

function ensureConfig() {
  const cfgPath = path.join(__dirname, "../../../config/autoroles.json");
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });

  if (!fs.existsSync(cfgPath)) {
    fs.writeFileSync(
      cfgPath,
      JSON.stringify(
        {
          channelId: "1468729208804081917",
          messageId: null,
          roles: [],
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  return { cfgPath, cfg };
}

function toStyle(style) {
  const map = {
    Primary: ButtonStyle.Primary,
    Secondary: ButtonStyle.Secondary,
    Success: ButtonStyle.Success,
    Danger: ButtonStyle.Danger,
  };
  return map[style] ?? ButtonStyle.Secondary;
}

module.exports = {
  name: "autoroles",
  description: "Crea/Aggiorna il pannello auto-ruoli",
  async execute(message) {
    try {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply("❌ Non hai i permessi per usare questo comando.");
      }

      const { cfgPath, cfg } = ensureConfig();

      const channelId = cfg.channelId || "1468729208804081917";

      // ✅ fetch invece di cache (più affidabile su hosting)
      const channel = await message.guild.channels.fetch(channelId).catch(() => null);
      if (!channel) return message.reply("❌ Non trovo il canale auto-ruoli.");

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
            "✅ Puoi attivarli/disattivarli quando vuoi.",
            "⚠️ Usa solo questo pannello ufficiale.",
          ].join("\n")
        )
        .setThumbnail(thumbGif)
        .setImage(bigImage)
        .setFooter({ text: "FireStorm™ • Auto-Ruoli" })
        .setTimestamp();

      const roles = Array.isArray(cfg.roles) ? cfg.roles.slice(0, 25) : [];

      const rows = [];
      for (let i = 0; i < roles.length; i += 5) {
        const chunk = roles.slice(i, i + 5);

        const row = new ActionRowBuilder();
        for (const r of chunk) {
          const roleId = String(r.roleId || "").trim();
          const label = String(r.label || "Ruolo").slice(0, 80);

          const btn = new ButtonBuilder()
            .setCustomId(`ar:${roleId || "MISSING"}`)
            .setLabel(label)
            .setStyle(toStyle(r.style));

          if (r.emoji) btn.setEmoji(r.emoji);

          // se non hai ancora messo i ruoli, non crasha: li disabilita
          if (!roleId || roleId === "INSERISCI_ROLE_ID") btn.setDisabled(true);

          row.addComponents(btn);
        }

        // ✅ aggiungi solo se ha componenti
        if (row.components.length > 0) rows.push(row);
      }

      const payload = rows.length > 0
        ? { embeds: [embed], components: rows }
        : { embeds: [embed] };

      // prova a modificare messaggio esistente
      let panelMsg = null;
      if (cfg.messageId) {
        try {
          const old = await channel.messages.fetch(cfg.messageId);
          await old.edit(payload);
          panelMsg = old;
        } catch {
          panelMsg = null;
        }
      }

      // altrimenti invia nuovo
      if (!panelMsg) {
        panelMsg = await channel.send(payload);
        cfg.messageId = panelMsg.id;
        fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
      }

      return message.reply(`✅ Pannello auto-ruoli pronto in <#${channelId}>`);
    } catch (err) {
      console.error("AUTOROLES ERROR:", err);
      return message.reply("❌ Errore durante la creazione del pannello auto-ruoli.");
    }
  },
};
