const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "testwelcome",
  description: "Mostra un welcome di prova (solo staff)",
  async execute(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("❌ Non hai i permessi per usare questo comando.");
    }

    const RULES_CHANNEL_ID = "828023898964492368";
    const AUTOROLES_CHANNEL_ID = "1468729208804081917";
    const MAIN_CHAT_ID = "723915326332469250";

    const WELCOME_GIF =
      "https://i.pinimg.com/originals/81/11/da/8111dadeee2521a210a29f2b734fcf92.gif";

    const SEP = "━━━━━━━━━━━━━━━━━━━━";
    const count = message.guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(0xff2d2d)
      .setTitle("👑 WELCOME IN FIRESTORM 👑")
      .setDescription(
        [
          `✨ **Ciao ${message.author} ❤️**`,
          SEP,
          `🔥 **Benvenuto/a in FireStorm™**`,
          `Sei il membro **#${count}** — preparati a divertirti e spaccare tutto 💥`,
          SEP,
          `📌 **Inizia da qui:**`,
          `➡️ <#${RULES_CHANNEL_ID}>  — 📜 **Regole**`,
          `➡️ <#${AUTOROLES_CHANNEL_ID}>  — 🎭 **Auto-Ruoli**`,
          `➡️ <#${MAIN_CHAT_ID}>  — 💬 **Chat Main**`,
          SEP,
          `💬 **Scrivi un saluto in chat e scegli i tuoi ruoli!**`,
          `🛡️ Se hai bisogno, contatta lo staff.`,
        ].join("\n")
      )
      .setThumbnail(message.author.displayAvatarURL({ size: 256 }))
      .setImage(WELCOME_GIF)
      .setFooter({ text: "FireStorm™ • Welcome System" })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};
