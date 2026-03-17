const {
  EmbedBuilder,
  AuditLogEvent,
  ChannelType
} = require("discord.js");

const logCh = require("../config/logChannels");

module.exports = (client) => {
  function cut(text, max = 1024) {
    if (!text) return "-";
    text = String(text);
    return text.length > max ? text.slice(0, max - 3) + "..." : text;
  }

  function getChannel(client, channelId) {
    if (!channelId) return null;
    return client.channels.cache.get(channelId) || null;
  }

  async function sendLog(client, channelId, payload) {
    try {
      const channel = getChannel(client, channelId);
      if (!channel) return;
      await channel.send(payload);
    } catch (err) {
      console.error("[LOG ERROR]", err);
    }
  }

  function userTag(user) {
    return user ? `${user.tag} (${user.id})` : "-";
  }

  function userAvatar(user) {
    return user?.displayAvatarURL?.({ dynamic: true, size: 1024 }) || null;
  }

  function baseEmbed(title, color = 0x2b2d31) {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setTimestamp();
  }

  async function getLastAudit(guild, type, predicate = null) {
    try {
      const fetched = await guild.fetchAuditLogs({ type, limit: 6 });
      const entry = fetched.entries.find((e) => {
        if (!predicate) return true;
        return predicate(e);
      });
      return entry || null;
    } catch {
      return null;
    }
  }

  function formatPerms(perms) {
    if (!perms) return "-";
    const arr = perms.toArray?.() || [];
    if (!arr.length) return "-";
    return cut(arr.join(", "), 1024);
  }

  function formatChannel(channel) {
    if (!channel) return "-";
    return `<#${channel.id}> (${channel.name})`;
  }

  function formatRole(role) {
    if (!role) return "-";
    return `<@&${role.id}> (${role.name})`;
  }

  function formatDate(ts) {
    if (!ts) return "-";
    return `<t:${Math.floor(ts / 1000)}:F>`;
  }

  function formatBool(value) {
    return value ? "Sì" : "No";
  }

  function memberThumb(member) {
    return member?.user?.displayAvatarURL?.({ dynamic: true, size: 1024 }) || null;
  }

  // =========================
  // MEMBER LOGS
  // =========================

  client.on("guildMemberAdd", async (member) => {
    const inviterData = member.guild.invites?.cache?.size ? null : null;

    const e = baseEmbed("📥 MEMBRO ENTRATO", 0x57f287)
      .setThumbnail(memberThumb(member))
      .setImage(userAvatar(member.user))
      .addFields(
        { name: "Utente", value: `${member.user} \n${userTag(member.user)}`, inline: false },
        { name: "Account creato", value: formatDate(member.user.createdTimestamp), inline: true },
        { name: "Entrato nel server", value: formatDate(Date.now()), inline: true },
        { name: "Bot", value: formatBool(member.user.bot), inline: true }
      );

    await sendLog(client, logCh.memberLog, { embeds: [e] });
  });

  client.on("guildMemberRemove", async (member) => {
    const e = baseEmbed("📤 MEMBRO USCITO", 0xed4245)
      .setThumbnail(memberThumb(member))
      .setImage(userAvatar(member.user))
      .addFields(
        { name: "Utente", value: `${member.user?.tag || "-"} (${member.id})`, inline: false },
        { name: "Nickname", value: cut(member.nickname || "-"), inline: true },
        { name: "Entrato il", value: member.joinedTimestamp ? formatDate(member.joinedTimestamp) : "-", inline: true },
        { name: "Ruoli", value: cut(member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.name).join(", ") || "-", 1024), inline: false }
      );

    await sendLog(client, logCh.memberLog, { embeds: [e] });
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    // Boost start/stop
    if (!oldMember.premiumSince && newMember.premiumSince) {
      const e = baseEmbed("🚀 BOOST INIZIATO", 0xff73fa)
        .setThumbnail(memberThumb(newMember))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false },
          { name: "Boost dal", value: formatDate(newMember.premiumSinceTimestamp || Date.now()), inline: true }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    if (oldMember.premiumSince && !newMember.premiumSince) {
      const e = baseEmbed("📉 BOOST RIMOSSO", 0x808080)
        .setThumbnail(memberThumb(newMember))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    // Nickname change
    if (oldMember.nickname !== newMember.nickname) {
      const e = baseEmbed("✏️ NICKNAME CAMBIATO", 0xfee75c)
        .setThumbnail(memberThumb(newMember))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false },
          { name: "Prima", value: cut(oldMember.nickname || "-"), inline: true },
          { name: "Dopo", value: cut(newMember.nickname || "-"), inline: true }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    // Roles added
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id) && r.id !== newMember.guild.id);
    if (addedRoles.size) {
      const e = baseEmbed("➕ RUOLI AGGIUNTI", 0x57f287)
        .setThumbnail(memberThumb(newMember))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false },
          { name: "Ruoli aggiunti", value: cut(addedRoles.map(r => `${r}`).join(", "), 1024), inline: false }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    // Roles removed
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id) && r.id !== newMember.guild.id);
    if (removedRoles.size) {
      const e = baseEmbed("➖ RUOLI RIMOSSI", 0xed4245)
        .setThumbnail(memberThumb(newMember))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false },
          { name: "Ruoli rimossi", value: cut(removedRoles.map(r => `${r}`).join(", "), 1024), inline: false }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    // Avatar change
    if (oldMember.user.avatar !== newMember.user.avatar) {
      const e = baseEmbed("🖼️ AVATAR CAMBIATO", 0x5865f2)
        .setThumbnail(userAvatar(newMember.user))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }
  });

  // =========================
  // MESSAGE LOGS
  // =========================

  client.on("messageDelete", async (message) => {
    if (!message.guild || !message.author || message.author.bot) return;

    const attachments = message.attachments?.size
      ? message.attachments.map(a => a.url).join("\n")
      : "-";

    const e = baseEmbed("🗑️ MESSAGGIO ELIMINATO", 0xed4245)
      .setThumbnail(userAvatar(message.author))
      .setImage(userAvatar(message.author))
      .addFields(
        { name: "Autore", value: `${message.author} \n${userTag(message.author)}`, inline: false },
        { name: "Canale", value: `${message.channel}`, inline: true },
        { name: "Messaggio ID", value: message.id, inline: true },
        { name: "Contenuto", value: cut(message.content || "Nessun testo", 1024), inline: false },
        { name: "Allegati", value: cut(attachments, 1024), inline: false }
      );

    await sendLog(client, logCh.messageLog, { embeds: [e] });
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!oldMessage.guild || !oldMessage.author || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const e = baseEmbed("✏️ MESSAGGIO MODIFICATO", 0xfee75c)
      .setThumbnail(userAvatar(oldMessage.author))
      .setImage(userAvatar(oldMessage.author))
      .addFields(
        { name: "Autore", value: `${oldMessage.author} \n${userTag(oldMessage.author)}`, inline: false },
        { name: "Canale", value: `${oldMessage.channel}`, inline: true },
        { name: "Link", value: newMessage.url || "-", inline: true },
        { name: "Prima", value: cut(oldMessage.content || "Nessun testo", 1024), inline: false },
        { name: "Dopo", value: cut(newMessage.content || "Nessun testo", 1024), inline: false }
      );

    await sendLog(client, logCh.messageLog, { embeds: [e] });
  });

  // =========================
  // VOICE LOGS
  // =========================

  client.on("voiceStateUpdate", async (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    // join
    if (!oldState.channelId && newState.channelId) {
      const e = baseEmbed("🔊 ENTRATO IN VOCALE", 0x57f287)
        .setThumbnail(memberThumb(member))
        .setImage(userAvatar(member.user))
        .addFields(
          { name: "Utente", value: `${member.user} \n${userTag(member.user)}`, inline: false },
          { name: "Canale", value: `${newState.channel}`, inline: true },
          { name: "Mute", value: formatBool(newState.selfMute), inline: true },
          { name: "Deaf", value: formatBool(newState.selfDeaf), inline: true },
          { name: "Streaming", value: formatBool(newState.streaming), inline: true },
          { name: "Video", value: formatBool(newState.selfVideo), inline: true }
        );

      return await sendLog(client, logCh.vcLog, { embeds: [e] });
    }

    // leave
    if (oldState.channelId && !newState.channelId) {
      const e = baseEmbed("📤 USCITO DALLA VOCALE", 0xed4245)
        .setThumbnail(memberThumb(member))
        .setImage(userAvatar(member.user))
        .addFields(
          { name: "Utente", value: `${member.user} \n${userTag(member.user)}`, inline: false },
          { name: "Canale", value: `${oldState.channel}`, inline: true }
        );

      return await sendLog(client, logCh.vcLog, { embeds: [e] });
    }

    // move
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const e = baseEmbed("🔁 SPOSTATO TRA VOCALI", 0x5865f2)
        .setThumbnail(memberThumb(member))
        .setImage(userAvatar(member.user))
        .addFields(
          { name: "Utente", value: `${member.user} \n${userTag(member.user)}`, inline: false },
          { name: "Da", value: `${oldState.channel}`, inline: true },
          { name: "A", value: `${newState.channel}`, inline: true }
        );

      return await sendLog(client, logCh.vcLog, { embeds: [e] });
    }

    // mute/deaf/stream/video updates
    const changes = [];

    if (oldState.selfMute !== newState.selfMute) {
      changes.push(`Self Mute: **${formatBool(oldState.selfMute)}** → **${formatBool(newState.selfMute)}**`);
    }
    if (oldState.selfDeaf !== newState.selfDeaf) {
      changes.push(`Self Deaf: **${formatBool(oldState.selfDeaf)}** → **${formatBool(newState.selfDeaf)}**`);
    }
    if (oldState.serverMute !== newState.serverMute) {
      changes.push(`Server Mute: **${formatBool(oldState.serverMute)}** → **${formatBool(newState.serverMute)}**`);
    }
    if (oldState.serverDeaf !== newState.serverDeaf) {
      changes.push(`Server Deaf: **${formatBool(oldState.serverDeaf)}** → **${formatBool(newState.serverDeaf)}**`);
    }
    if (oldState.streaming !== newState.streaming) {
      changes.push(`Streaming: **${formatBool(oldState.streaming)}** → **${formatBool(newState.streaming)}**`);
    }
    if (oldState.selfVideo !== newState.selfVideo) {
      changes.push(`Video: **${formatBool(oldState.selfVideo)}** → **${formatBool(newState.selfVideo)}**`);
    }

    if (changes.length) {
      const e = baseEmbed("⚙️ STATO VOCALE CAMBIATO", 0xfee75c)
        .setThumbnail(memberThumb(member))
        .setImage(userAvatar(member.user))
        .addFields(
          { name: "Utente", value: `${member.user} \n${userTag(member.user)}`, inline: false },
          { name: "Canale", value: `${newState.channel || oldState.channel || "-"}`, inline: false },
          { name: "Modifiche", value: cut(changes.join("\n"), 1024), inline: false }
        );

      return await sendLog(client, logCh.vcLog, { embeds: [e] });
    }
  });

  // =========================
  // MOD LOGS
  // =========================

  client.on("guildBanAdd", async (ban) => {
    const audit = await getLastAudit(
      ban.guild,
      AuditLogEvent.MemberBanAdd,
      (e) => e.target?.id === ban.user.id
    );

    const e = baseEmbed("🔨 UTENTE BANNATO", 0x8b0000)
      .setThumbnail(userAvatar(ban.user))
      .setImage(userAvatar(ban.user))
      .addFields(
        { name: "Utente", value: `${ban.user} \n${userTag(ban.user)}`, inline: false },
        { name: "Moderatore", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Motivo", value: cut(audit?.reason || "Nessun motivo"), inline: false }
      );

    await sendLog(client, logCh.modLog, { embeds: [e] });
  });

  client.on("guildBanRemove", async (ban) => {
    const audit = await getLastAudit(
      ban.guild,
      AuditLogEvent.MemberBanRemove,
      (e) => e.target?.id === ban.user.id
    );

    const e = baseEmbed("🔓 UTENTE SBANNATO", 0x57f287)
      .setThumbnail(userAvatar(ban.user))
      .setImage(userAvatar(ban.user))
      .addFields(
        { name: "Utente", value: `${ban.user} \n${userTag(ban.user)}`, inline: false },
        { name: "Moderatore", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Motivo", value: cut(audit?.reason || "Nessun motivo"), inline: false }
      );

    await sendLog(client, logCh.modLog, { embeds: [e] });
  });

  // timeout / untimeout / kick
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
      const isTimedOut = !!newMember.communicationDisabledUntilTimestamp;

      const audit = await getLastAudit(
        newMember.guild,
        AuditLogEvent.MemberUpdate,
        (entry) => entry.target?.id === newMember.id
      );

      const e = baseEmbed(isTimedOut ? "⏳ TIMEOUT APPLICATO" : "✅ TIMEOUT RIMOSSO", isTimedOut ? 0xffa500 : 0x57f287)
        .setThumbnail(memberThumb(newMember))
        .setImage(userAvatar(newMember.user))
        .addFields(
          { name: "Utente", value: `${newMember.user} \n${userTag(newMember.user)}`, inline: false },
          { name: "Moderatore", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
          { name: "Scadenza", value: isTimedOut ? formatDate(newMember.communicationDisabledUntilTimestamp) : "-", inline: true },
          { name: "Motivo", value: cut(audit?.reason || "Nessun motivo"), inline: false }
        );

      await sendLog(client, logCh.modLog, { embeds: [e] });
    }
  });

  client.on("guildMemberRemove", async (member) => {
    const audit = await getLastAudit(
      member.guild,
      AuditLogEvent.MemberKick,
      (entry) => entry.target?.id === member.id
    );

    if (!audit) return;

    const now = Date.now();
    const created = audit.createdTimestamp || 0;
    if (now - created > 5000) return;

    const e = baseEmbed("👢 UTENTE KICKATO", 0xffa500)
      .setThumbnail(memberThumb(member))
      .setImage(userAvatar(member.user))
      .addFields(
        { name: "Utente", value: `${member.user?.tag || "-"} (${member.id})`, inline: false },
        { name: "Moderatore", value: audit.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Motivo", value: cut(audit.reason || "Nessun motivo"), inline: false }
      );

    await sendLog(client, logCh.modLog, { embeds: [e] });
  });

  // =========================
  // INVITE LOGS
  // =========================

  client.on("inviteCreate", async (invite) => {
    const e = baseEmbed("🔗 INVITO CREATO", 0x57f287)
      .addFields(
        { name: "Codice", value: cut(invite.code), inline: true },
        { name: "Canale", value: invite.channel ? `${invite.channel}` : "-", inline: true },
        { name: "Creato da", value: invite.inviter ? `${invite.inviter} \n${userTag(invite.inviter)}` : "-", inline: false },
        { name: "Max usi", value: String(invite.maxUses ?? "-"), inline: true },
        { name: "Scade", value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : "Mai", inline: true },
        { name: "Temporary", value: formatBool(invite.temporary ?? false), inline: true }
      );

    if (invite.inviter) {
      e.setThumbnail(userAvatar(invite.inviter)).setImage(userAvatar(invite.inviter));
    }

    await sendLog(client, logCh.inviteLog, { embeds: [e] });
  });

  client.on("inviteDelete", async (invite) => {
    const e = baseEmbed("🗑️ INVITO ELIMINATO", 0xed4245)
      .addFields(
        { name: "Codice", value: cut(invite.code), inline: true },
        { name: "Canale", value: invite.channel ? `${invite.channel}` : "-", inline: true }
      );

    await sendLog(client, logCh.inviteLog, { embeds: [e] });
  });

  // =========================
  // SERVER LOGS
  // =========================

  client.on("channelCreate", async (channel) => {
    const audit = await getLastAudit(
      channel.guild,
      AuditLogEvent.ChannelCreate,
      (e) => e.target?.id === channel.id
    );

    const e = baseEmbed("📁 CANALE CREATO", 0x57f287)
      .addFields(
        { name: "Canale", value: `${channel} (${channel.name})`, inline: false },
        { name: "ID", value: channel.id, inline: true },
        { name: "Tipo", value: String(channel.type), inline: true },
        { name: "Creato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("channelDelete", async (channel) => {
    const audit = await getLastAudit(
      channel.guild,
      AuditLogEvent.ChannelDelete,
      (e) => e.target?.id === channel.id
    );

    const e = baseEmbed("🗑️ CANALE ELIMINATO", 0xed4245)
      .addFields(
        { name: "Nome", value: channel.name || "-", inline: true },
        { name: "ID", value: channel.id, inline: true },
        { name: "Tipo", value: String(channel.type), inline: true },
        { name: "Eliminato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("channelUpdate", async (oldChannel, newChannel) => {
    const changes = [];

    if (oldChannel.name !== newChannel.name) {
      changes.push(`Nome: **${oldChannel.name}** → **${newChannel.name}**`);
    }

    if ("topic" in oldChannel && oldChannel.topic !== newChannel.topic) {
      changes.push(`Topic:\n**Prima:** ${cut(oldChannel.topic || "-", 300)}\n**Dopo:** ${cut(newChannel.topic || "-", 300)}`);
    }

    if ("nsfw" in oldChannel && oldChannel.nsfw !== newChannel.nsfw) {
      changes.push(`NSFW: **${formatBool(oldChannel.nsfw)}** → **${formatBool(newChannel.nsfw)}**`);
    }

    if ("rateLimitPerUser" in oldChannel && oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push(`Slowmode: **${oldChannel.rateLimitPerUser || 0}s** → **${newChannel.rateLimitPerUser || 0}s**`);
    }

    if (!changes.length) return;

    const audit = await getLastAudit(
      newChannel.guild,
      AuditLogEvent.ChannelUpdate,
      (e) => e.target?.id === newChannel.id
    );

    const e = baseEmbed("⚙️ CANALE MODIFICATO", 0xfee75c)
      .addFields(
        { name: "Canale", value: `${newChannel}`, inline: false },
        { name: "Modificato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Modifiche", value: cut(changes.join("\n\n"), 1024), inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("roleCreate", async (role) => {
    const audit = await getLastAudit(
      role.guild,
      AuditLogEvent.RoleCreate,
      (e) => e.target?.id === role.id
    );

    const e = baseEmbed("🎭 RUOLO CREATO", 0x57f287)
      .addFields(
        { name: "Ruolo", value: `${role} (${role.name})`, inline: false },
        { name: "ID", value: role.id, inline: true },
        { name: "Colore", value: role.hexColor || "-", inline: true },
        { name: "Creato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Permessi", value: formatPerms(role.permissions), inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("roleDelete", async (role) => {
    const audit = await getLastAudit(
      role.guild,
      AuditLogEvent.RoleDelete,
      (e) => e.target?.id === role.id
    );

    const e = baseEmbed("🗑️ RUOLO ELIMINATO", 0xed4245)
      .addFields(
        { name: "Nome", value: role.name || "-", inline: true },
        { name: "ID", value: role.id, inline: true },
        { name: "Eliminato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("roleUpdate", async (oldRole, newRole) => {
    const changes = [];

    if (oldRole.name !== newRole.name) {
      changes.push(`Nome: **${oldRole.name}** → **${newRole.name}**`);
    }
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`Colore: **${oldRole.hexColor}** → **${newRole.hexColor}**`);
    }
    if (oldRole.hoist !== newRole.hoist) {
      changes.push(`Mostrato separatamente: **${formatBool(oldRole.hoist)}** → **${formatBool(newRole.hoist)}**`);
    }
    if (oldRole.mentionable !== newRole.mentionable) {
      changes.push(`Menzionabile: **${formatBool(oldRole.mentionable)}** → **${formatBool(newRole.mentionable)}**`);
    }

    if (!changes.length) return;

    const audit = await getLastAudit(
      newRole.guild,
      AuditLogEvent.RoleUpdate,
      (e) => e.target?.id === newRole.id
    );

    const e = baseEmbed("⚙️ RUOLO MODIFICATO", 0xfee75c)
      .addFields(
        { name: "Ruolo", value: `${newRole} (${newRole.name})`, inline: false },
        { name: "Modificato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Modifiche", value: cut(changes.join("\n"), 1024), inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("guildUpdate", async (oldGuild, newGuild) => {
    const changes = [];

    if (oldGuild.name !== newGuild.name) {
      changes.push(`Nome: **${oldGuild.name}** → **${newGuild.name}**`);
    }
    if (oldGuild.icon !== newGuild.icon) {
      changes.push(`Icona server cambiata`);
    }
    if (oldGuild.banner !== newGuild.banner) {
      changes.push(`Banner server cambiato`);
    }
    if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
      changes.push(`Livello verifica: **${oldGuild.verificationLevel}** → **${newGuild.verificationLevel}**`);
    }

    if (!changes.length) return;

    const audit = await getLastAudit(
      newGuild,
      AuditLogEvent.GuildUpdate
    );

    const e = baseEmbed("🛠️ SERVER MODIFICATO", 0x5865f2)
      .setThumbnail(newGuild.iconURL({ dynamic: true, size: 1024 }))
      .setImage(newGuild.bannerURL({ size: 1024 }) || newGuild.iconURL({ dynamic: true, size: 1024 }) || null)
      .addFields(
        { name: "Server", value: `${newGuild.name} (${newGuild.id})`, inline: false },
        { name: "Modificato da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false },
        { name: "Modifiche", value: cut(changes.join("\n"), 1024), inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("emojiCreate", async (emoji) => {
    const audit = await getLastAudit(
      emoji.guild,
      AuditLogEvent.EmojiCreate
    );

    const e = baseEmbed("😀 EMOJI CREATA", 0x57f287)
      .setThumbnail(emoji.imageURL())
      .setImage(emoji.imageURL())
      .addFields(
        { name: "Emoji", value: `${emoji}`, inline: true },
        { name: "Nome", value: emoji.name || "-", inline: true },
        { name: "Creata da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("emojiDelete", async (emoji) => {
    const audit = await getLastAudit(
      emoji.guild,
      AuditLogEvent.EmojiDelete
    );

    const e = baseEmbed("🗑️ EMOJI ELIMINATA", 0xed4245)
      .addFields(
        { name: "Nome", value: emoji.name || "-", inline: true },
        { name: "ID", value: emoji.id || "-", inline: true },
        { name: "Eliminata da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("emojiUpdate", async (oldEmoji, newEmoji) => {
    if (oldEmoji.name === newEmoji.name) return;

    const audit = await getLastAudit(
      newEmoji.guild,
      AuditLogEvent.EmojiUpdate
    );

    const e = baseEmbed("⚙️ EMOJI MODIFICATA", 0xfee75c)
      .setThumbnail(newEmoji.imageURL())
      .setImage(newEmoji.imageURL())
      .addFields(
        { name: "Prima", value: oldEmoji.name || "-", inline: true },
        { name: "Dopo", value: newEmoji.name || "-", inline: true },
        { name: "Modificata da", value: audit?.executor ? `${audit.executor} \n${userTag(audit.executor)}` : "-", inline: false }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });
};
