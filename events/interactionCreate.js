const { Events, PermissionsBitField } = require("discord.js");

module.exports = (client) => {
  console.log("✅ interactionCreate.js caricato (Auto-Ruoli)");

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("ar:")) return;

    // Rispondi subito (così non fallisce mai l’interazione)
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch {
      // se già "ack", non facciamo nulla
    }

    try {
      const guild = interaction.guild;
      if (!guild) return interaction.editReply("❌ Funziona solo in un server.");

      const roleId = interaction.customId.split(":")[1];
      const role = guild.roles.cache.get(roleId);
      if (!role) return interaction.editReply("❌ Ruolo non trovato (ID errato o eliminato).");

      const me = await guild.members.fetchMe();

      // Permesso manage roles
      if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.editReply("❌ Mi manca il permesso **Gestisci Ruoli**.");
      }

      // Ruoli gestiti (tipo bot/integrations) non si possono dare
      if (role.managed) {
        return interaction.editReply("❌ Questo ruolo è **gestito** (integration/bot) e non si può assegnare.");
      }

      // Gerarchia ruoli
      if (role.position >= me.roles.highest.position) {
        return interaction.editReply(
          "❌ Non posso assegnare questo ruolo perché è **più alto o uguale** al mio.\n" +
          "➡️ Sposta il ruolo del bot **SOPRA** i ruoli test in **Impostazioni server → Ruoli**."
        );
      }

      const member = await guild.members.fetch(interaction.user.id);

      // Toggle
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
          "❌ Errore interno.\n" +
          "Quasi sempre è **gerarchia ruoli** o **permesso Gestisci Ruoli**."
        );
      } catch {}
    }
  });
};
