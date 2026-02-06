const { Events, ChannelType } = require("discord.js");
const OpenAI = require("openai");

module.exports = (client) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const AI_CHANNEL_ID = process.env.AI_CHANNEL_ID || "1469303591708790814";
  const LOG_CHANNEL_ID = process.env.AI_LOG_CHANNEL_ID || "1469305064064684092";

  const USER_COOLDOWN_MS = 3000;           // 3s
  const INACTIVITY_MS = 5 * 60 * 1000;     // 5 min
  const MAX_TURNS = 10;

  const historyByThread = new Map(); // threadId -> [{role, content}]
  const lastUserMsgAt = new Map();   // threadId -> timestamp
  const userCooldown = new Map();    // userId -> timestamp
  const spamWarnings = new Map();    // threadId:userId -> count

  async function log(guild, text) {
    try {
      const ch =
        guild.channels.cache.get(LOG_CHANNEL_ID) ||
        (await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null));
      if (ch && ch.isTextBased()) ch.send(text).catch(() => null);
    } catch {}
  }

  function pushHistory(threadId, role, content) {
    if (!historyByThread.has(threadId)) historyByThread.set(threadId, []);
    const arr = historyByThread.get(threadId);
    arr.push({ role, content });

    const maxItems = MAX_TURNS * 2;
    if (arr.length > maxItems) arr.splice(0, arr.length - maxItems);
  }

  function k(threadId, userId) {
    return `${threadId}:${userId}`;
  }

  async function closeThread(thread, reasonText) {
    try {
      await thread.send(`🔒 Thread chiuso: ${reasonText}`).catch(() => null);
      await thread.setLocked(true).catch(() => null);
      await thread.setArchived(true).catch(() => null);
    } catch {}
  }

  // Auto-close per inattività
  setInterval(async () => {
    const now = Date.now();
    for (const [threadId, ts] of lastUserMsgAt.entries()) {
      if (now - ts < INACTIVITY_MS) continue;

      const thread = await client.channels.fetch(threadId).catch(() => null);
      if (!thread || !thread.isThread()) {
        lastUserMsgAt.delete(threadId);
        historyByThread.delete(threadId);
        continue;
      }

      await closeThread(thread, "inattività (5 minuti)");
      if (thread.guild) await log(thread.guild, `🧹 Auto-close inattività: ${thread.name} (${thread.id})`);

      lastUserMsgAt.delete(threadId);
      historyByThread.delete(threadId);
    }
  }, 30_000);

  client.on(Events.MessageCreate, async (message) => {
    try {
      if (!process.env.OPENAI_API_KEY) return;
      if (message.author.bot) return;
      if (!message.guild) return;

      const ch = message.channel;

      // ✅ Accetta QUALSIASI thread creato per AI
      if (!ch.isThread()) return;

      // opzionale: controlla parentId oppure nome
      const isAiByParent = ch.parentId === AI_CHANNEL_ID;
      const isAiByName = (ch.name || "").toLowerCase().startsWith("ai-");
      if (!isAiByParent && !isAiByName) return;

      // ✅ Anti-spam 3s con “cooldown visibile”
      const now = Date.now();
      const last = userCooldown.get(message.author.id) || 0;
      const delta = now - last;

      if (delta < USER_COOLDOWN_MS) {
        const remainingSec = Math.ceil((USER_COOLDOWN_MS - delta) / 1000);
        const key = k(ch.id, message.author.id);
        const w = (spamWarnings.get(key) || 0) + 1;
        spamWarnings.set(key, w);

        if (w <= 2) {
          const warnMsg = await message
            .reply(`⏳ Cooldown: **${remainingSec}s** — non spammare. (Avviso ${w}/2)`)
            .catch(() => null);

          await log(message.guild, `⚠️ Spam warn ${w}/2 — ${message.author.tag} in ${ch.name} (${ch.id})`);

          // auto-delete del warning (pulito)
          if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => null), 3500);
          return;
        }

        await log(message.guild, `🔒 Thread chiuso per spam — ${message.author.tag} in ${ch.name} (${ch.id})`);
        await closeThread(ch, "spam ripetuto");
        return;
      }

      userCooldown.set(message.author.id, now);
      lastUserMsgAt.set(ch.id, now);

      const userText = (message.content || "").trim();
      if (!userText) return;

      await ch.sendTyping().catch(() => null);

      // Moderation
      const mod = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: userText,
      });

      if (mod?.results?.[0]?.flagged) {
        await message.reply("🚫 Non posso aiutarti con questa richiesta. Riformula in modo sicuro e legale.");
        return;
      }

      pushHistory(ch.id, "user", `(${message.author.username}): ${userText}`);

      const systemRules = [
        "Sei l'AI del server FireStorm™. Rispondi in italiano, tono amichevole e professionale.",
        "Non chiedere né rivelare info private (token, email, IP, password, indirizzi).",
        "Non inventare info sugli utenti. Base solo su questa chat e conoscenza generale.",
        "Rifiuta richieste illegali/dannose (hacking, truffe, armi, bypass, doxxing).",
        "Niente spam, niente @everyone/@here.",
        "Risposte chiare e pratiche.",
      ].join("\n");

      const history = historyByThread.get(ch.id) || [];

      const resp = await openai.responses.create({
        model: "gpt-5-mini",
        input: [
          { role: "system", content: systemRules },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: "user", content: userText },
        ],
        safety_identifier: `discord:${message.author.id}`,
      });

      const out = (resp.output_text || "").trim() || "Non sono riuscito a rispondere. Riprova.";

      pushHistory(ch.id, "assistant", out);

      // split 2000 chars
      let text = out;
      while (text.length > 2000) {
        await message.reply(text.slice(0, 2000));
        text = text.slice(2000);
      }
      await message.reply(text);
    } catch (err) {
      console.error("AI THREAD ERROR:", err);
      try {
        await message.reply("❌ Errore AI. Controlla i Logs su Railway.");
      } catch {}
    }
  });
};
