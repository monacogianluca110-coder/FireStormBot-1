const { EmbedBuilder, AuditLogEvent, Events, ChannelType } = require("discord.js");

const LOG_CHANNEL_ID = "1455212328336228393";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function cut(text, max = 1024) {
  if (!text) return "Nessuno";
  text = String(text);
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

async function getLogChannel(client) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    return channel || null;
  } catch {
    return null;
  }
}

async function sendLog(client, embed) {
  const channel = await getLogChannel(client);
  if (!channel) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

function typeLabel(type) {
  const map = {
    [ChannelType.GuildText]: "Testo",
    [ChannelType.GuildVoice]: "Vocale",
    [ChannelType.GuildCategory]: "Categoria",
    [ChannelType.GuildAnnouncement]: "Annunci",
    [ChannelType.AnnouncementThread]: "Thread Annunci",
    [ChannelType.PublicThread]: "Thread Pubblico",
    [ChannelType.PrivateThread]: "Thread Privato",
    [ChannelType.GuildStageVoice]: "Stage",
    [ChannelType.GuildForum]: "Forum",
    [ChannelType.GuildMedia]: "Media",
  };

  return map[type] || `Tipo ${type}`;
}

function userValue(user) {
  if (!user) return "Sconosciuto";
  return `${user}\n\`${user.tag}\`\nID: \`${user.id}\``;
}

function targetValue(target) {
  if (!target) return "Sconosciuto";

  if (target.username && target.discriminator !== undefined) {
    return `${target}\n\`${target.tag}\`\nID: \`${target.id}\``;
  }

  if (target.name) {
    return `**${target.name}**\nID: \`${target.id}\``;
  }

  if (target.id) {
    return `ID: \`${target.id}\``;
  }

  return cut(JSON.stringify(target), 1000);
}

function stringifyChanges(changes) {
  if (!changes?.length) return "Nessun dettaglio disponibile";

  const lines = [];

  for (const change of changes) {
    const key = change.key || "sconosciuto";
    const oldVal = change.old ?? "∅";
    const newVal = change.new ?? "∅";

    lines.push(
      `• **${key}**\nPrima: \`${cut(JSON.stringify(oldVal), 250)}\`\nDopo: \`${cut(JSON.stringify(newVal), 250)}\``
    );
  }

  return cut(lines.join("\n\n"), 1024);
}

function getActionData(entry, guild) {
  const action = entry.action;
  const target = entry.target;
  const executor = entry.executor;
  const extra = entry.extra;

  const base = {
    color: 0x5865F2,
    title: "🛡️ Azione Staff",
    footer: "FireStorm Logs • Admin Action",
    targetName: targetValue(target),
    extraField: null,
  };

  switch (action) {
    case AuditLogEvent.MemberKick:
      return {
        ...base,
        color: 0xED4245,
        title: "🥾 Membro Espulso",
        footer: "FireStorm Logs • Kick",
      };

    case AuditLogEvent.MemberBanAdd:
      return {
        ...base,
        color: 0xED4245,
        title: "🔨 Ban Eseguito",
        footer: "FireStorm Logs • Ban",
      };

    case AuditLogEvent.MemberBanRemove:
      return {
        ...base,
        color: 0x57F287,
        title: "🔓 Ban Rimosso",
        footer: "FireStorm Logs • Unban",
      };

    case AuditLogEvent.MemberUpdate:
      return {
        ...base,
        color: 0xFEE75C,
        title: "✏️ Membro Modificato",
        footer: "FireStorm Logs • Member Update",
      };

    case AuditLogEvent.MemberRoleUpdate:
      return {
        ...base,
        color: 0xFAA61A,
        title: "🏷️ Ruoli Utente Modificati",
        footer: "FireStorm Logs • Member Role Update",
      };

    case AuditLogEvent.MemberMove:
      return {
        ...base,
        color: 0x5865F2,
        title: "🎙️ Membro Spostato in Vocale",
        footer: "FireStorm Logs • Member Move",
        extraField: extra?.channel
          ? {
              name: "🔊 Canale coinvolto",
              value: `${extra.channel}\nID: \`${extra.channel.id}\``,
              inline: true,
            }
          : null,
      };

    case AuditLogEvent.MemberDisconnect:
      return {
        ...base,
        color: 0xED4245,
        title: "🔌 Membro Disconnesso dalla Vocale",
        footer: "FireStorm Logs • Member Disconnect",
      };

    case AuditLogEvent.BotAdd:
      return {
        ...base,
        color: 0x57F287,
        title: "🤖 Bot Aggiunto",
        footer: "FireStorm Logs • Bot Add",
      };

    case AuditLogEvent.ChannelCreate:
      return {
        ...base,
        color: 0x57F287,
        title: "📁 Canale Creato",
        footer: "FireStorm Logs • Channel Create",
      };

    case AuditLogEvent.ChannelUpdate:
      return {
        ...base,
        color: 0xFEE75C,
        title: "🛠️ Canale Modificato",
        footer: "FireStorm Logs • Channel Update",
      };

    case AuditLogEvent.ChannelDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🗑️ Canale Eliminato",
        footer: "FireStorm Logs • Channel Delete",
      };

    case AuditLogEvent.RoleCreate:
      return {
        ...base,
        color: 0x57F287,
        title: "🏷️ Ruolo Creato",
        footer: "FireStorm Logs • Role Create",
      };

    case AuditLogEvent.RoleUpdate:
      return {
        ...base,
        color: 0xFEE75C,
        title: "✏️ Ruolo Modificato",
        footer: "FireStorm Logs • Role Update",
      };

    case AuditLogEvent.RoleDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🗑️ Ruolo Eliminato",
        footer: "FireStorm Logs • Role Delete",
      };

    case AuditLogEvent.EmojiCreate:
      return {
        ...base,
        color: 0x57F287,
        title: "😀 Emoji Creata",
        footer: "FireStorm Logs • Emoji Create",
      };

    case AuditLogEvent.EmojiUpdate:
      return {
        ...base,
        color: 0xFEE75C,
        title: "✏️ Emoji Modificata",
        footer: "FireStorm Logs • Emoji Update",
      };

    case AuditLogEvent.EmojiDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🗑️ Emoji Eliminata",
        footer: "FireStorm Logs • Emoji Delete",
      };

    case AuditLogEvent.StickerCreate:
      return {
        ...base,
        color: 0x57F287,
        title: "🧩 Sticker Creato",
        footer: "FireStorm Logs • Sticker Create",
      };

    case AuditLogEvent.StickerUpdate:
      return {
        ...base,
        color: 0xFEE75C,
        title: "✏️ Sticker Modificato",
        footer: "FireStorm Logs • Sticker Update",
      };

    case AuditLogEvent.StickerDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🗑️ Sticker Eliminato",
        footer: "FireStorm Logs • Sticker Delete",
      };

    case AuditLogEvent.WebhookCreate:
      return {
        ...base,
        color: 0x57F287,
        title: "🪝 Webhook Creato",
        footer: "FireStorm Logs • Webhook Create",
      };

    case AuditLogEvent.WebhookUpdate:
      return {
        ...base,
        color: 0xFEE75C,
        title: "✏️ Webhook Modificato",
        footer: "FireStorm Logs • Webhook Update",
      };

    case AuditLogEvent.WebhookDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🗑️ Webhook Eliminato",
        footer: "FireStorm Logs • Webhook Delete",
      };

    case AuditLogEvent.MessageDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🧹 Messaggio Eliminato da Staff",
        footer: "FireStorm Logs • Message Delete",
        extraField: extra?.channel
          ? {
              name: "💬 Canale",
              value: `${extra.channel}\nID: \`${extra.channel.id}\``,
              inline: true,
            }
          : null,
      };

    case AuditLogEvent.MessageBulkDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🧨 Bulk Delete / Purge",
        footer: "FireStorm Logs • Bulk Delete",
        extraField: extra?.count
          ? {
              name: "📦 Messaggi eliminati",
              value: `\`${extra.count}\``,
              inline: true,
            }
          : null,
      };

    case AuditLogEvent.InviteCreate:
      return {
        ...base,
        color: 0x57F287,
        title: "🔗 Invito Creato",
        footer: "FireStorm Logs • Invite Create",
      };

    case AuditLogEvent.InviteDelete:
      return {
        ...base,
        color: 0xED4245,
        title: "🗑️ Invito Eliminato",
        footer: "FireStorm Logs • Invite Delete",
      };

    default:
      return {
        ...base,
        title: `🛡️ Azione Staff (${action})`,
        footer: "FireStorm Logs • Audit Entry",
      };
  }
}

