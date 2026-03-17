const { Events, EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  const WELCOME_CHANNEL_ID = "723915326332469250";
  const RULES_CHANNEL_ID = "828023898964492368";
  const AUTOROLES_CHANNEL_ID = "1468729208804081917";
  const MAIN_CHAT_ID = "723915326332469250";

  const WELCOME_GIF =
    "https://i.pinimg.com/originals/81/11/da/8111dadeee2521a210a29f2b734fcf92.gif";

  const SEP = "━━━━━━━━━━━━━━━━━━━━";

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
      if (!channel) return;

      const avatar = member.user.displayAvatarURL({ size: 256 });
      const count = member.guild.memberCount;

      const embed = new EmbedBuilder()
        .setColor(0xff2d2d)
        .setTitle("👑 WELCOME IN FIRESTORM 👑")
        .setDescription(
          [
            `✨ **Ciao ${member} ❤️**`,
            SEP,
            `🔥 **Benvenuto/a in FireStorm™**`,
            `Sei il membro **#${count}** — preparati a divertirti e spaccare tutto 💥`,
            SEP,
            `📌 **Inizia da qui:**`,
            `➡️ <#${RULES_CHANNEL_ID}>  — 📜 ****`,
            `➡️ <#${AUTOROLES_CHANNEL_ID}>  — 🎭 ****`,
            `➡️ <#${MAIN_CHAT_ID}>  — 💬 ****`,
            SEP,
            `💬 **Scrivi un saluto in chat e scegli i tuoi ruoli!**`,
            `🛡️ Se hai bisogno, contatta lo staff.`,
          ].join("\n")
        )
        .setThumbnail(avatar)
        .setImage(WELCOME_GIF)
        .setFooter({ text: "FireStorm™ • Welcome System" })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Welcome error:", err);
    }
  });
};
