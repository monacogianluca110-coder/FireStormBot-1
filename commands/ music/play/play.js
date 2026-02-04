const play = require("play-dl");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

const players = new Map();

module.exports = {
  name: "p", // f!p

  async execute(message, args) {
    const query = args.join(" ").trim();
    if (!query) {
      return message.reply("❌ Usa: `f!p <link o nome canzone>`");
    }

    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply("❌ Devi essere in un canale vocale.");
    }

    let searchQuery = query;

    try {
      // 🎧 SPOTIFY LINK → converte in ricerca YouTube
      if (play.sp_validate(query) === "track") {
        const spData = await play.spotify(query);
        searchQuery = `${spData.name} ${spData.artists[0].name}`;
      }

      // 🔍 Cerca SEMPRE su YouTube
      const results = await play.search(searchQuery, { limit: 1 });
      if (!results.length) {
        return message.reply("❌ Nessun risultato trovato.");
      }

      const video = results[0];
      const stream = await play.stream(video.url);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

      let player = players.get(message.guild.id);
      if (!player) {
        player = createAudioPlayer();
        players.set(message.guild.id, player);

        player.on(AudioPlayerStatus.Idle, () => {
          try { connection.destroy(); } catch {}
          players.delete(message.guild.id);
        });
      }

      connection.subscribe(player);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      player.play(resource);

      await message.channel.send(`▶️ **Ora in riproduzione:** **${video.title}**`);
    } catch (err) {
      console.error(err);
      return message.reply("❌ Errore nella riproduzione.");
    }
  },
};
