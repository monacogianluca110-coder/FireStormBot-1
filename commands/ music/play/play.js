const play = require("play-dl");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

// player per-guild (così ogni server può avere il suo)
const players = new Map();

module.exports = {
  name: "p", // comando: f!p

  /**
   * @param {import('discord.js').Message} message
   * @param {string[]} args
   */
  async execute(message, args) {
    const query = args.join(" ").trim();
    if (!query) {
      return message.reply("❌ Usa: `f!p <link youtube/spotify o testo>`");
    }

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply("❌ Devi essere in un canale vocale per usare `f!p`.");
    }

    // 1) risolvi la “fonte” (link o ricerca)
    let info;
    try {
      // Se è un link, play-dl lo riconosce; se è testo, facciamo search su YouTube
      if (play.yt_validate(query) === "video" || query.includes("youtube.com") || query.includes("youtu.be")) {
        info = await play.video_basic_info(query);
      } else {
        // ricerca su YouTube: prende il primo risultato
        const results = await play.search(query, { limit: 1 });
        if (!results?.length) return message.reply("❌ Nessun risultato trovato.");
        info = await play.video_basic_info(results[0].url);
      }
    } catch (e) {
      console.error(e);
      return message.reply("❌ Non riesco a leggere quel link/ricerca (prova un link YouTube diretto).");
    }

    const title = info.video_details?.title ?? "Traccia";
    const url = info.video_details?.url ?? query;

    // 2) join vocale
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    // 3) crea/riusa player per questo server
    let player = players.get(message.guild.id);
    if (!player) {
      player = createAudioPlayer();
      players.set(message.guild.id, player);

      player.on(AudioPlayerStatus.Idle, () => {
        // quando finisce, esci dal canale (semplice, niente queue)
        try {
          connection.destroy();
        } catch {}
        players.delete(message.guild.id);
      });

      player.on("error", (err) => {
        console.error("Player error:", err);
        try {
          connection.destroy();
        } catch {}
        players.delete(message.guild.id);
      });
    }

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      try {
        connection.destroy();
      } catch {}
      players.delete(message.guild.id);
    });

    // 4) stream audio
    try {
      const stream = await play.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      connection.subscribe(player);
      player.play(resource);

      return message.channel.send(`▶️ **Ora in riproduzione:** **${title}**`);
    } catch (e) {
      console.error(e);
      try {
        connection.destroy();
      } catch {}
      players.delete(message.guild.id);
      return message.reply("❌ Errore durante la riproduzione (YouTube può bloccare alcune VPS).");
    }
  },
};
