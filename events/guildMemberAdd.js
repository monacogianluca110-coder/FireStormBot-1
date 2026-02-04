const { Events, EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  const WELCOME_CHANNEL_ID = "723915326332469250";
  const WELCOME_GIF =
    "https://i.pinimg.com/originals/81/11/da/8111dadeee2521a210a29f2b734fcf92.gif";

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle("🔥 Benvenuto in FireStorm™!")
        .setDescription(
          [
            `Hey ${member}, benvenuto/a nella community!`,
            "",
            "✨ **Siamo felici di averti qui!**",
            "",
            "📌 **Prima di iniziare:**",
            "• Leggi le **regole** 📜",
            "• Dai un’occhiata ai **link utili** 🔗",
            "• Presentati in chat e divertiti 😎",
            "",
            "👮 Per qualsiasi problema, contatta lo staff.",
          ].join("\n")
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setImage(WELCOME_GIF)
        .setFooter({ text: "FireStorm™ • Sistema di Benvenuto" })
        .setTimestamp();

      await channel.send({ content: `👋 ${member}`, embeds: [embed] });
    } catch (err) {
      console.error("Welcome error:", err);
    }
  });
};
