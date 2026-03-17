const { EmbedBuilder, AuditLogEvent } = require("discord.js");

const LOG_CHANNEL_ID = "1455212297378201773";

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function userField(member) {
  return `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\``;
}

function executorField(executor, member) {
  if (!executor) return "Sconosciuto / Sistema";

  if (executor.id === member.id) {
    return `${executor}\n\`${executor.tag}\`\nID: \`${executor.id}\`\n**Azione su sé stesso**`;
  }

  return `${executor}\n\`${executor.tag}\`\nID: \`${executor.id}\``;
}

async function getRecentAuditEntry(guild, type, targetId = null, maxAgeMs = 20000) {
  try {
    await sleep(1500);

    const logs = await guild.fetchAuditLogs({
      type,
      limit: 10,
    }).catch(() => null);

    if (!logs) return null;

    const now = Date.now();

    const entry = logs.entries.find((e) => {
      if (!e || !e.executor) return false;
      if (now - e.createdTimestamp > maxAgeMs) return false;

      if (targetId && e.target?.id === targetId) return true;

      if (type === AuditLogEvent.MemberMove || type === AuditLogEvent.MemberDisconnect) {
        return true;
      }

      return false;
    });

    return entry || null;
  } catch {
    return null;
  }
}

async function getVoiceUpdateExecutor(guild, targetId, key) {
  try {
    await sleep(1200);

    const logs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberUpdate,
      limit: 10,
    }).catch(() => null);

    if (!logs) return null;

    const now = Date.now();

    const entry = logs.entries.find((e) => {
      if (!e) return false;
      if (!e.executor) return false;
      if (e.target?.id !== targetId) return false;
      if (now - e.createdTimestamp > 20000) return false;

      return e.changes?.some((c) => c.key === key);
    });

    return entry || null;
  } catch {
    return null;
  }
}

