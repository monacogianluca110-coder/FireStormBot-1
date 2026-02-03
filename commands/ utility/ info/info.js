module.exports = {
  name: 'info',

  async execute(message) {
    // QUI poi cambi tu il testo
    const testoGigante = `
ｂａｃａ ｇａｙ ｂａｃａ ｇａｙ ｂａｃａ ｇａｙ ｂａｃａ ｇａｙ ｂａｃａ ｇａｙ ｂａｃａ ｇａｙ ｂａｃａ ｇａｙ 
`;

    await message.channel.send("```" + testoGigante + "```");
  }
};
