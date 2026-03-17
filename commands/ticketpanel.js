const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const { PANEL_CHANNEL_ID, TYPES } = require("../../../config/tickets");

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
          "Benvenuto nel centro assistenza del server.",
          "",
          "Seleziona qui sotto il tipo di ticket che desideri aprire.",
          "",
          "🔵 Supporto",
          "🟡 Partnership",
          "🔴 Segnalazione"
        ].join("\n")
      )
      .setColor(0x2b2d31)
      .setThumbnail(guildIcon)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open_supporto")
        .setLabel("Supporto")
        .setEmoji("🔵")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_open_partnership")
        .setLabel("Partnership")
        .setEmoji("🟡")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_open_segnalazione")
        .setLabel("Segnalazione")
        .setEmoji("🔴")
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
