const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");

function loadConfig() {
  const cfgPath = path.join(__dirname, "../../../config/autoroles.json");
  if (!fs.existsSync(cfgPath)) {
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
    fs.writeFileSync(
      cfgPath,
      JSON.stringify(
        { channelId: "1468729208804081917", messageId: null, roles: [] },
        null,
        2
      )
    );
  }
  return { cfgPath, cfg: JSON.parse(fs.readFileSync(cfgPath, "utf8")) };
}

function toButtonStyle(style) {
  // accetta: Primary, Secondary, Success, Danger
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
  description: "Crea/Aggiorna il pannello auto-ruoli nel canale dedicato",
  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("❌ Non hai i permessi per usare questo comando.");
    }

    const { cfgPath, cfg } = loadConfig();
    const channelId = cfg.channelId || "1468729208804081917";
    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) return message.reply("❌ Canale auto-ruoli non trovato.");

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
          "✅ Puoi **attivare/disattivare** i ruoli quando vuoi.",
          "⚠️ Usa solo questo pannello ufficiale.",
        ].join("\n")
      )
      .setThumbnail(thumbGif) // ✅ piccolo in alto a destra
      .setImage(bigImage) // ✅ grande sotto
      .setFooter({ text: "FireStorm™ • Auto-Ruoli" })
      .setTimestamp();

    // Costruisci bottoni (max 5 per riga, max 25 totale)
    const roles = Array.isArray(cfg.roles) ? cfg.roles : [];
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let countInRow = 0;

    for (const r of roles.slice(0, 25)) {
      const roleId = (r.roleId || "").trim();
      const label = (r.label || "Ruolo").slice(0, 80);
      const emoji = r.emoji;
      const style = toButtonStyle(r.style);

      const btn = new ButtonBuilder()
        .setCustomId(`ar:${roleId || "MISSING"}`)
        .setLabel(label)
        .setStyle(style);

      if (emoji) btn.setEmoji(emoji);

      // se roleId mancante, disabilita per evitare errori
      if (!roleId || roleId === "INSERISCI_ROLE_ID") btn.setDisabled(true);

      currentRow.addComponents(btn);
      countInRow++;

      if (countInRow === 5) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        countInRow = 0;
      }
    }

    if (countInRow > 0) rows.push(currentRow);

    // Se non ci sono ruoli, manda un pannello “vuoto” (solo embed)
    const payload =
      rows.length > 0 ? { embeds: [embed], components: rows } : { embeds: [embed] };

    // Se esiste già un messageId, prova ad editarlo; altrimenti invia nuovo
    let sentMsg = null;
    if (cfg.messageId) {
      try {
        const old = await channel.messages.fetch(cfg.messageId);
        await old.edit(payload);
        sentMsg = old;
      } catch {
        // se non esiste/più accessibile, ne creiamo uno nuovo
      }
    }

    if (!sentMsg) {
      sentMsg = await channel.send(payload);
      cfg.messageId = sentMsg.id;
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
    }

    return message.reply(`✅ Pannello auto-ruoli pronto in <#${channelId}>`);
  },
};
