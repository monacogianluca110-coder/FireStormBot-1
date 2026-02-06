const {
  AuditLogEvent,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

const logCh = require("../config/logChannels");
const { sendLog, baseEmbed, cut } = require("../utils/logger");

// --- Piccola cache inviti per capire "da che invite è entrato"
const invitesCache = new Map(); // guildId -> Map(code -> uses)

async function refreshInvites(guild) {
  try {
    const me = guild.members.me;
    if (!me) return;
    if (!me.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

    const invites = await guild.invites.fetch().catch(() => null);
    if (!invites) return;

    const map = new Map();
    invites.forEach((i) => map.set(i.code, i.uses ?? 0));
    invitesCache.set(guild.id, map);
  } catch {}
}

async function findUsedInvite(guild) {
  try {
    const oldMap = invitesCache.get(guild.id) || new Map();
    const invites = await guild.invites.fetch().catch(() => null);
    if (!invites) return null;

    let used = null;
    const newMap = new Map();
    invites.forEach((i) => {
      const newUses = i.uses ?? 0;
      const oldUses = oldMap.get(i.code) ?? 0;
      if (newUses > oldUses) used = i;
      newMap.set(i.code, newUses);
    });

    invitesCache.set(guild.id, newMap);
    return used;
  } catch {
    return null;
  }
}

async function getLastAudit(guild, type, predicate) {
  try {
    const me = guild.members.me;
    if (!me) return null;
    if (!me.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return null;

    const logs = await guild.fetchAuditLogs({ limit: 6, type }).catch(() => null);
    if (!logs) return null;

    const entry = logs.entries.find((e) => (predicate ? predicate(e) : true));
    return entry || null;
  } catch {
    return null;
  }
}

module.exports = (client) => {
  // ---------- READY: prepara cache inviti
  client.on("ready", async () => {
    for (const [, guild] of client.guilds.cache) {
      await refreshInvites(guild);
    }
  });

  client.on("guildCreate", async (guild) => refreshInvites(guild));

  // ---------- INVITE CREATE/DELETE (invite-logs)
  client.on("inviteCreate", async (invite) => {
    const e = baseEmbed("🔗 INVITE CREATO")
      .addFields(
        { name: "Codice", value: cut(invite.code, 1024), inline: true },
        { name: "Canale", value: invite.channel ? `<#${invite.channel.id}>` : "—", inline: true },
        { name: "Creato da", value: invite.inviter ? `${invite.inviter} \`(${invite.inviter.id})\`` : "—" },
        { name: "Max uses", value: String(invite.maxUses ?? "—"), inline: true },
        { name: "Expires", value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime()/1000)}:R>` : "Mai", inline: true },
        { name: "Temporary", value: String(invite.temporary ?? false), inline: true }
      );

    await sendLog(client, logCh.inviteLog, { embeds: [e] });
    await refreshInvites(invite.guild);
  });

  client.on("inviteDelete", async (invite) => {
    const e = baseEmbed("🗑️ INVITE ELIMINATO")
      .addFields(
        { name: "Codice", value: cut(invite.code, 1024), inline: true },
        { name: "Canale", value: invite.channel ? `<#${invite.channel.id}>` : "—", inline: true }
      );

    await sendLog(client, logCh.inviteLog, { embeds: [e] });
    await refreshInvites(invite.guild);
  });

  // ---------- MEMBER JOIN (registro-dei-membri + invite-logs)
  client.on("guildMemberAdd", async (member) => {
    const usedInvite = await findUsedInvite(member.guild);

    const createdTs = Math.floor(member.user.createdTimestamp / 1000);
    const joinedTs = Math.floor(Date.now() / 1000);

    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .map((r) => `<@&${r.id}>`)
      .slice(0, 25);

    const e = baseEmbed("👤 NUOVO MEMBRO ENTRATO")
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utente", value: `${member.user} \`(${member.user.id})\`` },
        { name: "Username", value: cut(member.user.tag ?? member.user.username), inline: true },
        { name: "Account creato", value: `<t:${createdTs}:F> • <t:${createdTs}:R>`, inline: false },
        { name: "Entrato", value: `<t:${joinedTs}:F>`, inline: false },
        { name: "Bot?", value: String(member.user.bot), inline: true },
        { name: "Ruoli iniziali", value: roles.length ? roles.join(" ") : "—" }
      );

    await sendLog(client, logCh.memberLog, { embeds: [e] });

    // Invito usato -> in invite-logs
    const ie = baseEmbed("📌 INVITE USATO (JOIN)")
      .addFields(
        { name: "Membro", value: `${member.user} \`(${member.user.id})\`` },
        { name: "Codice", value: usedInvite ? cut(usedInvite.code) : "Non rilevabile", inline: true },
        { name: "Creato da", value: usedInvite?.inviter ? `${usedInvite.inviter} \`(${usedInvite.inviter.id})\`` : "—", inline: true },
        { name: "Canale", value: usedInvite?.channel ? `<#${usedInvite.channel.id}>` : "—", inline: true },
        { name: "Uses", value: usedInvite ? String(usedInvite.uses ?? "—") : "—", inline: true }
      );

    await sendLog(client, logCh.inviteLog, { embeds: [ie] });
  });

  // ---------- MEMBER LEAVE (registro-dei-membri)
  client.on("guildMemberRemove", async (member) => {
    const e = baseEmbed("🚪 MEMBRO USCITO")
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utente", value: `${member.user} \`(${member.user.id})\`` },
        { name: "Bot?", value: String(member.user.bot), inline: true }
      );

    await sendLog(client, logCh.memberLog, { embeds: [e] });
  });

  // ---------- MEMBER UPDATE (nickname/ruoli) -> registro-dei-membri
  client.on("guildMemberUpdate", async (oldM, newM) => {
    if (oldM.nickname !== newM.nickname) {
      const e = baseEmbed("📝 NICKNAME CAMBIATO")
        .addFields(
          { name: "Utente", value: `${newM.user} \`(${newM.user.id})\`` },
          { name: "Prima", value: cut(oldM.nickname ?? oldM.user.username), inline: true },
          { name: "Dopo", value: cut(newM.nickname ?? newM.user.username), inline: true }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    // ruoli
    const oldRoles = new Set(oldM.roles.cache.keys());
    const newRoles = new Set(newM.roles.cache.keys());

    const added = [...newRoles].filter((id) => !oldRoles.has(id) && id !== newM.guild.id);
    const removed = [...oldRoles].filter((id) => !newRoles.has(id) && id !== newM.guild.id);

    if (added.length || removed.length) {
      const e = baseEmbed("🎭 RUOLI MODIFICATI")
        .addFields(
          { name: "Utente", value: `${newM.user} \`(${newM.user.id})\`` },
          { name: "Aggiunti", value: added.length ? added.map((id) => `<@&${id}>`).join(" ") : "—" },
          { name: "Rimossi", value: removed.length ? removed.map((id) => `<@&${id}>`).join(" ") : "—" }
        );

      await sendLog(client, logCh.memberLog, { embeds: [e] });
    }

    // timeout (communication disabled) -> mod-log
    if (oldM.communicationDisabledUntilTimestamp !== newM.communicationDisabledUntilTimestamp) {
      const until = newM.communicationDisabledUntilTimestamp
        ? `<t:${Math.floor(newM.communicationDisabledUntilTimestamp / 1000)}:F> • <t:${Math.floor(newM.communicationDisabledUntilTimestamp / 1000)}:R>`
        : "Rimosso";

      const audit = await getLastAudit(newM.guild, AuditLogEvent.MemberUpdate, (e) => e.target?.id === newM.id);
      const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
      const reason = audit?.reason ? cut(audit.reason, 1024) : "—";

      const e = baseEmbed("⏳ TIMEOUT / MUTE")
        .addFields(
          { name: "Utente", value: `${newM.user} \`(${newM.user.id})\`` },
          { name: "Staff", value: moderator },
          { name: "Fino a", value: until },
          { name: "Motivo", value: reason }
        );

      await sendLog(client, logCh.modLog, { embeds: [e] });
    }
  });

  // ---------- MESSAGE DELETE/UPDATE (mess-log)
  client.on("messageDelete", async (msg) => {
    if (!msg.guild) return;
    const author = msg.author ? `${msg.author} \`(${msg.author.id})\`` : "Sconosciuto (partial)";
    const content = msg.content ? cut(msg.content, 3500) : "—";
    const attachments = [...(msg.attachments?.values?.() ?? [])].map((a) => a.url);

    const e = baseEmbed("🗑️ MESSAGGIO ELIMINATO")
      .addFields(
        { name: "Autore", value: author },
        { name: "Canale", value: msg.channel ? `<#${msg.channel.id}>` : "—", inline: true },
        { name: "Message ID", value: cut(msg.id), inline: true },
        { name: "Contenuto", value: content }
      );

    if (attachments.length) e.addFields({ name: "Allegati", value: cut(attachments.join("\n"), 1024) });

    await sendLog(client, logCh.messageLog, { embeds: [e] });
  });

  client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (!newMsg.guild) return;
    if (oldMsg.content === newMsg.content) return;

    const author = newMsg.author ? `${newMsg.author} \`(${newMsg.author.id})\`` : "Sconosciuto (partial)";
    const before = oldMsg.content ? cut(oldMsg.content, 1700) : "—";
    const after = newMsg.content ? cut(newMsg.content, 1700) : "—";

    const e = baseEmbed("✏️ MESSAGGIO MODIFICATO")
      .addFields(
        { name: "Autore", value: author },
        { name: "Canale", value: `<#${newMsg.channel.id}>`, inline: true },
        { name: "Link", value: `[Vai al messaggio](https://discord.com/channels/${newMsg.guild.id}/${newMsg.channel.id}/${newMsg.id})`, inline: true },
        { name: "Prima", value: before },
        { name: "Dopo", value: after }
      );

    await sendLog(client, logCh.messageLog, { embeds: [e] });
  });

  // ---------- VC LOGS (vc-logs)
  client.on("voiceStateUpdate", async (oldS, newS) => {
    if (!newS.guild) return;
    const user = newS.member?.user || oldS.member?.user;
    if (!user) return;

    const uid = user.id;
    const who = `${user} \`(${uid})\``;

    // join/leave/move
    if (oldS.channelId !== newS.channelId) {
      const e = baseEmbed("🎙️ VOICE UPDATE")
        .addFields(
          { name: "Utente", value: who },
          { name: "Prima", value: oldS.channelId ? `<#${oldS.channelId}>` : "—", inline: true },
          { name: "Dopo", value: newS.channelId ? `<#${newS.channelId}>` : "—", inline: true }
        );

      await sendLog(client, logCh.vcLog, { embeds: [e] });
      return;
    }

    // toggles (mute/deaf/stream/cam)
    const changes = [];
    if (oldS.selfMute !== newS.selfMute) changes.push(`selfMute: ${oldS.selfMute} → ${newS.selfMute}`);
    if (oldS.selfDeaf !== newS.selfDeaf) changes.push(`selfDeaf: ${oldS.selfDeaf} → ${newS.selfDeaf}`);
    if (oldS.streaming !== newS.streaming) changes.push(`streaming: ${oldS.streaming} → ${newS.streaming}`);
    if (oldS.selfVideo !== newS.selfVideo) changes.push(`camera: ${oldS.selfVideo} → ${newS.selfVideo}`);

    // server mute/deaf (moderation) -> prova audit log
    const modChanges = [];
    if (oldS.serverMute !== newS.serverMute) modChanges.push(`serverMute: ${oldS.serverMute} → ${newS.serverMute}`);
    if (oldS.serverDeaf !== newS.serverDeaf) modChanges.push(`serverDeaf: ${oldS.serverDeaf} → ${newS.serverDeaf}`);

    if (changes.length || modChanges.length) {
      let moderator = "—";
      let reason = "—";

      if (modChanges.length) {
        const audit = await getLastAudit(newS.guild, AuditLogEvent.MemberUpdate, (e) => e.target?.id === uid);
        moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
        reason = audit?.reason ? cut(audit.reason, 1024) : "—";
      }

      const e = baseEmbed("🎛️ VC DETTAGLI")
        .addFields(
          { name: "Utente", value: who },
          { name: "Canale", value: newS.channelId ? `<#${newS.channelId}>` : "—", inline: true },
          { name: "User changes", value: changes.length ? cut(changes.join("\n"), 1024) : "—" },
          { name: "Mod changes", value: modChanges.length ? cut(modChanges.join("\n"), 1024) : "—" },
          { name: "Staff (se mod)", value: moderator },
          { name: "Motivo (se mod)", value: reason }
        );

      await sendLog(client, logCh.vcLog, { embeds: [e] });
    }
  });

  // ---------- MOD LOGS (ban/kick) via audit logs
  client.on("guildBanAdd", async (ban) => {
    const audit = await getLastAudit(ban.guild, AuditLogEvent.MemberBanAdd, (e) => e.target?.id === ban.user.id);
    const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
    const reason = audit?.reason ? cut(audit.reason, 1024) : "—";

    const e = baseEmbed("⛔ BAN")
      .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utente", value: `${ban.user} \`(${ban.user.id})\`` },
        { name: "Staff", value: moderator },
        { name: "Motivo", value: reason }
      );

    await sendLog(client, logCh.modLog, { embeds: [e] });
  });

  client.on("guildBanRemove", async (ban) => {
    const audit = await getLastAudit(ban.guild, AuditLogEvent.MemberBanRemove, (e) => e.target?.id === ban.user.id);
    const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
    const reason = audit?.reason ? cut(audit.reason, 1024) : "—";

    const e = baseEmbed("✅ UNBAN")
      .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utente", value: `${ban.user} \`(${ban.user.id})\`` },
        { name: "Staff", value: moderator },
        { name: "Motivo", value: reason }
      );

    await sendLog(client, logCh.modLog, { embeds: [e] });
  });

  // ---------- SERVER LOGS (ruoli/canali/webhooks ecc) - “tutto in generale”
  client.on("channelCreate", async (ch) => {
    if (!ch.guild) return;
    const audit = await getLastAudit(ch.guild, AuditLogEvent.ChannelCreate, (e) => e.target?.id === ch.id);
    const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
    const reason = audit?.reason ? cut(audit.reason, 1024) : "—";

    const e = baseEmbed("📁 CANALE CREATO")
      .addFields(
        { name: "Canale", value: `<#${ch.id}> \`(${ch.id})\`` },
        { name: "Tipo", value: String(ch.type), inline: true },
        { name: "Staff", value: moderator, inline: false },
        { name: "Motivo", value: reason }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("channelDelete", async (ch) => {
    if (!ch.guild) return;
    const audit = await getLastAudit(ch.guild, AuditLogEvent.ChannelDelete, (e) => e.target?.id === ch.id);
    const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
    const reason = audit?.reason ? cut(audit.reason, 1024) : "—";

    const e = baseEmbed("🗑️ CANALE ELIMINATO")
      .addFields(
        { name: "Nome", value: cut(ch.name), inline: true },
        { name: "ID", value: cut(ch.id), inline: true },
        { name: "Tipo", value: String(ch.type), inline: true },
        { name: "Staff", value: moderator },
        { name: "Motivo", value: reason }
      );

    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("roleCreate", async (role) => {
    const audit = await getLastAudit(role.guild, AuditLogEvent.RoleCreate, (e) => e.target?.id === role.id);
    const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
    const e = baseEmbed("🧩 RUOLO CREATO")
      .addFields(
        { name: "Ruolo", value: `<@&${role.id}> \`(${role.id})\`` },
        { name: "Staff", value: moderator }
      );
    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  client.on("roleDelete", async (role) => {
    const audit = await getLastAudit(role.guild, AuditLogEvent.RoleDelete, (e) => e.target?.id === role.id);
    const moderator = audit?.executor ? `${audit.executor} \`(${audit.executor.id})\`` : "—";
    const e = baseEmbed("🗑️ RUOLO ELIMINATO")
      .addFields(
        { name: "Nome", value: cut(role.name), inline: true },
        { name: "ID", value: cut(role.id), inline: true },
        { name: "Staff", value: moderator }
      );
    await sendLog(client, logCh.serverLog, { embeds: [e] });
  });

  // ---------- “POTERI”: logga OGNI comando slash usato (mod-log)
  // (Questo ti logga chi ha usato cosa e con quali opzioni.)
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;

    const opts = interaction.options?.data?.map((o) => {
      const v = o.value ?? (o.user ? `${o.user.tag} (${o.user.id})` : o.role ? `${o.role.name} (${o.role.id})` : o.channel ? `${o.channel.name} (${o.channel.id})` : "—");
      return `• **${o.name}**: ${cut(v, 200)}`;
    }) ?? [];

    const e = baseEmbed("⚡ POTERE USATO (COMANDO)")
      .addFields(
        { name: "Comando", value: `\`/${interaction.commandName}\`` },
        { name: "Staff", value: `${interaction.user} \`(${interaction.user.id})\`` },
        { name: "Canale", value: interaction.channelId ? `<#${interaction.channelId}>` : "—", inline: true },
        { name: "Dettagli", value: opts.length ? cut(opts.join("\n"), 1024) : "Nessuna opzione" }
      );

    await sendLog(client, logCh.modLog, { embeds: [e] });
  });
};
