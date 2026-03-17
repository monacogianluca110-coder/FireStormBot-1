const { EmbedBuilder, AuditLogEvent, PermissionsBitField } = require("discord.js");

const LOG_CHANNEL_ID = "1483456307649577002";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function cut(text, max = 1000) {
  if (!text) return "Nessuno";
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

async function getExecutor(guild, type, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 6 }).catch(() => null);
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

function formatColor(role) {
  return role.hexColor && role.hexColor !== "#000000" ? role.hexColor : "Default";
}

function formatPermissions(permissions) {
  try {
    const perms = new PermissionsBitField(permissions).toArray();
    if (!perms.length) return "Nessuno";

    return cut(perms.map(p => `• ${p}`).join("\n"), 1000);
  } catch {
    return "Impossibile leggere i permessi";
  }
}

function yesNo(value) {
  return value ? "Sì" : "No";
}

module.exports = (client) => {
  client.on("roleCreate", async (role) => {
    const executor = await getExecutor(role.guild, AuditLogEvent.RoleCreate, role.id);

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x57F287)
      .setAuthor({
        name: "🏷️ Ruolo Creato",
        iconURL: role.guild.iconURL({ dynamic: true }) || undefined,
      })
      .addFields(
        {
          name: "🏷️ Ruolo",
          value: `${role}\nNome: \`${role.name}\`\nID: \`${role.id}\``,
          inline: false,
        },
        {
          name: "🎨 Colore",
          value: `\`${formatColor(role)}\``,
          inline: true,
        },
        {
          name: "📍 Posizione",
          value: `\`${role.position}\``,
          inline: true,
        },
        {
          name: "👤 Creato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Sconosciuto",
          inline: true,
        },
        {
          name: "📢 Mentionable",
          value: yesNo(role.mentionable),
          inline: true,
        },
        {
          name: "📌 Hoist",
          value: yesNo(role.hoist),
          inline: true,
        },
        {
          name: "😀 Emoji/Icona",
          value: role.unicodeEmoji || (role.icon ? "Icona ruolo presente" : "Nessuna"),
          inline: true,
        },
        {
          name: "🛡️ Permessi",
          value: formatPermissions(role.permissions.bitfield),
          inline: false,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Role Create" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  client.on("roleDelete", async (role) => {
    const executor = await getExecutor(role.guild, AuditLogEvent.RoleDelete, role.id);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({
        name: "🗑️ Ruolo Eliminato",
        iconURL: role.guild.iconURL({ dynamic: true }) || undefined,
      })
      .addFields(
        {
          name: "🏷️ Ruolo",
          value: `Nome: \`${role.name}\`\nID: \`${role.id}\``,
          inline: false,
        },
        {
          name: "🎨 Colore",
          value: `\`${formatColor(role)}\``,
          inline: true,
        },
        {
          name: "📍 Posizione",
          value: `\`${role.position}\``,
          inline: true,
        },
        {
          name: "👤 Eliminato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Sconosciuto",
          inline: true,
        },
        {
          name: "📢 Mentionable",
          value: yesNo(role.mentionable),
          inline: true,
        },
        {
          name: "📌 Hoist",
          value: yesNo(role.hoist),
          inline: true,
        },
        {
          name: "😀 Emoji/Icona",
          value: role.unicodeEmoji || (role.icon ? "Icona ruolo presente" : "Nessuna"),
          inline: true,
        },
        {
          name: "🛡️ Permessi finali",
          value: formatPermissions(role.permissions.bitfield),
          inline: false,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Role Delete" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  client.on("roleUpdate", async (oldRole, newRole) => {
    const changes = [];

    if (oldRole.name !== newRole.name) {
      changes.push(`**Nome:** \`${oldRole.name}\` → \`${newRole.name}\``);
    }

    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`**Colore:** \`${formatColor(oldRole)}\` → \`${formatColor(newRole)}\``);
    }

    if (oldRole.position !== newRole.position) {
      changes.push(`**Posizione:** \`${oldRole.position}\` → \`${newRole.position}\``);
    }

    if (oldRole.hoist !== newRole.hoist) {
      changes.push(`**Hoist:** \`${yesNo(oldRole.hoist)}\` → \`${yesNo(newRole.hoist)}\``);
    }

    if (oldRole.mentionable !== newRole.mentionable) {
      changes.push(`**Mentionable:** \`${yesNo(oldRole.mentionable)}\` → \`${yesNo(newRole.mentionable)}\``);
    }

    if ((oldRole.unicodeEmoji || null) !== (newRole.unicodeEmoji || null)) {
      changes.push(`**Emoji ruolo:** \`${oldRole.unicodeEmoji || "Nessuna"}\` → \`${newRole.unicodeEmoji || "Nessuna"}\``);
    }

    if ((oldRole.icon || null) !== (newRole.icon || null)) {
      changes.push(`**Icona ruolo:** \`${oldRole.icon ? "Presente" : "Nessuna"}\` → \`${newRole.icon ? "Presente" : "Nessuna"}\``);
    }

    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push(`**Permessi prima:**\n${formatPermissions(oldRole.permissions.bitfield)}`);
      changes.push(`**Permessi dopo:**\n${formatPermissions(newRole.permissions.bitfield)}`);
    }

    if (!changes.length) return;

    const executor = await getExecutor(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);

    const embed = new EmbedBuilder()
      .setColor(newRole.color || 0xFEE75C)
      .setAuthor({
        name: "✏️ Ruolo Modificato",
        iconURL: newRole.guild.iconURL({ dynamic: true }) || undefined,
      })
      .addFields(
        {
          name: "🏷️ Ruolo",
          value: `${newRole}\nNome: \`${newRole.name}\`\nID: \`${newRole.id}\``,
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
          name: "🧾 Modifiche",
          value: cut(changes.join("\n\n"), 1024),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Role Update" })
      .setTimestamp();

    await sendLog(client, embed);
  });
};
