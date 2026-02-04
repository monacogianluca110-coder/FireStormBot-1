const fs = require("fs");
const path = require("path");
const { Events } = require("discord.js");

function loadConfig() {
  const cfgPath = path.join(__dirname, "../config/autoroles.json");
  if (!fs.existsSync(cfgPath)) return null;
  return JSON.parse(fs.readFileSync(cfgPath, "utf8"));
}

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith("ar:")) return;

      const roleId = interaction.customId.split(":")[1];
      if (!roleId || roleId === "MISSING") {
        return interaction.reply({
          content: "❌ Ruolo non configurato ancora.",
          ephemeral: true,
        });
      }

      const cfg = loadConfig();
      // (opzionale) se vuoi limitare solo al canale del pannello:
      if (cfg?.channelId && interaction.channelId !== cfg.channelId) {
        return interaction.reply({
          content: "❌ Usa il pannello nel canale auto-ruoli.",
          ephemeral: true,
        });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const role = interaction.guild.roles.cache.get(roleId);

      if (!role) {
        return interaction.reply({
          content: "❌ Ruolo non trovato (ID errato o ruolo eliminato).",
          ephemeral: true,
        });
      }

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
      console.error("AutoRoles button error:", err);
      if (interaction.isRepliable()) {
        try {
          await interaction.reply({
            content: "❌ Errore interno. Riprova tra poco.",
            ephemeral: true,
          });
        } catch {}
      }
    }
  });
};
