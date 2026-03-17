const {
  EmbedBuilder,
  AuditLogEvent,
} = require("discord.js");

const LOG_CHANNEL_ID = "1455212222732046391";

const inviteCache = new Map();
const vanityCache = new Map();

function formatTime(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function formatRelative(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

function getAccountAgeDays(createdAt) {
  return Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}

async function getLogChannel(client, guild) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return null;
    if (!channel.guild || channel.guild.id !== guild.id) return null;
    return channel;
  } catch {
    return null;
  }
}

async function sendEmbed(client, guild, embed) {
  const channel = await getLogChannel(client, guild);
  if (!channel) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) {
      const mapped = new Map();
      invites.forEach(inv => {
        mapped.set(inv.code, {
          uses: inv.uses || 0,
          inviter: inv.inviter ? `${inv.inviter.tag} (${inv.inviter.id})` : "Sconosciuto",
          code: inv.code,
          channel: inv.channel ? `${inv.channel.name}` : "Sconosciuto",
        });
      });
      inviteCache.set(guild.id, mapped);
    }

    const vanity = await guild.fetchVanityData().catch(() => null);
    vanityCache.set(guild.id, vanity?.uses || 0);
  } catch {}
}

async function findUsedInvite(guild) {
  try {
    const oldInvites = inviteCache.get(guild.id) || new Map();
    const newInvitesFetched = await guild.invites.fetch().catch(() => null);

    if (newInvitesFetched) {
      const newInvites = new Map();
      let usedInvite = null;

      newInvitesFetched.forEach(inv => {
        const oldData = oldInvites.get(inv.code);
        const newUses = inv.uses || 0;
        const oldUses = oldData ? oldData.uses : 0;

        newInvites.set(inv.code, {
          uses: newUses,
          inviter: inv.inviter ? `${inv.inviter.tag} (${inv.inviter.id})` : "Sconosciuto",
          code: inv.code,
          channel: inv.channel ? `${inv.channel.name}` : "Sconosciuto",
        });

        if (newUses > oldUses) {
          usedInvite = {
            code: inv.code,
            inviter: inv.inviter ? `${inv.inviter.tag} (${inv.inviter.id})` : "Sconosciuto",
            channel: inv.channel ? `${inv.channel}` : "Sconosciuto",
            uses: newUses,
          };
        }
      });

      inviteCache.set(guild.id, newInvites);
      if (usedInvite) return { type: "invite", data: usedInvite };
    }

    const oldVanityUses = vanityCache.get(guild.id) || 0;
    const vanity = await guild.fetchVanityData().catch(() => null);
    const newVanityUses = vanity?.uses || 0;
    vanityCache.set(guild.id, newVanityUses);

    if (newVanityUses > oldVanityUses) {
      return {
        type: "vanity",
        data: {
          code: vanity?.code || "custom-url",
          uses: newVanityUses,
        },
      };
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
    await cacheGuildInvites(invite.guild);
  });

  client.on("inviteDelete", async (invite) => {
    await cacheGuildInvites(invite.guild);
  });

  client.on("guildMemberAdd", async (member) => {
    const guild = member.guild;
    const user = member.user;

    const inviteInfo = await findUsedInvite(guild);
    const accountAgeDays = getAccountAgeDays(user.createdAt);
    const suspicious = accountAgeDays <= 7;

    const joinEmbed = new EmbedBuilder()
      .setColor(0x57F287)
      .setAuthor({
        name: "🟢 Membro Entrato",
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: "👤 Utente", value: `${user} \n\`${user.tag}\`\nID: \`${user.id}\``, inline: false },
        { name: "📅 Account creato", value: `${formatTime(user.createdAt)}\n(${formatRelative(user.createdAt)})`, inline: true },
        { name: "📥 Entrato nel server", value: `${formatTime(new Date())}`, inline: true }
      )
      .setFooter({ text: `FireStorm Logs • Join` })
      .setTimestamp();

    if (inviteInfo.type === "invite" && inviteInfo.data) {
      joinEmbed.addFields({
        name: "🔗 Invito utilizzato",
        value:
          `Codice: \`${inviteInfo.data.code}\`\n` +
          `Invitato da: ${inviteInfo.data.inviter}\n` +
          `Canale: ${inviteInfo.data.channel}\n` +
          `Utilizzi: \`${inviteInfo.data.uses}\``,
        inline: false,
      });
    } else if (inviteInfo.type === "vanity" && inviteInfo.data) {
      joinEmbed.addFields({
        name: "🌐 Entrata tramite Vanity URL",
        value:
          `Codice: \`${inviteInfo.data.code}\`\n` +
          `Utilizzi totali: \`${inviteInfo.data.uses}\``,
        inline: false,
      });
    } else {
      joinEmbed.addFields({
        name: "⚠️ Join non tracciato",
        value: "Non sono riuscito a determinare con precisione quale invito è stato usato.",
        inline: false,
      });
    }

    if (suspicious) {
      joinEmbed.addFields({
        name: "🚨 Account sospetto",
        value: `Questo account è molto recente: creato ${formatRelative(user.createdAt)}.`,
        inline: false,
      });
    }

    await sendEmbed(client, guild, joinEmbed);

    if (suspicious) {
      const warnEmbed = new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({
          name: "🚨 Nuovo account sospetto",
          iconURL: user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: `${user} \n\`${user.tag}\`\nID: \`${user.id}\``, inline: false },
          { name: "📅 Creato", value: `${formatTime(user.createdAt)}\n(${formatRelative(user.createdAt)})`, inline: true },
          { name: "⚠️ Motivo", value: `Account con soli \`${accountAgeDays}\` giorni di età.`, inline: true }
        )
        .setFooter({ text: `FireStorm Logs • Security` })
        .setTimestamp();

      await sendEmbed(client, guild, warnEmbed);
    }
  });

  client.on("guildMemberRemove", async (member) => {
    const guild = member.guild;
    const user = member.user;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setAuthor({
        name: "🔴 Membro Uscito",
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: "👤 Utente", value: `${user} \n\`${user.tag}\`\nID: \`${user.id}\``, inline: false },
        { name: "📅 Account creato", value: `${formatTime(user.createdAt)}\n(${formatRelative(user.createdAt)})`, inline: true },
        { name: "📤 Uscita dal server", value: `${formatTime(new Date())}`, inline: true }
      )
      .setFooter({ text: `FireStorm Logs • Leave` })
      .setTimestamp();

    await sendEmbed(client, guild, embed);
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const guild = newMember.guild;
    const user = newMember.user;

    // Boost iniziato
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const embed = new EmbedBuilder()
        .setColor(0xFF73FA)
        .setAuthor({
          name: "💎 Boost Avviato",
          iconURL: user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: `${user} \n\`${user.tag}\`\nID: \`${user.id}\``, inline: false },
          { name: "🚀 Azione", value: "Ha iniziato a boostare il server.", inline: true },
          { name: "🕒 Orario", value: formatTime(new Date()), inline: true }
        )
        .setFooter({ text: `FireStorm Logs • Boost` })
        .setTimestamp();

      await sendEmbed(client, guild, embed);
    }

    // Boost rimosso
    if (oldMember.premiumSince && !newMember.premiumSince) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setAuthor({
          name: "💔 Boost Terminato",
          iconURL: user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: `${user} \n\`${user.tag}\`\nID: \`${user.id}\``, inline: false },
          { name: "📉 Azione", value: "Ha smesso di boostare il server.", inline: true },
          { name: "🕒 Orario", value: formatTime(new Date()), inline: true }
        )
        .setFooter({ text: `FireStorm Logs • Boost` })
        .setTimestamp();

      await sendEmbed(client, guild, embed);
    }
  });

  client.on("userUpdate", async (oldUser, newUser) => {
    if (oldUser.displayAvatarURL() === newUser.displayAvatarURL()) return;

    for (const guild of client.guilds.cache.values()) {
      const member = guild.members.cache.get(newUser.id);
      if (!member) continue;

      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setAuthor({
          name: "🖼️ Avatar Aggiornato",
          iconURL: newUser.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(newUser.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: "👤 Utente", value: `${newUser} \n\`${newUser.tag}\`\nID: \`${newUser.id}\``, inline: false },
          { name: "🕒 Orario", value: formatTime(new Date()), inline: true }
        )
        .setFooter({ text: `FireStorm Logs • Profile` })
        .setTimestamp();

      await sendEmbed(client, guild, embed);
    }
  });
};
