const ytdl = require("ytdl-core");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

const players = new Map();

module.exports = {
  name: "p", // f!p

  async execute(message, args) {
    const query = args.join(" ").trim();
    if (!query) {
      return message.reply("❌ Usa: `f!p <link YouTube o testo>`");
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply("❌ Devi essere in un canale vocale.");
    }

    let videoUrl = query;

    try {
      // 🔍 Se NON è un link, cerchiamo su YouTube
      if (!ytdl.validateURL(query)) {
        const play = require("play-dl");
        const results = await play.search(query, { limit: 1 });
        if (!results.length) {
          return message.reply("❌ Nessun risultato trovato.");
        }
        videoUrl = results[0].url;
      }

      const stream = ytdl(videoUrl, {
        filter: "audioonly",
        highWaterMark: 1 << 25,
      });

      const resource = createAudioResource(stream);
      const player = createAudioPlayer();

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      await message.channel.send("▶️ **Riproduzione avviata**");
    } catch (err) {
      console.error(err);
      return message.reply("❌ Errore nella riproduzione (VPS).");
    }
  },
};
