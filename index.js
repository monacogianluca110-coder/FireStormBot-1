console.log("TOKEN PRESENTE?", !!process.env.TOKEN);
console.log("TOKEN LENGTH:", process.env.TOKEN ? process.env.TOKEN.length : 0);
console.log("TOKEN START:", process.env.TOKEN ? process.env.TOKEN.slice(0, 10) : "NULL");

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log("ONLINE come", client.user.tag);
});

client.login(process.env.TOKEN).catch((e) => console.error("LOGIN ERROR:", e));
