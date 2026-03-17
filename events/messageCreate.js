const { Events } = require("discord.js");

const prefix = "!";

module.exports = {
  name: Events.MessageCreate,

  async execute(message, client) {
    try {
      if (message.author.bot) return;
      if (!message.guild) return;
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = message.client.commands.get(commandName);
      if (!command) return;

      await command.execute(message, args, client);

      client.emit("commandSuccess", {
        interaction: null,
        message,
        commandName,
        args,
        type: "prefix",
      });
    } catch (err) {
      console.error("❌ Errore in messageCreate:", err);

      client.emit("commandError", {
        interaction: null,
        message,
        commandName: message.content,
        args: [],
        type: "prefix",
        error: err,
      });

      try {
        await message.channel.send("❌ Errore durante il comando.");
      } catch {}
    }
  },
};
