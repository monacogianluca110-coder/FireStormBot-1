const { EmbedBuilder } = require("discord.js");

const LOG_CHANNEL_ID = "1455212297378201773";

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

function userField(member) {
  return `${member}\n\`${member.user.tag}\`\nID: \`${member.id}\``;
}

module.exports = (client) => {

  client.on("voiceStateUpdate", async (oldState, newState) => {
    const member = newState.member;
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

    // 🚪 USCITA
    if (oldChannel && !newChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({
          name: "🚪 Uscito dalla vocale",
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: userField(member), inline: true },
          { name: "📍 Canale", value: `${oldChannel}\nID: \`${oldChannel.id}\``, inline: true },
          { name: "🕒 Orario", value: formatTime(), inline: true }
        )
        .setFooter({ text: "FireStorm Logs • Voice Leave" })
        .setTimestamp();

      return sendLog(client, embed);
    }

    // 🔁 SPOSTAMENTO
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
          name: "🔁 Spostamento vocale",
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: userField(member), inline: true },
          { name: "📤 Da", value: `${oldChannel}`, inline: true },
          { name: "📥 A", value: `${newChannel}`, inline: true },
          { name: "🕒 Orario", value: formatTime(), inline: false }
        )
        .setFooter({ text: "FireStorm Logs • Voice Move" })
        .setTimestamp();

      return sendLog(client, embed);
    }

    // 🔇 MUTE
    if (oldState.serverMute !== newState.serverMute) {
      const embed = new EmbedBuilder()
        .setColor(0xFAA61A)
        .setAuthor({
          name: newState.serverMute ? "🔇 Mutato" : "🔊 Unmutato",
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: userField(member), inline: true },
          { name: "📍 Canale", value: `${newChannel || oldChannel}`, inline: true },
          { name: "🕒 Orario", value: formatTime(), inline: true }
        )
        .setFooter({ text: "FireStorm Logs • Voice Mute" })
        .setTimestamp();

      return sendLog(client, embed);
    }

    // 🎧 DEAF
    if (oldState.serverDeaf !== newState.serverDeaf) {
      const embed = new EmbedBuilder()
        .setColor(0xFAA61A)
        .setAuthor({
          name: newState.serverDeaf ? "🎧 Deafened" : "🔊 Undeafened",
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: userField(member), inline: true },
          { name: "📍 Canale", value: `${newChannel || oldChannel}`, inline: true },
          { name: "🕒 Orario", value: formatTime(), inline: true }
        )
        .setFooter({ text: "FireStorm Logs • Voice Deaf" })
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
          { name: "📍 Canale", value: `${newChannel}`, inline: true },
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
          { name: "📍 Canale", value: `${newChannel}`, inline: true },
          { name: "🕒 Orario", value: formatTime(), inline: true }
        )
        .setFooter({ text: "FireStorm Logs • Camera" })
        .setTimestamp();

      return sendLog(client, embed);
    }

  });

};
