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

    const E_ARROW = `<:arrow:1446266575262056468>`;
    const E_STARS = `<:stars:1446264183912923298>`;
    const E_HEART = `<:heart:1374162617010225242>`;
    const E_DISCORD = `<:discord:850081111241785425>`;
    const E_CROWN_BLACK = `<a:crownblack:1383053653400621156>`;
    const E_CROWN_WHITE = `<a:crownwhite:1383053638502453320>`;

    const sep = "━━━━━━━━━━━━━━━━━━━━";
    const count = message.guild.memberCount;

    const embed = new EmbedBuilder()
      .setColor(0xff2d2d)
      .setTitle(`${E_CROWN_BLACK} WELCOME!! ${E_CROWN_WHITE}`)
      .setDescription(
        [
          `${E_STARS} Ciao ${message.author} ${E_HEART}`,
          `${sep}`,
          `${E_DISCORD} **Benvenuto/a in FireStorm™**`,
          `Sei il membro **#${count}** — preparati a divertirti e spaccare tutto 🔥`,
          `${sep}`,
          `**${E_STARS} Ti invitiamo a visitare i canali:**`,
          `${E_ARROW} <#${RULES_CHANNEL_ID}>  — **Regole**`,
          `${E_ARROW} <#${AUTOROLES_CHANNEL_ID}>  — **Auto-Ruoli**`,
          `${E_ARROW} <#${MAIN_CHAT_ID}>  — **Chat Main**`,
          `${sep}`,
          `💬 **Scrivi un saluto in chat** e scegli i tuoi ruoli!`,
          `👮 Se hai bisogno, contatta lo staff.`,
        ].join("\n")
      )
      .setThumbnail(message.author.displayAvatarURL({ size: 256 }))
      .setImage(WELCOME_GIF)
      .setFooter({ text: "FireStorm™ • Welcome System" })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};
