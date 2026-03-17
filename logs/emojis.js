const { EmbedBuilder, AuditLogEvent } = require("discord.js");

const LOG_CHANNEL_ID = "1483456280327880794";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
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
      limit: 1,
      type: type,
    });

    const entry = logs.entries.first();
    if (!entry) return "Sconosciuto";

    if (entry.target?.id !== targetId) return "Sconosciuto";

    return `${entry.executor.tag} (${entry.executor.id})`;
  } catch {
    return "Sconosciuto";
  }
}

module.exports = (client) => {

  // ➕ EMOJI CREATA
  client.on("emojiCreate", async (emoji) => {
    const executor = await getExecutor(
      emoji.guild,
      AuditLogEvent.EmojiCreate,
      emoji.id
    );

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({
        name: "😂 Emoji Creata",
        iconURL: emoji.url,
      })
      .setThumbnail(emoji.url)
      .addFields(
        {
          name: "🎭 Emoji",
          value: `${emoji} \nNome: \`${emoji.name}\`\nID: \`${emoji.id}\``,
          inline: false,
        },
        {
          name: "👤 Creata da",
          value: executor,
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: true,
        }
      )
      .setFooter({ text: "FireStorm Logs • Emoji Create" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  // ❌ EMOJI ELIMINATA
  client.on("emojiDelete", async (emoji) => {
    const executor = await getExecutor(
      emoji.guild,
      AuditLogEvent.EmojiDelete,
      emoji.id
    );

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({
        name: "🗑️ Emoji Eliminata",
      })
      .addFields(
        {
          name: "🎭 Emoji",
          value: `Nome: \`${emoji.name}\`\nID: \`${emoji.id}\``,
          inline: false,
        },
        {
          name: "👤 Eliminata da",
          value: executor,
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: true,
        }
      )
      .setFooter({ text: "FireStorm Logs • Emoji Delete" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  // ✏️ EMOJI MODIFICATA
  client.on("emojiUpdate", async (oldEmoji, newEmoji) => {
    if (oldEmoji.name === newEmoji.name) return;

    const executor = await getExecutor(
      newEmoji.guild,
      AuditLogEvent.EmojiUpdate,
      newEmoji.id
    );

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({
        name: "✏️ Emoji Modificata",
        iconURL: newEmoji.url,
      })
      .setThumbnail(newEmoji.url)
      .addFields(
        {
          name: "🎭 Emoji",
          value: `${newEmoji}\nID: \`${newEmoji.id}\``,
          inline: false,
        },
        {
          name: "📛 Nome prima",
          value: `\`${oldEmoji.name}\``,
          inline: true,
        },
        {
          name: "📛 Nome dopo",
          value: `\`${newEmoji.name}\``,
          inline: true,
        },
        {
          name: "👤 Modificata da",
          value: executor,
          inline: false,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Emoji Update" })
      .setTimestamp();

    await sendLog(client, embed);
  });

};
