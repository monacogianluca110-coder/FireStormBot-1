const {
  Events,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const discordTranscripts = require("discord-html-transcripts");

const {
  PANEL_CHANNEL_ID,
  LOG_CHANNEL_ID,
  STAFF_ROLE_ID,
  TYPES
} = require("../config/tickets");

function sanitizeName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);
}

function makeTopic(data) {
  return [
    `ticket=true`,
    `owner=${data.owner}`,
    `type=${data.type}`,
    `claimedBy=${data.claimedBy || "none"}`,
    `createdAt=${Date.now()}`
  ].join(";");
}

function parseTopic(topic = "") {
  const parts = topic.split(";");
  const out = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value !== undefined) out[key] = value;
  }
  return out;
}

function isStaff(member) {
  return member.roles.cache.has(STAFF_ROLE_ID) || member.permissions.has(PermissionsBitField.Flags.Administrator);
}

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (!interaction.inGuild()) return;

    try {
      // APRI TICKET
      if (interaction.isButton() && interaction.customId.startsWith("ticket_open_")) {
        const typeKey = interaction.customId.replace("ticket_open_", "");
        const typeData = TYPES[typeKey];
        if (!typeData) return;

        const panelChannel = await interaction.client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
        if (!panelChannel) {
          return interaction.reply({
            content: "❌ Canale pannello ticket non trovato.",
            ephemeral: true
          });
        }

        const parentId = panelChannel.parentId || null;

        const existing = interaction.guild.channels.cache.find(
          ch =>
            ch.type === ChannelType.GuildText &&
            ch.topic &&
            ch.topic.includes("ticket=true") &&
            ch.topic.includes(`owner=${interaction.user.id}`)
        );

        if (existing) {
          return interaction.reply({
            content: `❌ Hai già un ticket aperto: ${existing}`,
            ephemeral: true
          });
        }

        const baseName = sanitizeName(interaction.user.username);
        const channelName = `ticket-${typeData.name}-${baseName}`;

        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: parentId,
          topic: makeTopic({
            owner: interaction.user.id,
            type: typeKey,
            claimedBy: "none"
          }),
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
              ]
            },
            {
              id: STAFF_ROLE_ID,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ManageChannels
              ]
            },
            {
              id: interaction.client.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageMessages
              ]
            }
          ]
        });

        // prova a metterlo in basso nella categoria del pannello
        try {
          const siblings = interaction.guild.channels.cache
            .filter(ch => ch.parentId === parentId)
            .sort((a, b) => a.rawPosition - b.rawPosition);

          const lastPos = siblings.last()?.rawPosition ?? ticketChannel.rawPosition;
          await ticketChannel.setPosition(lastPos + 1).catch(() => null);
        } catch {}

        const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 1024 });

        const ticketEmbed = new EmbedBuilder()
          .setTitle(`${typeData.emoji} Ticket ${typeData.label}`)
          .setDescription(
            [
              `Ciao ${interaction.user}, il tuo ticket è stato creato con successo.`,
              "",
              `**Categoria:** ${typeData.label}`,
              `**Creato da:** ${interaction.user}`,
              "",
              `Un membro dello staff ti assisterà il prima possibile.`,
              "",
              `Usa i pulsanti qui sotto per gestire il ticket.`
            ].join("\n")
          )
          .setColor(
            typeKey === "supporto"
              ? 0x3498db
              : typeKey === "partnership"
              ? 0xf1c40f
              : 0xe74c3c
          )
          .setThumbnail(guildIcon)
          .setFooter({
            text: `${interaction.guild.name} • Ticket ${typeData.label}`,
            iconURL: guildIcon || undefined
          })
          .setTimestamp();

        const controls = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket_claim")
            .setLabel("Claim")
            .setEmoji("🛠️")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Chiudi")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `<@&${STAFF_ROLE_ID}> ${interaction.user}`,
          allowedMentions: {
            roles: [STAFF_ROLE_ID],
            users: [interaction.user.id]
          },
          embeds: [ticketEmbed],
          components: [controls]
        });

        const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🎫 Ticket Aperto")
            .addFields(
              { name: "Utente", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
              { name: "Categoria", value: typeData.label, inline: true },
              { name: "Canale", value: `${ticketChannel}`, inline: true }
            )
            .setColor(0x57f287)
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
        }

        return interaction.reply({
          content: `✅ Ticket creato: ${ticketChannel}`,
          ephemeral: true
        });
      }

      // CLAIM
      if (interaction.isButton() && interaction.customId === "ticket_claim") {
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) return;

        const data = parseTopic(channel.topic || "");
        if (data.ticket !== "true") return;

        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: "❌ Solo lo staff può claimare un ticket.",
            ephemeral: true
          });
        }

        if (data.claimedBy && data.claimedBy !== "none") {
          return interaction.reply({
            content: `❌ Questo ticket è già stato claimato da <@${data.claimedBy}>.`,
            ephemeral: true
          });
        }

        data.claimedBy = interaction.user.id;
        await channel.setTopic(
          makeTopic({
            owner: data.owner,
            type: data.type,
            claimedBy: data.claimedBy
          })
        );

        const embed = new EmbedBuilder()
          .setTitle("🛠️ Ticket Claimato")
          .setDescription(`${interaction.user} ha preso in carico questo ticket.`)
          .setColor(0xf1c40f)
          .setTimestamp();

        await channel.send({ embeds: [embed] });

        const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("🛠️ Ticket Claimato")
            .addFields(
              { name: "Staff", value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
              { name: "Canale", value: `${channel}`, inline: true },
              { name: "Categoria", value: TYPES[data.type]?.label || data.type, inline: true }
            )
            .setColor(0xf1c40f)
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] }).catch(() => null);
        }

        return interaction.reply({
          content: "✅ Ticket claimato con successo.",
          ephemeral: true
        });
      }

      // CLOSE
      if (interaction.isButton() && interaction.customId === "ticket_close") {
        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) return;

        const data = parseTopic(channel.topic || "");
        if (data.ticket !== "true") return;

        const ownerId = data.owner;
        const userIsOwner = interaction.user.id === ownerId;
        const userIsStaff = isStaff(interaction.member);

        if (!userIsOwner && !userIsStaff) {
          return interaction.reply({
            content: "❌ Può chiudere il ticket solo il creatore o lo staff.",
            ephemeral: true
          });
        }

        await interaction.reply({
          content: "🔒 Chiusura ticket in corso... sto generando il transcript.",
          ephemeral: true
        });

        const transcript = await discordTranscripts.createTranscript(channel, {
          limit: -1,
          returnType: "attachment",
          filename: `${channel.name}-transcript.html`,
          saveImages: true,
          poweredBy: false
        });

        const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

        if (logChannel) {
          const closer = interaction.user;
          const claimedText =
            data.claimedBy && data.claimedBy !== "none"
              ? `<@${data.claimedBy}> (\`${data.claimedBy}\`)`
              : "Nessuno";

          const ownerText = ownerId ? `<@${ownerId}> (\`${ownerId}\`)` : "Sconosciuto";

          const logEmbed = new EmbedBuilder()
            .setTitle("📁 Ticket Chiuso")
            .addFields(
              { name: "Creato da", value: ownerText, inline: true },
              { name: "Categoria", value: TYPES[data.type]?.label || data.type, inline: true },
              { name: "Chiuso da", value: `${closer} (\`${closer.id}\`)`, inline: true },
              { name: "Claimato da", value: claimedText, inline: false },
              { name: "Canale", value: `#${channel.name}`, inline: false }
            )
            .setColor(0xed4245)
            .setTimestamp();

          await logChannel.send({
            embeds: [logEmbed],
            files: [transcript]
          }).catch(() => null);
        }

        const closingEmbed = new EmbedBuilder()
          .setTitle("🔒 Ticket Chiuso")
          .setDescription("Questo ticket verrà eliminato tra 5 secondi.")
          .setColor(0xed4245)
          .setTimestamp();

        await channel.send({ embeds: [closingEmbed] }).catch(() => null);

        setTimeout(async () => {
          await channel.delete("Ticket chiuso con transcript salvato").catch(() => null);
        }, 5000);
      }
    } catch (err) {
      console.error("[TICKET SYSTEM ERROR]", err);

      if (interaction.deferred || interaction.replied) return;
      return interaction.reply({
        content: "❌ C'è stato un errore nel sistema ticket.",
        ephemeral: true
      }).catch(() => null);
    }
  }
};
