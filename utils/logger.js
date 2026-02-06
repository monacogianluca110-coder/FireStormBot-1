const { EmbedBuilder } = require("discord.js");

function cut(str, max = 1024) {
  if (!str) return "—";
  str = String(str);
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

async function sendLog(client, channelId, payload) {
  try {
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (!ch) return;
    await ch.send(payload).catch(() => null);
  } catch {}
}

function baseEmbed(title) {
  return new EmbedBuilder().setTitle(title).setTimestamp(Date.now());
}

module.exports = { sendLog, baseEmbed, cut };
