const play = require("play-dl");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

// player per server (semplice, senza queue)
const players = new Map();

module.exports = {
  name: "p", // comando: f!p

  async execute(message, args) {
    const query = args.join(" ").trim();
    if (!query) {
      return message.reply("❌ Usa: `f!p <link YouTube o nome canzone>`");
    }

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply("❌ Devi essere in un canale vocale.");
    }

    // ── trova il video (link o ricerca)
    let video;
    try {
      if (play.yt_validate(query) === "video") {
        video = await play.video_basic_info(query);
      } else {
        const results = await play.search(query, { limit: 1 });
        if (!results.length) {
          return message.reply("❌ Nessun risultato trovato.");
        }
        video = await play.video_basic_info(results[0].url);
      }
    } catch (err) {
      console.error(err);
      return message.reply("❌ Errore nel leggere il link/ricerca.");
    }

    const title = video.video_details.title;
    const url = video.video_details.url;

    // ── entra in vocale
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    // ── player per server
    let player = players.get(message.guild.id);
    if (!player) {
      player = createAudioPlayer();
      players.set(message.guild.id, player);

      player.on(AudioPlayerStatus.Idle, () => {
        try { connection.destroy(); } catch {}
        players.delete(message.guild.id);
      });

      player.on("error", (e) => {
        console.error(e);
        try { connection.destroy(); } catch {}
        players.delete(message.guild.id);
      });
    }

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      try { connection.destroy(); } catch {}
      players.delete(message.guild.id);
    });

    // ── stream audio
    try {
      const stream = await play.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      connection.subscribe(player);
      player.play(resource);

      await message.channel.send(`▶️ **Ora in riproduzione:** **${title}**`);
    } catch (err) {
      console.error(err);
      try { connection.destroy(); } catch {}
      players.delete(message.guild.id);
      return message.reply("❌ Errore durante la riproduzione.");
    }
  },
};
