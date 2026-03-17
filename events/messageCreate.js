module.exports = {
  name: "messageCreate",
  once: false,

  async execute(message, client) {
    const prefix = "!";

    try {
      if (!message) return;
      if (message.author?.bot) return;
      if (!message.guild) return;
      if (!message.content) return;
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const command = client.commands?.get(commandName);
      if (!command || typeof command.execute !== "function") return;

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
        commandName: message?.content || "unknown",
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