module.exports = (client) => {
  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    try {
      if (!entry || !guild) return;

      const allowedActions = new Set([
        AuditLogEvent.MemberKick,
        AuditLogEvent.MemberBanAdd,
        AuditLogEvent.MemberBanRemove,
        AuditLogEvent.MemberUpdate,
        AuditLogEvent.MemberRoleUpdate,
        AuditLogEvent.MemberMove,
        AuditLogEvent.MemberDisconnect,
        AuditLogEvent.BotAdd,

        AuditLogEvent.ChannelCreate,
        AuditLogEvent.ChannelUpdate,
        AuditLogEvent.ChannelDelete,

        AuditLogEvent.RoleCreate,
        AuditLogEvent.RoleUpdate,
        AuditLogEvent.RoleDelete,

        AuditLogEvent.EmojiCreate,
        AuditLogEvent.EmojiUpdate,
        AuditLogEvent.EmojiDelete,

        AuditLogEvent.StickerCreate,
        AuditLogEvent.StickerUpdate,
        AuditLogEvent.StickerDelete,

        AuditLogEvent.WebhookCreate,
        AuditLogEvent.WebhookUpdate,
        AuditLogEvent.WebhookDelete,

        AuditLogEvent.MessageDelete,
        AuditLogEvent.MessageBulkDelete,

        AuditLogEvent.InviteCreate,
        AuditLogEvent.InviteDelete,
      ]);

      if (!allowedActions.has(entry.action)) return;

      const info = getActionData(entry, guild);

      const embed = new EmbedBuilder()
        .setColor(info.color)
        .setAuthor({
          name: info.title,
          iconURL: guild.iconURL({ dynamic: true }) || undefined,
        })
        .addFields(
          {
            name: "👮 Staff",
            value: userValue(entry.executor),
            inline: true,
          },
          {
            name: "🎯 Target",
            value: info.targetName,
            inline: true,
          },
          {
            name: "🏠 Server",
            value: `${guild.name}\nID: \`${guild.id}\``,
            inline: true,
          },
          {
            name: "📌 Action Type",
            value: `\`${entry.action}\``,
            inline: true,
          },
          {
            name: "🕒 Orario",
            value: formatTime(),
            inline: true,
          },
          {
            name: "🆔 Entry ID",
            value: `\`${entry.id}\``,
            inline: true,
          }
        );

      if (entry.reason) {
        embed.addFields({
          name: "📝 Motivo",
          value: cut(entry.reason, 1024),
          inline: false,
        });
      }

      if (entry.target?.type !== undefined) {
        embed.addFields({
          name: "🧩 Tipo target",
          value: `\`${typeLabel(entry.target.type)}\``,
          inline: true,
        });
      }

      if (info.extraField) {
        embed.addFields(info.extraField);
      }

      if (entry.changes?.length) {
        embed.addFields({
          name: "🧾 Modifiche",
          value: stringifyChanges(entry.changes),
          inline: false,
        });
      }

      embed
        .setFooter({ text: info.footer })
        .setTimestamp();

      await sendLog(client, embed);
    } catch (err) {
      console.error("❌ Errore admin logs:", err);
    }
  });
};
