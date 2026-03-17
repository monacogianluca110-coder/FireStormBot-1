const { Events, PermissionsBitField } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction, client) {
    try {
      // ─────────────────────────────
      // SLASH COMMANDS
      // ─────────────────────────────
      if (interaction.isChatInputCommand()) {
        const command = client.slashCommands.get(interaction.commandName.toLowerCase());
        if (!command) return;

        await command.execute(interaction, client);
        return;
      }

      // ─────────────────────────────
      // AUTO-RUOLI BUTTONS
      // ─────────────────────────────
      if (interaction.isButton() && interaction.customId.startsWith("ar:")) {
        try {
          await interaction.deferReply({ ephemeral: true });
        } catch {}

        const guild = interaction.guild;
        if (!guild) {
          return interaction.editReply("❌ Funziona solo in un server.");
        }

        const roleId = interaction.customId.split(":")[1];
        const role = guild.roles.cache.get(roleId);

        if (!role) {
          return interaction.editReply("❌ Ruolo non trovato (ID errato o eliminato).");
        }

        const me = await guild.members.fetchMe();

        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          return interaction.editReply("❌ Mi manca il permesso **Gestisci Ruoli**.");
        }

        if (role.managed) {
          return interaction.editReply("❌ Questo ruolo è **gestito** e non si può assegnare.");
        }

        if (role.position >= me.roles.highest.position) {
          return interaction.editReply(
            "❌ Non posso assegnare questo ruolo perché è **più alto o uguale** al mio.\n" +
            "➡️ Sposta il ruolo del bot **sopra** questo ruolo nelle impostazioni ruoli."
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
      }
    } catch (err) {
      console.error("❌ Errore in interactionCreate.js:", err);

      try {
        if (interaction.isRepliable()) {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
              content: "❌ Errore durante l'interazione.",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: "❌ Errore durante l'interazione.",
              ephemeral: true,
            });
          }
        }
      } catch {}
    }
  },
};
