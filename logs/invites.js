const { EmbedBuilder, AuditLogEvent } = require("discord.js");

const LOG_CHANNEL_ID = "1455212706977157203";

const inviteCache = new Map();
const vanityCache = new Map();

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function formatRelative(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

function safe(value) {
  if (value === null || value === undefined || value === "") return "Nessuno";
  return String(value);
}

function formatMaxUses(invite) {
  if (!invite.maxUses || invite.maxUses === 0) return "Illimitati";
  return String(invite.maxUses);
}

function formatExpires(invite) {
  if (!invite.expiresAt) return "Mai";
  return `${formatTime(invite.expiresAt)}\n(${formatRelative(invite.expiresAt)})`;
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

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) {
      const mapped = new Map();
      invites.forEach((invite) => {
        mapped.set(invite.code, {
          code: invite.code,
          uses: invite.uses || 0,
          inviterId: invite.inviter?.id || null,
          inviterTag: invite.inviter?.tag || "Sconosciuto",
          channelId: invite.channel?.id || null,
          channelName: invite.channel?.name || "Sconosciuto",
          temporary: invite.temporary || false,
          maxUses: invite.maxUses || 0,
          expiresAt: invite.expiresAt || null,
          createdAt: invite.createdAt || null,
        });
      });
      inviteCache.set(guild.id, mapped);
    }

    const vanity = await guild.fetchVanityData().catch(() => null);
    vanityCache.set(guild.id, {
      code: vanity?.code || null,
      uses: vanity?.uses || 0,
    });
  } catch {}
}

async function getExecutor(guild, type, targetCode = null) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 5 }).catch(() => null);
    if (!logs) return null;

    const entry = logs.entries.find((e) => {
      if (!e) return false;
      if (!targetCode) return true;
      return e.target?.code === targetCode || e.changes?.some?.((c) => String(c?.new) === targetCode);
    });

    if (!entry || !entry.executor) return null;

    return {
      tag: entry.executor.tag,
      id: entry.executor.id,
    };
  } catch {
    return null;
  }
}

async function findUsedInvite(guild) {
  try {
    const oldInvites = inviteCache.get(guild.id) || new Map();
    const fetched = await guild.invites.fetch().catch(() => null);

    if (fetched) {
      const newInvites = new Map();
      let usedInvite = null;

      fetched.forEach((invite) => {
        const oldData = oldInvites.get(invite.code);
        const oldUses = oldData?.uses || 0;
        const newUses = invite.uses || 0;

        newInvites.set(invite.code, {
          code: invite.code,
          uses: newUses,
          inviterId: invite.inviter?.id || null,
          inviterTag: invite.inviter?.tag || "Sconosciuto",
          channelId: invite.channel?.id || null,
          channelName: invite.channel?.name || "Sconosciuto",
          temporary: invite.temporary || false,
          maxUses: invite.maxUses || 0,
          expiresAt: invite.expiresAt || null,
          createdAt: invite.createdAt || null,
        });

        if (newUses > oldUses) {
          usedInvite = {
            code: invite.code,
            uses: newUses,
            inviterId: invite.inviter?.id || null,
            inviterTag: invite.inviter?.tag || "Sconosciuto",
            channelId: invite.channel?.id || null,
            channelName: invite.channel?.name || "Sconosciuto",
            temporary: invite.temporary || false,
            maxUses: invite.maxUses || 0,
            expiresAt: invite.expiresAt || null,
          };
        }
      });

      inviteCache.set(guild.id, newInvites);

      if (usedInvite) {
        return { type: "invite", data: usedInvite };
      }
    }

    const oldVanity = vanityCache.get(guild.id) || { code: null, uses: 0 };
    const newVanity = await guild.fetchVanityData().catch(() => null);

    const vanityData = {
      code: newVanity?.code || null,
      uses: newVanity?.uses || 0,
    };

    vanityCache.set(guild.id, vanityData);

    if (vanityData.uses > oldVanity.uses) {
      return { type: "vanity", data: vanityData };
    }

    return { type: "unknown", data: null };
  } catch {
    return { type: "unknown", data: null };
  }
}