module.exports = (client) => {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      const member = newState.member || oldState.member;
      if (!member || member.user.bot) return;

      const oldChannel = oldState.channel;
      const newChannel = newState.channel;

      // 🔊 ENTRATA
      if (!oldChannel && newChannel) {
        const embed = new EmbedBuilder()
          .setColor(0x57F287)
          .setAuthor({
            name: "🔊 Entrato in vocale",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "📍 Canale", value: `${newChannel}\nID: \`${newChannel.id}\``, inline: true },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          )
          .setFooter({ text: "FireStorm Logs • Voice Join" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 🚪 USCITA / DISCONNECT FORZATO
      if (oldChannel && !newChannel) {
        const disconnectEntry = await getRecentAuditEntry(
          member.guild,
          AuditLogEvent.MemberDisconnect,
          member.id
        );

        const forced = !!disconnectEntry;
        const executor = disconnectEntry?.executor || null;

        const embed = new EmbedBuilder()
          .setColor(forced ? 0xFAA61A : 0xED4245)
          .setAuthor({
            name: forced ? "⛔ Disconnesso dalla vocale" : "🚪 Uscito dalla vocale",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "📍 Canale", value: `${oldChannel}\nID: \`${oldChannel.id}\``, inline: true },
            {
              name: "👮 Eseguito da",
              value: forced ? executorField(executor, member) : "Utente stesso / Uscita normale",
              inline: true,
            },
            {
              name: "🧠 Tipo azione",
              value: forced ? "Disconnessione forzata da staff" : "Uscita normale",
              inline: true,
            },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          );

        if (disconnectEntry?.reason) {
          embed.addFields({
            name: "📝 Motivo",
            value: disconnectEntry.reason,
            inline: false,
          });
        }

        embed
          .setFooter({ text: "FireStorm Logs • Voice Leave / Disconnect" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 🔁 SPOSTAMENTO VOCALE
      if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
        const moveEntry = await getRecentAuditEntry(
          member.guild,
          AuditLogEvent.MemberMove,
          member.id
        );

        const forcedMove = !!moveEntry;
        const executor = moveEntry?.executor || null;

        const embed = new EmbedBuilder()
          .setColor(forcedMove ? 0xFAA61A : 0x5865F2)
          .setAuthor({
            name: forcedMove ? "🛡️ Spostato da staff" : "🔁 Spostamento vocale",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "📤 Da", value: `${oldChannel}\nID: \`${oldChannel.id}\``, inline: true },
            { name: "📥 A", value: `${newChannel}\nID: \`${newChannel.id}\``, inline: true },
            {
              name: "👮 Eseguito da",
              value: forcedMove ? executorField(executor, member) : "Utente stesso / Cambio manuale",
              inline: true,
            },
            {
              name: "🧠 Tipo azione",
              value: forcedMove ? "Spostamento forzato da staff" : "Cambio canale normale",
              inline: true,
            },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          );

        if (moveEntry?.reason) {
          embed.addFields({
            name: "📝 Motivo",
            value: moveEntry.reason,
            inline: false,
          });
        }

        if (moveEntry?.extra?.count) {
          embed.addFields({
            name: "📦 Membri coinvolti",
            value: `\`${moveEntry.extra.count}\``,
            inline: true,
          });
        }

        embed
          .setFooter({ text: "FireStorm Logs • Voice Move" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 🔇 SERVER MUTE / UNMUTE
      if (oldState.serverMute !== newState.serverMute) {
        const entry = await getVoiceUpdateExecutor(member.guild, member.id, "mute");
        const executor = entry?.executor || null;
        const isSelfAction = executor && executor.id === member.id;

        const embed = new EmbedBuilder()
          .setColor(newState.serverMute ? 0xFAA61A : 0x57F287)
          .setAuthor({
            name: newState.serverMute ? "🔇 Mutato" : "🔊 Unmutato",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "👮 Eseguito da", value: executorField(executor, member), inline: true },
            { name: "📍 Canale", value: `${newChannel || oldChannel || "Sconosciuto"}`, inline: true },
            {
              name: "🧠 Tipo azione",
              value: isSelfAction
                ? "Utente su sé stesso"
                : executor
                ? "Azione staff/manuale"
                : "Sistema / Automatico / Non rilevato",
              inline: true,
            },
            {
              name: "📌 Stato",
              value: newState.serverMute ? "`Mutato dal server`" : "`Unmutato dal server`",
              inline: true,
            },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          );

        if (entry?.reason) {
          embed.addFields({
            name: "📝 Motivo",
            value: entry.reason,
            inline: false,
          });
        }

        embed
          .setFooter({ text: "FireStorm Logs • Voice Server Mute" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 🎧 SERVER DEAF / UNDEAF
      if (oldState.serverDeaf !== newState.serverDeaf) {
        const entry = await getVoiceUpdateExecutor(member.guild, member.id, "deaf");
        const executor = entry?.executor || null;
        const isSelfAction = executor && executor.id === member.id;

        const embed = new EmbedBuilder()
          .setColor(newState.serverDeaf ? 0xFAA61A : 0x57F287)
          .setAuthor({
            name: newState.serverDeaf ? "🎧 Deafened" : "🔊 Undeafened",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "👮 Eseguito da", value: executorField(executor, member), inline: true },
            { name: "📍 Canale", value: `${newChannel || oldChannel || "Sconosciuto"}`, inline: true },
            {
              name: "🧠 Tipo azione",
              value: isSelfAction
                ? "Utente su sé stesso"
                : executor
                ? "Azione staff/manuale"
                : "Sistema / Automatico / Non rilevato",
              inline: true,
            },
            {
              name: "📌 Stato",
              value: newState.serverDeaf ? "`Deafened dal server`" : "`Undeafened dal server`",
              inline: true,
            },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          );

        if (entry?.reason) {
          embed.addFields({
            name: "📝 Motivo",
            value: entry.reason,
            inline: false,
          });
        }

        embed
          .setFooter({ text: "FireStorm Logs • Voice Server Deaf" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 🙊 SELF MUTE
      if (oldState.selfMute !== newState.selfMute) {
        const embed = new EmbedBuilder()
          .setColor(newState.selfMute ? 0xFAA61A : 0x57F287)
          .setAuthor({
            name: newState.selfMute ? "🙊 Self Mute Attivato" : "🗣️ Self Mute Disattivato",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            {
              name: "👮 Eseguito da",
              value: `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\`\n**Auto-azione**`,
              inline: true,
            },
            { name: "📍 Canale", value: `${newChannel || oldChannel || "Sconosciuto"}`, inline: true },
            {
              name: "📌 Stato",
              value: newState.selfMute ? "`Self Muted`" : "`Self Unmuted`",
              inline: true,
            },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          )
          .setFooter({ text: "FireStorm Logs • Voice Self Mute" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 🔕 SELF DEAF
      if (oldState.selfDeaf !== newState.selfDeaf) {
        const embed = new EmbedBuilder()
          .setColor(newState.selfDeaf ? 0xFAA61A : 0x57F287)
          .setAuthor({
            name: newState.selfDeaf ? "🔕 Self Deaf Attivato" : "🔊 Self Deaf Disattivato",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            {
              name: "👮 Eseguito da",
              value: `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\`\n**Auto-azione**`,
              inline: true,
            },
            { name: "📍 Canale", value: `${newChannel || oldChannel || "Sconosciuto"}`, inline: true },
            {
              name: "📌 Stato",
              value: newState.selfDeaf ? "`Self Deafened`" : "`Self Undeafened`",
              inline: true,
            },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          )
          .setFooter({ text: "FireStorm Logs • Voice Self Deaf" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 📺 STREAM
      if (oldState.streaming !== newState.streaming) {
        const embed = new EmbedBuilder()
          .setColor(0xEB459E)
          .setAuthor({
            name: newState.streaming ? "📺 Streaming Avviato" : "📴 Streaming Terminato",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "📍 Canale", value: `${newChannel || oldChannel || "Sconosciuto"}`, inline: true },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          )
          .setFooter({ text: "FireStorm Logs • Stream" })
          .setTimestamp();

        return sendLog(client, embed);
      }

      // 📷 CAMERA
      if (oldState.selfVideo !== newState.selfVideo) {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setAuthor({
            name: newState.selfVideo ? "📷 Camera Attivata" : "📷 Camera Disattivata",
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
          .addFields(
            { name: "👤 Utente", value: userField(member), inline: true },
            { name: "📍 Canale", value: `${newChannel || oldChannel || "Sconosciuto"}`, inline: true },
            { name: "🕒 Orario", value: formatTime(), inline: true }
          )
          .setFooter({ text: "FireStorm Logs • Camera" })
          .setTimestamp();

        return sendLog(client, embed);
      }
    } catch (err) {
      console.error("❌ Errore voice logs:", err);
    }
  });
};
