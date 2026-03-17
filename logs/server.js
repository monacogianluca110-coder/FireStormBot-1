const { EmbedBuilder, AuditLogEvent, VerificationLevel, ExplicitContentFilter, GuildDefaultMessageNotifications } = require("discord.js");

const LOG_CHANNEL_ID = "1455214028170334278";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function cut(text, max = 1024) {
  if (!text) return "Nessuno";
  text = String(text);
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

function yesNo(value) {
  return value ? "Sì" : "No";
}

function formatChannel(channelId) {
  if (!channelId) return "Nessuno";
  return `<#${channelId}>\nID: \`${channelId}\``;
}

function formatVerificationLevel(level) {
  const map = {
    [VerificationLevel.None]: "Nessuna",
    [VerificationLevel.Low]: "Bassa",
    [VerificationLevel.Medium]: "Media",
    [VerificationLevel.High]: "Alta",
    [VerificationLevel.VeryHigh]: "Molto Alta",
  };
  return map[level] ?? String(level);
}

function formatExplicitFilter(level) {
  const map = {
    [ExplicitContentFilter.Disabled]: "Disattivato",
    [ExplicitContentFilter.MembersWithoutRoles]: "Solo membri senza ruoli",
    [ExplicitContentFilter.AllMembers]: "Tutti i membri",
  };
  return map[level] ?? String(level);
}

function formatDefaultNotifications(value) {
  const map = {
    [GuildDefaultMessageNotifications.AllMessages]: "Tutti i messaggi",
    [GuildDefaultMessageNotifications.OnlyMentions]: "Solo menzioni",
  };
  return map[value] ?? String(value);
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

async function getExecutor(guild) {
  try {
    const logs = await guild.fetchAuditLogs({
      type: AuditLogEvent.GuildUpdate,
      limit: 5,
    }).catch(() => null);

    if (!logs) return null;

    const entry = logs.entries.find(e => e?.target?.id === guild.id);
    if (!entry?.executor) return null;

    return {
      tag: entry.executor.tag,
      id: entry.executor.id,
    };
  } catch {
    return null;
  }
}

module.exports = (client) => {
  client.on("guildUpdate", async (oldGuild, newGuild) => {
    const changes = [];

    if (oldGuild.name !== newGuild.name) {
      changes.push(`**Nome server:** \`${oldGuild.name}\` → \`${newGuild.name}\``);
    }

    if ((oldGuild.icon || null) !== (newGuild.icon || null)) {
      changes.push(`**Icona:** \`${oldGuild.icon ? "Presente" : "Nessuna"}\` → \`${newGuild.icon ? "Presente" : "Nessuna"}\``);
    }

    if ((oldGuild.banner || null) !== (newGuild.banner || null)) {
      changes.push(`**Banner:** \`${oldGuild.banner ? "Presente" : "Nessuno"}\` → \`${newGuild.banner ? "Presente" : "Nessuno"}\``);
    }

    if ((oldGuild.splash || null) !== (newGuild.splash || null)) {
      changes.push(`**Invite Splash:** \`${oldGuild.splash ? "Presente" : "Nessuna"}\` → \`${newGuild.splash ? "Presente" : "Nessuna"}\``);
    }

    if ((oldGuild.discoverySplash || null) !== (newGuild.discoverySplash || null)) {
      changes.push(`**Discovery Splash:** \`${oldGuild.discoverySplash ? "Presente" : "Nessuna"}\` → \`${newGuild.discoverySplash ? "Presente" : "Nessuna"}\``);
    }

    if ((oldGuild.description || null) !== (newGuild.description || null)) {
      changes.push(`**Descrizione:** \`${oldGuild.description || "Nessuna"}\` → \`${newGuild.description || "Nessuna"}\``);
    }

    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
      changes.push(`**Livello verifica:** \`${formatVerificationLevel(oldGuild.verificationLevel)}\` → \`${formatVerificationLevel(newGuild.verificationLevel)}\``);
    }

    if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
      changes.push(`**Filtro contenuti espliciti:** \`${formatExplicitFilter(oldGuild.explicitContentFilter)}\` → \`${formatExplicitFilter(newGuild.explicitContentFilter)}\``);
    }

    if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications) {
      changes.push(`**Notifiche di default:** \`${formatDefaultNotifications(oldGuild.defaultMessageNotifications)}\` → \`${formatDefaultNotifications(newGuild.defaultMessageNotifications)}\``);
    }

    if (oldGuild.afkChannelId !== newGuild.afkChannelId) {
      changes.push(`**Canale AFK:** ${formatChannel(oldGuild.afkChannelId)} → ${formatChannel(newGuild.afkChannelId)}`);
    }

    if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
      changes.push(`**Timeout AFK:** \`${oldGuild.afkTimeout}\` → \`${newGuild.afkTimeout}\``);
    }

    if (oldGuild.ownerId !== newGuild.ownerId) {
      changes.push(`**Owner:** <@${oldGuild.ownerId}> (\`${oldGuild.ownerId}\`) → <@${newGuild.ownerId}> (\`${newGuild.ownerId}\`)`);
    }

    if ((oldGuild.vanityURLCode || null) !== (newGuild.vanityURLCode || null)) {
      changes.push(`**Vanity URL:** \`${oldGuild.vanityURLCode || "Nessuna"}\` → \`${newGuild.vanityURLCode || "Nessuna"}\``);
    }

    if (oldGuild.premiumTier !== newGuild.premiumTier) {
      changes.push(`**Boost Tier:** \`${oldGuild.premiumTier}\` → \`${newGuild.premiumTier}\``);
    }

    if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount) {
      changes.push(`**Numero Boost:** \`${oldGuild.premiumSubscriptionCount || 0}\` → \`${newGuild.premiumSubscriptionCount || 0}\``);
    }

    if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
      changes.push(`**System Channel:** ${formatChannel(oldGuild.systemChannelId)} → ${formatChannel(newGuild.systemChannelId)}`);
    }

    if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
      changes.push(`**Rules Channel:** ${formatChannel(oldGuild.rulesChannelId)} → ${formatChannel(newGuild.rulesChannelId)}`);
    }

    if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId) {
      changes.push(`**Public Updates Channel:** ${formatChannel(oldGuild.publicUpdatesChannelId)} → ${formatChannel(newGuild.publicUpdatesChannelId)}`);
    }

    if (!changes.length) return;

    const executor = await getExecutor(newGuild);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: "🛡️ Server Modificato",
        iconURL: newGuild.iconURL({ dynamic: true }) || undefined,
      })
      .setThumbnail(newGuild.iconURL({ dynamic: true, size: 1024 }) || null)
      .addFields(
        {
          name: "🏠 Server",
          value: `${newGuild.name}\nID: \`${newGuild.id}\``,
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
      .setFooter({ text: "FireStorm Logs • Server Update" })
      .setTimestamp();

    if (newGuild.bannerURL()) {
      embed.setImage(newGuild.bannerURL({ size: 1024 }));
    }

    await sendLog(client, embed);
  });
};
