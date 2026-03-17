const { EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1455213585176199262";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function cut(text, max = 1000) {
  if (!text) return "Nessun contenuto";
  text = String(text);
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
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

function getAttachments(message) {
  if (!message.attachments || message.attachments.size === 0) {
    return "Nessuno";
  }

  return message.attachments
    .map(att => `[${att.name || "file"}](${att.url})`)
    .join("\n")
    .slice(0, 1000);
}

module.exports = (client) => {

  // ❌ MESSAGGIO ELIMINATO
  client.on("messageDelete", async (message) => {
    if (!message || !message.author) return;
    if (message.author.bot) return;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({
        name: "❌ Messaggio Eliminato",
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: "👤 Utente",
          value: `${message.author}\n\`${message.author.tag}\`\nID: \`${message.author.id}\``,
          inline: true,
        },
        {
          name: "📍 Canale",
          value: message.channel
            ? `${message.channel}\nID: \`${message.channel.id}\``
            : "Sconosciuto",
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: true,
        },
        {
          name: "💬 Contenuto",
          value: cut(message.content),
          inline: false,
        },
        {
          name: "📎 Allegati",
          value: getAttachments(message),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Message Delete" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  // ✏️ MESSAGGIO MODIFICATO
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!oldMessage || !newMessage) return;
    if (!oldMessage.author) return;
    if (oldMessage.author.bot) return;

    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({
        name: "✏️ Messaggio Modificato",
        iconURL: oldMessage.author.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(oldMessage.author.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: "👤 Utente",
          value: `${oldMessage.author}\n\`${oldMessage.author.tag}\`\nID: \`${oldMessage.author.id}\``,
          inline: true,
        },
        {
          name: "📍 Canale",
          value: newMessage.channel
            ? `${newMessage.channel}\nID: \`${newMessage.channel.id}\``
            : "Sconosciuto",
          inline: true,
        },
        {
          name: "🕒 Modifica",
          value: formatTime(),
          inline: true,
        },
        {
          name: "💬 Prima",
          value: cut(oldMessage.content),
          inline: false,
        },
        {
          name: "💬 Dopo",
          value: cut(newMessage.content),
          inline: false,
        },
        {
          name: "🔗 Vai al messaggio",
          value: `[Clicca qui](${newMessage.url})`,
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Message Update" })
      .setTimestamp();

    await sendLog(client, embed);
  });

};
