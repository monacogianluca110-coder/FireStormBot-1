const { Events } = require("discord.js");
const OpenAI = require("openai");

module.exports = (client) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const AI_CHANNEL_ID = process.env.AI_CHANNEL_ID || "1469303591708790814";
  const LOG_CHANNEL_ID = process.env.AI_LOG_CHANNEL_ID || "1469305064064684092";

  const USER_COOLDOWN_MS = 3000; // 3 secondi
  const INACTIVITY_MS = 5 * 60 * 1000;

  const lastUserMsg = new Map(); // userId -> timestamp
  const lastThreadActivity = new Map(); // threadId -> timestamp
  const warnings = new Map(); // threadId:userId -> count

  function key(t, u) {
    return `${t}:${u}`;
  }

  async function closeThread(thread, reason) {
    try {
      await thread.send(`🔒 Thread chiuso: ${reason}`);
      await thread.setLocked(true);
      await thread.setArchived(true);
    } catch {}
  }

  // Auto-close dopo 5 min di inattività
  setInterval(async () => {
    const now = Date.now();
    for (const [threadId, ts] of lastThreadActivity.entries()) {
      if (now - ts < INACTIVITY_MS) continue;
      const thread = await client.channels.fetch(threadId).catch(() => null);
      if (!thread || !thread.isThread()) continue;
      await closeThread(thread, "inattività (5 minuti)");
      lastThreadActivity.delete(threadId);
    }
  }, 30000);

  client.on(Events.MessageCreate, async (message) => {
    try {
      if (!process.env.OPENAI_API_KEY) return;
      if (message.author.bot) return;
      if (!message.guild) return;

      const ch = message.channel;
      if (!ch.isThread()) return;

      // accetta thread AI
      const isAiThread =
        ch.parentId === AI_CHANNEL_ID ||
        (ch.name || "").toLowerCase().startsWith("ai-");

      if (!isAiThread) return;

      const now = Date.now();
      const last = lastUserMsg.get(message.author.id) || 0;

      // Cooldown 3s VISIBILE
      if (now - last < USER_COOLDOWN_MS) {
        const remain = Math.ceil((USER_COOLDOWN_MS - (now - last)) / 1000);
        const k = key(ch.id, message.author.id);
        const w = (warnings.get(k) || 0) + 1;
        warnings.set(k, w);

        if (w <= 2) {
          const m = await message.reply(`⏳ Cooldown: **${remain}s** (avviso ${w}/2)`);
          setTimeout(() => m.delete().catch(() => {}), 3000);
          return;
        }

        await closeThread(ch, "spam ripetuto");
        return;
      }

      lastUserMsg.set(message.author.id, now);
      lastThreadActivity.set(ch.id, now);

      const prompt = message.content?.trim();
      if (!prompt) return;

      await ch.sendTyping();

      // 🔥 CHIAMATA OPENAI STABILE
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "Sei l'AI del server FireStorm™. Rispondi in italiano, tono amichevole e professionale. " +
              "Non chiedere o rivelare dati personali. Rifiuta richieste illegali.",
          },
          { role: "user", content: prompt },
        ],
      });

      const reply =
        completion.choices?.[0]?.message?.content ||
        "Non riesco a rispondere, riprova.";

      await message.reply(reply);
    } catch (err) {
      console.error("AI ERROR:", err);
      try {
        await message.reply("❌ Errore AI. Controlla i Logs su Railway.");
      } catch {}
    }
  });
};
