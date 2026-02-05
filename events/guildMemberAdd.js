const { Events, EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  const WELCOME_CHANNEL_ID = "723915326332469250";
  const RULES_CHANNEL_ID = "828023898964492368";
  const AUTOROLES_CHANNEL_ID = "1468729208804081917";
  const MAIN_CHAT_ID = "723915326332469250";

  const WELCOME_GIF =
    "https://i.pinimg.com/originals/81/11/da/8111dadeee2521a210a29f2b734fcf92.gif";

  // 🔥 EMOJI CUSTOM (ID CHE MI HAI DATO TU)
  const E_ARROW = `<:arrow:1078839081435398235>`;
  const E_STARS = `<:stars:1446264183912923298>`;
  const E_HEART = `<:heart:1078842029611700265>`;
  const E_DISCORD = `<:discord:1078840726026211430>`;
  const E_CROWN_BLACK = `<a:crownblack:878544140198100992>`;
  const E_CROWN_WHITE = `<a:crownwhite:878544140198100992>`;

  const SEP = "━━━━━━━━━━━━━━━━━━━━";

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
      if (!channel) return;

      const avatar = member.user.displayAvatarURL({ size: 256 });
      const count = member.guild.memberCount;

      const embed = new EmbedBuilder()
        .setColor(0xff2d2d)
        .setTitle(`${E_CROWN_BLACK} WELCOME!! ${E_CROWN_WHITE}`)
        .setDescription(
          [
            `${E_STARS} **Ciao ${member}** ${E_HEART}`,
            SEP,
            `${E_DISCORD} **Benvenuto/a in FireStorm™**`,
            `Sei il membro **#${count}** — preparati a divertirti e spaccare tutto 🔥`,
            SEP,
            `${E_STARS} **Ti invitiamo a visitare i canali:**`,
            `${E_ARROW} <#${RULES_CHANNEL_ID}>  — 📜 **Regole**`,
            `${E_ARROW} <#${AUTOROLES_CHANNEL_ID}>  — 🎭 **Auto-Ruoli**`,
            `${E_ARROW} <#${MAIN_CHAT_ID}>  — 💬 **Chat Main**`,
            SEP,
            `💬 **Scrivi un saluto in chat e scegli i tuoi ruoli!**`,
            `👮 Se hai bisogno, contatta lo staff.`,
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
