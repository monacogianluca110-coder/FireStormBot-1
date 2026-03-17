module.exports = {
  PANEL_CHANNEL_ID: "1483483540153831519",
  LOG_CHANNEL_ID: "1483483895956766914",
  STAFF_ROLE_ID: "1483484839867977868",

  TYPES: {
    supporto: {
      label: "Supporto",
      emoji: "🔵",
      name: "supporto",
      buttonStyle: 1, // Primary (blu)
      description: "Hai bisogno di aiuto o assistenza generale."
    },
    partnership: {
      label: "Partnership",
      emoji: "🟡",
      name: "partnership",
      buttonStyle: 2, // Secondary (usiamo emoji gialla)
      description: "Richieste partnership, collaborazioni o proposte."
    },
    segnalazione: {
      label: "Segnalazione",
      emoji: "🔴",
      name: "segnalazione",
      buttonStyle: 4, // Danger (rosso)
      description: "Segnala problemi, utenti o situazioni da controllare."
    }
  }
};
