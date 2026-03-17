const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { PANEL_CHANNEL_ID, TYPES } = require("../../config/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Invia il pannello ticket professionale")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const channel = await interaction.client.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);

    if (!channel) {
      return interaction.reply({
        content: "❌ Canale pannello ticket non trovato.",
        ephemeral: true
      });
    }

    const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Sistema Ticket")
      .setDescription(
        [
          "Benvenuto nel **centro assistenza** del server.",
          "",
          "Seleziona qui sotto il tipo di ticket che desideri aprire.",
          "Ogni richiesta verrà gestita dal nostro staff il prima possibile.",
          "",
          `🔵 **${TYPES.supporto.label}**`,
          `🟡 **${TYPES.partnership.label}**`,
          `🔴 **${TYPES.segnalazione.label}**`
        ].join("\n")
      )
      .setColor(0x2b2d31)
      .setThumbnail(guildIcon)
      .setFooter({
        text: `${interaction.guild.name} • Ticket Center`,
        iconURL: guildIcon || undefined
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open_supporto")
        .setLabel(TYPES.supporto.label)
        .setEmoji(TYPES.supporto.emoji)
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_open_partnership")
        .setLabel(TYPES.partnership.label)
        .setEmoji(TYPES.partnership.emoji)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_open_segnalazione")
        .setLabel(TYPES.segnalazione.label)
        .setEmoji(TYPES.segnalazione.emoji)
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: "✅ Pannello ticket inviato.",
      ephemeral: true
    });
  }
};