module.exports = (client) => {
  client.once("ready", async () => {
    for (const guild of client.guilds.cache.values()) {
      await cacheGuildInvites(guild);
    }
  });

  client.on("inviteCreate", async (invite) => {
    const executor = await getExecutor(invite.guild, AuditLogEvent.InviteCreate, invite.code);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({
        name: "🔗 Invito Creato",
        iconURL: invite.guild.iconURL({ dynamic: true }) || undefined,
      })
      .addFields(
        {
          name: "📨 Codice",
          value: `\`${invite.code}\``,
          inline: true,
        },
        {
          name: "📍 Canale",
          value: invite.channel ? `${invite.channel}\nID: \`${invite.channel.id}\`` : "Sconosciuto",
          inline: true,
        },
        {
          name: "👤 Creato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : (invite.inviter ? `${invite.inviter.tag} (\`${invite.inviter.id}\`)` : "Sconosciuto"),
          inline: true,
        },
        {
          name: "♾️ Max usi",
          value: `\`${formatMaxUses(invite)}\``,
          inline: true,
        },
        {
          name: "📊 Usi attuali",
          value: `\`${invite.uses || 0}\``,
          inline: true,
        },
        {
          name: "⏳ Scadenza",
          value: formatExpires(invite),
          inline: true,
        },
        {
          name: "🧳 Temporary",
          value: invite.temporary ? "Sì" : "No",
          inline: true,
        },
        {
          name: "🕒 Creato",
          value: formatTime(),
          inline: true,
        }
      )
      .setFooter({ text: "FireStorm Logs • Invite Create" })
      .setTimestamp();

    await sendLog(client, embed);
    await cacheGuildInvites(invite.guild);
  });

  client.on("inviteDelete", async (invite) => {
    const executor = await getExecutor(invite.guild, AuditLogEvent.InviteDelete, invite.code);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({
        name: "🗑️ Invito Eliminato",
        iconURL: invite.guild.iconURL({ dynamic: true }) || undefined,
      })
      .addFields(
        {
          name: "📨 Codice",
          value: `\`${invite.code}\``,
          inline: true,
        },
        {
          name: "📍 Canale",
          value: invite.channel ? `${invite.channel}\nID: \`${invite.channel.id}\`` : "Sconosciuto",
          inline: true,
        },
        {
          name: "👤 Eliminato da",
          value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Sconosciuto",
          inline: true,
        },
        {
          name: "📊 Usi finali",
          value: `\`${invite.uses || 0}\``,
          inline: true,
        },
        {
          name: "♾️ Max usi",
          value: `\`${formatMaxUses(invite)}\``,
          inline: true,
        },
        {
          name: "🧳 Temporary",
          value: invite.temporary ? "Sì" : "No",
          inline: true,
        },
        {
          name: "🕒 Eliminato",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Invite Delete" })
      .setTimestamp();

    await sendLog(client, embed);
    await cacheGuildInvites(invite.guild);
  });

  client.on("guildMemberAdd", async (member) => {
    const result = await findUsedInvite(member.guild);

    if (result.type === "invite" && result.data) {
      const data = result.data;

      const inviterText = data.inviterId
        ? `<@${data.inviterId}>\n\`${data.inviterTag}\`\nID: \`${data.inviterId}\``
        : safe(data.inviterTag);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
          name: "📥 Invito Utilizzato",
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: "👤 Nuovo membro",
            value: `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\``,
            inline: true,
          },
          {
            name: "📨 Codice invito",
            value: `\`${data.code}\``,
            inline: true,
          },
          {
            name: "📊 Usi totali",
            value: `\`${data.uses}\``,
            inline: true,
          },
          {
            name: "🙋 Invitato da",
            value: inviterText,
            inline: true,
          },
          {
            name: "📍 Canale invito",
            value: data.channelId ? `<#${data.channelId}>\nID: \`${data.channelId}\`` : safe(data.channelName),
            inline: true,
          },
          {
            name: "♾️ Max usi",
            value: `\`${data.maxUses === 0 ? "Illimitati" : data.maxUses}\``,
            inline: true,
          },
          {
            name: "🧳 Temporary",
            value: data.temporary ? "Sì" : "No",
            inline: true,
          },
          {
            name: "⏳ Scadenza",
            value: data.expiresAt ? `${formatTime(data.expiresAt)}\n(${formatRelative(data.expiresAt)})` : "Mai",
            inline: true,
          },
          {
            name: "🕒 Entrata",
            value: formatTime(),
            inline: true,
          }
        )
        .setFooter({ text: "FireStorm Logs • Invite Used" })
        .setTimestamp();

      await sendLog(client, embed);
      return;
    }

    if (result.type === "vanity" && result.data) {
      const embed = new EmbedBuilder()
        .setColor(0xEB459E)
        .setAuthor({
          name: "🌐 Join tramite Vanity URL",
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: "👤 Nuovo membro",
            value: `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\``,
            inline: true,
          },
          {
            name: "🌐 Vanity Code",
            value: `\`${result.data.code || "custom-url"}\``,
            inline: true,
          },
          {
            name: "📊 Usi totali",
            value: `\`${result.data.uses}\``,
            inline: true,
          },
          {
            name: "🕒 Entrata",
            value: formatTime(),
            inline: false,
          }
        )
        .setFooter({ text: "FireStorm Logs • Vanity Join" })
        .setTimestamp();

      await sendLog(client, embed);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setAuthor({
        name: "⚠️ Join non tracciato",
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: "👤 Nuovo membro",
          value: `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\``,
          inline: false,
        },
        {
          name: "ℹ️ Stato",
          value: "Non sono riuscito a determinare quale invito è stato usato.",
          inline: false,
        },
        {
          name: "🕒 Entrata",
          value: formatTime(),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Unknown Join" })
      .setTimestamp();

    await sendLog(client, embed);
  });
};
