const { Events, PermissionsBitField } = require("discord.js");

module.exports = (client) => {
  console.log("✅ interactionCreate.js caricato");

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("ar:")) return;

    console.log("✅ Bottone auto-ruoli premuto:", interaction.customId);

    // rispondi subito (mai più “interazione non riuscita”)
    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    try {
      const guild = interaction.guild;
      if (!guild) return interaction.editReply("❌ Questo bottone funziona solo in un server.");

      const roleId = interaction.customId.split(":")[1];
      const role = guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.editReply("❌ Ruolo non trovato (ID errato o ruolo eliminato).");
      }

      // ✅ FIX: fetchMe è il modo corretto e stabile
      const me = await guild.members.fetchMe();

      if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.editReply("❌ Mi manca il permesso **Gestisci Ruoli**.");
      }

      // gerarchia
      if (role.position >= me.roles.highest.position) {
        return interaction.editReply(
          "❌ Non posso assegnare questo ruolo perché è **più alto (o uguale)** del mio ruolo.\n" +
          "➡️ Sposta il ruolo del bot **sopra** questi ruoli in **Impostazioni Server → Ruoli**."
        );
      }

      const member = await guild.members.fetch(interaction.user.id);

      const hasRole = member.roles.cache.has(roleId);
      if (hasRole) {
        await member.roles.remove(roleId);
        return interaction.editReply(`✅ Ruolo rimosso: **${role.name}**`);
      } else {
        await member.roles.add(roleId);
        return interaction.editReply(`✅ Ruolo assegnato: **${role.name}**`);
      }
    } catch (err) {
      console.error("AUTOROLES CLICK ERROR:", err);
      try {
        await interaction.editReply(
          "❌ Errore interno o permessi mancanti.\n" +
          "Controlla: **Gestisci Ruoli** + gerarchia ruoli del bot."
        );
      } catch {}
    }
  });
};
