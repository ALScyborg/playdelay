/**
 * PlayDelay — shared team registry (Big 12, Big Ten, ACC).
 * Source of truth for ids, ESPN ids, streams, colors, conference groups.
 * Favorites is UI-only (user list) — not a TeamDef.group.
 */
(() => {
  "use strict";

  /** @typedef {{ id: string, espnId: string, label: string, shortLabel?: string, station: string, streamUrl: string|null, accent: string, title: string, shortTitle: string, group: "big12"|"bigten"|"acc", theme: { primary: string, bright: string, accent: string, bg: string, elevated: string, button: string, buttonHover: string, border: string, themeColor: string } }} TeamDef */

  /** @type {Record<string, TeamDef>} */
  const TEAMS = {
    arizona: {
      id: "arizona",
      espnId: "12",
      label: "Arizona",
      shortLabel: "ARIZ",
      station: "Wildcats Radio 1290 KCUB",
      streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/KCUBAMAAC.aac",
      accent: "arizona",
      title: "Arizona · Wildcats Radio 1290 KCUB — PlayDelay",
      shortTitle: "Arizona Radio",
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
      station: "ESPN Central Texas KRZI",
      streamUrl: "https://ais-sa1.streamon.fm/7050_24k.aac",
      accent: "baylor",
      title: "Baylor · ESPN Central Texas KRZI — PlayDelay",
      shortTitle: "Baylor Radio",
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
      station: "NewsRadio 700 WLW",
      streamUrl: "https://stream.revma.ihrhls.com/zc1713",
      accent: "cincinnati",
      title: "Cincinnati · NewsRadio 700 WLW — PlayDelay",
      shortTitle: "Cincinnati Radio",
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
      station: "KOA 850/94.1",
      streamUrl: "https://stream.revma.ihrhls.com/zc389",
      accent: "colorado",
      title: "Colorado · KOA 850/94.1 — PlayDelay",
      shortTitle: "Colorado Radio",
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
      station: "KPRC 950",
      streamUrl: "https://stream.revma.ihrhls.com/zc2277",
      accent: "houston",
      title: "Houston · KPRC 950 — PlayDelay",
      shortTitle: "Houston Radio",
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
      station: "NewsTalk 1430 KASI",
      streamUrl: "https://stream.revma.ihrhls.com/zc4060",
      accent: "iowa_state",
      title: "Iowa State · NewsTalk 1430 KASI — PlayDelay",
      shortTitle: "Iowa State Radio",
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
      station: "Sports Radio 810 WHB",
      streamUrl: "https://live.amperwave.net/direct/unionbroadcasting-whbamaac-ibc2",
      accent: "kansas",
      title: "Kansas · Sports Radio 810 WHB — PlayDelay",
      shortTitle: "Kansas Radio",
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
      station: "HOT 93.7 KSPI-FM",
      streamUrl: "https://ice24.securenetsystems.net/KSPIFM",
      accent: "oklahoma_state",
      title: "Oklahoma State · HOT 93.7 KSPI-FM — PlayDelay",
      shortTitle: "Oklahoma State Radio",
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
      station: "Lone Star 92.5 KZPS",
      streamUrl: "https://stream.revma.ihrhls.com/zc3379",
      accent: "tcu",
      title: "TCU · Lone Star 92.5 KZPS — PlayDelay",
      shortTitle: "TCU Radio",
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
      station: "Double T 97.3 KTTU",
      streamUrl: "https://ais-sa1.streamon.fm/7001_48k.aac",
      accent: "texas_tech",
      title: "Texas Tech · Double T 97.3 KTTU — PlayDelay",
      shortTitle: "Texas Tech Radio",
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
      station: "96.9/740 The Game WYGM",
      streamUrl: "https://stream.revma.ihrhls.com/zc601",
      accent: "ucf",
      title: "UCF · 96.9/740 The Game WYGM — PlayDelay",
      shortTitle: "UCF Radio",
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
      station: "WVAQ 101.9",
      streamUrl: "https://live.amperwave.net/direct/wvradio-wvaqfmaac-imc2",
      accent: "west_virginia",
      title: "West Virginia · WVAQ 101.9 — PlayDelay",
      shortTitle: "West Virginia Radio",
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
      group: "bigten",
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
    nebraska: {
      id: "nebraska",
      espnId: "158",
      label: "Nebraska",
      shortLabel: "NEB",
      station: "1400 & 99.3 KLIN",
      streamUrl: "https://playerservices.streamtheworld.com/api/livestream-redirect/KLINAMAAC.aac",
      accent: "nebraska",
      title: "Nebraska · 1400 & 99.3 KLIN — PlayDelay",
      shortTitle: "Nebraska Radio",
      group: "bigten",
      theme: {
        primary: "#e31937",
        bright: "#ff2a4a",
        accent: "#ffffff",
        bg: "#140808",
        elevated: "#220e0e",
        button: "#301414",
        buttonHover: "#3e1a1a",
        border: "rgba(227, 25, 55, 0.24)",
        themeColor: "#140808",
      },
    },
    miami: {
      id: "miami",
      espnId: "2390",
      label: "Miami",
      shortLabel: "MIA",
      station: "WQAM 104.3",
      streamUrl: "https://live.amperwave.net/direct/audacy-wqamfmaac-imc",
      accent: "miami",
      title: "Miami · WQAM 104.3 — PlayDelay",
      shortTitle: "Miami Radio",
      group: "acc",
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

  const LIVE_STREAM_IDS = TEAM_IDS.filter(
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
  const BIGTEN_ORDER = ["nebraska", "usc"];
  const ACC_ORDER = ["miami"];

  /** Conference display order for pickers / chips (favorites is UI-only). */
  const GROUP_ORDER = ["big12", "bigten", "acc"];
  const GROUP_LABELS = {
    big12: "Big 12",
    bigten: "Big Ten",
    acc: "ACC",
  };
  const GROUP_IDS = {
    big12: BIG12_ORDER,
    bigten: BIGTEN_ORDER,
    acc: ACC_ORDER,
  };

  /** Default visible favorites in the player team picker (huge taps). */
  const FAVORITE_ORDER = ["byu", "utah", "asu", "usc", "miami", "arizona"];

  function isValid(id) {
    return VALID.has(id);
  }

  function get(id) {
    return TEAMS[id] || null;
  }

  /** ESPN CDN team logo (200×200 PNG). */
  function logoUrl(espnId) {
    if (espnId == null || espnId === "") return "";
    return (
      "https://a.espncdn.com/i/teamlogos/ncaa/500/" +
      encodeURIComponent(String(espnId)) +
      ".png"
    );
  }

  /** Safe <img> markup for team logos; hides itself on error. */
  function logoImgHtml(espnId, size) {
    const url = logoUrl(espnId);
    if (!url) return "";
    const s = size || 36;
    return (
      '<img class="team-logo" src="' +
      url +
      '" alt="" width="' +
      s +
      '" height="' +
      s +
      '" loading="lazy" decoding="async" onerror="this.hidden=true">'
    );
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
        logoUrl: logoUrl(t.espnId),
      };
    }
    return out;
  }

  function idsForGroup(group) {
    return (GROUP_IDS[group] || []).slice();
  }

  function orderedIds() {
    const out = [];
    for (const g of GROUP_ORDER) {
      out.push.apply(out, idsForGroup(g));
    }
    return out;
  }

  window.PlayDelayTeams = {
    TEAMS,
    TEAM_IDS,
    VALID,
    LIVE_STREAM_IDS,
    LIVE_STREAM_LABELS,
    BIG12_ORDER,
    BIGTEN_ORDER,
    ACC_ORDER,
    GROUP_ORDER,
    GROUP_LABELS,
    GROUP_IDS,
    FAVORITE_ORDER,
    isValid,
    get,
    logoUrl,
    logoImgHtml,
    readStoredTeamId,
    persistTeam,
    applyThemeVars,
    teamMetaMap,
    idsForGroup,
    orderedIds,
  };
})();
