const { EmbedBuilder, AuditLogEvent, StickerFormatType } = require("discord.js");

const LOG_CHANNEL_ID = "1483456356747968667";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function cut(text, max = 1000) {
  if (!text) return "Nessuno";
  text = String(text);
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function formatStickerType(type) {
  const map = {
    [StickerFormatType.PNG]: "PNG",
    [StickerFormatType.APNG]: "APNG",
    [StickerFormatType.Lottie]: "Lottie",
    [StickerFormatType.GIF]: "GIF",
  };
  return map[type] || `Sconosciuto (${type})`;
}

async function getLogChannel(client) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return null;
    return channel;
  } catch {
    return null;
  }
}

async function sendLog(client, embed) {
  const channel = await getLogChannel(client);
  if (!channel) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function getExecutor(guild, type, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({
      type,
      limit: 6,
    }).catch(() => null);

    if (!logs) return null;

    const entry = logs.entries.find((e) => e?.target?.id === targetId);
    if (!entry?.executor) return null;

    return {
      tag: entry.executor.tag,
      id: entry.executor.id,
    };
  } catch {
    return null;
  }
}

function stickerValue(sticker, showMention = false) {
  const lines = [
    `Nome: \`${sticker.name}\``,
    `ID: \`${sticker.id}\``,
  ];

  if (showMention && sticker.id) {
    lines.unshift(`Sticker: \`${sticker.name}\``);
  }

  return lines.join("\n");
}

module.exports = (client) => {
  client.on("stickerCreate", async (sticker) => {
    const executor = await getExecutor(sticker.guild, AuditLogEvent.StickerCreate, sticker.id);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({
        name: "🧩 Sticker Creato",
        iconURL: sticker.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setThumbnail(sticker.url || null)
      .addFields(
        {
          name: "🧩 Sticker",
          value: stickerValue(sticker),
          inline: false,
        },
        {
          name: "📝 Descrizione",
          value: cut(sticker.description || "Nessuna"),
          inline: false,
        },
        {
          name: "😀 Tag emoji",
          value: cut(sticker.tags || "Nessuno"),
          inline: true,
        },
        {
          name: "📦 Formato",
          value: `\`${formatStickerType(sticker.format)}\``,
          inline: true,
        },
        {
          name: "👤 Creato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Sconosciuto",
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Sticker Create" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  client.on("stickerDelete", async (sticker) => {
    const executor = await getExecutor(sticker.guild, AuditLogEvent.StickerDelete, sticker.id);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({
        name: "🗑️ Sticker Eliminato",
        iconURL: sticker.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setThumbnail(sticker.url || null)
      .addFields(
        {
          name: "🧩 Sticker",
          value: stickerValue(sticker),
          inline: false,
        },
        {
          name: "📝 Descrizione",
          value: cut(sticker.description || "Nessuna"),
          inline: false,
        },
        {
          name: "😀 Tag emoji",
          value: cut(sticker.tags || "Nessuno"),
          inline: true,
        },
        {
          name: "📦 Formato",
          value: `\`${formatStickerType(sticker.format)}\``,
          inline: true,
        },
        {
          name: "👤 Eliminato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Sconosciuto",
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Sticker Delete" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  client.on("stickerUpdate", async (oldSticker, newSticker) => {
    const changes = [];

    if (oldSticker.name !== newSticker.name) {
      changes.push(`**Nome:** \`${oldSticker.name}\` → \`${newSticker.name}\``);
    }

    if ((oldSticker.description || null) !== (newSticker.description || null)) {
      changes.push(`**Descrizione:** \`${oldSticker.description || "Nessuna"}\` → \`${newSticker.description || "Nessuna"}\``);
    }

    if ((oldSticker.tags || null) !== (newSticker.tags || null)) {
      changes.push(`**Tag emoji:** \`${oldSticker.tags || "Nessuno"}\` → \`${newSticker.tags || "Nessuno"}\``);
    }

    if (oldSticker.format !== newSticker.format) {
      changes.push(`**Formato:** \`${formatStickerType(oldSticker.format)}\` → \`${formatStickerType(newSticker.format)}\``);
    }

    if (!changes.length) return;

    const executor = await getExecutor(newSticker.guild, AuditLogEvent.StickerUpdate, newSticker.id);

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({
        name: "✏️ Sticker Modificato",
        iconURL: newSticker.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setThumbnail(newSticker.url || null)
      .addFields(
        {
          name: "🧩 Sticker",
          value: stickerValue(newSticker),
          inline: false,
        },
        {
          name: "👤 Modificato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Sconosciuto",
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: true,
        },
        {
          name: "📋 Modifiche",
          value: cut(changes.join("\n\n"), 1024),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Sticker Update" })
      .setTimestamp();

    await sendLog(client, embed);
  });
};
