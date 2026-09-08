/**
 * PlayDelay BYU — KSL NewsRadio with AudioWorklet delay.
 * Sound-first: never leave a captured <audio> silent after a failed graph.
 */
(() => {
  "use strict";

  const STREAM_URL = "https://bonneville.cdnstream1.com/2704_48.aac";
  const WORKLET_URL = "./worklets/delay-processor.js";
  const MAX_DELAY = 120;

  const playBtn = document.getElementById("playBtn");
  const muteBtn = document.getElementById("muteBtn");
  const volumeEl = document.getElementById("volume");
  const delayValueEl = document.getElementById("delayValue");
  const statusChip = document.getElementById("statusChip");
  const bannerEl = document.getElementById("banner");
  const toastEl = document.getElementById("toast");
  const presetButtons = Array.from(document.querySelectorAll("[data-delay]"));
  const stepButtons = Array.from(document.querySelectorAll("[data-delta]"));
  const audioHost = document.getElementById("audio");

  /** @type {HTMLAudioElement} */
  let audio = audioHost;

  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {AudioWorkletNode | null} */
  let delayNode = null;
  /** @type {MediaElementAudioSourceNode | null} */
  let sourceNode = null;
  /** @type {GainNode | null} */
  let gainNode = null;
  /** @type {AnalyserNode | null} */
  let analyser = null;

  let targetDelay = 0;
  let displayDelay = 0;
  let usingWorklet = false;
  let workletFailed = false;
  let workletFailReason = "";
  let isPlaying = false;
  let toastTimer = 0;
  let silenceWatch = 0;
  let workletModuleLoaded = false;

  function freshAudio(crossOrigin) {
    const el = document.createElement("audio");
    el.id = "audio";
    el.preload = "auto";
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    if (crossOrigin) el.crossOrigin = "anonymous";
    el.src = STREAM_URL;
    // Replace previous element (MediaElementSource permanently captures one)
    if (audio && audio.parentNode) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.replaceWith(el);
    } else if (audioHost && audioHost.parentNode && audio === audioHost) {
      audioHost.replaceWith(el);
    } else {
      document.body.appendChild(el);
    }
    wireAudioEvents(el);
    audio = el;
    return el;
  }

  function setStatus(kind, label) {
    statusChip.textContent = label;
    statusChip.className = "status-chip status-" + kind;
  }

  function showBanner(message, isError) {
    bannerEl.hidden = !message;
    bannerEl.textContent = message || "";
    bannerEl.classList.toggle("banner-error", !!isError);
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.hidden = true;
    }, 3600);
  }

  function formatDelay(seconds) {
    const s = Math.max(0, Math.min(MAX_DELAY, seconds));
    if (s < 0.05) return "Live";
    if (Math.abs(s - Math.round(s)) < 0.05) return Math.round(s) + "s";
    return s.toFixed(1) + "s";
  }

  function updateDelayUI() {
    delayValueEl.textContent = formatDelay(
      usingWorklet ? displayDelay : targetDelay
    );
    presetButtons.forEach((btn) => {
      const v = Number(btn.dataset.delay);
      const active =
        (v === 0 && targetDelay < 0.05) ||
        (v > 0 && Math.abs(targetDelay - v) < 0.05);
      btn.classList.toggle("is-active", active);
    });
  }

  function applyVolume() {
    const vol = Number(volumeEl.value);
    const muted = muteBtn.getAttribute("aria-pressed") === "true";
    if (usingWorklet && gainNode && audioCtx) {
      gainNode.gain.value = muted ? 0 : vol;
      audio.muted = false; // MES routes to graph; do not mute element (silences input in some browsers)
      audio.volume = 1;
    } else {
      audio.muted = muted;
      audio.volume = muted ? 0 : vol;
    }
  }

  function setMute(muted) {
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    muteBtn.textContent = muted ? "Unmute" : "Mute";
    applyVolume();
  }

  function sendDelayToWorklet(seconds) {
    if (!delayNode) return;
    delayNode.port.postMessage({ type: "setDelay", seconds });
  }

  function rememberDelayPreference(seconds) {
    const auth = window.PlayDelayAuth;
    if (!auth) return;
    const session = auth.getSession();
    if (!session) return;
    auth.setPrefs(session.email, { lastDelay: seconds });
  }

  function restoreDelayPreference() {
    const auth = window.PlayDelayAuth;
    if (!auth) return;
    const session = auth.getSession();
    if (!session) return;
    const prefs = auth.getPrefs(session.email);
    if (typeof prefs.lastDelay === "number" && prefs.lastDelay >= 0) {
      setDelay(prefs.lastDelay, { fromUser: false });
    }
  }

  function setDelay(seconds, { fromUser = true } = {}) {
    const next = Math.max(0, Math.min(MAX_DELAY, seconds));

    if (!usingWorklet && fromUser && next > 0) {
      showToast(
        workletFailReason ||
          "Delay needs Web Audio. Playing live sound only — delay the TV if radio is behind."
      );
      showBanner(
        "Playing without delay engine. Live audio still works. If radio is ahead of TV, we need CORS-friendly Web Audio; otherwise delay the TV.",
        false
      );
      targetDelay = 0;
      displayDelay = 0;
      updateDelayUI();
      return;
    }

    targetDelay = next;
    if (!usingWorklet) displayDelay = next;
    if (usingWorklet) sendDelayToWorklet(next);
    updateDelayUI();
    if (fromUser) rememberDelayPreference(next);
  }

  async function teardownGraph() {
    window.clearTimeout(silenceWatch);
    try {
      if (sourceNode) sourceNode.disconnect();
    } catch (_) {}
    try {
      if (delayNode) delayNode.disconnect();
    } catch (_) {}
    try {
      if (gainNode) gainNode.disconnect();
    } catch (_) {}
    try {
      if (analyser) analyser.disconnect();
    } catch (_) {}
    sourceNode = null;
    delayNode = null;
    gainNode = null;
    analyser = null;
    usingWorklet = false;
    if (audioCtx) {
      try {
        if (audioCtx.state !== "closed") await audioCtx.close();
      } catch (_) {}
      audioCtx = null;
    }
  }

  function rmsLevel() {
    if (!analyser) return 0;
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  async function startDirectPlay(reason) {
    await teardownGraph();
    workletFailed = true;
    workletFailReason =
      reason ||
      "Web Audio delay unavailable for this stream. Live radio still plays.";
    freshAudio(false);
    applyVolume();
    await audio.play();
    usingWorklet = false;
    showBanner(
      "Live sound on (no delay engine). Tap delay later if we get Web Audio working — or delay the TV when radio is behind.",
      false
    );
  }

  async function startWorkletPlay() {
    await teardownGraph();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error("No AudioContext");

    audioCtx = new Ctx();
    if (!workletModuleLoaded) {
      await audioCtx.audioWorklet.addModule(WORKLET_URL);
      workletModuleLoaded = true;
    } else {
      // New context needs the module again
      await audioCtx.audioWorklet.addModule(WORKLET_URL);
    }

    freshAudio(true);
    applyVolume();

    sourceNode = audioCtx.createMediaElementSource(audio);
    delayNode = new AudioWorkletNode(audioCtx, "delay-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    gainNode = audioCtx.createGain();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    delayNode.port.onmessage = (event) => {
      const data = event.data || {};
      if (data.type === "delay" && typeof data.current === "number") {
        displayDelay = data.current;
        updateDelayUI();
      }
    };

    sourceNode.connect(delayNode);
    delayNode.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    usingWorklet = true;
    workletFailed = false;
    sendDelayToWorklet(targetDelay);
    applyVolume();

    if (audioCtx.state === "suspended") await audioCtx.resume();
    await audio.play();

    // If graph is silent (CORS / empty buffers), fall back to direct play.
    window.clearTimeout(silenceWatch);
    silenceWatch = window.setTimeout(async () => {
      if (!isPlaying || !usingWorklet) return;
      const level = rmsLevel();
      if (level < 0.01) {
        console.warn("Worklet path silent (rms=" + level + "); falling back");
        const wasPlaying = isPlaying;
        try {
          await startDirectPlay(
            "Stream blocked Web Audio (often CORS). Switched to live element playback so you still hear radio."
          );
          if (wasPlaying) {
            isPlaying = true;
            playBtn.setAttribute("aria-pressed", "true");
            playBtn.textContent = "Pause";
            setStatus("live", "Live");
            targetDelay = 0;
            displayDelay = 0;
            updateDelayUI();
          }
        } catch (e) {
          console.error(e);
          setStatus("error", "Error");
          showBanner("Could not recover audio. Tap Play again.", true);
        }
      }
    }, 2000);
  }

  async function play() {
    setStatus("loading", "Loading");
    playBtn.disabled = true;
    showBanner("", false);

    try {
      // Prefer delay engine first; silence watchdog falls back to direct audio.
      try {
        await startWorkletPlay();
      } catch (err) {
        console.warn("Worklet play failed, direct fallback", err);
        await startDirectPlay(
          "Could not start delay engine. Playing live radio without delay."
        );
      }

      isPlaying = true;
      playBtn.setAttribute("aria-pressed", "true");
      playBtn.textContent = "Pause";
      setStatus("live", "Live");
      if (!usingWorklet) {
        targetDelay = 0;
        displayDelay = 0;
        updateDelayUI();
      }
    } catch (err) {
      console.error(err);
      isPlaying = false;
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "Play";
      setStatus("error", "Error");
      showBanner(
        "Could not start the stream. Check connection and tap Play again.",
        true
      );
    } finally {
      playBtn.disabled = false;
    }
  }

  function pause() {
    window.clearTimeout(silenceWatch);
    audio.pause();
    isPlaying = false;
    playBtn.setAttribute("aria-pressed", "false");
    playBtn.textContent = "Play";
    setStatus("paused", "Paused");
  }

  async function togglePlay() {
    if (isPlaying && !audio.paused) pause();
    else await play();
  }

  function wireAudioEvents(el) {
    el.addEventListener("waiting", () => {
      if (isPlaying) setStatus("loading", "Loading");
    });
    el.addEventListener("playing", () => {
      if (isPlaying) setStatus("live", "Live");
    });
    el.addEventListener("error", () => {
      setStatus("error", "Error");
      showBanner("Stream error. Tap Play to retry.", true);
      isPlaying = false;
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "Play";
    });
  }

  playBtn.addEventListener("click", () => {
    togglePlay();
  });

  muteBtn.addEventListener("click", () => {
    const muted = muteBtn.getAttribute("aria-pressed") !== "true";
    setMute(muted);
  });

  volumeEl.addEventListener("input", () => {
    if (
      muteBtn.getAttribute("aria-pressed") === "true" &&
      Number(volumeEl.value) > 0
    ) {
      setMute(false);
    }
    applyVolume();
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDelay(Number(btn.dataset.delay)));
  });

  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () =>
      setDelay(targetDelay + Number(btn.dataset.delta))
    );
  });

  wireAudioEvents(audio);
  // Initial element: prepare src without capturing yet
  audio.preload = "auto";
  audio.src = STREAM_URL;

  document.addEventListener("keydown", (event) => {
    const tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "m" || event.key === "M") {
      event.preventDefault();
      setMute(muteBtn.getAttribute("aria-pressed") !== "true");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setDelay(targetDelay + 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setDelay(targetDelay - 1);
    }
  });

  setStatus("idle", "Idle");
  updateDelayUI();
  applyVolume();
  restoreDelayPreference();
  window.addEventListener("playdelay:authchange", () => {
    restoreDelayPreference();
  });
})();
