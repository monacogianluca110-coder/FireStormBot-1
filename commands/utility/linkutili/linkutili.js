const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  name: "linkutili",
  description: "Mostra i link utili ufficiali di FireStorm™",
  async execute(message) {
    const CHANNEL_ID = "836715755289837588";

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("❌ Non hai i permessi per usare questo comando.");
    }

    const channel = message.guild.channels.cache.get(CHANNEL_ID);
    if (!channel) return message.reply("❌ Canale link utili non trovato.");

    // ───── EMBED TWITCH ─────
    const twitchEmbed = new EmbedBuilder()
      .setTitle("📺 FireStorm™ su Twitch")
      .setDescription(
        "Segui il **canale Twitch ufficiale** di FireStorm™ per live, eventi e contenuti esclusivi."
      )
      .setImage("https://i.pinimg.com/originals/27/4e/fc/274efc127536a6b68b352bc6e81d60aa.gif")
      .setColor(0x9146FF)
      .setFooter({ text: "FireStorm™ • Link Ufficiali" });

    const twitchButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Vai su Twitch")
        .setStyle(ButtonStyle.Link)
        .setURL("https://www.twitch.tv/tvfirestorm")
    );

    // ───── EMBED DISCORD ─────
    const discordEmbed = new EmbedBuilder()
      .setTitle("💬 Entra nel Discord FireStorm™")
      .setDescription(
        "Unisciti al **server Discord ufficiale** di FireStorm™ per community, supporto ed eventi."
      )
      .setImage("https://i.pinimg.com/originals/ec/28/22/ec282269201734cc000547f155c03c77.gif")
      .setColor(0x5865F2)
      .setFooter({ text: "FireStorm™ • Link Ufficiali" });

    const discordButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Entra nel Discord")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/p4sKdZV")
    );

    // invio messaggi
    await channel.send({ embeds: [twitchEmbed], components: [twitchButton] });
    await channel.send({ embeds: [discordEmbed], components: [discordButton] });

    return message.reply(`✅ Pannello link utili inviato in <#${CHANNEL_ID}>`);
  },
};
