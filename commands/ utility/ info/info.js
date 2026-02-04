module.exports = {
  name: "info",

  async execute(message) {
    const testo = `
🔥 **FireStorm™ | Informazioni Ufficiali** 🔥

Benvenuto su **FireStorm™**, una community attiva e organizzata dove **gaming, chat ed eventi** si incontrano.
Qui troverai uno spazio serio ma divertente, con uno **staff presente** e contenuti sempre aggiornati.

════════════════════

💬 **Chat Principale**
La chat principale del server: qui puoi parlare con tutti, fare amicizia e partecipare alla community.
👉 <#723915326332469250>

════════════════════

🎭 **Autori**
Scegli i tuoi ruoli in autonomia per personalizzare la tua esperienza sul server.
👉 <#833460915319341096>

════════════════════

📢 **Annunci**
Tutti gli aggiornamenti ufficiali, eventi, avvisi importanti e novità del server.
👉 <#836688982070263911>

════════════════════

🎮 **Giochi Gratis**
Segnalazioni di giochi gratuiti, offerte speciali e occasioni da non perdere.
👉 <#1451191419992670460>

════════════════════

🔗 **Link Utili**
Raccolta di link importanti, risorse utili e strumenti per la community.
👉 <#836715755289837588>

════════════════════

⚡ **Rispetta le regole, resta attivo e fai parte della tempesta.**
🔥 **FireStorm™ non è solo un server, è una comunità.** 🔥
`;

    await message.channel.send(testo);
  }
};
