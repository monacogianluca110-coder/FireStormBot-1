module.exports = {
  name: "info",

  async execute(message) {
    const testo = `
🔥 **FireStorm**

Una community dedicata a:
🎮 Gaming
💬 Chat
🚀 Eventi e progetti

Unisciti e fai parte del fuoco.
`;

    await message.channel.send(testo);
  },
};
