/**
 * PlayDelay — shared team registry (Big 12 + Miami + USC).
 * Source of truth for ids, ESPN ids, streams, colors, groups.
 */
(() => {
  "use strict";

  /** @typedef {{ id: string, espnId: string, label: string, shortLabel?: string, station: string, streamUrl: string|null, accent: string, title: string, shortTitle: string, group: "big12"|"other", theme: { primary: string, bright: string, accent: string, bg: string, elevated: string, button: string, buttonHover: string, border: string, themeColor: string } }} TeamDef */

  /** @type {Record<string, TeamDef>} */
  const TEAMS = {
    arizona: {
      id: "arizona",
      espnId: "12",
      label: "Arizona",
      shortLabel: "ARIZ",
      station: "Coming soon",
      streamUrl: null,
      accent: "arizona",
      title: "Arizona — PlayDelay",
      shortTitle: "Arizona",
      group: "big12",
      theme: {
        primary: "#cc0033",
        bright: "#e6003a",
        accent: "#003366",
        bg: "#12080c",
        elevated: "#1e1016",
        button: "#2a141c",
        buttonHover: "#381a24",
        border: "rgba(204, 0, 51, 0.22)",
        themeColor: "#1a0508",
      },
    },
    asu: {
      id: "asu",
      espnId: "9",
      label: "ASU",
      shortLabel: "ASU",
      station: "Arizona Sports 98.7",
      streamUrl: "https://bonneville.cdnstream1.com/2699_48.aac",
      accent: "maroon",
      title: "ASU · Arizona Sports 98.7 — PlayDelay",
      shortTitle: "ASU Radio",
      group: "big12",
      theme: {
        primary: "#8c1d40",
        bright: "#a8244f",
        accent: "#ffc627",
        bg: "#140a10",
        elevated: "#221018",
        button: "#2e1520",
        buttonHover: "#3c1c2a",
        border: "rgba(255, 198, 39, 0.16)",
        themeColor: "#1a0a12",
      },
    },
    baylor: {
      id: "baylor",
      espnId: "239",
      label: "Baylor",
      shortLabel: "BAY",
      station: "Coming soon",
      streamUrl: null,
      accent: "baylor",
      title: "Baylor — PlayDelay",
      shortTitle: "Baylor",
      group: "big12",
      theme: {
        primary: "#154734",
        bright: "#1c5c43",
        accent: "#ffb81c",
        bg: "#0a120e",
        elevated: "#122018",
        button: "#1a2e24",
        buttonHover: "#223a2e",
        border: "rgba(255, 184, 28, 0.18)",
        themeColor: "#0a120e",
      },
    },
    byu: {
      id: "byu",
      espnId: "252",
      label: "BYU",
      shortLabel: "BYU",
      station: "KSL NewsRadio",
      streamUrl: "https://bonneville.cdnstream1.com/2704_48.aac",
      accent: "navy",
      title: "BYU · KSL — PlayDelay",
      shortTitle: "BYU Radio",
      group: "big12",
      theme: {
        primary: "#002e5d",
        bright: "#0a4a8a",
        accent: "#f0c14b",
        bg: "#0a1628",
        elevated: "#122038",
        button: "#1a2c48",
        buttonHover: "#243858",
        border: "rgba(240, 193, 75, 0.16)",
        themeColor: "#0a1628",
      },
    },
    cincinnati: {
      id: "cincinnati",
      espnId: "2132",
      label: "Cincinnati",
      shortLabel: "CIN",
      station: "Coming soon",
      streamUrl: null,
      accent: "cincinnati",
      title: "Cincinnati — PlayDelay",
      shortTitle: "Cincinnati",
      group: "big12",
      theme: {
        primary: "#e00122",
        bright: "#ff1a3a",
        accent: "#000000",
        bg: "#140808",
        elevated: "#220e0e",
        button: "#301414",
        buttonHover: "#3e1a1a",
        border: "rgba(224, 1, 34, 0.22)",
        themeColor: "#140808",
      },
    },
    colorado: {
      id: "colorado",
      espnId: "38",
      label: "Colorado",
      shortLabel: "COLO",
      station: "Coming soon",
      streamUrl: null,
      accent: "colorado",
      title: "Colorado — PlayDelay",
      shortTitle: "Colorado",
      group: "big12",
      theme: {
        primary: "#cfb87c",
        bright: "#e0cc96",
        accent: "#000000",
        bg: "#12100a",
        elevated: "#1e1a12",
        button: "#2a2418",
        buttonHover: "#383020",
        border: "rgba(207, 184, 124, 0.22)",
        themeColor: "#12100a",
      },
    },
    houston: {
      id: "houston",
      espnId: "248",
      label: "Houston",
      shortLabel: "HOU",
      station: "Coming soon",
      streamUrl: null,
      accent: "houston",
      title: "Houston — PlayDelay",
      shortTitle: "Houston",
      group: "big12",
      theme: {
        primary: "#c8102e",
        bright: "#e01436",
        accent: "#ffffff",
        bg: "#14080a",
        elevated: "#221014",
        button: "#2e151c",
        buttonHover: "#3c1c24",
        border: "rgba(200, 16, 46, 0.22)",
        themeColor: "#14080a",
      },
    },
    iowa_state: {
      id: "iowa_state",
      espnId: "66",
      label: "Iowa State",
      shortLabel: "ISU",
      station: "Coming soon",
      streamUrl: null,
      accent: "iowa_state",
      title: "Iowa State — PlayDelay",
      shortTitle: "Iowa State",
      group: "big12",
      theme: {
        primary: "#c8102e",
        bright: "#e01436",
        accent: "#f1be48",
        bg: "#14080a",
        elevated: "#221014",
        button: "#2e151c",
        buttonHover: "#3c1c24",
        border: "rgba(241, 190, 72, 0.2)",
        themeColor: "#14080a",
      },
    },
    kansas: {
      id: "kansas",
      espnId: "2305",
      label: "Kansas",
      shortLabel: "KU",
      station: "Coming soon",
      streamUrl: null,
      accent: "kansas",
      title: "Kansas — PlayDelay",
      shortTitle: "Kansas",
      group: "big12",
      theme: {
        primary: "#0051ba",
        bright: "#1a6ad4",
        accent: "#e8000d",
        bg: "#0a1020",
        elevated: "#121a30",
        button: "#1a2440",
        buttonHover: "#243050",
        border: "rgba(0, 81, 186, 0.28)",
        themeColor: "#0a1020",
      },
    },
    kansas_state: {
      id: "kansas_state",
      espnId: "2306",
      label: "Kansas State",
      shortLabel: "KSU",
      station: "Coming soon",
      streamUrl: null,
      accent: "kansas_state",
      title: "Kansas State — PlayDelay",
      shortTitle: "Kansas State",
      group: "big12",
      theme: {
        primary: "#512888",
        bright: "#6a3aa8",
        accent: "#ffffff",
        bg: "#100a18",
        elevated: "#1a1228",
        button: "#241a34",
        buttonHover: "#302240",
        border: "rgba(81, 40, 136, 0.3)",
        themeColor: "#100a18",
      },
    },
    oklahoma_state: {
      id: "oklahoma_state",
      espnId: "197",
      label: "Oklahoma State",
      shortLabel: "OKST",
      station: "Coming soon",
      streamUrl: null,
      accent: "oklahoma_state",
      title: "Oklahoma State — PlayDelay",
      shortTitle: "Oklahoma State",
      group: "big12",
      theme: {
        primary: "#ff7300",
        bright: "#ff8a26",
        accent: "#000000",
        bg: "#140c06",
        elevated: "#22140c",
        button: "#2e1c12",
        buttonHover: "#3c2418",
        border: "rgba(255, 115, 0, 0.24)",
        themeColor: "#140c06",
      },
    },
    tcu: {
      id: "tcu",
      espnId: "2628",
      label: "TCU",
      shortLabel: "TCU",
      station: "Coming soon",
      streamUrl: null,
      accent: "tcu",
      title: "TCU — PlayDelay",
      shortTitle: "TCU",
      group: "big12",
      theme: {
        primary: "#4d1979",
        bright: "#6622a0",
        accent: "#a3a9ac",
        bg: "#100a16",
        elevated: "#1a1224",
        button: "#241a32",
        buttonHover: "#302240",
        border: "rgba(77, 25, 121, 0.3)",
        themeColor: "#100a16",
      },
    },
    texas_tech: {
      id: "texas_tech",
      espnId: "2641",
      label: "Texas Tech",
      shortLabel: "TTU",
      station: "Coming soon",
      streamUrl: null,
      accent: "texas_tech",
      title: "Texas Tech — PlayDelay",
      shortTitle: "Texas Tech",
      group: "big12",
      theme: {
        primary: "#cc0000",
        bright: "#e60000",
        accent: "#000000",
        bg: "#140808",
        elevated: "#220e0e",
        button: "#301414",
        buttonHover: "#3e1a1a",
        border: "rgba(204, 0, 0, 0.24)",
        themeColor: "#140808",
      },
    },
    ucf: {
      id: "ucf",
      espnId: "2116",
      label: "UCF",
      shortLabel: "UCF",
      station: "Coming soon",
      streamUrl: null,
      accent: "ucf",
      title: "UCF — PlayDelay",
      shortTitle: "UCF",
      group: "big12",
      theme: {
        primary: "#ba9b37",
        bright: "#d4b44a",
        accent: "#000000",
        bg: "#12100a",
        elevated: "#1e1a12",
        button: "#2a2418",
        buttonHover: "#383020",
        border: "rgba(186, 155, 55, 0.24)",
        themeColor: "#12100a",
      },
    },
    utah: {
      id: "utah",
      espnId: "254",
      label: "Utah",
      shortLabel: "UTAH",
      station: "ESPN 700 KALL",
      streamUrl: "https://ais-sa1.streamon.fm/7349_48k.aac",
      accent: "crimson",
      title: "Utah · ESPN 700 — PlayDelay",
      shortTitle: "Utah Radio",
      group: "big12",
      theme: {
        primary: "#8b1538",
        bright: "#a01840",
        accent: "#f0c4ce",
        bg: "#12070a",
        elevated: "#1e0c12",
        button: "#2a1018",
        buttonHover: "#3a1620",
        border: "rgba(255, 200, 210, 0.14)",
        themeColor: "#1a0508",
      },
    },
    west_virginia: {
      id: "west_virginia",
      espnId: "277",
      label: "West Virginia",
      shortLabel: "WVU",
      station: "Coming soon",
      streamUrl: null,
      accent: "west_virginia",
      title: "West Virginia — PlayDelay",
      shortTitle: "West Virginia",
      group: "big12",
      theme: {
        primary: "#002855",
        bright: "#0a3a78",
        accent: "#eaaa00",
        bg: "#0a1220",
        elevated: "#121a30",
        button: "#1a2440",
        buttonHover: "#243050",
        border: "rgba(234, 170, 0, 0.2)",
        themeColor: "#0a1220",
      },
    },
    usc: {
      id: "usc",
      espnId: "30",
      label: "USC",
      shortLabel: "USC",
      station: "ESPN LA 710",
      streamUrl: "https://live.amperwave.net/direct/goodkarma-kspnamaac-ibc",
      accent: "cardinal",
      title: "USC · ESPN LA 710 — PlayDelay",
      shortTitle: "USC Radio",
      group: "other",
      theme: {
        primary: "#990000",
        bright: "#b30000",
        accent: "#ffcc00",
        bg: "#140808",
        elevated: "#220e0e",
        button: "#301414",
        buttonHover: "#3e1a1a",
        border: "rgba(255, 204, 0, 0.16)",
        themeColor: "#1a0c0c",
      },
    },
    miami: {
      id: "miami",
      espnId: "2390",
      label: "Miami",
      shortLabel: "MIA",
      station: "Coming soon",
      streamUrl: null,
      accent: "miami",
      title: "Miami — PlayDelay",
      shortTitle: "Miami",
      group: "other",
      theme: {
        primary: "#f47321",
        bright: "#ff8a3d",
        accent: "#005030",
        bg: "#140c08",
        elevated: "#221610",
        button: "#2e1e16",
        buttonHover: "#3c2820",
        border: "rgba(244, 115, 33, 0.24)",
        themeColor: "#140c08",
      },
    },
  };

  const TEAM_IDS = Object.keys(TEAMS);
  const VALID = new Set(TEAM_IDS);

  const LIVE_STREAM_IDS = ["byu", "utah", "asu", "usc"].filter(
    (id) => TEAMS[id] && TEAMS[id].streamUrl
  );
  const LIVE_STREAM_LABELS = LIVE_STREAM_IDS.map((id) => TEAMS[id].label);

  const BIG12_ORDER = [
    "arizona",
    "asu",
    "baylor",
    "byu",
    "cincinnati",
    "colorado",
    "houston",
    "iowa_state",
    "kansas",
    "kansas_state",
    "oklahoma_state",
    "tcu",
    "texas_tech",
    "ucf",
    "utah",
    "west_virginia",
  ];
  const OTHER_ORDER = ["usc", "miami"];

  function isValid(id) {
    return VALID.has(id);
  }

  function get(id) {
    return TEAMS[id] || null;
  }

  function readStoredTeamId(fallback) {
    try {
      const raw = localStorage.getItem("playdelay.lastTeam");
      if (raw && VALID.has(raw)) return raw;
    } catch (_) {}
    return fallback || "byu";
  }

  function persistTeam(id) {
    if (!VALID.has(id)) return;
    try {
      localStorage.setItem("playdelay.lastTeam", id);
    } catch (_) {}
  }

  function applyThemeVars(team) {
    if (!team || !team.theme) return;
    const t = team.theme;
    const root = document.documentElement;
    root.style.setProperty("--team-primary", t.primary);
    root.style.setProperty("--team-bright", t.bright);
    root.style.setProperty("--team-accent", t.accent);
    root.style.setProperty("--team-bg", t.bg);
    root.style.setProperty("--team-elevated", t.elevated);
    root.style.setProperty("--team-button", t.button);
    root.style.setProperty("--team-button-hover", t.buttonHover);
    root.style.setProperty("--team-border", t.border);
  }

  /** TEAM_META shape used by schedule.js */
  function teamMetaMap() {
    const out = {};
    for (const id of TEAM_IDS) {
      const t = TEAMS[id];
      out[id] = {
        id: t.id,
        espnId: t.espnId,
        label: t.label,
        shortLabel: t.shortLabel || t.label,
        group: t.group,
        hasStream: !!t.streamUrl,
      };
    }
    return out;
  }

  function orderedIds() {
    return BIG12_ORDER.concat(OTHER_ORDER);
  }

  window.PlayDelayTeams = {
    TEAMS,
    TEAM_IDS,
    VALID,
    LIVE_STREAM_IDS,
    LIVE_STREAM_LABELS,
    BIG12_ORDER,
    OTHER_ORDER,
    isValid,
    get,
    readStoredTeamId,
    persistTeam,
    applyThemeVars,
    teamMetaMap,
    orderedIds,
  };
})();
