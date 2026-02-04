const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "linkutili",
  description: "Posta il pannello Link Utili nel canale dedicato",
  async execute(message) {
    const LINKS_CHANNEL_ID = "836715755289837588";

    // Solo staff (puoi togliere questo controllo se vuoi)
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("❌ You don’t have permission to use this command.");
    }

    const channel = message.guild.channels.cache.get(LINKS_CHANNEL_ID);
    if (!channel) return message.reply("❌ Link channel not found.");

    const twitchUrl = "https://www.twitch.tv/tvfirestorm";
    const discordInvite = "https://discord.gg/p4sKdZV";

    const twitchGif = "https://i.pinimg.com/originals/27/4e/fc/274efc127536a6b68b352bc6e81d60aa.gif";
    const discordGif = "https://i.pinimg.com/originals/ec/28/22/ec282269201734cc000547f155c03c77.gif";

    const embed = new EmbedBuilder()
      .setTitle("🔗 FireStorm™ — Useful Links")
      .setDescription("All official links in one place. Use only these to avoid scams.")
      .addFields(
        {
          name: "📺 Twitch",
          value: `[${twitchGif}](${twitchUrl})  •  **[tvfirestorm](${twitchUrl})**`,
          inline: false,
        },
        {
          name: "💬 Discord Invite",
          value: `[${discordGif}](${discordInvite})  •  **[Join FireStorm](${discordInvite})**`,
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm™ • Official Links" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    return message.reply(`✅ Posted in <#${LINKS_CHANNEL_ID}>`);
  },
};
