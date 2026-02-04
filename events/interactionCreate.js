const { Events } = require("discord.js");

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith("ar:")) return;

      const roleId = interaction.customId.split(":")[1];
      const role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.reply({
          content: "❌ Ruolo non trovato (ID errato o ruolo eliminato).",
          ephemeral: true,
        });
      }

      // fetch membro
      const member = await interaction.guild.members.fetch(interaction.user.id);

      // sicurezza: bot deve poter gestire il ruolo
      // (se il ruolo è sopra al bot nella gerarchia, fallisce)
      const hasRole = member.roles.cache.has(roleId);

      if (hasRole) {
        await member.roles.remove(roleId);
        return interaction.reply({
          content: `✅ Ruolo rimosso: **${role.name}**`,
          ephemeral: true,
        });
      } else {
        await member.roles.add(roleId);
        return interaction.reply({
          content: `✅ Ruolo assegnato: **${role.name}**`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error("AUTOROLES BUTTON ERROR:", err);
      if (interaction.isRepliable()) {
        try {
          await interaction.reply({
            content:
              "❌ Non posso assegnare quel ruolo. Controlla permessi/gerarchia ruoli del bot.",
            ephemeral: true,
          });
        } catch {}
      }
    }
  });
};
