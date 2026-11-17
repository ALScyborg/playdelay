/**
 * Team radio directory. Stations and conferences come from teams.js.
 * Play-by-play names are a separate, reviewed list — never guessed.
 * A missing name renders as a dash.
 */
(() => {
  "use strict";

  const root = document.getElementById("radioDirectory");
  const teamsApi = window.PlayDelayTeams;
  if (!root || !teamsApi) return;

  /**
   * Football play-by-play unless the note says otherwise.
   * Included only when a 2026 athletics page, official game note,
   * flagship-station page, or game-day broadcast listing named the voice.
   */
  const VOICES = {
    arizona: "Brian Jeffries (football)",
    asu: "Tim Healey (football and men’s basketball)",
    baylor: "John Morris (football)",
    byu: "Greg Wrubell (football and men’s basketball)",
    cincinnati: "Dan Hoard (football; Mo Egger on at least one 2026 date)",
    houston: "Kevin Eschenfelder (football)",
    iowa_state: "John Walters (football)",
    kansas: "Brian Hanni (football)",
    kansas_state: "Wyatt Thompson (football, on the K-State network — not streaming here yet)",
    oklahoma_state: "Dave Hunziker (football and men’s basketball)",
    tcu: "Brian Estridge (football)",
    ucf: "Marc Daniels",
    utah: "Bill Riley (football and men’s basketball)",
    west_virginia: "Tony Caridi (football and men’s basketball)",
    usc: "Pete Arbogast is on the English ESPN LA game-day broadcast; that note does not label the play-by-play seat. Spanish play-by-play: Harry Ruiz.",
    nebraska: "Kyle Crooks (football); Kent Pavelka (men’s basketball)",
    lsu: "Chris Blair (football and men’s basketball)",
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch];
    });
  }

  const parts = [];
  teamsApi.GROUP_ORDER.forEach((group) => {
    const ids = teamsApi.idsForGroup(group);
    if (!ids.length) return;
    parts.push('<section class="radio-group">');
    parts.push("<h2>" + esc(teamsApi.GROUP_LABELS[group] || group) + "</h2>");
    parts.push('<div class="radio-table-wrap">');
    parts.push('<table class="radio-table">');
    parts.push(
      "<thead><tr><th>Team</th><th>Flagship in PlayDelay</th><th>Play-by-play</th></tr></thead><tbody>"
    );
    ids.forEach((id) => {
      const team = teamsApi.get(id);
      if (!team) return;
      const station = team.streamUrl
        ? team.station
        : "No stream in the player yet";
      const voice = VOICES[id] || "—";
      const voiceClass = VOICES[id] ? "" : ' class="radio-missing"';
      parts.push("<tr>");
      parts.push("<td data-label=\"Team\">" + esc(team.label) + "</td>");
      parts.push("<td data-label=\"Flagship in PlayDelay\">" + esc(station) + "</td>");
      parts.push(
        "<td data-label=\"Play-by-play\"" +
          voiceClass +
          ">" +
          esc(voice) +
          "</td>"
      );
      parts.push("</tr>");
    });
    parts.push("</tbody></table></div></section>");
  });

  root.innerHTML = parts.join("");
})();
