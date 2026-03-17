const { EmbedBuilder, ChannelType } = require("discord.js");

const LOG_CHANNEL_ID = "1455212328336228393";
const PREFIX = "!"; // cambia se vuoi

function formatTime(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function cut(text, max = 1024) {
  if (!text) return "Nessuno";
  text = String(text);
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

async function getLogChannel(client) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return null;
    return channel;
  } catch {
    return null;
  }
}

async function sendLog(client, embed) {
  const channel = await getLogChannel(client);
  if (!channel) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

function stringifyOptions(interaction) {
  try {
    const data = interaction.options?.data;
    if (!data || !data.length) return "Nessuna opzione";

    const lines = [];

    for (const option of data) {
      if (option.type === 1 || option.type === 2) {
        lines.push(`• **${option.name}**`);

        if (option.options?.length) {
          for (const sub of option.options) {
            if (sub.type === 1 || sub.type === 2) {
              lines.push(`  ↳ **${sub.name}**`);

              if (sub.options?.length) {
                for (const value of sub.options) {
                  lines.push(`    • \`${value.name}\`: \`${JSON.stringify(value.value)}\``);
                }
              }
            } else {
              lines.push(`  • \`${sub.name}\`: \`${JSON.stringify(sub.value)}\``);
            }
          }
        }
      } else {
        lines.push(`• \`${option.name}\`: \`${JSON.stringify(option.value)}\``);
      }
    }

    return cut(lines.join("\n"), 1024);
  } catch {
    return "Impossibile leggere le opzioni";
  }
}

function getCommandPath(interaction) {
  try {
    const commandName = interaction.commandName || "sconosciuto";
    const subcommandGroup = interaction.options?.getSubcommandGroup(false);
    const subcommand = interaction.options?.getSubcommand(false);

    let full = `/${commandName}`;
    if (subcommandGroup) full += ` ${subcommandGroup}`;
    if (subcommand) full += ` ${subcommand}`;

    return full;
  } catch {
    return `/${interaction.commandName || "sconosciuto"}`;
  }
}

function baseUserValue(user) {
  return `${user}\n\`${user.tag}\`\nID: \`${user.id}\``;
}

module.exports = (client) => {
  const commandTimes = new Map();

  // LOG SLASH COMMANDS - avvio
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const startedAt = Date.now();
    commandTimes.set(interaction.id, startedAt);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: "🤖 Comando Eseguito",
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: "👤 Utente",
          value: baseUserValue(interaction.user),
          inline: true,
        },
        {
          name: "⚡ Comando",
          value: `\`${getCommandPath(interaction)}\``,
          inline: true,
        },
        {
          name: "🕒 Orario",
          value: formatTime(),
          inline: true,
        },
        {
          name: "📍 Canale",
          value: interaction.channel
            ? `${interaction.channel}\nID: \`${interaction.channel.id}\``
            : "Sconosciuto",
          inline: true,
        },
        {
          name: "🏠 Server",
          value: interaction.guild
            ? `${interaction.guild.name}\nID: \`${interaction.guild.id}\``
            : "DM",
          inline: true,
        },
        {
          name: "🧭 Tipo",
          value: interaction.guild ? "Comando nel server" : "Comando in DM",
          inline: true,
        },
        {
          name: "🧩 Opzioni usate",
          value: stringifyOptions(interaction),
          inline: false,
        }
      )
      .setFooter({ text: "FireStorm Logs • Commands" })
      .setTimestamp();

    await sendLog(client, embed);
  });

  // LOG ERRORI SLASH COMMANDS
  client.on("commandError", async (data) => {
    try {
      const interaction = data?.interaction;
      const error = data?.error;

      if (!interaction || !interaction.isChatInputCommand()) return;

      const startedAt = commandTimes.get(interaction.id);
      const duration = startedAt ? `${Date.now() - startedAt}ms` : "Sconosciuto";

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setAuthor({
          name: "❌ Errore Comando",
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: "👤 Utente",
            value: baseUserValue(interaction.user),
            inline: true,
          },
          {
            name: "⚡ Comando",
            value: `\`${getCommandPath(interaction)}\``,
            inline: true,
          },
          {
            name: "⏱️ Tempo",
            value: duration,
            inline: true,
          },
          {
            name: "📍 Canale",
            value: interaction.channel
              ? `${interaction.channel}\nID: \`${interaction.channel.id}\``
              : "Sconosciuto",
            inline: true,
          },
          {
            name: "🏠 Server",
            value: interaction.guild
              ? `${interaction.guild.name}\nID: \`${interaction.guild.id}\``
              : "DM",
            inline: true,
          },
          {
            name: "💥 Errore",
            value: `\`\`\`${cut(error?.stack || error?.message || String(error), 900)}\`\`\``,
            inline: false,
          }
        )
        .setFooter({ text: "FireStorm Logs • Command Error" })
        .setTimestamp();

      await sendLog(client, embed);
      commandTimes.delete(interaction.id);
    } catch {}
  });

  // LOG SUCCESSO MANUALE
  client.on("commandSuccess", async (data) => {
    try {
      const interaction = data?.interaction;
      if (!interaction || !interaction.isChatInputCommand()) return;

      const startedAt = commandTimes.get(interaction.id);
      const duration = startedAt ? `${Date.now() - startedAt}ms` : "Sconosciuto";

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setAuthor({
          name: "✅ Comando Completato",
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: "👤 Utente",
            value: baseUserValue(interaction.user),
            inline: true,
          },
          {
            name: "⚡ Comando",
            value: `\`${getCommandPath(interaction)}\``,
            inline: true,
          },
          {
            name: "⏱️ Tempo",
            value: duration,
            inline: true,
          },
          {
            name: "📍 Canale",
            value: interaction.channel
              ? `${interaction.channel}\nID: \`${interaction.channel.id}\``
              : "Sconosciuto",
            inline: true,
          },
          {
            name: "🏠 Server",
            value: interaction.guild
              ? `${interaction.guild.name}\nID: \`${interaction.guild.id}\``
              : "DM",
            inline: true,
          },
          {
            name: "🧩 Opzioni",
            value: stringifyOptions(interaction),
            inline: false,
          }
        )
        .setFooter({ text: "FireStorm Logs • Command Success" })
        .setTimestamp();

      await sendLog(client, embed);
      commandTimes.delete(interaction.id);
    } catch {}
  });

  // LOG COMANDI PREFIX
  client.on("messageCreate", async (message) => {
    try {
      if (!message.content) return;
      if (message.author.bot) return;
      if (!message.content.startsWith(PREFIX)) return;

      const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const embed = new EmbedBuilder()
        .setColor(0xFAA61A)
        .setAuthor({
          name: "⌨️ Comando Testuale Usato",
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          {
            name: "👤 Utente",
            value: `${message.author}\n\`${message.author.tag}\`\nID: \`${message.author.id}\``,
            inline: true,
          },
          {
            name: "⚡ Comando",
            value: `\`${PREFIX}${commandName}\``,
            inline: true,
          },
          {
            name: "🕒 Orario",
            value: formatTime(),
            inline: true,
          },
          {
            name: "📍 Canale",
            value: message.channel
              ? `${message.channel}\nID: \`${message.channel.id}\``
              : "Sconosciuto",
            inline: true,
          },
          {
            name: "🏠 Server",
            value: message.guild
              ? `${message.guild.name}\nID: \`${message.guild.id}\``
              : "DM",
            inline: true,
          },
          {
            name: "🧩 Argomenti",
            value: args.length ? `\`${cut(args.join(" "), 1000)}\`` : "Nessun argomento",
            inline: false,
          },
          {
            name: "💬 Messaggio completo",
            value: `\`${cut(message.content, 1000)}\``,
            inline: false,
          }
        )
        .setFooter({ text: "FireStorm Logs • Prefix Commands" })
        .setTimestamp();

      await sendLog(client, embed);
    } catch {}
  });
};
