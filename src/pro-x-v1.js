/* ==========================================================================
   Studio Editor PRO X 1.0 — upgrade layer
   A self-contained script that runs after the original editor and adds:
   creator tools, safer exports, PWA install, WIX embedding, touch mode,
   memory management, recovery snapshots and a live codec matrix.
   ========================================================================== */
(() => {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 0. Version, state and small helpers
   * ------------------------------------------------------------------ */
  const VERSION = "1.0.0";
  const BUILD = "2026-10-22";
  const APP_NAME = "Studio Editor PRO X";
  const qp = new URLSearchParams(location.search);
  const isHttp = /^https?:$/.test(location.protocol);
  const isFile = location.protocol === "file:";
  const isEmbedded = qp.get("embed") === "1" || (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const LS = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("prox." + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("prox." + key, JSON.stringify(value)); return true; }
      catch { return false; }
    },
    del(key) {
      try { localStorage.removeItem("prox." + key); } catch {}
    }
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const round = (n, p = 1) => Math.round(n * 10 ** p) / 10 ** p;
  const fmtBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(2) + " GB";
  };
  const fmtTime = (s) => {
    s = Math.max(0, Number(s) || 0);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(1).padStart(4, "0")}`
             : `${m}:${sec.toFixed(1).padStart(4, "0")}`;
  };
  const fmtClock = (ts) => {
    try { return new Date(ts).toLocaleString(); } catch { return ""; }
  };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const byId = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  const appToast = window.toast || ((m) => console.log(m));
  let lastToast = "";
  window.toast = function (message, blob, name) {
    lastToast = String(message ?? "");
    try { return appToast.call(window, message, blob, name); }
    catch { return undefined; }
  };
  const say = (message, blob, name) => {
    lastToast = String(message ?? "");
    try { appToast.call(window, message, blob, name); } catch { console.log(message); }
    postToParent("toast", { text: lastToast });
  };

  const S = {
    touch: false,
    compat: false,
    embed: isEmbedded,
    pwa: { installable: false, standalone: false, sw: false, update: false, prompt: null },
    drawer: "",
    hub: "publish",
    cues: [],
    captionStyle: {
      font: "system-ui, sans-serif",
      size: 4.8,
      y: 88,
      bg: 55,
      color: "#ffffff",
      bgc: "#000000",
      bold: 1,
      shadow: 1,
      maxw: 86
    },
    thumb: {
      img: null,
      title: "MY NEXT VIDEO",
      sub: "A short, clear promise goes here",
      badge: "NEW",
      showBadge: true,
      pos: "left",
      template: "bold",
      color: "#ffffff",
      accent: "#378ef0",
      overlay: 58,
      w: 1280,
      h: 720
    },
    tp: {
      text: LS.get("tp.text", "Welcome to Studio Editor PRO X.\n\nPaste your script here, press Start, and read naturally.\n\nThe text scrolls at your own pace."),
      speed: LS.get("tp.speed", 55),
      size: LS.get("tp.size", 64),
      mirror: LS.get("tp.mirror", false),
      playing: false,
      offset: 0,
      raf: 0,
      lock: null
    },
    save: { busy: false, last: 0, dirty: false },
    installed: false,
    init: false
  };

  const DEFAULT_SETTINGS = {
    mobile: "auto",          // auto | on | off
    compat: false,
    quality: "quality",      // quality | balanced
    autosave: true,
    autosaveMin: 2,
    safe: false,
    safeStyle: "all",        // all | title | platform
    accent: "#378ef0",
    showFps: false
  };
  const settings = Object.assign({}, DEFAULT_SETTINGS, LS.get("settings", {}));

  const DEFAULT_BRAND = {
    name: "",
    handle: "",
    color: "#378ef0",
    color2: "#34d3b1",
    logo: "",
    wm: {
      on: false,
      text: "",
      pos: "br",          // tl tc tr bl bc br center
      size: 3.1,          // % of frame height
      opacity: 78,
      plate: false,
      shadow: true
    }
  };
  const brand = Object.assign({}, DEFAULT_BRAND, LS.get("brand", {}));
  brand.wm = Object.assign({}, DEFAULT_BRAND.wm, LS.get("brand", {}).wm || {});

  const saveSettings = () => { LS.set("settings", settings); };
  const saveBrand = () => { LS.set("brand", brand); wmDirty = true; };

  const postToParent = (type, payload = {}) => {
    if (!S.embed) return;
    try {
      const origin = qp.get("origin") || "*";
      window.parent.postMessage({
        source: "studio-pro-x",
        version: VERSION,
        type: "prox:" + type,
        ...payload
      }, origin);
    } catch {}
  };

  const showDialog = (dlg) => {
    try {
      if (dlg && !dlg.open) dlg.showModal();
    } catch {
      try { dlg.setAttribute("open", ""); } catch {}
    }
  };
  const closeDialog = (dlg) => {
    try { if (dlg && dlg.open) dlg.close(); } catch { try { dlg.removeAttribute("open"); } catch {} }
  };

  const stat = (label, value) => `<div class="px-stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;
  const badge = (text, kind = "") => `<span class="px-badge ${kind}">${esc(text)}</span>`;

  /* ------------------------------------------------------------------ *
   * 1. Branding, version, About and What's new
   * ------------------------------------------------------------------ */
  function buildBrandBar() {
    document.title = "Studio Editor PRO X 1.0";
    const top = qs(".top");
    if (!top) return;
    const old = top.querySelector(":scope > b");
    if (old) {
      old.outerHTML = `<div class="px-brand" title="${APP_NAME} ${VERSION}">
        <span class="px-brand-mark">◆</span>
        <span class="px-brand-name">Studio Editor</span>
        <em class="px-brand-pro">PRO X</em>
        <span class="px-ver">1.0</span>
      </div>`;
    }
    const spacer = [...top.children].find((el) => el.tagName === "SPAN" && /flex:\s*1/.test(el.getAttribute("style") || ""));
    if (!spacer) return;

    const creator = document.createElement("button");
    creator.id = "pxHubBtn";
    creator.className = "px-topbtn px-creator";
    creator.title = "Creator Hub — platform presets, captions, thumbnails, audio tools and more (Alt+C)";
    creator.innerHTML = `<span class="px-ico">✦</span><span class="px-txt">Creator</span>`;
    creator.onclick = () => openHub(S.hub);

    const install = document.createElement("button");
    install.id = "pxInstallBtn";
    install.className = "px-topbtn px-install px-hide-embed";
    install.title = "Install Studio Editor as a desktop app";
    install.hidden = true;
    install.innerHTML = `<span class="px-ico">⬇</span><span class="px-txt">Install</span>`;
    install.onclick = () => promptInstall();

    const mem = document.createElement("button");
    mem.id = "pxMemChip";
    mem.className = "px-chip";
    mem.title = "Memory and history — click to manage";
    mem.innerHTML = `<i class="px-dot"></i><span class="px-chiptxt">RAM —</span>`;
    mem.onclick = () => openHub("memory");

    const offline = document.createElement("span");
    offline.className = "px-chip px-offline";
    offline.id = "pxOfflineChip";
    offline.innerHTML = `<i class="px-dot"></i><span class="px-chiptxt">Offline</span>`;

    const update = document.createElement("button");
    update.className = "px-chip px-update";
    update.id = "pxUpdateChip";
    update.innerHTML = `<i class="px-dot"></i><span class="px-chiptxt">Update ready</span>`;
    update.onclick = () => applyUpdate();

    spacer.before(creator, install, mem, offline, update);
    // The original About button stays available on wide screens and is hidden
    // in embed mode by CSS; the Help panel always links to it as well.
  };

  function decorateAbout() {
    const dlg = byId("abt");
    if (!dlg) return;
    const created = "Matthew J Thomas";
    dlg.innerHTML = `
      <h3 style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span class="px-brand-mark" style="width:24px;height:24px">◆</span>
        Studio Editor <span style="color:#34d3b1;font-size:12px;letter-spacing:.12em">PRO X</span>
        <span class="px-badge px-info">1.0</span>
      </h3>
      <div class="px-about-version">VERSION ${VERSION} · BUILD ${BUILD}</div>
      <p style="margin-bottom:6px">Created by ${created}</p>
      <p class="px-muted" style="max-width:520px;margin-bottom:8px">
        A local-first creative studio for photos, video, audio and 3D.
        Your media stays in your browser unless you export it.
      </p>
      <div class="px-about-grid">
        <b>Engine</b><span>Canvas 2D · WebGL · WebAudio</span>
        <b>Video export</b><span>WebCodecs, MediaRecorder, ffmpeg.wasm</span>
        <b>Installable</b><span>PWA (Chrome, Edge, Firefox where supported)</span>
        <b>Embedding</b><span>iframe + postMessage bridge</span>
        <b>Storage</b><span>IndexedDB recovery snapshots</span>
        <b>Touch</b><span>Phone and tablet layout</span>
      </div>
      <div class="px-row" style="margin-top:14px">
        <button class="px-btn px-pri" id="pxAboutCreator">Open Creator Hub</button>
        <button class="px-btn" id="pxAboutInstall">Install app</button>
        <button class="px-btn" id="pxAboutHelp">Help</button>
        <button class="px-btn px-ghost" id="pxAboutClose" style="margin-left:auto">Close</button>
      </div>`;
    byId("pxAboutClose").onclick = () => closeDialog(dlg);
    byId("pxAboutCreator").onclick = () => { closeDialog(dlg); openHub("publish"); };
    byId("pxAboutInstall").onclick = () => { closeDialog(dlg); promptInstall(); };
    byId("pxAboutHelp").onclick = () => { closeDialog(dlg); openHub("help"); };
  }

  function decorateWhatsNew() {
    try {
      if (typeof WN !== "undefined" && Array.isArray(WN) && !WN.some(([t]) => String(t).includes("1.0"))) {
        WN.unshift(["Version 1.0 — the creator update", [
          "Creator Hub with platform sizes for YouTube, Shorts, TikTok, Reels, Instagram, Facebook, LinkedIn and X.",
          "Captions: import SRT/VTT, style them, burn them in and export SRT again.",
          "Thumbnail Studio with templates, badges and one-click PNG export.",
          "Teleprompter with adjustable speed, mirror mode and screen wake lock.",
          "Audio tools: automatic music ducking under speech, silence removal and clip normalization.",
          "Audio tone, tempo and pitch: bass/treble shelves, pitch-preserving tempo from 50% to 200%, pitch from -12 to +12 semitones, plus a non-destructive 1 kHz bleep or silence censor drawn on the timeline.",
          "Watermarks and brand kit with a logo, handle, colours and live preview.",
          "Memory meter, history trimming, media cache cleanup and recovery snapshots.",
          "AV1 and VP9 export options plus a live codec capability matrix.",
          "PWA install, offline shell, install/update controls and a standalone desktop layout.",
          "WIX/iframe embedding with a postMessage API, compact embed mode and open-standalone escape hatch.",
          "Touch layout for phones and tablets: bottom bar, panel drawers and tap-friendly menus.",
          "Compatibility mode for older or low-memory devices."
        ]]);
      }
      const box = byId("wnbox");
      if (box && typeof WN !== "undefined") {
        box.innerHTML = `<h2>What's new</h2>
          <p>Everything added in this version. The latest release is at the top.</p>
          <div class="px-note px-good"><b>PRO X 1.0 is here.</b> The editor is still a single file. Optional PWA files (manifest, service worker and icons) live next to it for install and offline use.</div>` +
          WN.map(([title, items]) => `<div class="wn"><h4>${esc(title)}</h4><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`).join("");
      }
    } catch (e) { console.warn("PRO X: could not update What's new", e); }
  }

  function decorateHelp() {
    try {
      if (typeof HELP !== "object" || !HELP) return;
      HELP.creator = ["Creator", `
        <h4>Creator Hub</h4>
        <p>Open it with <b>✦ Creator</b> in the top bar or <kbd>Alt</kbd>+<kbd>C</kbd>. It collects the publishing tools in one place.</p>
        <h4>Publish</h4>
        <p>Pick a platform to resize the sequence, then use <b>Fill frame</b> to crop or <b>Fit frame</b> to letterbox existing clips. Export presets set a sensible bitrate, frame rate and format.</p>
        <h4>Captions</h4>
        <p>Paste an SRT or VTT file (or choose one), press <b>Parse</b>, then <b>Add to timeline</b>. Captions become subtitle clips on V3, so they appear in preview and exports. <b>Export SRT</b> writes the current caption clips back out.</p>
        <h4>Thumbnail Studio</h4>
        <p>Capture the current video frame or open a picture, add a headline and badge, and download a platform-sized PNG or JPG.</p>
        <h4>Teleprompter</h4>
        <p>Paste a script, press <b>Start</b> and adjust speed, text size or mirror. <kbd>Space</kbd> pauses, <kbd>Esc</kbd> closes. The screen wake lock is requested where the browser supports it.</p>
        <h4>Audio tools</h4>
        <p>Select a music clip on the timeline, then use <b>Duck under voice</b> to keyframe its volume under every other audio clip. <b>Remove silence</b> jump-cuts the selected clip. <b>Normalize</b> raises or lowers its volume.</p>
        <p><b>Bass</b> and <b>treble</b> are shelves up to 15 dB. <b>Tempo</b> changes speed while keeping the pitch; <b>Pitch</b> moves voices up or down without changing the cut. Apply renders a new local WAV for the selected A1 clip, so the preview and every export match. Undo puts the previous source back.</p>
        <p><b>Censor</b>: park the playhead over a word, choose a 1 kHz bleep or silence and press <b>Add censor at playhead</b>. Markers are non-destructive, are drawn on the clip and work on video clips too. They are saved with the project and are included in preview and exports.</p>
        <h4>Brand kit and watermark</h4>
        <p>Set a name, handle, logo and colours. Turn the watermark on to draw it on the program monitor and every export. Text and logo placement is saved in this browser.</p>
        <h4>Memory and recovery</h4>
        <p>The RAM chip opens the memory panel. Trim history, clear audio caches and release orphan media. Recovery snapshots are stored in IndexedDB; restore the latest one from the banner or the panel.</p>
        <h4>Embedding and install</h4>
        <p>See the <b>Embed &amp; PWA</b> panel for the iframe snippet, the postMessage API and install instructions. If a host blocks downloads or full screen, use <b>Open standalone</b>.</p>`];
      const start = HELP.start;
      if (start && !String(start[1]).includes("PRO X 1.0")) {
        start[1] += `\n<h4>New in PRO X 1.0</h4><p>Use the <b>✦ Creator</b> button for captions, thumbnails, a teleprompter, audio ducking, watermarks, platform presets, memory tools and PWA install. On a phone or tablet the editor switches to a touch layout automatically.</p>`;
      }
      // The help nav is rebuilt on each open, so adding HELP.creator is enough.
    } catch (e) { console.warn("PRO X: could not extend help", e); }
  }

  /* ------------------------------------------------------------------ *
   * 2. PWA: manifest, icons, service worker, install and update
   * ------------------------------------------------------------------ */
  function iconDataURL(size, maskable = false) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#1b6fe0");
    g.addColorStop(0.55, "#6f5bff");
    g.addColorStop(1, "#21c9a5");
    x.fillStyle = maskable ? "#101216" : g;
    x.fillRect(0, 0, size, size);
    if (maskable) {
      x.fillStyle = g;
      const r = size * 0.16;
      const pad = size * 0.12;
      const w = size - pad * 2;
      x.beginPath();
      if (x.roundRect) x.roundRect(pad, pad, w, w, r); else x.rect(pad, pad, w, w);
      x.fill();
    } else {
      // Subtle inner highlight.
      x.fillStyle = "rgba(255,255,255,.10)";
      x.beginPath();
      if (x.roundRect) x.roundRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88, size * 0.2);
      else x.rect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);
      x.fill();
    }
    // Play triangle with a small cut-out, like a clapper/play mark.
    x.save();
    x.translate(size / 2, size / 2);
    x.fillStyle = "#ffffff";
    x.beginPath();
    x.moveTo(-size * 0.115, -size * 0.17);
    x.lineTo(size * 0.185, 0);
    x.lineTo(-size * 0.115, size * 0.17);
    x.closePath();
    x.fill();
    x.restore();
    // Accent dot.
    x.fillStyle = "#ffffff";
    x.globalAlpha = 0.9;
    x.beginPath();
    x.arc(size * 0.735, size * 0.265, size * 0.045, 0, 7);
    x.fill();
    x.globalAlpha = 1;
    return c.toDataURL("image/png");
  }

  function addMeta(name, content, prop = false) {
    let m = document.head.querySelector(`meta[${prop ? "property" : "name"}="${name}"]`);
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute(prop ? "property" : "name", name);
      document.head.append(m);
    }
    m.content = content;
  }
  function addLink(rel, href, extra = {}) {
    let l = document.head.querySelector(`link[rel="${rel}"]`);
    if (!l) {
      l = document.createElement("link");
      l.rel = rel;
      document.head.append(l);
    }
    l.href = href;
    Object.entries(extra).forEach(([k, v]) => l.setAttribute(k, v));
    return l;
  }

  async function fetchQuiet(url, opts = {}, ms = 2500) {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), ms) : 0;
    try {
      return await fetch(url, ctl ? { ...opts, signal: ctl.signal } : opts);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function setupPWA() {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    S.pwa.standalone = standalone;
    document.body.classList.toggle("px-standalone", standalone);
    addMeta("theme-color", "#111418");
    addMeta("mobile-web-app-capable", "yes");
    addMeta("apple-mobile-web-app-capable", "yes");
    addMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    addMeta("apple-mobile-web-app-title", "Studio PRO X");
    addMeta("application-name", "Studio Editor PRO X");
    addMeta("description", "Local-first photo, video, audio and 3D studio with creator tools, captions, thumbnails, PWA install and iframe embedding.");
    addLink("apple-touch-icon", iconDataURL(180));
    addLink("icon", iconDataURL(32), { sizes: "32x32", type: "image/png" });

    let href = "";
    if (isHttp) {
      try {
        const res = await fetchQuiet("manifest.webmanifest", { cache: "no-store" }, 2500);
        if (res.ok) href = "manifest.webmanifest";
      } catch {}
    }
    if (!href) {
      const base = location.origin + location.pathname;
      const scope = base.replace(/[^/]*$/, "");
      const manifest = {
        id: base,
        name: APP_NAME,
        short_name: "Studio PRO X",
        description: "Local-first photo, video, audio and 3D studio with creator tools.",
        start_url: base,
        scope,
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        orientation: "any",
        background_color: "#111418",
        theme_color: "#111418",
        categories: ["photo", "video", "productivity"],
        lang: "en",
        dir: "ltr",
        icons: [
          { src: iconDataURL(192), sizes: "192x192", type: "image/png", purpose: "any" },
          { src: iconDataURL(512), sizes: "512x512", type: "image/png", purpose: "any" },
          { src: iconDataURL(512, true), sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        shortcuts: [
          { name: "Video editor", short_name: "Video", url: base + "?workspace=video" },
          { name: "Photo editor", short_name: "Photo", url: base + "?workspace=photo" },
          { name: "Creator Hub", short_name: "Creator", url: base + "?open=creator" }
        ]
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
      href = URL.createObjectURL(blob);
    }
    addLink("manifest", href);

    if ("serviceWorker" in navigator && isHttp) {
      const hadController = !!navigator.serviceWorker.controller;
      try {
        const reg = await navigator.serviceWorker.register("sw.js", { scope: "./" });
        S.pwa.sw = true;
        S.pwa.reg = reg;
        if (reg.waiting) showUpdateReady();
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdateReady();
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!hadController || S.pwa.reloading) return;
          S.pwa.reloading = true;
          location.reload();
        });
      } catch (e) {
        S.pwa.sw = false;
        console.info("PRO X: service worker unavailable (host sw.js next to the app for offline mode).", e && e.message);
      }
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      S.pwa.prompt = e;
      S.pwa.installable = true;
      const btn = byId("pxInstallBtn");
      if (btn) btn.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      S.pwa.installable = false;
      S.pwa.prompt = null;
      S.installed = true;
      const btn = byId("pxInstallBtn");
      if (btn) btn.hidden = true;
      say("Studio Editor PRO X was installed.");
      postToParent("installed", {});
    });

    const updateOnline = () => {
      document.body.classList.toggle("px-is-offline", !navigator.onLine);
    };
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    updateOnline();

    // Firefox on Android and desktop do not expose beforeinstallprompt. Show the
    // button only when the manifest is present and the display mode is not installed.
    if (!standalone && isHttp && !("onbeforeinstallprompt" in window) && /firefox/i.test(navigator.userAgent)) {
      const btn = byId("pxInstallBtn");
      if (btn) btn.hidden = false;
    }
  }

  function showUpdateReady() {
    S.pwa.update = true;
    document.body.classList.add("px-has-update");
  }
  function applyUpdate() {
    const reg = S.pwa.reg;
    if (reg && reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      S.pwa.reloading = true;
      setTimeout(() => location.reload(), 250);
    } else {
      location.reload();
    }
  }
  async function promptInstall() {
    if (S.pwa.standalone) {
      say("You are already running the installed app.");
      return;
    }
    if (S.pwa.prompt) {
      try {
        S.pwa.prompt.prompt();
        const choice = await S.pwa.prompt.userChoice;
        if (choice.outcome === "accepted") say("Installing Studio Editor PRO X…");
        else say("Install cancelled. You can use the browser menu later.");
      } catch (e) { say("The install prompt was not available: " + e.message); }
      S.pwa.prompt = null;
      return;
    }
    if (isFile) {
      say("PWA install needs the file to be served over HTTP or HTTPS. Upload the folder to a site, or use the hosted copy.");
      return;
    }
    const ua = navigator.userAgent;
    const hint = /firefox/i.test(ua)
      ? "In Firefox, open the application menu and choose Install (desktop) or Add to Home screen (Android)."
      : /edg/i.test(ua)
        ? "In Edge, open the … menu → Apps → Install this site as an app."
        : "In Chrome, open the ⋮ menu → Cast, save and share → Install page as app, or click the install icon in the address bar.";
    say(hint);
    openHub("embed");
  }

  /* ------------------------------------------------------------------ *
   * 3. iframe / WIX bridge
   * ------------------------------------------------------------------ */
  function setupEmbed() {
    if (!S.embed) return;
    document.body.classList.add("px-embed");
    const bar = document.createElement("div");
    bar.id = "pxEmbedBar";
    bar.innerHTML = `<span>◆ Studio Editor PRO X · embedded mode</span>
      <span class="px-badge px-info">postMessage ready</span>
      <div class="px-row">
        <button class="px-btn px-sm" id="pxEmbedStandalone">Open standalone</button>
        <button class="px-btn px-sm px-pri" id="pxEmbedCreator">Creator</button>
      </div>`;
    document.body.insertBefore(bar, document.body.firstChild);
    byId("pxEmbedStandalone").onclick = () => {
      try {
        const url = new URL(location.href);
        url.searchParams.delete("embed");
        window.open(url.toString(), "_blank", "noopener");
      } catch { say("Could not open a new tab. Use the address bar to open the editor directly."); }
    };
    byId("pxEmbedCreator").onclick = () => openHub("publish");

    const reportHeight = () => {
      postToParent("height", { height: window.innerHeight, width: window.innerWidth });
    };
    window.addEventListener("resize", reportHeight);
    if (window.ResizeObserver) new ResizeObserver(reportHeight).observe(document.body);
    setTimeout(reportHeight, 50);

    window.addEventListener("message", async (event) => {
      if (event.source !== window.parent && event.source !== window.opener) return;
      const required = qp.get("origin");
      if (required && required !== "*" && event.origin !== required) return;
      const data = event.data;
      if (!data || typeof data !== "object" || typeof data.type !== "string" || !data.type.startsWith("prox:")) return;
      const requestId = data.requestId || null;
      const reply = (type, payload = {}) => {
        try {
          window.parent.postMessage({
            source: "studio-pro-x", version: VERSION, type: "prox:" + type,
            requestId, ...payload
          }, event.origin && event.origin !== "null" ? event.origin : "*");
        } catch {}
      };
      try {
        switch (data.type) {
          case "prox:ping":
            reply("pong", { ready: true, version: VERSION, state: apiState() });
            break;
          case "prox:state":
            reply("state", { state: apiState() });
            break;
          case "prox:openWorkspace": {
            const ws = String(data.workspace || "video");
            if (["photo", "video", "audio", "model", "resources", "whatsnew"].includes(ws)) {
              document.querySelector(`.tab[data-t="${ws}"]`)?.click();
              reply("workspace", { workspace: ws });
            } else reply("error", { message: "Unknown workspace" });
            break;
          }
          case "prox:openCreator":
            openHub(String(data.panel || "publish"));
            reply("creator", { panel: data.panel || "publish" });
            break;
          case "prox:setTheme": {
            const accent = String(data.accent || "").trim();
            if (/^#[0-9a-f]{6}$/i.test(accent)) {
              document.documentElement.style.setProperty("--px-accent", accent);
              document.documentElement.style.setProperty("--ac", accent);
            }
            reply("theme", { accent });
            break;
          }
          case "prox:toast":
            say(String(data.text || ""));
            reply("toast", {});
            break;
          case "prox:loadProject": {
            const blob = await toBlob(data);
            if (!blob) throw new Error("No project bytes were supplied.");
            await loadProjectBlob(blob, false);
            reply("loaded", { size: blob.size });
            break;
          }
          case "prox:getProject": {
            const blob = await buildProject({ photo: true, video: true, audio: true, model: true }, "Studio project");
            const buffer = await blob.arrayBuffer();
            reply("project", { name: "project.studio", size: buffer.byteLength, buffer });
            break;
          }
          case "prox:frame": {
            if (Number.isFinite(+data.time)) {
              T = clamp(+data.time, 0, Math.max(0, endT()));
              render(T);
            }
            const blob = await new Promise((res) => pm.toBlob(res, data.format === "jpg" ? "image/jpeg" : "image/png", 0.94));
            if (!blob) throw new Error("Could not capture the frame.");
            const buffer = await blob.arrayBuffer();
            reply("frame", { mime: blob.type, buffer });
            break;
          }
          case "prox:export": {
            openExportDialog();
            reply("export", { dialog: true });
            break;
          }
          default:
            reply("error", { message: "Unknown command: " + data.type });
        }
      } catch (e) {
        reply("error", { message: String(e && e.message || e) });
      }
    });

    setTimeout(() => postToParent("ready", { ready: true, state: apiState() }), 150);
  }

  async function toBlob(data) {
    if (data.blob instanceof Blob) return data.blob;
    if (data.buffer instanceof ArrayBuffer) return new Blob([data.buffer]);
    if (ArrayBuffer.isView(data.buffer)) return new Blob([data.buffer]);
    if (typeof data.data === "string" && data.data.startsWith("data:")) {
      const res = await fetch(data.data);
      return await res.blob();
    }
    if (typeof data.data === "string" && data.data.length > 32) {
      const bin = atob(data.data.replace(/\s+/g, ""));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes]);
    }
    return null;
  }
  async function loadProjectBlob(blob, confirmFirst = true) {
    const project = await readProject(blob);
    const names = { photo: "Photo", video: "Video", audio: "Audio", model: "3D" };
    if (confirmFirst) {
      const parts = Object.keys(project.parts).map((k) => names[k] || k).join(", ");
      if (!window.confirm(`Open this project? It replaces your work in: ${parts}.`)) return false;
    }
    toast("Opening project…");
    if (project.parts.photo) await loadPhoto(project.parts.photo, project.assets);
    if (project.parts.video) await loadVideo(project.parts.video, project.assets);
    if (project.parts.audio) await loadAudio(project.parts.audio, project.assets);
    if (project.parts.model) await loadModel(project.parts.model, project.assets);
    const prn = byId("prn");
    if (prn) prn.value = project.name || "My project";
    toast("Project opened.");
    postToParent("projectOpened", { name: project.name || "" });
    return true;
  }
  function apiState() {
    return {
      workspace: qs("section.on")?.id || "photo",
      width: W, height: H, fps: PS.fps,
      duration: Math.max(0, endT()),
      clips: clips.length, media: items.length,
      captions: clips.filter((c) => c.caption).length,
      touch: S.touch, embed: S.embed,
      watermark: !!brand.wm.on
    };
  }

  /* ------------------------------------------------------------------ *
   * 4. Touch / compatibility mode and panel drawers
   * ------------------------------------------------------------------ */
  function autoTouch() {
    try {
      if (window.matchMedia("(pointer: coarse)").matches) return true;
    } catch {}
    const w = window.innerWidth, h = window.innerHeight, min = Math.min(w, h);
    // Phones (and small split windows).
    if (min < 700 && w <= 900) return true;
    // Tablets that report a fine pointer but do support touch (iPad with a
    // trackpad, Windows tablets): still use the roomier touch layout.
    const touchCapable = (navigator.maxTouchPoints || 0) > 0;
    if (touchCapable && min < 900 && w <= 1100) return true;
    return false;
  }
  function syncCompactLabels() {
    // Keep the phone top bar usable without horizontal scrolling: trim the
    // three long project/export labels while in touch mode.
    const pairs = [
      ["projOpen", "Open project", "Open"],
      ["projSave", "Save project", "Save"],
      ["savebtn", "Save file", "Export"]
    ];
    for (const [id, long, short] of pairs) {
      const el = byId(id);
      if (!el) continue;
      if (!el.dataset.pxfull) el.dataset.pxfull = el.textContent.trim() || long;
      const full = el.dataset.pxfull;
      const next = S.touch ? short : full;
      if (el.textContent !== next) el.textContent = next;
      el.title = full;
    }
  }
  function applyInterfaceMode() {
    const mobile = settings.mobile || "auto";
    S.touch = mobile === "on" ? true : mobile === "off" ? false : autoTouch();
    document.body.classList.toggle("px-touch", S.touch);
    S.compat = !!settings.compat;
    document.body.classList.toggle("px-compat", S.compat);
    document.documentElement.style.setProperty("--px-accent", settings.accent || "#378ef0");
    document.documentElement.style.setProperty("--ac", settings.accent || "#378ef0");
    document.body.classList.toggle("px-safezones", !!settings.safe);
    syncCompactLabels();
    syncMobileBar();
    resizeSafe();
    applyQuality();
  }
  function setInterfaceMode(mode) {
    settings.mobile = mode;
    saveSettings();
    applyInterfaceMode();
  }

  function syncMobileBar() {
    const bar = byId("pxMbar");
    if (!bar) return;
    const ws = qs("section.on")?.id || "photo";
    qsa("[data-mws]", bar).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mws === ws)));
    const play = qs("#pxMplay", bar);
    if (play) play.style.opacity = (ws === "video" || ws === "audio") ? "1" : ".45";
  }

  function buildMobileBar() {
    const bar = document.createElement("div");
    bar.id = "pxMbar";
    bar.innerHTML = `
      <button class="px-mbtn" data-mws="photo" aria-pressed="true"><span class="px-mico">🖼️</span><span>Photo</span></button>
      <button class="px-mbtn" data-mws="video" aria-pressed="false"><span class="px-mico">🎬</span><span>Video</span></button>
      <button class="px-mbtn" data-mws="audio" aria-pressed="false"><span class="px-mico">🎧</span><span>Audio</span></button>
      <button class="px-mbtn" data-mws="model" aria-pressed="false"><span class="px-mico">🧊</span><span>3D</span></button>
      <button class="px-mbtn" id="pxMplay"><span class="px-mico">▶</span><span>Play</span></button>
      <button class="px-mbtn" id="pxMcreator"><span class="px-mico">✦</span><span>Creator</span></button>
      <button class="px-mbtn" id="pxMmore"><span class="px-mico">☰</span><span>More</span></button>`;
    document.body.append(bar);
    qsa("[data-mws]", bar).forEach((b) => b.onclick = () => {
      document.querySelector(`.tab[data-t="${b.dataset.mws}"]`)?.click();
      syncMobileBar();
    });
    byId("pxMcreator").onclick = () => openHub(S.hub);
    byId("pxMmore").onclick = () => openSettings();
    byId("pxMplay").onclick = () => {
      const ws = qs("section.on")?.id;
      if (ws === "video") byId("vpl")?.click();
      else if (ws === "audio") (byId("aplay"))?.click();
      else say("Play is available in the Video and Audio workspaces.");
    };
    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", syncMobileBar));
  }

  function tagSidePanels() {
    const mark = (el, side) => {
      if (!el) return;
      el.classList.add("px-side", side === "left" ? "px-side-left" : "px-side-right");
      const h4 = el.querySelector(":scope > h4");
      if (h4 && !h4.querySelector(".px-drawerclose")) {
        const close = document.createElement("button");
        close.className = "px-drawerclose px-iconbtn";
        close.textContent = "×";
        close.title = "Close panel";
        close.style.cssText = "float:right;width:24px;height:24px;font-size:15px;margin:-2px -2px 0 6px";
        close.onclick = (e) => { e.stopPropagation(); closeDrawer(); };
        h4.append(close);
      }
      // Panels without a heading still need a visible way out on touch.
      if (!h4 && !el.querySelector(".px-drawerfloat")) {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "px-drawerclose px-drawerfloat";
        close.textContent = "×";
        close.title = "Close panel";
        close.setAttribute("aria-label", "Close panel");
        close.onclick = (e) => { e.stopPropagation(); closeDrawer(); };
        el.prepend(close);
      }
    };
    mark(qs("#photo .body > .rp"), "right");
    const vtop = qs("#video .vtop");
    if (vtop) {
      const panels = [...vtop.children].filter((el) => el.classList.contains("pn"));
      mark(panels[0], "left");
      mark(panels[panels.length - 1], "right");
    }
    mark(qs("#model .body > .rp"), "right");
    mark(qs("#audio .rp"), "right");

    const bg = document.createElement("div");
    bg.id = "pxDrawerBg";
    bg.onclick = closeDrawer;
    document.body.append(bg);

    const addBtn = (parent, label, side, extraClass = "") => {
      if (!parent || parent.querySelector(`[data-pxdrawer="${side}"]`)) return;
      const b = document.createElement("button");
      b.className = "px-drawerbtn " + extraClass;
      b.dataset.pxdrawer = side;
      b.textContent = label;
      b.onclick = () => toggleDrawer(side);
      parent.append(b);
    };
    addBtn(qs("#photo .opt"), "Panels", "right");
    addBtn(qs("#model .mb"), "Properties", "right");
    addBtn(qs("#video .mc"), "Media", "left");
    addBtn(qs("#video .mc"), "Effects", "right");
  }
  function openDrawer(side) {
    if (!S.touch) return;
    S.drawer = side;
    document.body.classList.toggle("px-drawer-right", side === "right");
    document.body.classList.toggle("px-drawer-left", side === "left");
    resizeSafe();
  }
  function closeDrawer() {
    S.drawer = "";
    document.body.classList.remove("px-drawer-right", "px-drawer-left");
  }
  function toggleDrawer(side) {
    if (S.drawer === side) closeDrawer(); else openDrawer(side);
  }

  function setupTouchMenus() {
    const closeMenus = () => qsa(".m.px-open").forEach((m) => m.classList.remove("px-open"));
    document.addEventListener("pointerdown", (e) => {
      if (!S.touch) return;
      if (!e.target.closest(".m")) closeMenus();
      if (!e.target.closest(".px-side") && !e.target.closest("[data-pxdrawer]") && !e.target.closest(".px-drawerclose")) closeDrawer();
    }, true);
    qsa(".m > button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (!S.touch) return;
        e.preventDefault();
        e.stopPropagation();
        const m = btn.parentElement;
        const was = m.classList.contains("px-open");
        closeMenus();
        if (!was) m.classList.add("px-open");
      });
    });
    qsa(".dd").forEach((dd) => dd.addEventListener("click", (e) => {
      if (S.touch && e.target.closest("button,a,label")) closeMenus();
    }));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeMenus(); closeDrawer(); }
    });
  }

  function applyQuality() {
    try {
      if (typeof px2 !== "undefined") {
        px2.imageSmoothingEnabled = true;
        px2.imageSmoothingQuality = S.compat || settings.quality === "balanced" ? "medium" : "high";
      }
      if (typeof sx2 !== "undefined" && sx2) sx2.imageSmoothingQuality = "high";
      if (typeof ovx !== "undefined" && ovx) ovx.imageSmoothingQuality = "high";
      if (typeof R3 !== "undefined" && R3 && R3.setPixelRatio) {
        const dpr = window.devicePixelRatio || 1;
        R3.setPixelRatio(S.compat || settings.quality === "balanced" ? 1 : Math.min(2, dpr));
      }
    } catch {}
  }

  /* ------------------------------------------------------------------ *
   * 5. Safe zones over the program monitor
   * ------------------------------------------------------------------ */
  let safeEl = null, safeCanvas = null, safeCtx = null;

  function setupSafeZones() {
    const mon = qs("#video .mon");
    const pmEl = byId("pm");
    if (!mon || !pmEl) return;
    safeEl = document.createElement("div");
    safeEl.className = "px-safe";
    safeEl.innerHTML = `<canvas></canvas>`;
    mon.append(safeEl);
    safeCanvas = safeEl.querySelector("canvas");
    safeCtx = safeCanvas.getContext("2d");
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => resizeSafe());
      ro.observe(mon); ro.observe(pmEl);
    }
    window.addEventListener("resize", resizeSafe);
    window.addEventListener("orientationchange", () => setTimeout(resizeSafe, 120));
    resizeSafe();
  }

  function resizeSafe() {
    const mon = qs("#video .mon"), pmEl = byId("pm");
    if (!safeEl || !mon || !pmEl) return;
    const mr = mon.getBoundingClientRect(), pr = pmEl.getBoundingClientRect();
    if (!pr.width || !pr.height) return;
    safeEl.style.left = (pr.left - mr.left) + "px";
    safeEl.style.top = (pr.top - mr.top) + "px";
    safeEl.style.width = pr.width + "px";
    safeEl.style.height = pr.height + "px";
    const dpr = window.devicePixelRatio || 1;
    safeCanvas.width = Math.max(1, Math.round(pr.width * dpr));
    safeCanvas.height = Math.max(1, Math.round(pr.height * dpr));
    safeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSafe();
  }

  function drawSafe() {
    if (!safeCtx) return;
    const cw = safeCanvas.width / (window.devicePixelRatio || 1);
    const ch = safeCanvas.height / (window.devicePixelRatio || 1);
    safeCtx.clearRect(0, 0, cw, ch);
    if (!settings.safe) return;
    const style = settings.safeStyle || "all";
    const vertical = H > W;
    const square = Math.abs(W - H) < Math.max(W, H) * 0.02;
    const line = (x, y, w, h, color, dash = [5, 4], lw = 1) => {
      safeCtx.save();
      safeCtx.strokeStyle = color;
      safeCtx.lineWidth = lw;
      safeCtx.setLineDash(dash);
      safeCtx.strokeRect(x, y, w, h);
      safeCtx.restore();
    };
    const label = (text, x, y, color, align = "left") => {
      safeCtx.save();
      safeCtx.font = `600 ${Math.max(9, Math.round(ch / 40))}px system-ui,sans-serif`;
      safeCtx.fillStyle = color;
      safeCtx.textAlign = align;
      safeCtx.textBaseline = "bottom";
      safeCtx.fillText(text, x, y);
      safeCtx.restore();
    };
    if (style === "all" || style === "title") {
      const ax = cw * 0.035, ay = ch * 0.035;
      line(ax, ay, cw - ax * 2, ch - ay * 2, "rgba(255,255,255,.42)");
      label("ACTION SAFE", ax + 5, ay + ch * 0.035, "rgba(255,255,255,.6)");
      const tx = cw * 0.05, ty = ch * 0.05;
      line(tx, ty, cw - tx * 2, ch - ty * 2, "rgba(255,212,100,.68)");
      label("TITLE SAFE", tx + 5, ty + ch * 0.035, "rgba(255,212,100,.8)");
      // Rule-of-thirds guides.
      safeCtx.save();
      safeCtx.strokeStyle = "rgba(255,255,255,.12)";
      safeCtx.lineWidth = 1;
      safeCtx.setLineDash([2, 4]);
      for (let i = 1; i < 3; i++) {
        safeCtx.beginPath(); safeCtx.moveTo(cw * i / 3, 0); safeCtx.lineTo(cw * i / 3, ch); safeCtx.stroke();
        safeCtx.beginPath(); safeCtx.moveTo(0, ch * i / 3); safeCtx.lineTo(cw, ch * i / 3); safeCtx.stroke();
      }
      safeCtx.restore();
    }
    if (style === "all" || style === "platform") {
      safeCtx.save();
      safeCtx.fillStyle = "rgba(255,93,108,.09)";
      if (vertical) {
        safeCtx.fillRect(0, 0, cw, ch * 0.09);
        safeCtx.fillRect(0, ch * 0.78, cw, ch * 0.22);
        safeCtx.fillRect(cw * 0.84, 0, cw * 0.16, ch);
        safeCtx.restore();
        label("TOP UI", 10, ch * 0.09 - 3, "rgba(255,160,168,.9)");
        label("CAPTION / UI", 10, ch * 0.78 + 14, "rgba(255,160,168,.9)");
        label("ICONS", cw - 10, ch * 0.5, "rgba(255,160,168,.9)", "right");
        // 4:5 feed-safe box inside a vertical frame.
        const fw = cw * 0.8, fh = fw * 1.25;
        const fx = (cw - fw) / 2, fy = (ch - fh) / 2;
        line(fx, fy, fw, fh, "rgba(52,211,177,.6)", [4, 5]);
        label("4:5 SAFE", fx + 5, fy + 15, "rgba(52,211,177,.8)");
      } else if (square) {
        safeCtx.fillRect(0, 0, cw, ch * 0.06);
        safeCtx.fillRect(0, ch * 0.88, cw, ch * 0.12);
        safeCtx.restore();
        label("UI SAFE", 10, ch * 0.06 - 3, "rgba(255,160,168,.9)");
        label("CAPTION", 10, ch * 0.88 + 14, "rgba(255,160,168,.9)");
      } else {
        safeCtx.fillRect(0, 0, cw, ch * 0.055);
        safeCtx.fillRect(0, ch * 0.89, cw, ch * 0.11);
        safeCtx.restore();
        label("TITLE / UI", 10, ch * 0.055 - 3, "rgba(255,160,168,.9)");
        label("CAPTION", 10, ch * 0.89 + 14, "rgba(255,160,168,.9)");
      }
    }
    safeCtx.save();
    safeCtx.strokeStyle = "rgba(55,142,240,.5)";
    safeCtx.lineWidth = 1;
    safeCtx.beginPath();
    safeCtx.moveTo(cw / 2 - 7, ch / 2); safeCtx.lineTo(cw / 2 + 7, ch / 2);
    safeCtx.moveTo(cw / 2, ch / 2 - 7); safeCtx.lineTo(cw / 2, ch / 2 + 7);
    safeCtx.stroke();
    safeCtx.restore();
  }
  function toggleSafe(on) {
    settings.safe = on == null ? !settings.safe : !!on;
    saveSettings();
    document.body.classList.toggle("px-safezones", !!settings.safe);
    const cb = byId("pxSafeToggle");
    if (cb) cb.checked = !!settings.safe;
    drawSafe();
  }

  /* ------------------------------------------------------------------ *
   * 6. Enhanced title canvas (alignment, wrapping, captions)
   * ------------------------------------------------------------------ */
  function pxTitleCanvas(clip) {
    const t = clip && clip.title;
    const canvas = clip && clip.el;
    if (!t || !canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    const size = Math.max(1, (t.size || 5) * H / 100);
    const lh = (t.lh || 1.2) * size;
    const align = t.align === "left" || t.align === "right" ? t.align : "center";
    ctx.font = `${t.italic ? "italic " : ""}${t.bold ? "bold " : ""}${size}px ${t.font || "system-ui, sans-serif"}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    const maxW = Math.max(20, (t.maxw ?? 100) * W / 100);
    const paragraphs = String(t.text ?? "").split("\n");
    const lines = [];
    for (const para of paragraphs) {
      if (!para) { lines.push(""); continue; }
      if (ctx.measureText(para).width <= maxW) { lines.push(para); continue; }
      const words = para.split(/\s+/);
      let cur = "";
      for (const word of words) {
        const test = cur ? cur + " " + word : word;
        if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = word; }
        else cur = test;
      }
      if (cur) lines.push(cur);
    }
    const n = Math.max(1, lines.length);
    const cx = (t.x ?? 50) * W / 100;
    const firstY = (t.y ?? 50) * H / 100 - (n - 1) * lh / 2;
    const widest = Math.max(0, ...lines.map((line) => ctx.measureText(line).width));
    const padX = (t.padx ?? 0.6) * size;
    const padY = (t.pady ?? 0.3) * size;
    const bx = align === "left" ? cx : align === "right" ? cx - widest : cx - widest / 2;
    ctx.save();
    ctx.globalAlpha = clamp((t.bg ?? 0) / 100, 0, 1);
    ctx.fillStyle = t.bgc || "#000000";
    if (t.full) {
      ctx.fillRect(0, 0, W, H);
    } else if ((t.bg ?? 0) > 0 && t.text) {
      const r = Math.min(lh * 0.4, (t.radius ?? 0.18) * size);
      const x0 = bx - padX, y0 = firstY - lh / 2 - padY;
      const w0 = widest + padX * 2, h0 = n * lh + padY * 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, y0, w0, h0, r);
      else {
        const rr = Math.min(r, w0 / 2, h0 / 2);
        ctx.moveTo(x0 + rr, y0);
        ctx.lineTo(x0 + w0 - rr, y0); ctx.quadraticCurveTo(x0 + w0, y0, x0 + w0, y0 + rr);
        ctx.lineTo(x0 + w0, y0 + h0 - rr); ctx.quadraticCurveTo(x0 + w0, y0 + h0, x0 + w0 - rr, y0 + h0);
        ctx.lineTo(x0 + rr, y0 + h0); ctx.quadraticCurveTo(x0, y0 + h0, x0, y0 + h0 - rr);
        ctx.lineTo(x0, y0 + rr); ctx.quadraticCurveTo(x0, y0, x0 + rr, y0);
        ctx.closePath();
      }
      ctx.fill();
    }
    ctx.restore();
    if (t.shadow) {
      ctx.shadowColor = t.shadowColor || "rgba(0,0,0,.7)";
      ctx.shadowBlur = 0.22 * size;
      ctx.shadowOffsetY = 0.05 * size;
    }
    lines.forEach((line, i) => {
      const y = firstY + i * lh;
      if (t.stroke || t.size > 0) {
        ctx.lineWidth = Math.max(1, (t.strokeW ?? 0.08) * size);
        ctx.strokeStyle = t.stroke || "rgba(0,0,0,.85)";
        ctx.strokeText(line, cx, y);
      }
      if (t.gradient) {
        const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
        g.addColorStop(0, t.color || "#fff");
        g.addColorStop(1, t.gradient);
        ctx.fillStyle = g;
      } else ctx.fillStyle = t.color || "#ffffff";
      ctx.fillText(line, cx, y);
    });
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  /* ------------------------------------------------------------------ *
   * 7. Watermark / brand paint
   * ------------------------------------------------------------------ */
  let wmCache = null, wmCacheKey = "", wmImg = null, wmImgSrc = "";
  let wmDirty = true;

  function buildWatermark() {
    if (!brand.wm.on) { wmCache = null; wmCacheKey = ""; return; }
    const text = (brand.wm.text || brand.handle || brand.name || "").trim();
    const logo = brand.logo || "";
    if (!text && !logo) { wmCache = null; return; }
    const key = [text, logo, brand.wm.size, brand.wm.opacity, brand.wm.plate, brand.wm.shadow, W, H].join("|");
    if (wmCache && wmCacheKey === key) return;
    const size = Math.max(10, H * (brand.wm.size / 100));
    const pad = size * 0.55;
    const gap = size * 0.45;
    const tmp = document.createElement("canvas");
    const tctx = tmp.getContext("2d");
    tctx.font = `700 ${size}px system-ui,-apple-system,"Segoe UI",sans-serif`;
    const logoH = logo && wmImg && wmImg.complete ? size * 1.5 : 0;
    const logoW = logoH ? logoH * ((wmImg.naturalWidth || 1) / (wmImg.naturalHeight || 1)) : 0;
    const textW = text ? tctx.measureText(text).width : 0;
    const wContent = textW + (logoW ? logoW + gap : 0);
    const hContent = Math.max(size * 1.1, logoH);
    tmp.width = Math.ceil(wContent + pad * 2);
    tmp.height = Math.ceil(hContent + pad * 2);
    const x = tmp.getContext("2d");
    if (brand.wm.plate) {
      x.fillStyle = "rgba(0,0,0,.52)";
      x.beginPath();
      const r = Math.min(tmp.width, tmp.height) * 0.18;
      if (x.roundRect) x.roundRect(0, 0, tmp.width, tmp.height, r);
      else x.rect(0, 0, tmp.width, tmp.height);
      x.fill();
    }
    x.font = `700 ${size}px system-ui,-apple-system,"Segoe UI",sans-serif`;
    x.textBaseline = "middle";
    x.textAlign = "left";
    if (brand.wm.shadow) {
      x.shadowColor = "rgba(0,0,0,.7)";
      x.shadowBlur = size * 0.22;
      x.shadowOffsetY = size * 0.06;
    }
    let tx = pad;
    if (logoH && wmImg) {
      x.drawImage(wmImg, pad, (tmp.height - logoH) / 2, logoW, logoH);
      tx += logoW + gap;
    }
    if (text) {
      x.fillStyle = "#ffffff";
      x.fillText(text, tx, tmp.height / 2 + size * 0.04);
    }
    wmCache = tmp;
    wmCacheKey = key;
  }

  function paintWatermark() {
    if (!brand.wm.on) return;
    if (brand.logo && wmImgSrc !== brand.logo) {
      wmImgSrc = brand.logo;
      wmImg = new Image();
      wmImg.onload = () => { wmDirty = true; buildWatermark(); try { render(T); } catch {} };
      wmImg.onerror = () => { wmImg = null; };
      wmImg.src = brand.logo;
      return;
    }
    buildWatermark();
    if (!wmCache) return;
    const c = wmCache;
    const m = Math.min(W, H) * 0.038;
    const pos = brand.wm.pos || "br";
    let x, y;
    if (pos === "center") { x = (W - c.width) / 2; y = (H - c.height) / 2; }
    else {
      x = pos.endsWith("l") ? m : pos.endsWith("r") ? W - c.width - m : (W - c.width) / 2;
      y = pos.startsWith("t") ? m : m + (H - c.height - m * 2) * 0 + (H - c.height - m);
    }
    px2.save();
    px2.globalAlpha = clamp((brand.wm.opacity ?? 78) / 100, 0, 1);
    px2.drawImage(c, Math.round(x), Math.round(y));
    px2.restore();
  }

  /* ------------------------------------------------------------------ *
   * 8. Core rendering and export hooks
   * ------------------------------------------------------------------ */
  function installHooks() {
    // Better canvas scaling everywhere.
    applyQuality();

    // Title renderer with alignment/wrapping support.
    try { window.titleCanvas = pxTitleCanvas; } catch (e) { console.warn("PRO X: title hook", e); }

    // Watermark is painted after every preview render and every exported frame.
    const baseRender = window.render;
    if (typeof baseRender === "function") {
      window.render = function (t) {
        const r = baseRender.call(this, t);
        try { paintWatermark(); } catch (e) { /* never break playback */ }
        try { applyAudioCensor(t); } catch (e) { /* never break playback */ }
        return r;
      };
    }

    // Stop the censor tone the moment playback pauses, even mid-bleep.
    const basePause = window.pause;
    if (typeof basePause === "function") {
      window.pause = function () {
        const r = basePause.apply(this, arguments);
        try { stopBleep(); } catch {}
        return r;
      };
    }

    // Redraw the censor bands whenever the timeline rebuilds.
    const baseTl = window.tl;
    if (typeof baseTl === "function") {
      window.tl = function () {
        const r = baseTl.apply(this, arguments);
        try { drawCensorMarks(); } catch {}
        return r;
      };
    }

    // Splitting a clip should keep censor ranges on the correct half.
    const splitBtn = byId("vsplit");
    if (splitBtn && typeof splitBtn.onclick === "function") {
      const baseSplit = splitBtn.onclick;
      splitBtn.onclick = function (ev) {
        const before = cs;
        const splitAt = T;
        const oldList = before ? censorList(before) : [];
        const result = baseSplit.call(this, ev);
        const after = cs;
        if (before && after && after !== before && oldList.length) {
          const local = splitAt - before.start;
          const first = [];
          const second = [];
          for (const m of oldList) {
            const s = m.at;
            const e = m.at + m.dur;
            if (e <= local + 1e-4) {
              first.push({ ...m });
            } else if (s >= local - 1e-4) {
              second.push({ ...m, at: Math.max(0, s - local) });
            } else {
              if (local - s > 0.01) first.push({ ...m, dur: local - s });
              if (e - local > 0.01) second.push({ ...m, at: 0, dur: e - local });
            }
          }
          before.fx.censor = first;
          after.fx.censor = second;
          try { tl(); vui(); } catch {}
        }
        return result;
      };
    }

    // Undo and redo replace the clip objects. Put the right baked source back.
    const baseVrestore = window.vrestore;
    if (typeof baseVrestore === "function") {
      window.vrestore = function () {
        const r = baseVrestore.apply(this, arguments);
        try { restoreBakedSources(); } catch {}
        return r;
      };
    }

    // WebCodecs export mixes audio offline. Mirror the censor there too.
    const baseMix = window.mixAudio;
    if (typeof baseMix === "function") {
      window.mixAudio = function (total, sampleRate) {
        try {
          if (hasCensors()) return mixAudioWithCensors(total, sampleRate);
        } catch (e) { console.warn("PRO X: offline censor mix", e); }
        return baseMix.apply(this, arguments);
      };
    }

    // Keep safe guides and watermark cache in sync when the frame size changes.
    const baseApply = window.applyPS;
    if (typeof baseApply === "function") {
      window.applyPS = function () {
        const r = baseApply.apply(this, arguments);
        wmDirty = true;
        setTimeout(() => { resizeSafe(); reapplyCaptions(); }, 30);
        return r;
      };
    }

    // Export format menu: auto, AV1 and WebCodecs VP9.
    try {
      const xf = byId("xf");
      if (xf && !xf.querySelector('option[value="auto"]')) {
        xf.insertAdjacentHTML("afterbegin",
          `<option value="auto">Automatic — best for this browser</option>
           <option value="av1">MP4 · AV1 (smaller, newer)</option>
           <option value="vp9">MP4 · VP9 (WebCodecs)</option>`);
      }
      if (xf) {
        // Inserting options keeps WebM selected in Chrome. Default to Automatic
        // on a first visit, then remember whatever the user picks.
        let saved = null;
        try { saved = localStorage.getItem("prox.exportFormat"); } catch {}
        const has = (v) => v && [...xf.options].some((o) => o.value === v);
        xf.value = has(saved) ? saved : "auto";
        xf.addEventListener("change", () => {
          try { localStorage.setItem("prox.exportFormat", xf.value); } catch {}
        });
      }
    } catch {}

    // WCC vocabulary for the extra encoders.
    try {
      if (typeof WCC === "object" && WCC) {
        WCC.av1 = WCC.av1 || [
          { codec: "av01.0.08M.08", mux: "av1" },
          { codec: "av01.0.05M.08", mux: "av1" },
          { codec: "av01.0.04M.08", mux: "av1" }
        ];
        WCC.vp9 = WCC.vp9 || [
          { codec: "vp09.00.41.08", mux: "vp9" },
          { codec: "vp09.00.31.08", mux: "vp9" },
          { codec: "vp09.00.21.08", mux: "vp9" }
        ];
      }
    } catch {}

    // Wrap vexport so auto/AV1/VP9 can select the right encoder and fall back safely.
    const baseExport = window.vexport;
    if (typeof baseExport === "function") {
      window.vexport = async function () {
        const sel = byId("xf");
        if (!sel) return baseExport.apply(this, arguments);
        const wanted = sel.value;
        if (wanted === "auto") {
          const best = await bestFormat();
          if (best !== "auto") {
            sel.value = best;
            say("Automatic export: " + formatLabel(best) + ".");
            try { return await baseExport.apply(this, arguments); }
            finally { sel.value = wanted; }
          }
          return baseExport.apply(this, arguments);
        }
        if (wanted === "av1" || wanted === "vp9") {
          const cfg = wanted === "av1" ? WCC.av1 : WCC.vp9;
          const ok = await canEncode(cfg);
          if (!ok) {
            say(formatLabel(wanted) + " encoding is not available here. Falling back to H.264/WebM.");
            sel.value = wanted === "av1" ? "h264" : "webm";
            try { return await baseExport.apply(this, arguments); }
            finally { sel.value = wanted; }
          }
          if (byId("xch")?.value !== "420" || byId("xbd")?.value !== "8") {
            byId("xch").value = "420";
            byId("xbd").value = "8";
            say("AV1/VP9 use 4:2:0 8-bit here, so those settings were applied.");
          }
          const old = window.__wcTest;
          window.__wcTest = { video: cfg, audio: typeof WCA !== "undefined" ? WCA : [] };
          try { return await baseExport.apply(this, arguments); }
          finally { window.__wcTest = old; }
        }
        return baseExport.apply(this, arguments);
      };
    }

    // Mark work as dirty when the user edits, for autosave.
    ["pointerup", "keyup", "change", "drop", "paste"].forEach((ev) =>
      document.addEventListener(ev, () => { S.save.dirty = true; }, true));
  }

  function reapplyCaptions() {
    try {
      clips.forEach((c) => { if (c.title) window.titleCanvas(c); });
    } catch {}
  }

  const formatLabel = (id) => ({
    auto: "Automatic", av1: "AV1", vp9: "VP9", h264: "H.264", h265: "H.265 (HEVC)",
    webm: "WebM", prores: "ProRes"
  }[id] || id);

  async function canEncode(list) {
    if (!window.VideoEncoder || !list || !list.length) return false;
    for (const item of list) {
      try {
        const cfg = {
          codec: item.codec,
          width: Math.max(2, W - W % 2),
          height: Math.max(2, H - H % 2),
          bitrate: 8e6,
          framerate: PS.fps || 30,
          latencyMode: "quality"
        };
        const res = await VideoEncoder.isConfigSupported(cfg);
        if (res && res.supported) return true;
      } catch {}
    }
    return false;
  }

  async function bestFormat() {
    if (await canEncode(WCC?.h264 || [])) return "h264";
    if (window.MediaRecorder) {
      if (typeof mrs === "function" && mrs("video/mp4;codecs=avc1.640028,mp4a.40.2")) return "h264";
      if (typeof mrs === "function" && mrs("video/webm;codecs=vp9,opus")) return "vp9";
      if (typeof mrs === "function" && mrs("video/webm")) return "webm";
    }
    if (await canEncode(WCC?.vp9 || [])) return "vp9";
    return "auto";
  }

  /* ------------------------------------------------------------------ *
   * 9. Platform presets, reframing and export presets
   * ------------------------------------------------------------------ */
  const PLATFORMS = [
    { id: "youtube", name: "YouTube", ar: "16:9", w: 1920, h: 1080, fps: 30, vbr: 12, abr: 192, note: "Standard 1080p upload" },
    { id: "youtube4k", name: "YouTube 4K", ar: "16:9", w: 3840, h: 2160, fps: 30, vbr: 45, abr: 256, note: "Sharper, much larger files" },
    { id: "shorts", name: "YouTube Shorts", ar: "9:16", w: 1080, h: 1920, fps: 30, vbr: 10, abr: 192, note: "Vertical, up to 3 minutes" },
    { id: "tiktok", name: "TikTok", ar: "9:16", w: 1080, h: 1920, fps: 30, vbr: 10, abr: 192, note: "Vertical, UI safe zones on" },
    { id: "reels", name: "Instagram Reels", ar: "9:16", w: 1080, h: 1920, fps: 30, vbr: 10, abr: 192, note: "Vertical, 4:5 feed-safe box" },
    { id: "igfeed", name: "Instagram Feed", ar: "1:1", w: 1080, h: 1080, fps: 30, vbr: 8, abr: 192, note: "Square post or carousel" },
    { id: "igportrait", name: "Instagram Portrait", ar: "4:5", w: 1080, h: 1350, fps: 30, vbr: 8, abr: 192, note: "Tall feed post" },
    { id: "facebook", name: "Facebook", ar: "16:9", w: 1920, h: 1080, fps: 30, vbr: 10, abr: 192, note: "Feed and watch" },
    { id: "linkedin", name: "LinkedIn", ar: "16:9", w: 1920, h: 1080, fps: 30, vbr: 10, abr: 192, note: "Professional feed video" },
    { id: "x", name: "X / Twitter", ar: "16:9", w: 1280, h: 720, fps: 30, vbr: 8, abr: 192, note: "Smaller, fast-loading" },
    { id: "pinterest", name: "Pinterest", ar: "9:16", w: 1080, h: 1920, fps: 30, vbr: 8, abr: 192, note: "Idea Pins and video pins" }
  ];

  const EXPORT_PRESETS = [
    { id: "youtube", name: "YouTube 1080p", detail: "H.264 · 12 Mbps · 30 fps", format: "auto", w: 1920, h: 1080, fps: 30, vbr: 12, abr: 192 },
    { id: "shorts", name: "Shorts / TikTok / Reels", detail: "H.264 · 10 Mbps · vertical", format: "auto", w: 1080, h: 1920, fps: 30, vbr: 10, abr: 192 },
    { id: "high", name: "High quality master", detail: "H.265 or H.264 · 24 Mbps", format: "h265", w: 1920, h: 1080, fps: 30, vbr: 24, abr: 256 },
    { id: "small", name: "Small file / email", detail: "H.264 · 5 Mbps · 720p", format: "h264", w: 1280, h: 720, fps: 30, vbr: 5, abr: 128 },
    { id: "av1", name: "AV1 (smallest)", detail: "AV1 · 8 Mbps · newer players", format: "av1", w: 1920, h: 1080, fps: 30, vbr: 8, abr: 192 },
    { id: "webm", name: "WebM / open format", detail: "VP9 · 9 Mbps · Firefox friendly", format: "vp9", w: 1920, h: 1080, fps: 30, vbr: 9, abr: 192 },
    { id: "prores", name: "ProRes master", detail: "MOV · editing hand-off", format: "prores", w: 1920, h: 1080, fps: 30, vbr: 20, abr: 320 }
  ];

  function applyPlatform(p) {
    const old = { w: W, h: H, ar: PS.ar };
    Object.assign(PS, { ar: p.ar, w: p.w, h: p.h, fps: p.fps });
    applyPS();
    settings.safe = true;
    settings.safeStyle = "all";
    saveSettings();
    document.body.classList.add("px-safezones");
    const cb = byId("pxSafeToggle");
    if (cb) cb.checked = true;
    resizeSafe();
    const changed = old.w !== p.w || old.h !== p.h;
    say(`Project is now ${p.w}×${p.h} (${p.ar}) for ${p.name}.` + (changed ? " Use Fill frame to crop existing clips or Fit frame to letterbox." : ""));
    postToParent("preset", { platform: p.id, width: p.w, height: p.h });
    refreshHubPublish();
  }

  function reframe(mode) {
    if (!clips.length) { say("Add clips to the timeline first."); return; }
    vpush();
    let n = 0;
    clips.forEach((c) => {
      if (c.title || c.audio || !c.g && !c.el?.naturalWidth && !c.el?.videoWidth) return;
      c.fx = c.fx || {};
      if (mode === "fill") { c.fx.fill = 1; c.fx.scale = 100; c.fx.px = 0; c.fx.py = 0; }
      else if (mode === "fit") { c.fx.fill = 0; c.fx.scale = 100; c.fx.px = 0; c.fx.py = 0; }
      else if (mode === "center") { c.fx.px = 0; c.fx.py = 0; c.fx.scale = 100; }
      n++;
    });
    tl(); fxUI(); vui();
    say(mode === "fill" ? `Filled the frame with ${n} clips (sides are cropped).` :
        mode === "fit" ? `Fit ${n} clips inside the frame (letterboxed).` :
        `Centred ${n} clips.`);
  }

  function setExportPreset(p) {
    const sel = byId("xf");
    if (sel) {
      if (![...sel.options].some((o) => o.value === p.format)) {
        const opt = document.createElement("option");
        opt.value = p.format; opt.textContent = formatLabel(p.format);
        sel.append(opt);
      }
      sel.value = p.format;
    }
    const xr = byId("xr");
    const key = `${p.w}x${p.h}`;
    if (xr) {
      if ([...xr.options].some((o) => o.value === key)) xr.value = key;
      else xr.value = "c";
    }
    const xw = byId("xw"), xh = byId("xh"), xfps = byId("xfps");
    if (xw) xw.value = p.w;
    if (xh) xh.value = p.h;
    if (xfps && [...xfps.options].some((o) => +o.value === p.fps)) xfps.value = p.fps;
    const xbr = byId("xbr"), xab = byId("xab"), xch = byId("xch"), xbd = byId("xbd"), xmode = byId("xmode");
    if (xbr) xbr.value = p.vbr;
    if (xab) xab.value = p.abr;
    if (xch) xch.value = "420";
    if (xbd) xbd.value = "8";
    if (xmode) xmode.value = "auto";
    openExportDialog();
    say(`${p.name} export settings are ready. Choose a file name and press export.`);
  }

  function openExportDialog() {
    const vexp = byId("vexp");
    if (vexp) vexp.click();
  }

  function exportEstimate(vbr, abr) {
    const dur = Math.max(0, endT());
    return ((vbr + abr / 1000) * dur / 8).toFixed(1) + " MB";
  }

  /* ------------------------------------------------------------------ *
   * 10. Captions: SRT/VTT import, subtitle clips and export
   * ------------------------------------------------------------------ */
  function guessSeconds(str) {
    const s = String(str).trim().replace(",", ".");
    const parts = s.split(":").map(Number);
    if (parts.some((n) => !Number.isFinite(n))) return NaN;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(s);
  }
  function parseCues(text) {
    const src = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const blocks = src.split(/\n{2,}/);
    const cues = [];
    for (let block of blocks) {
      block = block.trim();
      if (!block) continue;
      const lines = block.split("\n");
      if (/^WEBVTT/i.test(lines[0])) { lines.shift(); while (lines.length && !lines[0].trim()) lines.shift(); }
      const tIdx = lines.findIndex((l) => l.includes("-->"));
      if (tIdx < 0) continue;
      const [a, b] = lines[tIdx].split("-->");
      if (!a || !b) continue;
      const start = guessSeconds(a.trim().split(/\s+/)[0]);
      const end = guessSeconds(b.trim().split(/\s+/)[0]);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      const body = lines.slice(tIdx + 1).join("\n")
        .replace(/<[^>]*>/g, "")
        .replace(/\{[^}]*\}/g, "")
        .trim();
      if (!body) continue;
      cues.push({ start, end, text: body });
    }
    return cues.sort((x, y) => x.start - y.start);
  }

  function captionClip(cue, style) {
    const clip = {
      name: "Caption: " + cue.text.split("\n")[0].slice(0, 40),
      el: document.createElement("canvas"),
      track: 2,
      start: cue.start,
      in: 0,
      dur: Math.max(0.2, cue.end - cue.start),
      src: 1e9,
      fx: Object.assign({}, typeof DEF !== "undefined" ? DEF : {}, { tin: "none", tout: "none" }),
      g: null,
      title: {
        text: cue.text,
        size: style.size,
        y: style.y,
        bg: style.bg,
        bgc: style.bgc,
        color: style.color,
        stroke: "#000000",
        strokeW: 0.07,
        font: style.font,
        bold: style.bold ? 1 : 0,
        shadow: style.shadow ? 1 : 0,
        align: "center",
        x: 50,
        maxw: style.maxw,
        padx: 0.55,
        pady: 0.28,
        lh: 1.22
      },
      caption: true,
      cue: { start: cue.start, end: cue.end }
    };
    window.titleCanvas(clip);
    return clip;
  }

  function addCaptionCues(cues, opts = {}) {
    if (!cues.length) { say("No cues to add. Parse an SRT or VTT first."); return 0; }
    vpush();
    if (opts.replace) {
      clips = clips.filter((c) => !c.caption);
      cs = null;
    }
    const shift = Number(opts.shift) || 0;
    const style = Object.assign({}, S.captionStyle, opts.style || {});
    let n = 0;
    for (const cue of cues) {
      if (cue.end <= 0) continue;
      const c = captionClip({
        start: Math.max(0, cue.start + shift),
        end: Math.max(0.2, cue.end + shift),
        text: cue.text
      }, style);
      clips.push(c);
      n++;
    }
    tl(); fxUI(); render(T);
    say(`Added ${n} caption clip${n === 1 ? "" : "s"} on V3.`);
    postToParent("captions", { count: n });
    return n;
  }

  function captionClips() {
    return clips.filter((c) => c.caption || (c.title && /^Caption:/i.test(c.name || "")))
      .sort((a, b) => a.start - b.start);
  }

  function srtTime(sec) {
    sec = Math.max(0, sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.round((sec - Math.floor(sec)) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
  }
  function exportSRT() {
    const caps = captionClips();
    if (!caps.length) { say("There are no caption clips to export."); return; }
    const body = caps.map((c, i) =>
      `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.start + c.dur)}\n${c.title.text}\n`
    ).join("\n");
    dl(new Blob([body], { type: "text/plain;charset=utf-8" }), "captions.srt", null);
  }
  function clearCaptions() {
    const caps = captionClips();
    if (!caps.length) { say("There are no caption clips to clear."); return; }
    if (!window.confirm(`Remove ${caps.length} caption clip${caps.length === 1 ? "" : "s"}?`)) return;
    vpush();
    clips = clips.filter((c) => !captionClips().includes(c));
    cs = null; tl(); fxUI(); render(T);
    say("Caption clips removed.");
  }
  function styleCaptions() {
    const caps = captionClips();
    if (!caps.length) { say("Add captions first."); return; }
    vpush();
    caps.forEach((c) => {
      const t = c.title;
      t.size = S.captionStyle.size;
      t.y = S.captionStyle.y;
      t.bg = S.captionStyle.bg;
      t.bgc = S.captionStyle.bgc;
      t.color = S.captionStyle.color;
      t.font = S.captionStyle.font;
      t.bold = S.captionStyle.bold ? 1 : 0;
      t.shadow = S.captionStyle.shadow ? 1 : 0;
      t.maxw = S.captionStyle.maxw;
      window.titleCanvas(c);
    });
    tl(); vui();
    say("Caption style updated.");
  }

  function renderCueTable() {
    const box = byId("pxCueTable");
    if (!box) return;
    if (!S.cues.length) {
      box.innerHTML = `<div class="px-empty">No cues yet. Paste an SRT or VTT above, then press <b>Parse</b>.</div>`;
      return;
    }
    box.innerHTML = `<div class="px-cues"><table class="px-table">
      <thead><tr><th>#</th><th>In</th><th>Out</th><th>Text</th></tr></thead>
      <tbody>${S.cues.map((c, i) => `<tr><td>${i + 1}</td><td>${fmtTime(c.start)}</td><td>${fmtTime(c.end)}</td><td>${esc(c.text)}</td></tr>`).join("")}</tbody>
    </table></div>`;
  }

  /* ------------------------------------------------------------------ *
   * 11. Thumbnail Studio
   * ------------------------------------------------------------------ */
  function thumbCanvas() { return byId("pxThumbCanvas"); }

  function thumbLoadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      S.thumb.img = img;
      URL.revokeObjectURL(url);
      renderThumb();
    };
    img.onerror = () => { URL.revokeObjectURL(url); say("That image could not be opened."); };
    img.src = url;
  }
  function thumbCaptureFrame() {
    try {
      render(T);
      pm.toBlob((blob) => {
        if (!blob) return say("Could not capture the current frame.");
        thumbLoadBlob(blob);
        say("Current frame loaded into the thumbnail.");
      }, "image/png");
    } catch (e) { say("Could not capture a frame: " + e.message); }
  }

  function wrapText(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split("\n")) {
      if (!para) { out.push(""); continue; }
      const words = para.split(/\s+/);
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        if (line && ctx.measureText(test).width > maxW) { out.push(line); line = w; }
        else line = test;
      }
      if (line) out.push(line);
    }
    return out;
  }

  function renderThumb() {
    const c = thumbCanvas();
    if (!c) return;
    const t = S.thumb;
    c.width = t.w; c.height = t.h;
    const x = c.getContext("2d");
    const W0 = t.w, H0 = t.h;
    x.clearRect(0, 0, W0, H0);
    if (t.img && t.img.complete && t.img.naturalWidth) {
      const iw = t.img.naturalWidth, ih = t.img.naturalHeight;
      const sc = Math.max(W0 / iw, H0 / ih);
      const dw = iw * sc, dh = ih * sc;
      x.drawImage(t.img, (W0 - dw) / 2, (H0 - dh) / 2, dw, dh);
    } else {
      const g = x.createLinearGradient(0, 0, W0, H0);
      g.addColorStop(0, "#1b2a44");
      g.addColorStop(0.55, "#2a2050");
      g.addColorStop(1, "#0d3a35");
      x.fillStyle = g; x.fillRect(0, 0, W0, H0);
      x.fillStyle = "rgba(255,255,255,.06)";
      for (let i = 0; i < 6; i++) {
        x.beginPath();
        x.arc(W0 * (0.18 + i * 0.14), H0 * (0.22 + (i % 3) * 0.22), H0 * 0.22, 0, 7);
        x.fill();
      }
    }
    // Overlay gradient. Left-aligned text gets a left-to-right shade.
    const ov = clamp(t.overlay / 100, 0, 1);
    const gg = x.createLinearGradient(0, 0, W0, 0);
    if (t.pos === "left") {
      gg.addColorStop(0, `rgba(0,0,0,${ov})`);
      gg.addColorStop(0.62, `rgba(0,0,0,${ov * 0.55})`);
      gg.addColorStop(1, "rgba(0,0,0,0)");
    } else if (t.pos === "right") {
      gg.addColorStop(0, "rgba(0,0,0,0)");
      gg.addColorStop(0.38, `rgba(0,0,0,${ov * 0.55})`);
      gg.addColorStop(1, `rgba(0,0,0,${ov})`);
    } else {
      const gv = x.createLinearGradient(0, 0, 0, H0);
      gv.addColorStop(0, `rgba(0,0,0,${ov * 0.25})`);
      gv.addColorStop(0.5, `rgba(0,0,0,${ov * 0.55})`);
      gv.addColorStop(1, `rgba(0,0,0,${ov})`);
      x.fillStyle = gv; x.fillRect(0, 0, W0, H0);
    }
    if (t.pos !== "center") { x.fillStyle = gg; x.fillRect(0, 0, W0, H0); }
    else {
      const gv = x.createLinearGradient(0, 0, 0, H0);
      gv.addColorStop(0, `rgba(0,0,0,${ov * 0.3})`);
      gv.addColorStop(0.55, `rgba(0,0,0,${ov * 0.5})`);
      gv.addColorStop(1, `rgba(0,0,0,${ov})`);
      x.fillStyle = gv; x.fillRect(0, 0, W0, H0);
    }

    const accent = t.accent || "#378ef0";
    const margin = W0 * 0.055;
    const align = t.pos === "center" ? "center" : t.pos === "right" ? "right" : "left";
    const cx = align === "center" ? W0 / 2 : align === "right" ? W0 - margin : margin;
    const titleSize = Math.round(H0 * (t.template === "mini" ? 0.075 : 0.095));
    const subSize = Math.round(titleSize * 0.42);
    const maxW = W0 * (align === "center" ? 0.82 : 0.68);
    x.textAlign = align;
    x.textBaseline = "alphabetic";
    x.shadowColor = "rgba(0,0,0,.65)";
    x.shadowBlur = H0 * 0.012;
    x.shadowOffsetY = H0 * 0.004;
    let bottom = H0 * 0.8;
    if (t.template === "box") {
      const titleLines = wrapText(Object.assign(x, { font: `800 ${titleSize}px system-ui,sans-serif` }), t.title, maxW);
      const boxH = titleLines.length * titleSize * 1.08 + titleSize * 0.7;
      x.save();
      x.shadowColor = "transparent";
      x.fillStyle = accent;
      const bx = align === "center" ? W0 * 0.09 : align === "right" ? W0 * 0.3 : margin;
      const bw = align === "center" ? W0 * 0.82 : W0 * 0.7;
      x.fillRect(bx, H0 - boxH - H0 * 0.06, bw, boxH);
      x.restore();
      x.fillStyle = "#fff";
      x.font = `800 ${titleSize}px system-ui,sans-serif`;
      titleLines.forEach((line, i) => {
        const ty = H0 - boxH - H0 * 0.06 + titleSize * 0.9 + i * titleSize * 1.08;
        x.fillText(line, align === "center" ? W0 / 2 : align === "right" ? bx + bw - margin : bx + margin, ty);
      });
    } else {
      x.font = `800 ${titleSize}px system-ui,sans-serif`;
      const lines = wrapText(x, t.title, maxW);
      let y = H0 * 0.56;
      if (t.sub) y -= subSize * 1.5;
      lines.forEach((line) => { x.fillStyle = t.color || "#fff"; x.fillText(line, cx, y); y += titleSize * 1.04; });
      if (t.sub) {
        x.font = `600 ${subSize}px system-ui,sans-serif`;
        x.fillStyle = "rgba(255,255,255,.86)";
        x.fillText(t.sub, cx, y + subSize * 0.55);
      }
      if (t.template !== "mini") {
        x.save();
        x.shadowColor = "transparent";
        x.fillStyle = accent;
        x.fillRect(align === "center" ? (W0 - maxW) / 2 : align === "right" ? W0 - margin - maxW : margin, H0 * 0.56 - titleSize * (t.sub ? 2.15 : 1.55), maxW * 0.16, Math.max(4, H0 * 0.009));
        x.restore();
      }
    }
    if (t.showBadge && t.badge) {
      x.save();
      x.shadowColor = "transparent";
      const bf = Math.round(H0 * 0.033);
      x.font = `800 ${bf}px system-ui,sans-serif`;
      const bw = x.measureText(t.badge).width + bf * 1.3;
      const bh = bf * 2.1;
      const bxx = align === "right" ? W0 - margin - bw : align === "center" ? W0 - margin - bw : margin;
      x.fillStyle = accent;
      x.beginPath();
      if (x.roundRect) x.roundRect(bxx, margin, bw, bh, bh / 2); else x.rect(bxx, margin, bw, bh);
      x.fill();
      x.fillStyle = "#fff";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(t.badge, bxx + bw / 2, margin + bh / 2 + 1);
      x.restore();
    }
    const tag = byId("pxThumbSize");
    if (tag) tag.textContent = `${W0} × ${H0}`;
  }

  function openThumb() {
    closeDialog(byId("pxHub"));
    const dlg = byId("pxThumb");
    if (!dlg) return;
    showDialog(dlg);
    renderThumb();
    if (!S.thumb.img) setTimeout(() => { if (!S.thumb.img) thumbCaptureFrame(); }, 180);
  }

  /* ------------------------------------------------------------------ *
   * 12. Teleprompter
   * ------------------------------------------------------------------ */
  function buildPrompter() {
    const el = document.createElement("div");
    el.id = "pxPrompter";
    el.innerHTML = `
      <div class="px-prompter-top">
        <b style="font-size:13px;letter-spacing:.02em">Teleprompter</b>
        <span class="px-muted">Space = play/pause · Esc = close</span>
        <div class="px-row">
          <label class="px-check"><input type="checkbox" id="pxTpMirror" ${S.tp.mirror ? "checked" : ""}> Mirror</label>
          <button class="px-btn px-sm" id="pxTpRestart">Restart</button>
          <button class="px-btn px-sm px-pri" id="pxTpToggle">Start</button>
          <button class="px-btn px-sm px-danger" id="pxTpClose">Close</button>
        </div>
      </div>
      <div class="px-prompter-view">
        <div class="px-prompter-fade"></div>
        <div class="px-prompter-guide"></div>
        <div class="px-prompter-text" id="pxTpText"></div>
      </div>
      <div class="px-prompter-foot">
        <label class="px-row" style="gap:6px"><span class="px-muted">Speed</span><input type="range" id="pxTpSpeed" min="10" max="220" value="${S.tp.speed}" class="px-range"></label>
        <label class="px-row" style="gap:6px"><span class="px-muted">Size</span><input type="range" id="pxTpSize" min="28" max="130" value="${S.tp.size}" class="px-range"></label>
        <span class="px-muted" id="pxTpInfo"></span>
      </div>`;
    document.body.append(el);
    const textEl = byId("pxTpText");
    textEl.textContent = S.tp.text;
    byId("pxTpToggle").onclick = togglePrompter;
    byId("pxTpClose").onclick = closePrompter;
    byId("pxTpRestart").onclick = () => { S.tp.offset = 0; applyPromptTransform(); };
    byId("pxTpMirror").onchange = (e) => {
      S.tp.mirror = e.target.checked;
      LS.set("tp.mirror", S.tp.mirror);
      applyPromptTransform();
    };
    byId("pxTpSpeed").oninput = (e) => {
      S.tp.speed = +e.target.value;
      LS.set("tp.speed", S.tp.speed);
    };
    byId("pxTpSize").oninput = (e) => {
      S.tp.size = +e.target.value;
      textEl.style.fontSize = S.tp.size + "px";
      LS.set("tp.size", S.tp.size);
    };
    textEl.style.fontSize = S.tp.size + "px";
    applyPromptTransform();
    document.addEventListener("keydown", (e) => {
      if (!el.classList.contains("px-on")) return;
      if (e.key === "Escape") { e.preventDefault(); closePrompter(); }
      else if (e.key === " ") { e.preventDefault(); togglePrompter(); }
      else if (e.key === "ArrowUp") { S.tp.speed = clamp(S.tp.speed + 8, 10, 220); byId("pxTpSpeed").value = S.tp.speed; e.preventDefault(); }
      else if (e.key === "ArrowDown") { S.tp.speed = clamp(S.tp.speed - 8, 10, 220); byId("pxTpSpeed").value = S.tp.speed; e.preventDefault(); }
    });
  }

  function applyPromptTransform() {
    const text = byId("pxTpText");
    if (!text) return;
    text.style.transform = `translateY(${-S.tp.offset}px)` + (S.tp.mirror ? " scaleX(-1)" : "");
  }
  function promptSetText(txt) {
    S.tp.text = String(txt || "");
    LS.set("tp.text", S.tp.text);
    const el = byId("pxTpText");
    if (el) el.textContent = S.tp.text;
    S.tp.offset = 0;
    applyPromptTransform();
  }
  function openPrompter(text) {
    if (text != null) promptSetText(text);
    const el = byId("pxPrompter");
    if (!el) return;
    el.classList.add("px-on");
    S.tp.playing = false;
    setPromptPlaying(false);
    applyPromptTransform();
    requestWakeLock();
    postToParent("teleprompter", { open: true });
  }
  function closePrompter() {
    const el = byId("pxPrompter");
    if (!el) return;
    setPromptPlaying(false);
    el.classList.remove("px-on");
    releaseWakeLock();
    postToParent("teleprompter", { open: false });
  }
  function setPromptPlaying(on) {
    S.tp.playing = !!on;
    const btn = byId("pxTpToggle");
    if (btn) btn.textContent = S.tp.playing ? "Pause" : "Start";
    const info = byId("pxTpInfo");
    if (info) info.textContent = S.tp.playing ? "Scrolling…" : "Ready";
    if (S.tp.playing) {
      S.tp.last = performance.now();
      cancelAnimationFrame(S.tp.raf);
      const step = (now) => {
        if (!S.tp.playing) return;
        const dt = Math.min(0.05, (now - S.tp.last) / 1000);
        S.tp.last = now;
        S.tp.offset += S.tp.speed * dt;
        const text = byId("pxTpText");
        const view = qs(".px-prompter-view");
        const max = text ? Math.max(0, text.scrollHeight - (view ? view.clientHeight : 0) * 0.65) : 0;
        if (max && S.tp.offset > max) {
          S.tp.offset = max;
          applyPromptTransform();
          setPromptPlaying(false);
          return;
        }
        applyPromptTransform();
        S.tp.raf = requestAnimationFrame(step);
      };
      S.tp.raf = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(S.tp.raf);
    }
  }
  function togglePrompter() { setPromptPlaying(!S.tp.playing); }
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !S.tp.lock) {
        S.tp.lock = await navigator.wakeLock.request("screen");
        S.tp.lock.addEventListener("release", () => { S.tp.lock = null; });
      }
    } catch {}
  }
  function releaseWakeLock() {
    try { S.tp.lock && S.tp.lock.release(); } catch {}
    S.tp.lock = null;
  }

  /* ------------------------------------------------------------------ *
   * 13. Audio tools: decode, duck, silence, normalize
   * ------------------------------------------------------------------ */
  const clipAudioCache = new Map();

  async function clipBuffer(clip) {
    const url = clip?.it?.url || clip?.el?.currentSrc || clip?.el?.src;
    if (!url || !/^(blob:|data:|https?:|file:)/.test(url)) return null;
    if (clipAudioCache.has(url)) {
      const hit = clipAudioCache.get(url);
      if (hit instanceof Promise) return hit;
      return hit;
    }
    const promise = (async () => {
      try {
        const res = await fetch(url);
        const ab = await res.arrayBuffer();
        const buf = await AC.decodeAudioData(ab.slice(0));
        clipAudioCache.set(url, buf);
        while (clipAudioCache.size > 5) {
          const k = clipAudioCache.keys().next().value;
          if (k === url) break;
          clipAudioCache.delete(k);
        }
        return buf;
      } catch (e) {
        clipAudioCache.delete(url);
        return null;
      }
    })();
    clipAudioCache.set(url, promise);
    return promise;
  }

  function clipSourceRange(clip, buf) {
    const speed = Math.max(0.1, (clip.fx?.speed ?? 100) / 100);
    const a = clamp(clip.in || 0, 0, Math.max(0, buf.duration - 0.001));
    const b = clamp((clip.in || 0) + clip.dur * speed, 0, buf.duration);
    return { a, b, speed };
  }

  async function voiceSegments(clip, thresholdDb) {
    const buf = await clipBuffer(clip);
    if (!buf) return [];
    const { a, b, speed } = clipSourceRange(clip, buf);
    if (b - a < 0.08) return [];
    const sr = buf.sampleRate;
    const win = 0.08;
    const ch = Math.min(2, buf.numberOfChannels);
    const data = [...Array(ch)].map((_, i) => buf.getChannelData(i));
    const segs = [];
    let active = false, start = 0;
    for (let t = a; t < b; t += win) {
      const i0 = Math.floor(t * sr);
      const i1 = Math.min(data[0].length, Math.floor((t + win) * sr));
      let sum = 0, n = 0;
      for (let i = i0; i < i1; i += 4) {
        let s = 0;
        for (let c = 0; c < ch; c++) s += data[c][i] || 0;
        s /= ch; sum += s * s; n++;
      }
      const rms = Math.sqrt(sum / Math.max(1, n));
      const db = 20 * Math.log10(Math.max(1e-7, rms));
      const on = db >= thresholdDb;
      if (on && !active) { active = true; start = t; }
      else if (!on && active) { active = false; if (t - start >= 0.1) segs.push([start, t]); }
    }
    if (active && b - start >= 0.1) segs.push([start, b]);
    // Merge tiny gaps and convert source time to timeline time.
    const merged = [];
    for (const [s0, e0] of segs) {
      const prev = merged[merged.length - 1];
      if (prev && s0 - prev[1] < 0.18) prev[1] = e0;
      else merged.push([s0, e0]);
    }
    return merged.map(([s0, e0]) => [
      clamp(clip.start + (s0 - (clip.in || 0)) / speed, clip.start, clip.start + clip.dur),
      clamp(clip.start + (e0 - (clip.in || 0)) / speed, clip.start, clip.start + clip.dur)
    ]).filter(([s0, e0]) => e0 - s0 > 0.08);
  }

  async function duckMusic(opts = {}) {
    const music = cs;
    if (!music || !music.g) {
      say("Select the music clip on the timeline first, then run the ducking tool.");
      return;
    }
    const depth = clamp(Number(opts.depth) || 14, 3, 30);
    const threshold = clamp(Number(opts.threshold) || -34, -60, -12);
    const voices = clips.filter((c) => c !== music && c.g);
    if (!voices.length) { say("There are no other audio-bearing clips to analyze."); return; }
    say("Analyzing speech and building volume keyframes…");
    await wait(40);
    let all = [];
    for (const v of voices) {
      const segs = await voiceSegments(v, threshold);
      all.push(...segs);
    }
    if (!all.length) { say("No speech was found above the threshold. Lower the threshold and try again."); return; }
    all.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const seg of all) {
      const prev = merged[merged.length - 1];
      if (prev && seg[0] - prev[1] < 0.28) prev[1] = Math.max(prev[1], seg[1]);
      else merged.push([seg[0], seg[1]]);
    }
    const speed = Math.max(0.1, (music.fx.speed ?? 100) / 100);
    const base = clamp(music.fx.vol ?? 100, 0, 200);
    const duck = clamp(base * Math.pow(10, -depth / 20), 0, 200);
    const attack = 0.16, release = 0.26;
    const sourceAt = (t) => (music.in || 0) + (t - music.start) * speed;
    const points = [];
    for (const [s0, e0] of merged) {
      const s = clamp(s0, music.start, music.start + music.dur);
      const e = clamp(e0, music.start, music.start + music.dur);
      if (e - s < 0.06) continue;
      points.push([Math.max(music.in || 0, sourceAt(s - attack)), base]);
      points.push([sourceAt(s), duck]);
      points.push([sourceAt(e), duck]);
      points.push([Math.min((music.in || 0) + music.dur * speed, sourceAt(e + release)), base]);
    }
    points.sort((a, b) => a[0] - b[0]);
    const dedup = [];
    for (const p of points) {
      const prev = dedup[dedup.length - 1];
      if (prev && Math.abs(prev[0] - p[0]) < 0.01) prev[1] = p[1];
      else dedup.push(p);
    }
    vpush();
    music.kf = music.kf || {};
    music.kf.vol = dedup;
    music.ease = music.ease || "smooth";
    tl(); fxUI(); vui();
    say(`Ducked the music by ${depth} dB under ${merged.length} speech region${merged.length === 1 ? "" : "s"}.`);
  }

  async function removeSilence(opts = {}) {
    const clip = cs;
    if (!clip || !clip.g) {
      say("Select a video or audio clip on the timeline first.");
      return;
    }
    const threshold = clamp(Number(opts.threshold) || -40, -70, -12);
    const minSil = clamp(Number(opts.minSil) || 0.35, 0.1, 5);
    const buf = await clipBuffer(clip);
    if (!buf) { say("Could not decode audio for the selected clip. It may have no audio track."); return; }
    const { a, b, speed } = clipSourceRange(clip, buf);
    if (b - a < 0.3) { say("That clip is too short."); return; }
    const sr = buf.sampleRate, win = 0.03, ch = Math.min(2, buf.numberOfChannels);
    const data = [...Array(ch)].map((_, i) => buf.getChannelData(i));
    const silent = [];
    let runStart = null;
    for (let t = a; t < b; t += win) {
      const i0 = Math.floor(t * sr), i1 = Math.min(data[0].length, Math.floor((t + win) * sr));
      let sum = 0, n = 0;
      for (let i = i0; i < i1; i += 3) {
        let s = 0; for (let c = 0; c < ch; c++) s += data[c][i] || 0;
        s /= ch; sum += s * s; n++;
      }
      const rms = Math.sqrt(sum / Math.max(1, n));
      const db = 20 * Math.log10(Math.max(1e-7, rms));
      const isSil = db < threshold;
      if (isSil && runStart == null) runStart = t;
      else if (!isSil && runStart != null) {
        if (t - runStart >= minSil) silent.push([runStart, t]);
        runStart = null;
      }
    }
    if (runStart != null && b - runStart >= minSil) silent.push([runStart, b]);
    if (!silent.length) { say("No silence longer than " + minSil + " s was found."); return; }
    // Build kept ranges.
    const kept = [];
    let cursor = a;
    for (const [s0, e0] of silent) {
      if (s0 > cursor + 0.05) kept.push([cursor, Math.min(s0, b)]);
      cursor = Math.max(cursor, e0);
    }
    if (cursor < b - 0.05) kept.push([cursor, b]);
    if (!kept.length) { say("The clip appears to be silent end to end."); return; }
    const totalKept = kept.reduce((n, [s0, e0]) => n + (e0 - s0), 0) / speed;
    if (totalKept >= clip.dur - 0.05) { say("Silence removal would not shorten the clip."); return; }
    vpush();
    const idx = clips.indexOf(clip);
    const baseStart = clip.start;
    const newClips = kept.map(([s0, e0], i) => ({
      ...clip,
      name: clip.name + (i ? " (cut)" : ""),
      start: baseStart + (kept.slice(0, i).reduce((n, [x0, x1]) => n + (x1 - x0), 0)) / speed,
      in: s0,
      dur: (e0 - s0) / speed,
      fx: { ...clip.fx },
      kf: clip.kf ? JSON.parse(JSON.stringify(clip.kf)) : null
    }));
    const removed = clip.dur - newClips.reduce((n, c) => n + c.dur, 0);
    const oldEnd = clip.start + clip.dur;
    const arr = clips.slice();
    if (idx >= 0) arr.splice(idx, 1, ...newClips); else arr.push(...newClips);
    clips = arr;
    clips.forEach((c) => {
      if (c === clip) return;
      if (c.track === clip.track && c.start >= oldEnd - 0.01) c.start = Math.max(0, c.start - removed);
    });
    cs = newClips[0] || null;
    tl(); fxUI(); vui();
    say(`Removed ${silent.length} silent region${silent.length === 1 ? "" : "s"} (${removed.toFixed(1)} s) and closed the gaps.`);
  }

  async function normalizeClip(opts = {}) {
    const clip = cs;
    if (!clip || !clip.g) { say("Select a video or audio clip first."); return; }
    const target = clamp(Number(opts.target) || -1, -12, 0);
    const buf = await clipBuffer(clip);
    if (!buf) { say("Could not decode audio for that clip."); return; }
    const { a, b } = clipSourceRange(clip, buf);
    let peak = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = Math.floor(a * buf.sampleRate); i < Math.min(d.length, Math.floor(b * buf.sampleRate)); i += 3) {
        const v = Math.abs(d[i]); if (v > peak) peak = v;
      }
    }
    if (peak < 1e-6) { say("That clip is silent."); return; }
    const targetLin = Math.pow(10, target / 20);
    const gain = targetLin / peak;
    const vol = clamp((clip.fx.vol ?? 100) * gain, 0, 200);
    vpush();
    clip.fx.vol = round(vol, 1);
    if (clip.kf?.vol?.length && !window.confirm("This clip has volume keyframes. Replace them with a flat normalized level?")) {
      return;
    }
    if (clip.kf?.vol?.length) delete clip.kf.vol;
    tl(); fxUI(); vui();
    say(`Normalized to about ${target} dBFS (clip volume ${clip.fx.vol}%).`);
  }

  /* ------------------------------------------------------------------ *
   * 13b. Tone, tempo, pitch and the censor track
   *
   * Tone and time changes need real DSP, so they are rendered into a new
   * local WAV and swapped in for the clip. That keeps preview, MediaRecorder
   * exports and the WebCodecs export path in perfect agreement. Censors are
   * non-destructive: they live in fx.censor and are applied live and offline.
   * ------------------------------------------------------------------ */
  const AUDIO_FX_DEFAULTS = { bass: 0, treble: 0, tempo: 100, pitch: 0 };
  const MAX_BAKE_SECONDS = 300;

  function audioFxValues(v) {
    return {
      bass: clamp(Number(v && v.bass) || 0, -15, 15),
      treble: clamp(Number(v && v.treble) || 0, -15, 15),
      tempo: clamp(Number(v && v.tempo) || 100, 50, 200),
      pitch: clamp(Number(v && v.pitch) || 0, -12, 12)
    };
  }

  function audioFxSummary(clip) {
    const f = audioFxValues({ ...AUDIO_FX_DEFAULTS, ...(clip && clip.fx && clip.fx.audioFx) });
    if (f.bass === 0 && f.treble === 0 && f.tempo === 100 && f.pitch === 0) return "Original";
    return `${f.bass > 0 ? "+" : ""}${f.bass} dB bass / ${f.treble > 0 ? "+" : ""}${f.treble} dB treble / ${f.tempo}% / ${f.pitch > 0 ? "+" : ""}${f.pitch} st`;
  }

  function resampleLinear(data, ratio) {
    if (!Number.isFinite(ratio) || ratio <= 0 || Math.abs(ratio - 1) < 1e-4) return data;
    const outLen = Math.max(1, Math.round(data.length / ratio));
    const out = new Float32Array(outLen);
    const last = data.length - 1;
    for (let i = 0; i < outLen; i++) {
      const p = i * ratio;
      const i0 = Math.floor(p);
      if (i0 >= last) { out[i] = data[last] || 0; continue; }
      const f = p - i0;
      out[i] = data[i0] * (1 - f) + data[i0 + 1] * f;
    }
    return out;
  }

  // Overlap-add time stretch. factor > 1 makes the clip longer/slower.
  // Pitch is preserved because the analysis hop changes, not the read rate.
  function timeStretch(data, factor) {
    if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 1e-4) return data;
    const inLen = data.length;
    if (!inLen) return data;
    const outLen = Math.max(1, Math.round(inLen * factor));
    const frame = 2048;
    const hopOut = frame >> 1;
    const hopIn = hopOut / factor;
    const win = new Float32Array(frame);
    for (let i = 0; i < frame; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / frame);
    const out = new Float32Array(outLen);
    for (let k = 0, outPos = 0; outPos < outLen; k++, outPos += hopOut) {
      const inPos = Math.round(k * hopIn);
      if (inPos >= inLen) break;
      for (let i = 0; i < frame; i++) {
        const p = outPos + i;
        if (p >= outLen) break;
        const q = inPos + i;
        if (q >= inLen) break;
        out[p] += data[q] * win[i];
      }
    }
    return out;
  }

  async function applyEq(data, sampleRate, bassDb, trebleDb) {
    if ((!bassDb && !trebleDb) || !data.length || !data[0].length) return data;
    try {
      const ctx = new OfflineAudioContext(data.length, data[0].length, sampleRate);
      const buf = ctx.createBuffer(data.length, data[0].length, sampleRate);
      data.forEach((ch, i) => buf.copyToChannel(ch, i));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const lo = ctx.createBiquadFilter();
      lo.type = "lowshelf";
      lo.frequency.value = 160;
      lo.gain.value = bassDb;
      const hi = ctx.createBiquadFilter();
      hi.type = "highshelf";
      hi.frequency.value = 3800;
      hi.gain.value = trebleDb;
      src.connect(lo);
      lo.connect(hi);
      hi.connect(ctx.destination);
      src.start();
      const out = await ctx.startRendering();
      return [...Array(out.numberOfChannels)].map((_, i) => out.getChannelData(i).slice());
    } catch (e) {
      console.warn("PRO X: EQ skipped", e);
      return data;
    }
  }

  function encodeWav(data, sampleRate) {
    const ch = data.length;
    const len = data[0] ? data[0].length : 0;
    const bytes = 44 + len * ch * 2;
    const ab = new ArrayBuffer(bytes);
    const dv = new DataView(ab);
    const str = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
    str(0, "RIFF");
    dv.setUint32(4, bytes - 8, true);
    str(8, "WAVE");
    str(12, "fmt ");
    dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true);
    dv.setUint16(22, ch, true);
    dv.setUint32(24, sampleRate, true);
    dv.setUint32(28, sampleRate * ch * 2, true);
    dv.setUint16(32, ch * 2, true);
    dv.setUint16(34, 16, true);
    str(36, "data");
    dv.setUint32(40, len * ch * 2, true);
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < ch; c++) {
        let s = data[c][i] || 0;
        s = s < -1 ? -1 : s > 1 ? 1 : s;
        dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  async function applyAudioFx(values) {
    const clip = cs;
    if (!clip || !clip.g) { say("Select an audio clip on the timeline first."); return false; }
    if (clip.el && clip.el.videoWidth) {
      say("Tone, tempo and pitch need an audio clip from the A1 track. The censor tools below work on video clips too.");
      return false;
    }
    if (S.audioBusy) { say("The last audio render is still running. Give it a moment."); return false; }
    const prev = audioFxValues({ ...AUDIO_FX_DEFAULTS, ...(clip.fx.audioFx || {}) });
    const next = audioFxValues(values);
    const dBass = round(next.bass - prev.bass, 2);
    const dTreble = round(next.treble - prev.treble, 2);
    const dPitch = round(next.pitch - prev.pitch, 2);
    const tempoFactor = prev.tempo / next.tempo;
    if (!dBass && !dTreble && !dPitch && Math.abs(tempoFactor - 1) < 1e-4) {
      say("Those tone and time settings are already applied.");
      return false;
    }
    const sourceUrl = clip.it?.url || clip.el.currentSrc || clip.el.src;
    const buf = await clipBuffer(clip);
    if (!buf) { say("Could not decode that clip. It may have no audio track or use a format the browser cannot read."); return false; }
    const { a, b, speed } = clipSourceRange(clip, buf);
    const len = b - a;
    if (len < 0.05) { say("That clip is too short to process."); return false; }
    if (len > MAX_BAKE_SECONDS) {
      say(`That clip is ${fmtTime(len)} long. The tone and time tools handle up to ${Math.round(MAX_BAKE_SECONDS / 60)} minutes at a time — split the clip first.`);
      return false;
    }
    S.audioBusy = true;
    say("Rendering the new tone and timing locally…");
    await wait(40);
    try {
      const srcSr = buf.sampleRate;
      const sr = clamp(srcSr, 8000, 96000);
      const ch = Math.min(2, buf.numberOfChannels);
      const i0 = Math.floor(a * srcSr);
      const n = Math.max(1, Math.floor(len * srcSr));
      let data = [];
      for (let c = 0; c < ch; c++) {
        const s = buf.getChannelData(c);
        const out = new Float32Array(n);
        out.set(s.subarray(i0, Math.min(s.length, i0 + n)));
        data.push(out);
      }
      if (sr !== srcSr) data = data.map((d) => resampleLinear(d, srcSr / sr));
      data = await applyEq(data, sr, dBass, dTreble);
      if (dPitch) {
        const ratio = Math.pow(2, dPitch / 12);
        data = data.map((d) => timeStretch(resampleLinear(d, ratio), ratio));
      }
      if (Math.abs(tempoFactor - 1) > 1e-4) data = data.map((d) => timeStretch(d, tempoFactor));
      // Gentle peak guard: bass boosts should not clip the rendered file.
      let peak = 0;
      for (const d of data) {
        for (let i = 0; i < d.length; i++) {
          const v = d[i] < 0 ? -d[i] : d[i];
          if (v > peak) peak = v;
        }
      }
      if (peak > 0.995) {
        const g = 0.995 / peak;
        data = data.map((d) => {
          for (let i = 0; i < d.length; i++) d[i] *= g;
          return d;
        });
      }
      const outLen = data[0] ? data[0].length : 0;
      if (!outLen) throw new Error("the render produced no samples");
      const outDur = outLen / sr;
      const blob = encodeWav(data, sr);
      const url = URL.createObjectURL(blob);
      const baseName = String(clip.name || "clip").replace(/\.[a-z0-9]{2,5}$/i, "");
      const tag = `bass ${next.bass} treble ${next.treble} tempo ${next.tempo} pitch ${next.pitch}`;
      const item = { name: `${baseName} (edited ${tag}).wav`, url, type: "audio" };

      vpush();
      let el = clip.el;
      // A split shares the media element and gain node between both halves.
      // Give this clip its own element before swapping in a baked source.
      if (clips.some((c) => c !== clip && c.el === el)) {
        try {
          const fresh = new Audio();
          fresh.preload = "auto";
          fresh.src = clip.it?.url || el.currentSrc || el.src;
          fresh.onseeked = () => { playing || render(T); };
          const g = AC.createGain();
          AC.createMediaElementSource(fresh).connect(g);
          g.connect(AC.destination);
          g.connect(xd);
          clip.el = fresh;
          clip.g = g;
          el = fresh;
        } catch (e) {
          console.warn("PRO X: could not detach the split clip", e);
        }
      }
      if (!el._pxOrig) {
        el._pxOrig = { url: sourceUrl, in: clip.in, dur: clip.dur, src: clip.src };
      }
      const oldDur = clip.dur;
      items.push(item);
      clip.it = item;
      // The import handler would see this as a fresh file and try to add a
      // second clip (and a second MediaElementSource). Detach it once.
      el.onloadedmetadata = null;
      el.onerror = null;
      el.src = url;
      clip.in = 0;
      clip.src = outDur;
      clip.dur = Math.max(0.2, outDur / speed);
      clip._pxBakedUrl = url;
      clip.fx.audioFx = next;
      if (Array.isArray(clip.fx.censor) && clip.fx.censor.length) {
        const k = clip.dur / oldDur;
        clip.fx.censor = clip.fx.censor.map((m) => ({
          ...m,
          at: Math.max(0, m.at * k),
          dur: Math.max(0.05, m.dur * k)
        }));
      }
      const delta = clip.dur - oldDur;
      if (Math.abs(delta) > 0.002) {
        const oldEnd = clip.start + oldDur;
        for (const c of clips) {
          if (c !== clip && c.track === clip.track && c.start >= oldEnd - 0.01) {
            c.start = Math.max(0, c.start + delta);
          }
        }
      }
      clipAudioCache.delete(sourceUrl);
      try { tl(); fxUI(); vui(); } catch {}
      say(`Applied ${next.bass > 0 ? "+" : ""}${next.bass} dB bass, ${next.treble > 0 ? "+" : ""}${next.treble} dB treble, ${next.tempo}% tempo and ${next.pitch > 0 ? "+" : ""}${next.pitch} semitones.`);
      return true;
    } catch (e) {
      console.warn("PRO X: audio FX failed", e);
      say("Could not process that audio: " + (e.message || e));
      return false;
    } finally {
      S.audioBusy = false;
    }
  }

  function restoreBakedSources() {
    let changed = false;
    for (const clip of clips) {
      const el = clip && clip.el;
      if (!el) continue;
      let want = clip._pxBakedUrl;
      if (!want && !(clip.fx && clip.fx.audioFx)) want = el._pxOrig && el._pxOrig.url;
      if (!want) continue;
      if (el.src !== want) {
        try {
          el.onloadedmetadata = null;
          el.onerror = null;
          el.src = want;
          changed = true;
        } catch {}
      }
    }
    if (changed) { try { render(T); } catch {} }
  }

  /* ---- Censors ------------------------------------------------------ */
  function censorList(clip) {
    return clip && clip.fx && Array.isArray(clip.fx.censor) ? clip.fx.censor : [];
  }

  function censorAt(clip, time) {
    const list = censorList(clip);
    if (!list.length) return null;
    const local = time - clip.start;
    if (local < 0 || local > clip.dur) return null;
    for (const m of list) {
      if (local >= m.at && local < m.at + m.dur) return m;
    }
    return null;
  }

  function hasCensors() {
    return clips.some((c) => c.g && censorList(c).length);
  }

  let bleepNode = null;
  function ensureBleep() {
    if (bleepNode) return bleepNode;
    try {
      const gain = AC.createGain();
      gain.gain.value = 0;
      const osc = AC.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1000;
      osc.connect(gain);
      gain.connect(AC.destination);
      try { gain.connect(xd); } catch {}
      osc.start();
      bleepNode = { osc, gain };
    } catch (e) {
      console.warn("PRO X: bleep node", e);
    }
    return bleepNode;
  }

  function stopBleep() {
    if (!bleepNode) return;
    try { bleepNode.gain.gain.value = 0; } catch {}
  }

  function applyAudioCensor(time) {
    if (!hasCensors()) return;
    const b = ensureBleep();
    let beep = false;
    for (const clip of clips) {
      if (!clip.g) continue;
      const m = censorAt(clip, time);
      if (!m) continue;
      try { clip.g.gain.value = 0; } catch {}
      if (m.mode !== "mute") beep = true;
    }
    if (b) {
      try { b.gain.gain.value = playing && beep ? 0.11 : 0; } catch {}
    }
  }

  function drawCensorMarks() {
    if (typeof rows === "undefined" || !Array.isArray(rows) || typeof pps !== "number") return;
    for (const clip of clips) {
      const list = censorList(clip);
      if (!list.length) continue;
      const row = rows[clip.track < 0 ? 3 : 2 - clip.track];
      if (!row) continue;
      for (const m of list) {
        const d = document.createElement("div");
        d.className = "px-censor-mark" + (m.mode === "mute" ? " px-censor-mute" : "");
        d.style.left = (clip.start + m.at) * pps + "px";
        d.style.width = Math.max(3, m.dur * pps) + "px";
        d.title = (m.mode === "mute" ? "Silenced" : "Bleeped") + " at " + fmtTime(clip.start + m.at);
        row.append(d);
      }
    }
  }

  function addCensorAtPlayhead() {
    const clip = cs;
    if (!clip || !clip.g) { say("Select an audio or video clip on the timeline first."); return; }
    const local = T - clip.start;
    if (local < 0 || local >= clip.dur - 0.01) {
      say("Park the playhead over the selected clip first.");
      return;
    }
    const lenEl = byId("pxCensorLen");
    const modeEl = byId("pxCensorMode");
    const len = clamp(Number(lenEl && lenEl.value) || 0.6, 0.1, 10);
    const d = Math.max(0.1, Math.min(len, clip.dur - local));
    const mode = modeEl && modeEl.value === "mute" ? "mute" : "bleep";
    vpush();
    const list = censorList(clip).map((m) => ({ ...m }));
    list.push({ at: round(local, 3), dur: round(d, 3), mode });
    list.sort((a, b) => a.at - b.at);
    clip.fx.censor = list;
    try { tl(); vui(); } catch {}
    refreshAudioPanel();
    say(`${mode === "mute" ? "Silence" : "Bleep"} censor added at ${fmtTime(clip.start + local)}.`);
  }

  function removeCensor(index) {
    const clip = cs;
    if (!clip) return;
    const list = censorList(clip);
    if (index < 0 || index >= list.length) return;
    vpush();
    clip.fx.censor = list.filter((_, i) => i !== index).map((m) => ({ ...m }));
    try { tl(); vui(); } catch {}
    refreshAudioPanel();
    say("Censor removed.");
  }

  function clearCensors() {
    const clip = cs;
    if (!clip || !censorList(clip).length) { say("There are no censors on the selected clip."); return; }
    vpush();
    clip.fx.censor = [];
    try { tl(); vui(); } catch {}
    refreshAudioPanel();
    say("All censors removed from that clip.");
  }

  function refreshCensorList(clip = cs) {
    const box = byId("pxCensorList");
    if (!box) return;
    if (!clip || !clip.g) {
      box.innerHTML = `<p class="px-hint">Select an audio or video clip to censor it.</p>`;
      return;
    }
    const list = censorList(clip);
    if (!list.length) {
      box.innerHTML = `<p class="px-hint">No censors on this clip. Park the playhead and add one.</p>`;
      return;
    }
    box.innerHTML = list.map((m, i) => `<div class="px-censor-row">
      <span class="px-censor-dot${m.mode === "mute" ? " mute" : ""}"></span>
      <b>${fmtTime(clip.start + m.at)}</b>
      <span>${m.mode === "mute" ? "silence" : "1 kHz bleep"} · ${round(m.dur, 2)} s</span>
      <button class="px-btn px-sm px-ghost" data-ci="${i}" title="Remove this censor">Remove</button>
    </div>`).join("");
    qsa("[data-ci]", box).forEach((b) => b.onclick = () => removeCensor(Number(b.dataset.ci)));
  }

  function updateAudioFxLabels() {
    const map = [["pxBass", "pxBassOut"], ["pxTreble", "pxTrebleOut"], ["pxTempo", "pxTempoOut"], ["pxPitch", "pxPitchOut"]];
    for (const [inId, outId] of map) {
      const el = byId(inId);
      const out = byId(outId);
      if (!el || !out) continue;
      const v = Number(el.value) || 0;
      out.textContent = outId === "pxTempoOut" ? `${round(v, 0)}%`
        : outId === "pxPitchOut" ? `${v > 0 ? "+" : ""}${round(v, 0)} st`
        : `${v > 0 ? "+" : ""}${round(v, 0)} dB`;
    }
  }

  function syncAudioFxUI(clip) {
    const f = audioFxValues({ ...AUDIO_FX_DEFAULTS, ...(clip && clip.fx && clip.fx.audioFx) });
    [["pxBass", f.bass], ["pxTreble", f.treble], ["pxTempo", f.tempo], ["pxPitch", f.pitch]].forEach(([id, v]) => {
      const el = byId(id);
      if (el) el.value = v;
    });
    updateAudioFxLabels();
    const hint = byId("pxAudioFxHint");
    if (hint) {
      hint.textContent = clip && clip.fx && clip.fx.audioFx
        ? "Applied to this clip. Reset processes the opposite amount."
        : "No tone or timing changes applied yet.";
    }
  }

  function readAudioFxUI() {
    return {
      bass: Number(byId("pxBass") && byId("pxBass").value) || 0,
      treble: Number(byId("pxTreble") && byId("pxTreble").value) || 0,
      tempo: Number(byId("pxTempo") && byId("pxTempo").value) || 100,
      pitch: Number(byId("pxPitch") && byId("pxPitch").value) || 0
    };
  }

  // Offline mirror of the live censor mute and bleep, used by WebCodecs export.
  async function mixAudioWithCensors(total, sampleRate) {
    const ctx = new OfflineAudioContext(2, Math.max(1, Math.ceil(total * sampleRate)), sampleRate);
    let any = false;
    for (const clip of clips) {
      if (!clip.g) continue;
      const url = clip.it?.url || clip.el.currentSrc || clip.el.src;
      let buf = abCache.get(url);
      if (!buf) {
        try {
          buf = await AC.decodeAudioData(await (await fetch(url)).arrayBuffer());
          abCache.set(url, buf);
        } catch { continue; }
      }
      const speed = Math.max(0.1, (clip.fx.speed ?? 100) / 100);
      const gain = ctx.createGain();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = speed;
      src.connect(gain);
      gain.connect(ctx.destination);

      const levelAt = (at) => {
        const fx = fxAt(clip, at);
        return fx.vol / 100 * audFac(fx, at, clip.dur);
      };
      const censored = (at) => censorList(clip).some((m) => at >= m.at && at < m.at + m.dur);
      const points = Math.max(2, Math.ceil(clip.dur * 50));
      const curve = new Float32Array(points + 1);
      for (let i = 0; i <= points; i++) {
        const at = Math.min(clip.dur, (clip.dur * i) / points);
        curve[i] = censored(at) ? 0 : levelAt(at);
      }
      if (clip.dur > 0.01) gain.gain.setValueCurveAtTime(curve, clip.start, clip.dur);

      for (const m of censorList(clip)) {
        const s = clamp(m.at, 0, clip.dur);
        const e = clamp(m.at + m.dur, 0, clip.dur);
        if (e - s < 0.01 || m.mode === "mute") continue;
        const atS = clip.start + s;
        const atE = clip.start + e;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 1000;
        const g = ctx.createGain();
        osc.connect(g);
        g.connect(ctx.destination);
        const fade = Math.min(0.012, (e - s) / 3);
        g.gain.setValueAtTime(0, atS);
        g.gain.linearRampToValueAtTime(0.1, atS + fade);
        g.gain.setValueAtTime(0.1, Math.max(atS + fade, atE - fade));
        g.gain.linearRampToValueAtTime(0, atE);
        osc.start(atS);
        osc.stop(atE + 0.02);
      }
      src.start(clip.start, clip.in, clip.dur * speed);
      any = true;
    }
    return any ? ctx.startRendering() : null;
  }


  /* ------------------------------------------------------------------ *
   * 14. Memory manager: history, caches, orphan media
   * ------------------------------------------------------------------ */
  function heapInfo() {
    try {
      const m = performance.memory;
      if (m && m.jsHeapSizeLimit) {
        return { used: m.usedJSHeapSize || 0, limit: m.jsHeapSizeLimit || 0 };
      }
    } catch {}
    return { used: 0, limit: 0 };
  }
  function updateMemChip() {
    const chip = byId("pxMemChip");
    if (!chip) return;
    const h = heapInfo();
    const txt = chip.querySelector(".px-chiptxt");
    if (h.used) {
      if (txt) txt.textContent = "RAM " + fmtBytes(h.used).replace(" ", "");
      const pct = h.limit ? h.used / h.limit : 0;
      chip.dataset.state = pct > 0.85 ? "bad" : pct > 0.65 ? "warn" : "ok";
      chip.title = `JavaScript heap ${fmtBytes(h.used)} of ${fmtBytes(h.limit)} (${Math.round(pct * 100)}%). Click to manage memory.`;
    } else if (txt) {
      txt.textContent = "RAM " + Math.max(0, clips.length) + " clips";
      chip.dataset.state = "off";
      chip.title = "This browser does not report heap usage. Click for history, cache and media tools.";
    }
  }

  function historyDepth() {
    try { return U.length; } catch { return 0; }
  }
  function videoHistoryDepth() {
    try { return VU.length; } catch { return 0; }
  }
  function audioCacheSize() {
    try { return abCache.size; } catch { return 0; }
  }

  function setHistoryDepth(n) {
    const depth = clamp(Math.round(Number(n) || 12), 4, 60);
    settings.history = depth;
    saveSettings();
    try { window.__pxHistMax = depth; } catch {}
    try { if (U.length > depth) U.length = depth; } catch {}
    say(`Photo history will keep ${depth} steps.`);
    refreshMemoryPanel();
  }

  function trimHistory() {
    const depth = clamp(Number(settings.history) || 12, 4, 60);
    let removed = 0;
    try { if (U.length > depth) { removed += U.length - depth; U.length = depth; } } catch {}
    try { if (R && R.length > depth) { removed += R.length - depth; R.length = depth; } } catch {}
    try { if (VU && VU.length > depth) { removed += VU.length - depth; VU.length = depth; } } catch {}
    updateMemChip();
    refreshMemoryPanel();
    say(removed ? `Trimmed ${removed} old undo step${removed === 1 ? "" : "s"}.` : "History is already lean.");
  }

  function clearAudioCaches() {
    let n = 0;
    try { n += abCache.size; abCache.clear(); } catch {}
    try { n += clipAudioCache.size; clipAudioCache.clear(); } catch {}
    updateMemChip();
    refreshMemoryPanel();
    say(n ? `Released ${n} decoded audio buffer${n === 1 ? "" : "s"}.` : "There were no decoded audio buffers to release.");
  }

  function releaseOrphanMedia() {
    let urls = new Set();
    try {
      clips.forEach((c) => {
        const u = c.el && (c.el.currentSrc || c.el.src);
        if (u) urls.add(u);
      });
      if (cs && cs.el) {
        const u = cs.el.currentSrc || cs.el.src;
        if (u) urls.add(u);
      }
    } catch {}
    let unused = [];
    try { unused = items.filter((it) => it && it.url && !urls.has(it.url)); } catch {}
    if (!unused.length) { say("Every library item is used on the timeline."); return; }
    const names = unused.slice(0, 6).map((i) => i.name).join(", ") + (unused.length > 6 ? " and more" : "");
    if (!window.confirm(`Remove ${unused.length} unused library item${unused.length === 1 ? "" : "s"} from memory?\n\n${names}\n\nThey stay on disk and can be imported again.`)) return;
    const drop = new Set(unused.map((i) => i.url));
    try { items = items.filter((it) => !drop.has(it.url)); } catch {}
    drop.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    try {
      [...hold.querySelectorAll("video,audio,img")].forEach((el) => {
        const u = el.currentSrc || el.src;
        if (u && drop.has(u)) el.remove();
      });
    } catch {}
    try { bin(); } catch {}
    updateMemChip();
    refreshMemoryPanel();
    say(`Removed ${unused.length} unused item${unused.length === 1 ? "" : "s"} and released their memory.`);
  }

  function refreshMemoryPanel() {
    const box = byId("pxMemStats");
    const h = heapInfo();
    const snaps = S.snaps || [];
    if (box) {
      box.innerHTML = [
        stat("Browser heap", h.used ? fmtBytes(h.used) : "n/a"),
        stat("Heap limit", h.limit ? fmtBytes(h.limit) : "n/a"),
        stat("Photo history", historyDepth() + " steps"),
        stat("Video history", videoHistoryDepth() + " steps"),
        stat("Timeline clips", clips.length),
        stat("Library items", items.length),
        stat("Audio buffers", audioCacheSize()),
        stat("Snapshots", snaps.length)
      ].join("");
    }
    const meter = byId("pxMemMeter");
    if (meter) {
      const pct = h.used && h.limit ? clamp((h.used / h.limit) * 100, 2, 100) : clamp((clips.length * 3 + historyDepth() * 2), 3, 92);
      meter.style.width = pct.toFixed(1) + "%";
    }
    const histLabel = byId("pxHistOut");
    if (histLabel) histLabel.textContent = (settings.history || 12) + " steps";
    const histInput = byId("pxHistDepth");
    if (histInput && document.activeElement !== histInput) histInput.value = settings.history || 12;
    const auto = byId("pxSetAutosave");
    if (auto) auto.checked = !!settings.autosave;
    const autoMin = byId("pxSetAutoMin");
    if (autoMin && document.activeElement !== autoMin) autoMin.value = settings.autosaveMin || 2;
    refreshSnapshots();
  }

  /* ------------------------------------------------------------------ *
   * 15. Recovery snapshots in IndexedDB
   * ------------------------------------------------------------------ */
  const DB_NAME = "studio-pro-x";
  const DB_STORE = "snapshots";
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      let req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          const store = db.createObjectStore(DB_STORE, { keyPath: "id" });
          store.createIndex("ts", "ts");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IndexedDB is not available."));
      req.onblocked = () => reject(new Error("IndexedDB is blocked by another tab."));
    });
    return dbPromise;
  }

  async function dbPut(rec) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(rec);
      tx.oncomplete = () => resolve(rec);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("Snapshot write was aborted."));
    });
  }
  async function dbAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const out = [];
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) { out.push(cur.value); cur.continue(); } else resolve(out);
      };
      req.onerror = () => reject(req.error);
    });
  }
  async function dbDel(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function dbClear() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  function canSnapshot() {
    try {
      return typeof buildProject === "function" && typeof hasWork === "object" &&
        (hasWork.photo() || hasWork.video() || hasWork.audio() || hasWork.model());
    } catch { return false; }
  }

  async function makeSnapshot(reason = "auto") {
    if (S.save.busy || !canSnapshot()) return null;
    S.save.busy = true;
    const bar = byId("pxSnapProgress");
    if (bar) bar.classList.add("px-on");
    try {
      await wait(30);
      const name = (byId("prn")?.value || "Recovery");
      const blob = await buildProject({ photo: true, video: true, audio: true, model: true }, name);
      if (blob.size > 384 * 1024 * 1024) {
        console.info("PRO X: snapshot skipped because the project is larger than 384 MB.");
        if (reason === "manual") say("This project is too large for a browser snapshot. Save a project file instead.");
        return null;
      }
      const rec = {
        id: "snap-" + Date.now().toString(36),
        ts: Date.now(),
        name,
        size: blob.size,
        reason,
        version: VERSION,
        blob
      };
      await dbPut(rec);
      await pruneSnapshots();
      S.save.last = Date.now();
      S.save.dirty = false;
      if (reason === "manual") say(`Recovery snapshot saved (${fmtBytes(blob.size)}).`);
      refreshSnapshots();
      return rec;
    } catch (e) {
      console.warn("PRO X: snapshot failed", e);
      if (reason === "manual") say("Could not save a snapshot: " + (e && e.message || e));
      return null;
    } finally {
      S.save.busy = false;
      if (bar) bar.classList.remove("px-on");
    }
  }

  async function pruneSnapshots(keep = 5) {
    try {
      const all = await dbAll();
      const sorted = all.sort((a, b) => b.ts - a.ts);
      for (const rec of sorted.slice(keep)) await dbDel(rec.id);
    } catch {}
  }

  async function refreshSnapshots() {
    const box = byId("pxSnapList");
    let list = [];
    try { list = await dbAll(); } catch { list = []; }
    list.sort((a, b) => b.ts - a.ts);
    S.snaps = list;
    if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="px-empty">No recovery snapshots yet. They appear here after autosave or <b>Save snapshot</b>.</div>`;
      return;
    }
    box.innerHTML = `<table class="px-table">
      <thead><tr><th>When</th><th>Project</th><th>Size</th><th>Type</th><th></th></tr></thead>
      <tbody>${list.map((r) => `<tr>
        <td>${esc(fmtClock(r.ts))}</td>
        <td>${esc(r.name || "Recovery")}</td>
        <td class="px-mono">${fmtBytes(r.size)}</td>
        <td>${r.reason === "manual" ? badge("manual", "px-info") : badge("auto", "")}</td>
        <td style="white-space:nowrap;text-align:right">
          <button class="px-btn px-sm" data-snap-restore="${esc(r.id)}">Restore</button>
          <button class="px-btn px-sm px-ghost" data-snap-del="${esc(r.id)}" title="Delete">X</button>
        </td></tr>`).join("")}</tbody></table>`;
    qsa("[data-snap-restore]", box).forEach((b) => b.onclick = () => restoreSnapshot(b.dataset.snapRestore));
    qsa("[data-snap-del]", box).forEach((b) => b.onclick = async () => {
      if (!window.confirm("Delete this recovery snapshot?")) return;
      try { await dbDel(b.dataset.snapDel); } catch {}
      refreshSnapshots();
      refreshMemoryPanel();
    });
  }

  async function restoreSnapshot(id) {
    let rec = null;
    try { rec = (await dbAll()).find((r) => r.id === id); } catch {}
    if (!rec) { say("That snapshot could not be found."); return; }
    if (!rec.blob) { say("That snapshot has no project data."); return; }
    say("Restoring the snapshot.");
    try {
      const ok = await loadProjectBlob(rec.blob, true);
      if (ok) {
        const bar = byId("pxRecoveryBar");
        if (bar) bar.remove();
        say("Snapshot restored. Keep editing, then save a project file.");
      }
    } catch (e) {
      say("Could not restore the snapshot: " + (e && e.message || e));
    }
  }

  function showRecoveryBar(rec) {
    if (byId("pxRecoveryBar")) return;
    const bar = document.createElement("div");
    bar.id = "pxRecoveryBar";
    bar.innerHTML = `<b>Recovery snapshot</b>
      <span>${esc(fmtClock(rec.ts))} &middot; ${fmtBytes(rec.size)} &middot; ${esc(rec.name || "Project")}</span>
      <div class="px-row">
        <button class="px-btn px-sm px-pri" id="pxRecRestore">Restore</button>
        <button class="px-btn px-sm px-ghost" id="pxRecDismiss">Not now</button>
      </div>`;
    document.body.append(bar);
    requestAnimationFrame(() => bar.classList.add("px-on"));
    byId("pxRecRestore").onclick = () => restoreSnapshot(rec.id);
    byId("pxRecDismiss").onclick = () => bar.remove();
    setTimeout(() => { if (bar.isConnected) bar.remove(); }, 120000);
  }

  async function checkRecovery() {
    if (!settings.autosave) return;
    let list = [];
    try { list = await dbAll(); } catch { return; }
    if (!list.length) return;
    list.sort((a, b) => b.ts - a.ts);
    const rec = list[0];
    if (Date.now() - rec.ts > 7 * 24 * 3600 * 1000) return;
    showRecoveryBar(rec);
  }

  let autosaveBusy = false;
  async function autosaveTick() {
    if (!settings.autosave || autosaveBusy || S.save.busy || S.save.restoring) return;
    if (document.visibilityState !== "visible") return;
    if (!S.save.dirty) return;
    if (Date.now() - (S.save.last || 0) < (settings.autosaveMin || 2) * 60000) return;
    if (!canSnapshot()) return;
    autosaveBusy = true;
    try { await makeSnapshot("auto"); } finally { autosaveBusy = false; }
  }

  function setupSnapshotEngine() {
    try { window.__pxHistMax = clamp(Number(settings.history) || 12, 4, 60); } catch {}
    setInterval(autosaveTick, 30000);
    setTimeout(checkRecovery, 1600);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") { S.save.dirty = true; autosaveTick(); }
    });
  }


  /* ------------------------------------------------------------------ *
   * 16. Creator Hub
   * ------------------------------------------------------------------ */
  const HUB_NAV = [
    { id: "publish", ico: "PUB", label: "Publish" },
    { id: "captions", ico: "CC", label: "Captions" },
    { id: "thumb", ico: "IMG", label: "Thumbnail" },
    { id: "audio", ico: "AUD", label: "Audio tools" },
    { id: "brand", ico: "BRD", label: "Brand & watermark" },
    { id: "export", ico: "EXP", label: "Export & codecs" },
    { id: "memory", ico: "RAM", label: "Memory & recovery" },
    { id: "embed", ico: "EMB", label: "Embed & PWA" },
    { id: "settings", ico: "SET", label: "Settings" },
    { id: "help", ico: "?", label: "Help" }
  ];

  const FONT_CHOICES = [
    ["system-ui, sans-serif", "System sans"],
    ["'Segoe UI', system-ui, sans-serif", "Segoe UI"],
    ["Inter, Helvetica, Arial, sans-serif", "Helvetica / Arial"],
    ["Georgia, 'Times New Roman', serif", "Georgia serif"],
    ["'Trebuchet MS', sans-serif", "Trebuchet"],
    ["Impact, 'Arial Black', sans-serif", "Impact"],
    ["ui-monospace, Consolas, monospace", "Monospace"]
  ];

  function platformCards() {
    return PLATFORMS.map((p) => `<button class="px-card" data-plat="${p.id}">
      <b>${esc(p.name)} <span class="px-card-badge">${esc(p.ar)}</span></b>
      <span>${p.w} x ${p.h} at ${p.fps} fps</span>
      <em>${esc(p.note)} &middot; ${p.vbr} Mbps</em>
    </button>`).join("");
  }
  function presetCards() {
    return EXPORT_PRESETS.map((p) => `<button class="px-card" data-preset="${p.id}">
      <b>${esc(p.name)}</b>
      <span>${esc(p.detail)}</span>
      <em>${p.w} x ${p.h} &middot; ${p.fps} fps</em>
    </button>`).join("");
  }

  function hubMarkup() {
    const fontOpts = FONT_CHOICES.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
    const nav = HUB_NAV.map((n) => `<button data-panel="${n.id}" aria-pressed="false">
      <span class="px-navico">${n.ico}</span><span>${esc(n.label)}</span></button>`).join("");

    return `
    <div class="px-hub">
      <div class="px-hub-head">
        <div class="px-hub-title"><span class="px-brand-mark">P</span> Creator Hub <span class="px-badge px-info">1.0</span></div>
        <div class="px-hub-sub" id="pxHubSub">Publishing, captions, thumbnails and audio</div>
        <div class="px-row">
          <button class="px-btn px-sm" id="pxHubHelpBtn">Help</button>
          <button class="px-iconbtn px-hub-close" id="pxHubClose" title="Close">&times;</button>
        </div>
      </div>
      <div class="px-hub-body">
        <nav class="px-hub-nav" id="pxHubNav">${nav}</nav>
        <div class="px-hub-main" id="pxHubMain">

          <section class="px-hub-panel" data-panel="publish">
            <h3>Publish to any platform</h3>
            <p class="px-lead">Choose where the video is going. The frame size, safe zones and export preset are set for you. Existing clips can be cropped to fill the new frame or letterboxed to fit inside it.</p>
            <div class="px-panelbox" id="pxPubNow"></div>
            <h4>Platform sizes</h4>
            <div class="px-grid" id="pxPlatGrid">${platformCards()}</div>
            <h4>Fit existing clips</h4>
            <div class="px-row">
              <button class="px-btn px-pri" id="pxFill">Fill frame (crop)</button>
              <button class="px-btn" id="pxFit">Fit frame (letterbox)</button>
              <button class="px-btn" id="pxCenter">Centre clips</button>
            </div>
            <p class="px-hint">Fill keeps the whole frame covered and crops the edges. Fit shows everything with bars. Motion, colour and keyframes are kept.</p>
            <h4>Export presets</h4>
            <div class="px-grid px-grid-2" id="pxExpGrid">${presetCards()}</div>
            <p class="px-hint">A preset fills the export dialog. You can still change any value before pressing export.</p>
          </section>

          <section class="px-hub-panel" data-panel="captions">
            <h3>Captions and subtitles</h3>
            <p class="px-lead">Import an SRT or VTT file, style it, then add the cues as caption clips. They sit on V3 and burn into preview and every export. You can also export a fresh SRT for YouTube, TikTok or a website player.</p>
            <div class="px-split">
              <div class="px-col">
                <label class="px-field"><span>Paste captions (SRT or VTT)</span>
                  <textarea class="px-area" id="pxCueInput" spellcheck="false" placeholder="1&#10;00:00:00,000 --&gt; 00:00:02,500&#10;Hello and welcome.&#10;&#10;2&#10;00:00:02,500 --&gt; 00:00:05,000&#10;Today we build something."></textarea>
                </label>
                <div class="px-row">
                  <button class="px-btn px-pri" id="pxCueParse">Parse</button>
                  <button class="px-btn" id="pxCueFileBtn">Open file</button>
                  <input type="file" id="pxCueFile" accept=".srt,.vtt,text/plain,text/vtt" hidden>
                  <span class="px-muted" id="pxCueCount">No cues parsed</span>
                </div>
                <label class="px-field"><span>Time offset in seconds (use a negative number to start earlier)</span>
                  <input type="number" class="px-input" id="pxCueShift" value="0" step="0.1">
                </label>
                <div class="px-row">
                  <button class="px-btn px-pri" id="pxCueAdd">Add to timeline</button>
                  <button class="px-btn" id="pxCueReplace">Replace existing captions</button>
                </div>
                <p class="px-hint">Caption clips are normal clips: drag, trim or delete them like any other title.</p>
              </div>
              <div class="px-col">
                <label class="px-field"><span>Font</span>
                  <select class="px-select" id="pxCapFont">${fontOpts}</select>
                </label>
                <label class="px-field"><span>Size <b id="pxCapSizeOut">4.8%</b> of frame height</span>
                  <input type="range" class="px-range" id="pxCapSize" min="2" max="12" step="0.1">
                </label>
                <label class="px-field"><span>Vertical position <b id="pxCapYOut">88%</b> from the top</span>
                  <input type="range" class="px-range" id="pxCapY" min="35" max="97" step="0.5">
                </label>
                <label class="px-field"><span>Maximum line width <b id="pxCapWOut">86%</b></span>
                  <input type="range" class="px-range" id="pxCapW" min="40" max="100" step="1">
                </label>
                <label class="px-field"><span>Background plate <b id="pxCapBgOut">55%</b></span>
                  <input type="range" class="px-range" id="pxCapBg" min="0" max="100" step="1">
                </label>
                <div class="px-row">
                  <label class="px-field" style="flex:1"><span>Text colour</span><input type="color" class="px-input" id="pxCapColor" value="#ffffff" style="height:30px;padding:2px"></label>
                  <label class="px-field" style="flex:1"><span>Plate colour</span><input type="color" class="px-input" id="pxCapBgc" value="#000000" style="height:30px;padding:2px"></label>
                </div>
                <div class="px-row">
                  <label class="px-check"><input type="checkbox" id="pxCapBold" checked> Bold</label>
                  <label class="px-check"><input type="checkbox" id="pxCapShadow" checked> Shadow</label>
                </div>
                <div class="px-row">
                  <button class="px-btn" id="pxCapStyle">Apply style to captions</button>
                  <button class="px-btn px-ghost" id="pxCapClear">Clear captions</button>
                </div>
              </div>
            </div>
            <h4>Cues</h4>
            <div id="pxCueTable"></div>
            <div class="px-row" style="margin-top:12px">
              <button class="px-btn" id="pxCapExport">Export SRT</button>
              <span class="px-muted" id="pxCapSummary"></span>
            </div>
          </section>

          <section class="px-hub-panel" data-panel="thumb">
            <h3>Thumbnail Studio</h3>
            <p class="px-lead">A strong thumbnail is most of the click. Capture the current video frame or open a picture, then add a short headline, a supporting line and a badge. Export at the exact size the platform expects.</p>
            <div class="px-grid px-grid-2">
              <button class="px-card" id="pxThumbOpen">
                <b>Open Thumbnail Studio</b>
                <span>Full editor with templates, colours, overlay strength and a live preview.</span>
                <em>1280 x 720 or any platform size</em>
              </button>
              <button class="px-card" id="pxThumbFrame">
                <b>Use the current frame</b>
                <span>Grabs the program monitor at the playhead and drops it into the studio.</span>
                <em>Quick starting point</em>
              </button>
            </div>
            <h4>Quick sizes</h4>
            <div class="px-grid" id="pxThumbSizes">
              <button class="px-card" data-thsize="1280x720"><b>YouTube</b><span>1280 x 720</span><em>16:9 thumbnail</em></button>
              <button class="px-card" data-thsize="1920x1080"><b>Full HD</b><span>1920 x 1080</span><em>Sharp 16:9</em></button>
              <button class="px-card" data-thsize="1080x1080"><b>Square</b><span>1080 x 1080</span><em>Feed post</em></button>
              <button class="px-card" data-thsize="1080x1350"><b>Portrait</b><span>1080 x 1350</span><em>4:5 feed</em></button>
              <button class="px-card" data-thsize="1080x1920"><b>Vertical</b><span>1080 x 1920</span><em>Shorts and TikTok covers</em></button>
            </div>
            <p class="px-hint">The studio keeps your headline and colours while you change size, so one idea works on every platform.</p>
          </section>

          <section class="px-hub-panel" data-panel="audio">
            <h3>Audio tools</h3>
            <p class="px-lead">Three jobs that usually need another app: keep music under the voice, remove dead air, and even out loudness. Everything works on the clip selected on the timeline.</p>
            <div class="px-panelbox" id="pxAudioSel"></div>
            <h4>Duck music under speech</h4>
            <div class="px-grid">
              <label class="px-field"><span>Voice threshold (dB)</span><input type="number" class="px-input" id="pxDuckThreshold" value="-32" min="-60" max="-8" step="1"></label>
              <label class="px-field"><span>Music level while speaking (%)</span><input type="number" class="px-input" id="pxDuckAmount" value="35" min="0" max="90" step="5"></label>
              <label class="px-field"><span>Fade (seconds)</span><input type="number" class="px-input" id="pxDuckFade" value="0.35" min="0.05" max="2" step="0.05"></label>
            </div>
            <div class="px-row" style="margin-top:9px">
              <button class="px-btn px-pri" id="pxDuckRun">Duck selected clip</button>
              <span class="px-hint">Select the music clip first. Volume keyframes are written under every other audio clip.</span>
            </div>
            <h4>Remove silence</h4>
            <div class="px-grid">
              <label class="px-field"><span>Silence threshold (dB)</span><input type="number" class="px-input" id="pxSilThreshold" value="-38" min="-60" max="-10" step="1"></label>
              <label class="px-field"><span>Minimum silence (seconds)</span><input type="number" class="px-input" id="pxSilMin" value="0.45" min="0.15" max="3" step="0.05"></label>
            </div>
            <div class="px-row" style="margin-top:9px">
              <button class="px-btn px-pri" id="pxSilRun">Remove silence and close gaps</button>
              <span class="px-hint">The selected clip is split into the parts worth keeping. Later clips ripple left.</span>
            </div>
            <h4>Normalize</h4>
            <div class="px-grid">
              <label class="px-field"><span>Target peak (dBFS)</span><input type="number" class="px-input" id="pxNormTarget" value="-1" min="-12" max="0" step="0.5"></label>
            </div>
            <div class="px-row" style="margin-top:9px">
              <button class="px-btn px-pri" id="pxNormRun">Normalize selected clip</button>
              <span class="px-hint">Uses the decoded waveform to set the clip volume. Keyframed volume will ask before it is replaced.</span>
            </div>
            <h4>Tone, tempo and pitch</h4>
            <p class="px-hint">Select an audio clip on track A1, set the amount, then apply. The editor renders a new local WAV so the preview and every export sound the same. The clip length follows tempo changes and later clips ripple out of the way.</p>
            <div class="px-grid">
              <label class="px-field"><span>Bass <b id="pxBassOut">0 dB</b></span><input type="range" class="px-range" id="pxBass" min="-15" max="15" step="1" value="0"></label>
              <label class="px-field"><span>Treble <b id="pxTrebleOut">0 dB</b></span><input type="range" class="px-range" id="pxTreble" min="-15" max="15" step="1" value="0"></label>
              <label class="px-field"><span>Tempo <b id="pxTempoOut">100%</b></span><input type="range" class="px-range" id="pxTempo" min="50" max="200" step="1" value="100"></label>
              <label class="px-field"><span>Pitch <b id="pxPitchOut">0 st</b></span><input type="range" class="px-range" id="pxPitch" min="-12" max="12" step="1" value="0"></label>
            </div>
            <div class="px-row" style="margin-top:9px">
              <button class="px-btn px-pri" id="pxAudioFxApply">Apply tone and time</button>
              <button class="px-btn px-ghost" id="pxAudioFxReset">Reset to zero</button>
              <span class="px-hint" id="pxAudioFxHint">No tone or timing changes applied yet.</span>
            </div>
            <h4>Censor words</h4>
            <p class="px-hint">Park the playhead over the word, then add a 1 kHz bleep or silence. Censors are non-destructive, survive project saves and are drawn on the clip. They work on video clips as well as audio clips. For faces, plates or logos, use Blur or Pixelate in the clip's Effect controls.</p>
            <div class="px-grid">
              <label class="px-field"><span>Style</span><select class="px-select" id="pxCensorMode"><option value="bleep">Bleep (1 kHz tone)</option><option value="mute">Silence</option></select></label>
              <label class="px-field"><span>Length (seconds)</span><input type="number" class="px-input" id="pxCensorLen" value="0.6" min="0.1" max="10" step="0.1"></label>
            </div>
            <div class="px-row" style="margin-top:9px">
              <button class="px-btn px-pri" id="pxCensorAdd">Add censor at playhead</button>
              <button class="px-btn px-ghost" id="pxCensorClear">Clear all censors</button>
            </div>
            <div id="pxCensorList" style="margin-top:8px"></div>
          </section>

          <section class="px-hub-panel" data-panel="brand">
            <h3>Brand kit and watermark</h3>
            <p class="px-lead">Save your name, handle, colours and logo once. Turn the watermark on to draw it on the program monitor and every export. The settings stay in this browser.</p>
            <div class="px-grid px-grid-2">
              <label class="px-field"><span>Creator or channel name</span><input class="px-input" id="pxBrandName" placeholder="Your channel"></label>
              <label class="px-field"><span>Handle</span><input class="px-input" id="pxBrandHandle" placeholder="@yourhandle"></label>
              <label class="px-field"><span>Accent colour</span><input type="color" class="px-input" id="pxBrandColor" value="#378ef0" style="height:32px;padding:2px"></label>
              <label class="px-field"><span>Second colour</span><input type="color" class="px-input" id="pxBrandColor2" value="#34d3b1" style="height:32px;padding:2px"></label>
            </div>
            <h4>Logo</h4>
            <div class="px-row">
              <button class="px-btn" id="pxBrandLogoBtn">Choose logo (PNG or SVG)</button>
              <input type="file" id="pxBrandLogo" accept="image/png,image/svg+xml,image/jpeg,image/webp" hidden>
              <button class="px-btn px-ghost" id="pxBrandLogoClear">Remove logo</button>
              <span class="px-muted" id="pxBrandLogoName">No logo</span>
            </div>
            <h4>Watermark</h4>
            <div class="px-panelbox">
              <label class="px-check" style="font-weight:700"><input type="checkbox" id="pxWmOn"> Show watermark in preview and exports</label>
              <div class="px-grid" style="margin-top:9px">
                <label class="px-field"><span>Watermark text (blank uses your handle)</span><input class="px-input" id="pxWmText" placeholder="@yourhandle"></label>
                <label class="px-field"><span>Position</span>
                  <select class="px-select" id="pxWmPos">
                    <option value="tl">Top left</option>
                    <option value="tc">Top centre</option>
                    <option value="tr">Top right</option>
                    <option value="bl">Bottom left</option>
                    <option value="bc">Bottom centre</option>
                    <option value="br">Bottom right</option>
                    <option value="center">Centre</option>
                  </select>
                </label>
                <label class="px-field"><span>Size <b id="pxWmSizeOut">3.1%</b></span><input type="range" class="px-range" id="pxWmSize" min="1" max="9" step="0.1"></label>
                <label class="px-field"><span>Opacity <b id="pxWmOpacityOut">78%</b></span><input type="range" class="px-range" id="pxWmOpacity" min="5" max="100" step="1"></label>
              </div>
              <div class="px-row" style="margin-top:8px">
                <label class="px-check"><input type="checkbox" id="pxWmPlate"> Dark plate behind it</label>
                <label class="px-check"><input type="checkbox" id="pxWmShadow"> Soft shadow</label>
              </div>
            </div>
            <h4>Preview</h4>
            <div id="pxBrandPreview"></div>
            <div class="px-row" style="margin-top:10px">
              <button class="px-btn px-pri" id="pxBrandApply">Apply and redraw</button>
              <button class="px-btn px-ghost" id="pxBrandReset">Reset brand kit</button>
            </div>
          </section>

          <section class="px-hub-panel" data-panel="export">
            <h3>Export and codecs</h3>
            <p class="px-lead">Chrome and Edge can use hardware WebCodecs for H.264, H.265, VP9 and AV1. Firefox often falls back to WebM through MediaRecorder. This panel shows what is actually available in the browser you are using right now.</p>
            <div class="px-panelbox">
              <div class="px-row">
                <b>Best automatic choice</b>
                <span class="px-badge px-info" id="pxBestFmt">Checking&hellip;</span>
                <button class="px-btn px-sm" id="pxBestRefresh">Check again</button>
              </div>
              <p class="px-hint" style="margin-top:6px">Automatic picks the smallest reliable path. If a hardware encoder disappears mid-export, the editor falls back instead of failing.</p>
            </div>
            <h4>What this browser can encode</h4>
            <table class="px-table">
              <thead><tr><th>Format</th><th>Encoder</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody id="pxCodecBody"><tr><td colspan="4" class="px-muted">Checking this browser&hellip;</td></tr></tbody>
            </table>
            <p class="px-hint" id="pxCodecHint">Capabilities are checked live with VideoEncoder.isConfigSupported and MediaRecorder.isTypeSupported.</p>
            <h4>Open the export dialog with a format</h4>
            <div class="px-row">
              <select class="px-select" id="pxFmtQuick" style="max-width:280px">
                <option value="auto">Automatic - best for this browser</option>
                <option value="h264">MP4 - H.264</option>
                <option value="h265">MP4 - H.265 (HEVC)</option>
                <option value="av1">MP4 - AV1</option>
                <option value="vp9">MP4 - VP9 (WebCodecs)</option>
                <option value="webm">WebM - VP9 / VP8</option>
                <option value="prores">MOV - ProRes</option>
              </select>
              <button class="px-btn px-pri" id="pxFmtOpen">Open export dialog</button>
            </div>
            <h4>Good to know</h4>
            <div class="px-grid px-grid-2">
              <div class="px-panelbox"><b>Memory</b><p class="px-hint">Long exports hold frames in memory. Close other tabs, export in parts, or turn on Compatibility mode in Settings.</p></div>
              <div class="px-panelbox"><b>Downloads in iframes</b><p class="px-hint">Some hosts block downloads and full screen. Use Open standalone in the embed panel, or the save preview window.</p></div>
              <div class="px-panelbox"><b>Firefox</b><p class="px-hint">Firefox may offer only WebM. That file plays everywhere on the web, but some social platforms re-encode it.</p></div>
              <div class="px-panelbox"><b>AV1</b><p class="px-hint">AV1 gives smaller files but needs a recent GPU or CPU. Check the matrix above before choosing it for a long video.</p></div>
            </div>
          </section>

          <section class="px-hub-panel" data-panel="memory">
            <h3>Memory and recovery</h3>
            <p class="px-lead">Video editing is memory hungry. This panel shows what the editor is holding, lets you trim history and caches, and keeps recovery snapshots in IndexedDB so a crash does not cost a whole session.</p>
            <div class="px-statgrid" id="pxMemStats"></div>
            <div class="px-meter" style="margin-top:10px"><i id="pxMemMeter"></i></div>
            <p class="px-hint">The bar uses the browser heap where it is reported. Otherwise it estimates pressure from clips and history.</p>
            <div class="px-split" style="margin-top:12px">
              <div class="px-panelbox">
                <b>History depth</b>
                <div class="px-row" style="margin-top:8px">
                  <input type="range" class="px-range" id="pxHistDepth" min="4" max="60" step="1" style="flex:1">
                  <span class="px-muted" id="pxHistOut">12 steps</span>
                </div>
                <div class="px-row"><button class="px-btn" id="pxTrimHist">Trim history now</button></div>
                <p class="px-hint">Undo keeps full image snapshots. Fewer steps is the single biggest saving for photo work.</p>
              </div>
              <div class="px-panelbox">
                <b>Free memory</b>
                <div class="px-row" style="margin-top:8px">
                  <button class="px-btn" id="pxClearAudio">Clear audio cache</button>
                  <button class="px-btn" id="pxOrphan">Remove unused media</button>
                </div>
                <p class="px-hint">Unused media means library items that are not on the timeline. The original files stay on disk.</p>
                <div class="px-row"><button class="px-btn px-ghost" id="pxMemRefresh">Refresh numbers</button></div>
              </div>
            </div>
            <h4>Recovery snapshots</h4>
            <div class="px-row">
              <label class="px-check"><input type="checkbox" id="pxSetAutosave"> Autosave recovery snapshots</label>
              <label class="px-field" style="max-width:170px"><span>Every (minutes)</span><input type="number" class="px-input" id="pxSetAutoMin" min="1" max="30" step="1"></label>
              <span class="px-badge px-warn" id="pxSnapProgress" style="display:none">Working</span>
            </div>
            <div class="px-row" style="margin-top:9px">
              <button class="px-btn px-pri" id="pxSnapNow">Save snapshot now</button>
              <button class="px-btn px-ghost" id="pxSnapClear">Delete all snapshots</button>
            </div>
            <div id="pxSnapList" style="margin-top:10px"></div>
            <p class="px-hint">Snapshots contain your project parts and media. Very large projects over 384 MB are skipped, so save a project file for those.</p>
          </section>

          <section class="px-hub-panel" data-panel="embed">
            <h3>Embed and install</h3>
            <p class="px-lead">Studio Editor PRO X runs happily inside a WIX page, Squarespace, WordPress or any site that allows an HTML iframe. The same files can be installed as a desktop app.</p>
            <h4>WIX / website iframe</h4>
            <p class="px-hint">In WIX, add <b>Embed &gt; Custom embed &gt; Embed code</b>, then paste this. Host the four PWA files next to the HTML for install and offline support.</p>
            <textarea class="px-area" id="pxEmbedCode" readonly rows="6" spellcheck="false"></textarea>
            <div class="px-row">
              <button class="px-btn px-pri" id="pxEmbedCopy">Copy embed code</button>
              <button class="px-btn" id="pxEmbedOpen">Open standalone</button>
              <span class="px-muted" id="pxEmbedState"></span>
            </div>
            <h4>Host API (postMessage)</h4>
            <p class="px-hint">Send <code class="px-kbd">prox:</code> messages to the iframe. Every reply includes <code class="px-kbd">source: "studio-pro-x"</code> and the same <code class="px-kbd">requestId</code>.</p>
            <table class="px-table">
              <thead><tr><th>Command</th><th>Payload</th><th>Does</th></tr></thead>
              <tbody>
                <tr><td class="px-mono">prox:ping</td><td>-</td><td>Replies <b>pong</b> with version and state.</td></tr>
                <tr><td class="px-mono">prox:state</td><td>-</td><td>Frame size, fps, duration, clip counts, captions.</td></tr>
                <tr><td class="px-mono">prox:openWorkspace</td><td>{ workspace }</td><td>photo, video, audio or model.</td></tr>
                <tr><td class="px-mono">prox:openCreator</td><td>{ panel }</td><td>Opens this hub on a panel.</td></tr>
                <tr><td class="px-mono">prox:setTheme</td><td>{ accent }</td><td>Sets the accent colour.</td></tr>
                <tr><td class="px-mono">prox:loadProject</td><td>{ buffer | data }</td><td>Opens a .studio project.</td></tr>
                <tr><td class="px-mono">prox:getProject</td><td>-</td><td>Returns the project bytes.</td></tr>
                <tr><td class="px-mono">prox:frame</td><td>{ time, format }</td><td>Returns a PNG or JPEG of that frame.</td></tr>
                <tr><td class="px-mono">prox:export</td><td>-</td><td>Opens the export dialog.</td></tr>
              </tbody>
            </table>
            <h4>Desktop app</h4>
            <div class="px-row">
              <button class="px-btn px-pri" id="pxPwaInstall">Install app</button>
              <button class="px-btn" id="pxPwaUpdate">Check for updates</button>
            </div>
            <div class="px-statgrid" id="pxPwaStatus" style="margin-top:10px"></div>
            <p class="px-hint">Install needs the page to be served over HTTP or HTTPS. Opening the HTML file directly still works, but the browser will not offer installation or offline caching.</p>
          </section>

          <section class="px-hub-panel" data-panel="settings">
            <h3>Settings</h3>
            <p class="px-lead">These settings are saved in this browser. They never travel inside an exported project.</p>
            <h4>Interface</h4>
            <div class="px-grid px-grid-2">
              <label class="px-field"><span>Layout</span>
                <select class="px-select" id="pxSetMobile">
                  <option value="auto">Automatic - touch screens get the mobile layout</option>
                  <option value="on">Always use the mobile and tablet layout</option>
                  <option value="off">Always use the desktop layout</option>
                </select>
              </label>
              <label class="px-field"><span>Accent colour</span>
                <input type="color" class="px-input" id="pxSetAccent" value="#378ef0" style="height:32px;padding:2px">
              </label>
              <label class="px-field"><span>Preview quality</span>
                <select class="px-select" id="pxSetQuality">
                  <option value="quality">Quality - smoothing and full pixel ratio</option>
                  <option value="balanced">Balanced - faster on older machines</option>
                </select>
              </label>
              <div class="px-field"><span>Options</span>
                <label class="px-check"><input type="checkbox" id="pxSafeToggle"> Show safe zones on the program monitor</label>
                <label class="px-check"><input type="checkbox" id="pxSetCompat"> Compatibility mode for older or low-memory devices</label>
              </div>
            </div>
            <label class="px-field" style="max-width:320px;margin-top:10px"><span>Safe zone style</span>
              <select class="px-select" id="pxSetSafeStyle">
                <option value="all">Action, title and platform UI</option>
                <option value="title">Title safe and rule of thirds</option>
                <option value="platform">Platform UI only</option>
              </select>
            </label>
            <h4>Jump to a workspace</h4>
            <div class="px-row px-touch-only" id="pxSetWorkspaces">
              <button class="px-btn px-sm" data-ws="photo">Photo</button>
              <button class="px-btn px-sm" data-ws="video">Video</button>
              <button class="px-btn px-sm" data-ws="audio">Audio</button>
              <button class="px-btn px-sm" data-ws="model">3D</button>
              <button class="px-btn px-sm" data-ws="resources">Resources</button>
              <button class="px-btn px-sm" data-ws="whatsnew">What's new</button>
            </div>
            <h4>Recovery</h4>
            <div class="px-row">
              <label class="px-check"><input type="checkbox" id="pxSetAutosave2"> Autosave recovery snapshots</label>
              <label class="px-field" style="max-width:170px"><span>Every (minutes)</span><input type="number" class="px-input" id="pxSetAutoMin2" min="1" max="30" step="1"></label>
            </div>
            <h4>Reset</h4>
            <div class="px-row">
              <button class="px-btn" id="pxSetReset">Reset interface settings</button>
              <button class="px-btn px-ghost" id="pxSetResetAll">Reset settings and brand kit</button>
            </div>
          </section>

          <section class="px-hub-panel" data-panel="help">
            <h3>Quick help</h3>
            <p class="px-lead">The full guides are still available. These are the shortcuts and habits that matter most in PRO X.</p>
            <div class="px-grid" id="pxHelpTopics"></div>
            <h4>Keyboard</h4>
            <table class="px-table">
              <tbody>
                <tr><td><span class="px-kbd">Alt</span> + <span class="px-kbd">C</span></td><td>Open or close the Creator Hub</td></tr>
                <tr><td><span class="px-kbd">Alt</span> + <span class="px-kbd">P</span></td><td>Open the teleprompter</td></tr>
                <tr><td><span class="px-kbd">Alt</span> + <span class="px-kbd">M</span></td><td>Open memory and recovery</td></tr>
                <tr><td><span class="px-kbd">Ctrl</span> + <span class="px-kbd">Shift</span> + <span class="px-kbd">S</span></td><td>Save a recovery snapshot</td></tr>
                <tr><td><span class="px-kbd">Space</span></td><td>Play or pause in Video, and start or pause the teleprompter</td></tr>
                <tr><td><span class="px-kbd">Esc</span></td><td>Close menus, drawers and the teleprompter</td></tr>
              </tbody>
            </table>
            <h4>Mobile and tablet</h4>
            <p class="px-hint">The bottom bar switches workspace and opens the Creator. Panel buttons open the side drawers. Pinch to zoom the timeline, tap a clip to select it, and use the handles to trim.</p>
            <h4>This build</h4>
            <div class="px-row">
              <button class="px-btn" id="pxHelpAbout">About Studio Editor PRO X</button>
              <button class="px-btn px-ghost" id="pxHelpNew">What's new in 1.0</button>
            </div>
            <p class="px-hint" style="margin-top:8px">Version ${VERSION} · build ${BUILD}. Everything runs locally in this tab.</p>
          </section>

        </div>
      </div>
    </div>`;
  }

  let hubEl = null;

  function buildHub() {
    if (hubEl && hubEl.isConnected) return hubEl;
    hubEl = document.createElement("dialog");
    hubEl.id = "pxHub";
    hubEl.innerHTML = hubMarkup();
    document.body.append(hubEl);
    wireHub(hubEl);
    return hubEl;
  }

  function showPanel(id) {
    const dlg = buildHub();
    const panels = qsa(".px-hub-panel", dlg);
    if (!panels.some((p) => p.dataset.panel === id)) id = "publish";
    S.hub = id;
    panels.forEach((p) => p.classList.toggle("px-on", p.dataset.panel === id));
    qsa("#pxHubNav button", dlg).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.panel === id)));
    const meta = HUB_NAV.find((n) => n.id === id);
    const sub = byId("pxHubSub");
    if (sub && meta) sub.textContent = meta.label + " - everything stays in your browser";
    const main = byId("pxHubMain");
    if (main) main.scrollTop = 0;
    if (id === "publish") refreshHubPublish();
    if (id === "captions") { renderCueTable(); refreshCaptionPanel(); }
    if (id === "audio") refreshAudioPanel();
    if (id === "brand") refreshBrandPanel();
    if (id === "export") refreshCodecPanel();
    if (id === "memory") refreshMemoryPanel();
    if (id === "embed") refreshEmbedPanel();
    if (id === "settings") refreshSettings();
    if (id === "help") renderHelpTopics();
    postToParent("panel", { panel: id });
  }

  function openHub(panel) {
    const dlg = buildHub();
    showPanel(panel || S.hub || "publish");
    showDialog(dlg);
  }
  function openSettings() { openHub("settings"); }

  function wireHub(dlg) {
    byId("pxHubClose").onclick = () => closeDialog(dlg);
    byId("pxHubHelpBtn").onclick = () => showPanel("help");
    qsa("#pxHubNav button", dlg).forEach((b) => b.onclick = () => showPanel(b.dataset.panel));

    /* Publish -------------------------------------------------------- */
    qsa("[data-plat]", byId("pxPlatGrid")).forEach((b) => b.onclick = () => {
      const p = PLATFORMS.find((x) => x.id === b.dataset.plat);
      if (p) applyPlatform(p);
    });
    qsa("[data-preset]", byId("pxExpGrid")).forEach((b) => b.onclick = () => {
      const p = EXPORT_PRESETS.find((x) => x.id === b.dataset.preset);
      if (p) setExportPreset(p);
    });
    byId("pxFill").onclick = () => reframe("fill");
    byId("pxFit").onclick = () => reframe("fit");
    byId("pxCenter").onclick = () => reframe("center");

    /* Captions ------------------------------------------------------- */
    byId("pxCueParse").onclick = () => parseCueInput();
    byId("pxCueFileBtn").onclick = () => byId("pxCueFile").click();
    byId("pxCueFile").onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        byId("pxCueInput").value = text;
        parseCueInput();
      } catch (err) { say("Could not read that file: " + (err.message || err)); }
    };
    const capIds = ["pxCapFont", "pxCapSize", "pxCapY", "pxCapW", "pxCapBg", "pxCapColor", "pxCapBgc", "pxCapBold", "pxCapShadow"];
    capIds.forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.addEventListener("input", readCaptionStyle);
      el.addEventListener("change", readCaptionStyle);
    });
    byId("pxCueAdd").onclick = () => {
      if (!S.cues.length) parseCueInput();
      addCaptionCues(S.cues, { shift: Number(byId("pxCueShift").value) || 0 });
      refreshCaptionPanel();
    };
    byId("pxCueReplace").onclick = () => {
      if (!S.cues.length) parseCueInput();
      if (!S.cues.length) return;
      addCaptionCues(S.cues, { shift: Number(byId("pxCueShift").value) || 0, replace: true });
      refreshCaptionPanel();
    };
    byId("pxCapStyle").onclick = () => { readCaptionStyle(); styleCaptions(); refreshCaptionPanel(); };
    byId("pxCapClear").onclick = () => { clearCaptions(); refreshCaptionPanel(); };
    byId("pxCapExport").onclick = () => exportSRT();

    /* Thumbnail ------------------------------------------------------ */
    byId("pxThumbOpen").onclick = () => openThumb();
    byId("pxThumbFrame").onclick = () => {
      closeDialog(dlg);
      const d = byId("pxThumb");
      if (d) showDialog(d);
      setTimeout(() => { thumbCaptureFrame(); renderThumb(); }, 120);
    };
    qsa("[data-thsize]", byId("pxThumbSizes")).forEach((b) => b.onclick = () => {
      const [w, h] = b.dataset.thsize.split("x").map(Number);
      S.thumb.w = w; S.thumb.h = h;
      openThumb();
      say(`Thumbnail canvas set to ${w} x ${h}.`);
    });

    /* Audio ---------------------------------------------------------- */
    byId("pxDuckRun").onclick = async () => {
      await duckMusic({
        threshold: Number(byId("pxDuckThreshold").value) || -32,
        amount: Number(byId("pxDuckAmount").value) || 35,
        fade: Number(byId("pxDuckFade").value) || 0.35
      });
      refreshAudioPanel();
    };
    byId("pxSilRun").onclick = async () => {
      await removeSilence({
        threshold: Number(byId("pxSilThreshold").value) || -38,
        minSil: Number(byId("pxSilMin").value) || 0.45
      });
      refreshAudioPanel();
    };
    byId("pxNormRun").onclick = async () => {
      await normalizeClip({ target: Number(byId("pxNormTarget").value) || -1 });
      refreshAudioPanel();
    };
    ["pxBass", "pxTreble", "pxTempo", "pxPitch"].forEach((id) => {
      const el = byId(id);
      if (el) el.addEventListener("input", updateAudioFxLabels);
    });
    byId("pxAudioFxApply").onclick = async () => {
      if (S.audioBusy) return;
      const btn = byId("pxAudioFxApply");
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Rendering…";
      try {
        if (await applyAudioFx(readAudioFxUI())) refreshAudioPanel();
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    };
    byId("pxAudioFxReset").onclick = async () => {
      if (S.audioBusy) return;
      if (await applyAudioFx({ ...AUDIO_FX_DEFAULTS })) refreshAudioPanel();
    };
    byId("pxCensorAdd").onclick = () => addCensorAtPlayhead();
    byId("pxCensorClear").onclick = () => clearCensors();

    /* Brand ---------------------------------------------------------- */
    const brandFields = ["pxBrandName", "pxBrandHandle", "pxBrandColor", "pxBrandColor2", "pxWmText", "pxWmPos", "pxWmSize", "pxWmOpacity", "pxWmPlate", "pxWmShadow", "pxWmOn"];
    brandFields.forEach((id) => {
      const el = byId(id);
      if (!el) return;
      el.addEventListener("input", () => { readBrandPanel(); refreshBrandPreview(); });
      el.addEventListener("change", () => { readBrandPanel(); refreshBrandPreview(); });
    });
    byId("pxBrandLogoBtn").onclick = () => byId("pxBrandLogo").click();
    byId("pxBrandLogo").onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        brand.logo = String(reader.result || "");
        saveBrand();
        refreshBrandPanel();
        try { render(T); } catch {}
      };
      reader.onerror = () => say("Could not read that logo.");
      reader.readAsDataURL(file);
    };
    byId("pxBrandLogoClear").onclick = () => {
      brand.logo = "";
      saveBrand();
      refreshBrandPanel();
      try { render(T); } catch {}
    };
    byId("pxBrandApply").onclick = () => {
      readBrandPanel();
      try { render(T); } catch {}
      say("Brand settings applied. The watermark shows in preview and exports.");
    };
    byId("pxBrandReset").onclick = () => {
      if (!window.confirm("Reset the brand kit and watermark?")) return;
      Object.assign(brand, JSON.parse(JSON.stringify(DEFAULT_BRAND)));
      saveBrand();
      refreshBrandPanel();
      try { render(T); } catch {}
      say("Brand kit reset.");
    };

    /* Export --------------------------------------------------------- */
    byId("pxBestRefresh").onclick = () => refreshCodecPanel();
    byId("pxFmtOpen").onclick = () => {
      const v = byId("pxFmtQuick").value;
      const sel = byId("xf");
      if (sel) {
        if (![...sel.options].some((o) => o.value === v)) {
          const opt = document.createElement("option");
          opt.value = v; opt.textContent = formatLabel(v);
          sel.append(opt);
        }
        sel.value = v;
      }
      closeDialog(dlg);
      openExportDialog();
    };

    /* Memory --------------------------------------------------------- */
    byId("pxHistDepth").oninput = (e) => {
      const out = byId("pxHistOut");
      if (out) out.textContent = e.target.value + " steps";
      try { window.__pxHistMax = Number(e.target.value) || 12; } catch {}
    };
    byId("pxHistDepth").onchange = (e) => setHistoryDepth(e.target.value);
    byId("pxTrimHist").onclick = () => trimHistory();
    byId("pxClearAudio").onclick = () => clearAudioCaches();
    byId("pxOrphan").onclick = () => releaseOrphanMedia();
    byId("pxMemRefresh").onclick = () => { updateMemChip(); refreshMemoryPanel(); };
    byId("pxSnapNow").onclick = () => makeSnapshot("manual");
    byId("pxSnapClear").onclick = async () => {
      if (!window.confirm("Delete every recovery snapshot?")) return;
      try { await dbClear(); } catch {}
      refreshMemoryPanel();
      say("Recovery snapshots deleted.");
    };
    byId("pxSetAutosave").onchange = (e) => {
      settings.autosave = e.target.checked;
      saveSettings();
      syncAutosaveToggles();
    };
    byId("pxSetAutoMin").onchange = (e) => {
      settings.autosaveMin = clamp(Number(e.target.value) || 2, 1, 30);
      saveSettings();
      syncAutosaveToggles();
    };

    /* Embed ---------------------------------------------------------- */
    byId("pxEmbedCopy").onclick = () => copyText(byId("pxEmbedCode").value, "Embed code copied.");
    byId("pxEmbedOpen").onclick = () => {
      try {
        const url = new URL(location.href);
        url.searchParams.delete("embed");
        window.open(url.toString(), "_blank", "noopener");
      } catch { say("Open the editor URL directly in a new tab."); }
    };
    byId("pxPwaInstall").onclick = () => promptInstall();
    byId("pxPwaUpdate").onclick = async () => {
      try {
        if (S.pwa.reg) await S.pwa.reg.update();
        say(S.pwa.update ? "An update is waiting. Use the Update chip in the top bar." : "The app is up to date.");
      } catch { say("Could not check for updates here."); }
    };

    /* Settings ------------------------------------------------------- */
    qsa("#pxSetWorkspaces button", dlg).forEach((b) => {
      b.onclick = () => {
        const ws = b.dataset.ws;
        closeDialog(dlg);
        const tabBtn = document.querySelector(`.tab[data-t="${ws}"]`);
        if (tabBtn) tabBtn.click();
        else say("That workspace is not available in this build.");
      };
    });
    byId("pxHelpAbout").onclick = () => {
      closeDialog(dlg);
      const btn = byId("about");
      if (btn) btn.click();
      else say("About is not available in this build.");
    };
    byId("pxHelpNew").onclick = () => {
      closeDialog(dlg);
      const btn = document.querySelector('.tab[data-t="whatsnew"]');
      if (btn) btn.click();
    };
    byId("pxSetMobile").onchange = (e) => { setInterfaceMode(e.target.value); rebuildDrawers(); };
    byId("pxSetAccent").oninput = (e) => {
      settings.accent = e.target.value;
      saveSettings();
      applyInterfaceMode();
    };
    byId("pxSetQuality").onchange = (e) => { settings.quality = e.target.value; saveSettings(); applyQuality(); };
    byId("pxSetCompat").onchange = (e) => { settings.compat = e.target.checked; saveSettings(); applyInterfaceMode(); };
    byId("pxSafeToggle").onchange = (e) => toggleSafe(e.target.checked);
    byId("pxSetSafeStyle").onchange = (e) => { settings.safeStyle = e.target.value; saveSettings(); drawSafe(); };
    byId("pxSetAutosave2").onchange = (e) => { settings.autosave = e.target.checked; saveSettings(); syncAutosaveToggles(); };
    byId("pxSetAutoMin2").onchange = (e) => { settings.autosaveMin = clamp(Number(e.target.value) || 2, 1, 30); saveSettings(); syncAutosaveToggles(); };
    byId("pxSetReset").onclick = () => {
      if (!window.confirm("Reset layout, quality, safe zones and recovery settings?")) return;
      const accent = settings.accent;
      Object.assign(settings, DEFAULT_SETTINGS, { accent });
      saveSettings();
      applyInterfaceMode();
      refreshSettings();
      say("Interface settings reset.");
    };
    byId("pxSetResetAll").onclick = () => {
      if (!window.confirm("Reset settings and the brand kit?")) return;
      Object.assign(settings, DEFAULT_SETTINGS);
      Object.assign(brand, JSON.parse(JSON.stringify(DEFAULT_BRAND)));
      saveSettings();
      saveBrand();
      applyInterfaceMode();
      refreshSettings();
      refreshBrandPanel();
      try { render(T); } catch {}
      say("Settings and brand kit reset.");
    };
  }

  function rebuildDrawers() {
    try { applyInterfaceMode(); } catch {}
  }

  function syncAutosaveToggles() {
    ["pxSetAutosave", "pxSetAutosave2"].forEach((id) => {
      const el = byId(id);
      if (el) el.checked = !!settings.autosave;
    });
    ["pxSetAutoMin", "pxSetAutoMin2"].forEach((id) => {
      const el = byId(id);
      if (el && document.activeElement !== el) el.value = settings.autosaveMin || 2;
    });
  }

  async function copyText(text, message) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        say(message || "Copied.");
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      say(message || "Copied.");
    } catch {
      say("Could not copy automatically. Select the text and press Ctrl+C.");
    }
  }

  /* ------------------------------------------------------------------ *
   * 17. Panel refreshers and actions
   * ------------------------------------------------------------------ */
  function refreshHubPublish() {
    const box = byId("pxPubNow");
    if (!box) return;
    box.innerHTML = `<div class="px-statgrid">
      ${stat("Frame", `${W} x ${H}`)}
      ${stat("Aspect", PS.ar || "-")}
      ${stat("Frame rate", (PS.fps || 30) + " fps")}
      ${stat("Clips", clips.length)}
      ${stat("Duration", fmtTime(endT()))}
      ${stat("Captions", captionClips().length)}
    </div>`;
    const match = PLATFORMS.find((p) => p.w === W && p.h === H) ||
      PLATFORMS.find((p) => p.ar === PS.ar && p.h === H) || null;
    qsa("[data-plat]", byId("pxPlatGrid")).forEach((b) => b.classList.toggle("px-selected", !!match && b.dataset.plat === match.id));
  }

  function refreshCaptionPanel() {
    const count = byId("pxCueCount");
    if (count) count.textContent = S.cues.length ? `${S.cues.length} cue${S.cues.length === 1 ? "" : "s"} parsed` : "No cues parsed";
    const caps = captionClips();
    const summary = byId("pxCapSummary");
    if (summary) summary.textContent = caps.length ? `${caps.length} caption clip${caps.length === 1 ? "" : "s"} on the timeline` : "No caption clips yet";
    renderCueTable();
    syncCaptionInputs();
  }

  function syncCaptionInputs() {
    const st = S.captionStyle;
    const font = byId("pxCapFont");
    if (font && !font.value) font.value = FONT_CHOICES[0][0];
    const setVal = (id, v) => { const el = byId(id); if (el && document.activeElement !== el) el.value = v; };
    setVal("pxCapSize", st.size);
    setVal("pxCapY", st.y);
    setVal("pxCapW", st.maxw);
    setVal("pxCapBg", st.bg);
    setVal("pxCapColor", st.color);
    setVal("pxCapBgc", st.bgc);
    const bold = byId("pxCapBold"); if (bold) bold.checked = !!st.bold;
    const shadow = byId("pxCapShadow"); if (shadow) shadow.checked = !!st.shadow;
    const out = (id, v) => { const el = byId(id); if (el) el.textContent = v; };
    out("pxCapSizeOut", round(st.size, 1) + "%");
    out("pxCapYOut", round(st.y, 1) + "%");
    out("pxCapWOut", round(st.maxw, 1) + "%");
    out("pxCapBgOut", Math.round(st.bg) + "%");
  }

  function readCaptionStyle() {
    const num = (id, fallback) => {
      const el = byId(id);
      const v = el ? Number(el.value) : NaN;
      return Number.isFinite(v) ? v : fallback;
    };
    const st = S.captionStyle;
    const font = byId("pxCapFont");
    if (font) st.font = font.value;
    st.size = clamp(num("pxCapSize", st.size), 2, 12);
    st.y = clamp(num("pxCapY", st.y), 20, 98);
    st.maxw = clamp(num("pxCapW", st.maxw), 30, 100);
    st.bg = clamp(num("pxCapBg", st.bg), 0, 100);
    const c1 = byId("pxCapColor"); if (c1) st.color = c1.value;
    const c2 = byId("pxCapBgc"); if (c2) st.bgc = c2.value;
    const b = byId("pxCapBold"); if (b) st.bold = b.checked ? 1 : 0;
    const sh = byId("pxCapShadow"); if (sh) st.shadow = sh.checked ? 1 : 0;
    const out = (id, v) => { const el = byId(id); if (el) el.textContent = v; };
    out("pxCapSizeOut", round(st.size, 1) + "%");
    out("pxCapYOut", round(st.y, 1) + "%");
    out("pxCapWOut", round(st.maxw, 1) + "%");
    out("pxCapBgOut", Math.round(st.bg) + "%");
  }

  function parseCueInput() {
    const input = byId("pxCueInput");
    if (!input) return;
    const cues = parseCues(input.value);
    S.cues = cues;
    renderCueTable();
    refreshCaptionPanel();
    if (cues.length) {
      say(`Parsed ${cues.length} cue${cues.length === 1 ? "" : "s"}. Add them to the timeline when ready.`);
    } else {
      say("No valid cues were found. SRT and VTT both need a time line with an arrow.");
    }
  }

  function refreshAudioPanel() {
    const box = byId("pxAudioSel");
    if (!box) return;
    const c = cs;
    if (!c) {
      box.innerHTML = `<b>No clip selected</b><p class="px-hint" style="margin-top:6px">Click a clip on the timeline. For ducking, select the music clip, not the voice.</p>`;
      syncAudioFxUI(null);
      refreshCensorList(null);
      return;
    }
    const kind = c.audio ? "Audio" : c.g ? (c.el && c.el.videoWidth ? "Video" : "Audio") : c.title ? "Title" : "Image";
    const censors = censorList(c).length;
    box.innerHTML = `<div class="px-row"><b>${esc(c.name || "Clip")}</b>${badge(kind, "px-info")}${badge("Track " + (c.track < 0 ? "A1" : "V" + (c.track + 1)))}</div>
      <div class="px-statgrid" style="margin-top:8px">
        ${stat("Start", fmtTime(c.start))}
        ${stat("Length", fmtTime(c.dur))}
        ${stat("Speed", (c.fx?.speed ?? 100) + "%")}
        ${stat("Volume", Math.round(c.fx?.vol ?? 100) + "%")}
        ${stat("Tone", audioFxSummary(c))}
        ${stat("Censors", censors ? censors + (censors === 1 ? " marker" : " markers") : "none")}
        ${stat("Keyframes", c.kf?.vol?.length ? c.kf.vol.length + " volume" : "none")}
      </div>
      ${!c.g && !c.audio ? `<p class="px-hint" style="margin-top:7px">That clip has no audio. Select a video or audio clip for these tools.</p>` : ""}
      ${c.el && c.el.videoWidth ? `<p class="px-hint" style="margin-top:7px">This is a video clip. Ducking, silence removal, normalization and censors work on its soundtrack. Tone, tempo and pitch need an audio clip on track A1.</p>` : ""}
      <p class="px-hint" style="margin-top:7px">Audio decoding happens locally. A very long clip takes a moment the first time.</p>`;
    syncAudioFxUI(c);
    refreshCensorList(c);
  }

  function refreshBrandPanel() {
    const set = (id, v) => { const el = byId(id); if (el && document.activeElement !== el) el.value = v; };
    set("pxBrandName", brand.name || "");
    set("pxBrandHandle", brand.handle || "");
    set("pxBrandColor", brand.color || "#378ef0");
    set("pxBrandColor2", brand.color2 || "#34d3b1");
    set("pxWmText", brand.wm.text || "");
    set("pxWmPos", brand.wm.pos || "br");
    set("pxWmSize", brand.wm.size ?? 3.1);
    set("pxWmOpacity", brand.wm.opacity ?? 78);
    const on = byId("pxWmOn"); if (on) on.checked = !!brand.wm.on;
    const plate = byId("pxWmPlate"); if (plate) plate.checked = !!brand.wm.plate;
    const shadow = byId("pxWmShadow"); if (shadow) shadow.checked = !!brand.wm.shadow;
    const sizeOut = byId("pxWmSizeOut"); if (sizeOut) sizeOut.textContent = round(brand.wm.size ?? 3.1, 1) + "%";
    const opOut = byId("pxWmOpacityOut"); if (opOut) opOut.textContent = Math.round(brand.wm.opacity ?? 78) + "%";
    const logoName = byId("pxBrandLogoName");
    if (logoName) logoName.textContent = brand.logo ? "Logo loaded" : "No logo";
    refreshBrandPreview();
  }

  function readBrandPanel() {
    const get = (id) => byId(id);
    if (get("pxBrandName")) brand.name = get("pxBrandName").value.trim();
    if (get("pxBrandHandle")) brand.handle = get("pxBrandHandle").value.trim();
    if (get("pxBrandColor")) brand.color = get("pxBrandColor").value;
    if (get("pxBrandColor2")) brand.color2 = get("pxBrandColor2").value;
    if (get("pxWmText")) brand.wm.text = get("pxWmText").value.trim();
    if (get("pxWmPos")) brand.wm.pos = get("pxWmPos").value;
    if (get("pxWmSize")) brand.wm.size = Number(get("pxWmSize").value) || 3.1;
    if (get("pxWmOpacity")) brand.wm.opacity = Number(get("pxWmOpacity").value) || 78;
    if (get("pxWmOn")) brand.wm.on = get("pxWmOn").checked;
    if (get("pxWmPlate")) brand.wm.plate = get("pxWmPlate").checked;
    if (get("pxWmShadow")) brand.wm.shadow = get("pxWmShadow").checked;
    const sizeOut = byId("pxWmSizeOut"); if (sizeOut) sizeOut.textContent = round(brand.wm.size, 1) + "%";
    const opOut = byId("pxWmOpacityOut"); if (opOut) opOut.textContent = Math.round(brand.wm.opacity) + "%";
    saveBrand();
    postToParent("watermark", { on: !!brand.wm.on });
  }

  function refreshBrandPreview() {
    const box = byId("pxBrandPreview");
    if (!box) return;
    const pos = brand.wm.pos || "br";
    const just = pos.endsWith("l") ? "flex-start" : pos.endsWith("r") ? "flex-end" : "center";
    const align = pos === "center" ? "center" : pos.startsWith("t") ? "flex-start" : "flex-end";
    const text = (brand.wm.text || brand.handle || brand.name || "Your watermark").trim();
    const size = clamp(brand.wm.size || 3.1, 1, 9);
    const fs = (size * 1.5).toFixed(1);
    box.innerHTML = `<div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;border:1px solid #ffffff14;background:
      radial-gradient(circle at 30% 25%,#28405f,#1b2430 45%,#12161b 100%);display:flex;align-items:${pos === "center" ? "center" : "flex-start"};justify-content:${just};padding:${size * 1.6}%">
      <span style="display:inline-flex;align-items:center;gap:6px;font:700 ${fs}px system-ui,sans-serif;color:#fff;opacity:${clamp((brand.wm.opacity ?? 78) / 100, 0.05, 1)};
        ${brand.wm.plate ? "background:rgba(0,0,0,.52);padding:3px 8px;border-radius:6px;" : ""}
        ${brand.wm.shadow ? "text-shadow:0 2px 6px rgba(0,0,0,.7);" : ""}">
        ${brand.logo ? `<img src="${esc(brand.logo)}" alt="" style="height:${fs * 1.5}px;display:block">` : ""}
        ${esc(text)}
      </span>
    </div>
    <p class="px-hint" style="margin-top:5px">Approximate placement. The program monitor shows the exact result.</p>`;
  }

  async function refreshCodecPanel() {
    const best = byId("pxBestFmt");
    if (best) best.textContent = "Checking\u2026";
    const body = byId("pxCodecBody");
    if (body) body.innerHTML = `<tr><td colspan="4" class="px-muted">Checking this browser\u2026</td></tr>`;
    const test = async (name, list, mimeList) => {
      let webcodecs = false;
      try { webcodecs = await canEncode(list || []); } catch {}
      let recorder = false;
      try { recorder = !!(mimeList || []).some((m) => mrs(m)); } catch {}
      return { name, webcodecs, recorder };
    };
    const rows = [];
    try {
      rows.push(await test("H.264 / AVC", WCC?.h264 || [], ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1"]));
      rows.push(await test("H.265 / HEVC", WCC?.h265 || [], ["video/mp4;codecs=hvc1.1.6.L93.B0", "video/mp4;codecs=hev1.1.6.L93.B0"]));
      rows.push(await test("VP9", WCC?.vp9 || [], ["video/webm;codecs=vp9"]));
      rows.push(await test("AV1", WCC?.av1 || [], ["video/mp4;codecs=av01.0.08M.08"]));
      rows.push(await test("VP8", [], ["video/webm;codecs=vp8"]));
      rows.push(await test("Opus audio", [], ["video/webm;codecs=opus", "audio/webm;codecs=opus"]));
      rows.push(await test("AAC audio", [], ["video/mp4;codecs=mp4a.40.2", "audio/mp4"]));
    } catch (e) {
      console.warn("PRO X: codec matrix", e);
    }
    const fmt = await bestFormat();
    if (best) {
      best.textContent = fmt === "auto" ? "MediaRecorder default" : formatLabel(fmt);
      best.className = "px-badge " + (fmt === "auto" ? "px-warn" : "px-ok");
    }
    if (!body) return;
    body.innerHTML = rows.map((r) => {
      const status = r.webcodecs ? badge("WebCodecs", "px-ok") : r.recorder ? badge("MediaRecorder", "px-info") : badge("Not available", "px-bad");
      const notes = r.webcodecs ? "Hardware or software encoder reported as supported." : r.recorder ? "Falls back to real-time recording. Keep the tab visible." : "This browser cannot encode it here.";
      return `<tr><td><b>${esc(r.name)}</b></td><td>${r.webcodecs ? "VideoEncoder" : r.recorder ? "MediaRecorder" : "-"}</td><td>${status}</td><td class="px-hint">${notes}</td></tr>`;
    }).join("");
    const hint = byId("pxCodecHint");
    if (hint) {
      hint.textContent = navigator.userAgent.includes("Firefox")
        ? "Firefox is reporting this set. WebM is usually the most reliable export here."
        : "Capabilities are checked live with VideoEncoder.isConfigSupported and MediaRecorder.isTypeSupported.";
    }
  }

  function refreshEmbedPanel() {
    const base = (location.protocol === "file:" ? location.href.split("#")[0].split("?")[0] : location.origin + location.pathname);
    const code = byId("pxEmbedCode");
    if (code) {
      code.value = `<iframe
  src="${base}?embed=1"
  title="Studio Editor PRO X"
  style="width:100%;height:720px;border:0;border-radius:12px;overflow:hidden"
  allow="fullscreen; clipboard-write; microphone; camera"
  loading="lazy"></iframe>`;
    }
    const state = byId("pxEmbedState");
    if (state) state.textContent = S.embed ? "This window is embedded right now." : "This window is standalone.";
    const box = byId("pxPwaStatus");
    if (box) {
      box.innerHTML = [
        stat("Display mode", S.pwa.standalone ? "Installed" : "Browser tab"),
        stat("Install prompt", S.pwa.prompt ? "Available" : "Not offered"),
        stat("Service worker", S.pwa.sw ? "Active" : (isHttp ? "Not registered" : "Needs HTTP")),
        stat("Connection", navigator.onLine ? "Online" : "Offline"),
        stat("Protocol", location.protocol.replace(":", "")),
        stat("Version", VERSION)
      ].join("");
    }
  }

  function refreshSettings() {
    const mobile = byId("pxSetMobile");
    if (mobile) mobile.value = settings.mobile || "auto";
    const acc = byId("pxSetAccent");
    if (acc && document.activeElement !== acc) acc.value = settings.accent || "#378ef0";
    const q = byId("pxSetQuality");
    if (q) q.value = settings.quality || "quality";
    const compat = byId("pxSetCompat");
    if (compat) compat.checked = !!settings.compat;
    const safe = byId("pxSafeToggle");
    if (safe) safe.checked = !!settings.safe;
    const ss = byId("pxSetSafeStyle");
    if (ss) ss.value = settings.safeStyle || "all";
    syncAutosaveToggles();
  }

  function renderHelpTopics() {
    const box = byId("pxHelpTopics");
    if (!box) return;
    const topics = [
      ["photo", "Photo workspace", "Layers, selections, text, retouching and content-aware tools."],
      ["video", "Video workspace", "Timeline, transitions, titles, keyframes and export."],
      ["audio", "Audio workspace", "Recording, effects and mixdown."],
      ["model", "3D workspace", "Shapes, materials, sculpting and lights."],
      ["start", "Start here", "The five minute tour of the whole editor."],
      ["creator", "Creator tools", "Captions, thumbnails, presets, watermark and memory."]
    ];
    box.innerHTML = topics.map(([id, name, desc]) =>
      `<button class="px-card" data-topic="${id}"><b>${esc(name)}</b><span>${esc(desc)}</span><em>Open guide</em></button>`).join("");
    qsa("[data-topic]", box).forEach((b) => b.onclick = () => {
      const id = b.dataset.topic;
      try {
        if (typeof window.helpOpen === "function") {
          window.helpOpen(id);
        } else {
          say("The full help window is not available in this build.");
        }
      } catch (e) { say("Could not open help: " + e.message); }
    });
  }


  /* ------------------------------------------------------------------ *
   * 18. Thumbnail Studio dialog
   * ------------------------------------------------------------------ */
  function buildThumbDialog() {
    if (byId("pxThumb")) return byId("pxThumb");
    const dlg = document.createElement("dialog");
    dlg.id = "pxThumb";
    const sizeOpts = [
      [1280, 720, "YouTube 1280 x 720"],
      [1920, 1080, "Full HD 1920 x 1080"],
      [1080, 1080, "Square 1080 x 1080"],
      [1080, 1350, "Portrait 1080 x 1350"],
      [1080, 1920, "Vertical 1080 x 1920"],
      [1200, 628, "Facebook link 1200 x 628"]
    ];
    dlg.innerHTML = `<div class="px-thumb">
      <div class="px-hub-head">
        <div class="px-hub-title"><span class="px-brand-mark">T</span> Thumbnail Studio</div>
        <div class="px-hub-sub">A headline, a badge, one clear image</div>
        <div class="px-row"><button class="px-iconbtn px-hub-close" id="pxThumbClose" title="Close">&times;</button></div>
      </div>
      <div class="px-thumb-body">
        <div class="px-thumb-stage"><canvas id="pxThumbCanvas" width="1280" height="720"></canvas></div>
        <aside class="px-thumb-side">
          <label class="px-field"><span>Headline</span>
            <textarea class="px-area" id="pxThumbTitle" rows="2" style="min-height:52px">MY NEXT VIDEO</textarea>
          </label>
          <label class="px-field"><span>Supporting line</span>
            <input class="px-input" id="pxThumbSub" value="A short, clear promise goes here">
          </label>
          <div class="px-row">
            <label class="px-check" style="flex:1"><input type="checkbox" id="pxThumbShowBadge" checked> Badge</label>
            <input class="px-input" id="pxThumbBadge" value="NEW" style="max-width:90px">
          </div>
          <label class="px-field"><span>Template</span>
            <select class="px-select" id="pxThumbTemplate">
              <option value="bold">Bold - big headline, accent rule</option>
              <option value="box">Box - solid colour panel</option>
              <option value="mini">Minimal - small, clean type</option>
            </select>
          </label>
          <label class="px-field"><span>Text position</span>
            <select class="px-select" id="pxThumbPos">
              <option value="left">Left</option>
              <option value="center">Centre</option>
              <option value="right">Right</option>
            </select>
          </label>
          <div class="px-row">
            <label class="px-field" style="flex:1"><span>Text colour</span><input type="color" class="px-input" id="pxThumbColor" value="#ffffff" style="height:30px;padding:2px"></label>
            <label class="px-field" style="flex:1"><span>Accent</span><input type="color" class="px-input" id="pxThumbAccent" value="#378ef0" style="height:30px;padding:2px"></label>
          </div>
          <label class="px-field"><span>Image darkening <b id="pxThumbOverlayOut">58%</b></span>
            <input type="range" class="px-range" id="pxThumbOverlay" min="0" max="95" step="1" value="58">
          </label>
          <label class="px-field"><span>Canvas size</span>
            <select class="px-select" id="pxThumbSizeSel">
              ${sizeOpts.map(([w, h, l]) => `<option value="${w}x${h}">${l}</option>`).join("")}
            </select>
          </label>
          <div class="px-row">
            <button class="px-btn" id="pxThumbCap">Use current frame</button>
            <button class="px-btn" id="pxThumbImgBtn">Open image</button>
            <input type="file" id="pxThumbImg" accept="image/*" hidden>
          </div>
          <p class="px-hint">Drag the headline to keep it short. Two or three words at this size is usually best.</p>
        </aside>
      </div>
      <div class="px-thumb-foot">
        <span class="px-muted" id="pxThumbSize">1280 x 720</span>
        <button class="px-btn" id="pxThumbJpg">Export JPG</button>
        <button class="px-btn px-pri" id="pxThumbPng">Export PNG</button>
      </div>
    </div>`;
    document.body.append(dlg);

    const read = () => {
      const t = S.thumb;
      t.title = byId("pxThumbTitle").value;
      t.sub = byId("pxThumbSub").value;
      t.badge = byId("pxThumbBadge").value;
      t.showBadge = byId("pxThumbShowBadge").checked;
      t.template = byId("pxThumbTemplate").value;
      t.pos = byId("pxThumbPos").value;
      t.color = byId("pxThumbColor").value;
      t.accent = byId("pxThumbAccent").value;
      t.overlay = Number(byId("pxThumbOverlay").value);
      const out = byId("pxThumbOverlayOut");
      if (out) out.textContent = Math.round(t.overlay) + "%";
      renderThumb();
    };
    ["pxThumbTitle", "pxThumbSub", "pxThumbBadge", "pxThumbShowBadge", "pxThumbTemplate", "pxThumbPos", "pxThumbColor", "pxThumbAccent", "pxThumbOverlay"]
      .forEach((id) => {
        const el = byId(id);
        if (!el) return;
        el.addEventListener("input", read);
        el.addEventListener("change", read);
      });
    byId("pxThumbSizeSel").onchange = (e) => {
      const [w, h] = e.target.value.split("x").map(Number);
      S.thumb.w = w; S.thumb.h = h;
      renderThumb();
    };
    byId("pxThumbCap").onclick = () => thumbCaptureFrame();
    byId("pxThumbImgBtn").onclick = () => byId("pxThumbImg").click();
    byId("pxThumbImg").onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (file) thumbLoadBlob(file);
    };
    byId("pxThumbPng").onclick = () => {
      const c = thumbCanvas();
      if (!c) return;
      c.toBlob((blob) => {
        if (!blob) return say("Could not create the image.");
        dl(blob, `thumbnail-${S.thumb.w}x${S.thumb.h}.png`);
        postToParent("thumbnail", { width: S.thumb.w, height: S.thumb.h, format: "png" });
      }, "image/png");
    };
    byId("pxThumbJpg").onclick = () => {
      const c = thumbCanvas();
      if (!c) return;
      c.toBlob((blob) => {
        if (!blob) return say("Could not create the image.");
        dl(blob, `thumbnail-${S.thumb.w}x${S.thumb.h}.jpg`);
        postToParent("thumbnail", { width: S.thumb.w, height: S.thumb.h, format: "jpg" });
      }, "image/jpeg", 0.92);
    };
    byId("pxThumbClose").onclick = () => closeDialog(dlg);
    return dlg;
  }

  function syncThumbDialog() {
    const set = (id, v) => { const el = byId(id); if (el) el.value = v; };
    set("pxThumbTitle", S.thumb.title);
    set("pxThumbSub", S.thumb.sub);
    set("pxThumbBadge", S.thumb.badge);
    set("pxThumbTemplate", S.thumb.template);
    set("pxThumbPos", S.thumb.pos);
    set("pxThumbColor", S.thumb.color);
    set("pxThumbAccent", S.thumb.accent);
    set("pxThumbOverlay", S.thumb.overlay);
    const sb = byId("pxThumbShowBadge"); if (sb) sb.checked = !!S.thumb.showBadge;
    const sel = byId("pxThumbSizeSel");
    if (sel) {
      const key = S.thumb.w + "x" + S.thumb.h;
      sel.value = [...sel.options].some((o) => o.value === key) ? key : sel.options[0].value;
    }
  }

  /* ------------------------------------------------------------------ *
   * 19. Drag and drop media anywhere
   * ------------------------------------------------------------------ */
  let dropOverlay = null;
  function showDropOverlay(on, count = 0) {
    if (!dropOverlay) {
      dropOverlay = document.createElement("div");
      dropOverlay.style.cssText = "position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;background:#0b0d10cc;backdrop-filter:blur(3px);pointer-events:none";
      dropOverlay.innerHTML = `<div style="padding:26px 34px;border-radius:14px;border:2px dashed #4a9eff;background:#1b2531ee;color:#e9f2ff;font:600 15px/1.5 system-ui,sans-serif;text-align:center;box-shadow:0 20px 60px #000a">
        <div style="font-size:26px;margin-bottom:8px;color:#7db9ff">+</div>
        <div id="pxDropTitle">Drop media to import</div>
        <div style="font-size:11.5px;font-weight:400;color:#9fb0c3;margin-top:5px">Images, video and audio. Routed to the workspace you are in.</div>
      </div>`;
      document.body.append(dropOverlay);
    }
    const title = dropOverlay.querySelector("#pxDropTitle");
    if (title) title.textContent = count > 1 ? `Drop ${count} files to import` : "Drop media to import";
    dropOverlay.style.display = on ? "flex" : "none";
  }

  function setupDropZone() {
    let depth = 0;
    const isFileDrag = (e) => {
      try { return [...(e.dataTransfer?.types || [])].includes("Files"); } catch { return false; }
    };
    window.addEventListener("dragenter", (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth++;
      showDropOverlay(true, e.dataTransfer?.items?.length || 0);
    });
    window.addEventListener("dragover", (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = "copy"; } catch {}
    });
    window.addEventListener("dragleave", (e) => {
      if (!isFileDrag(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) showDropOverlay(false);
    });
    window.addEventListener("drop", async (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      depth = 0;
      showDropOverlay(false);
      const files = [...(e.dataTransfer?.files || [])];
      if (files.length) await routeDroppedFiles(files);
    });
  }

  async function routeDroppedFiles(files) {
    const ws = qs("section.on")?.id || "photo";
    const images = files.filter((f) => f.type.startsWith("image/"));
    const media = files.filter((f) => f.type.startsWith("video/") || f.type.startsWith("audio/") || /\.(mts|m2ts|ts|avi|mov|mkv|webm|mp4|m4v|mp3|wav|m4a|aac|ogg|flac)$/i.test(f.name));
    const other = files.filter((f) => !images.includes(f) && !media.includes(f));
    if (images.length && ws === "photo") {
      for (const file of images) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          try {
            if (typeof newDoc === "function") {
              newDoc(img.width, img.height, file.name.replace(/\.\w+$/, ""), 0, (ctx) => ctx.drawImage(img, 0, 0));
              say(`Opened ${file.name}.`);
            }
          } catch (err) { say("Could not open that image: " + err.message); }
          URL.revokeObjectURL(url);
        };
        img.onerror = () => { URL.revokeObjectURL(url); say(`Could not open ${file.name}.`); };
        img.src = url;
      }
      return;
    }
    const target = ws === "audio" && media.some((f) => f.type.startsWith("audio/")) ? byId("af") : byId("vf");
    if (media.length && target) {
      try {
        const dt = new DataTransfer();
        media.forEach((f) => dt.items.add(f));
        target.files = dt.files;
        target.dispatchEvent(new Event("change", { bubbles: true }));
        say(`Importing ${media.length} file${media.length === 1 ? "" : "s"}.`);
      } catch (err) {
        // Fallback for browsers that reject a synthetic file list.
        let ok = 0;
        for (const f of media) {
          const type = f.type.startsWith("audio/") ? "audio" : f.type.startsWith("image/") ? "image" : "video";
          try {
            items.push({ name: f.name, url: URL.createObjectURL(f), type });
            ok++;
          } catch {}
        }
        if (ok) { try { bin(); } catch {} say(`Added ${ok} file${ok === 1 ? "" : "s"} to the library.`); }
        else say("The browser did not allow that import. Use File > Import media.");
      }
      return;
    }
    if (images.length) {
      let ok = 0;
      images.forEach((f) => {
        try { items.push({ name: f.name, url: URL.createObjectURL(f), type: "image" }); ok++; } catch {}
      });
      if (ok) { try { bin(); } catch {} say(`Added ${ok} image${ok === 1 ? "" : "s"} to the video library.`); }
      return;
    }
    if (other.length) say("Those files are not images, video or audio.");
  }

  /* ------------------------------------------------------------------ *
   * 20. Keyboard shortcuts, init and public API
   * ------------------------------------------------------------------ */
  function isTypingTarget(el) {
    return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
  }

  function setupKeys() {
    document.addEventListener("keydown", (e) => {
      if (isTypingTarget(e.target)) return;
      const key = String(e.key || "").toLowerCase();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === "s") {
        e.preventDefault();
        makeSnapshot("manual");
        return;
      }
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      if (key === "c") { e.preventDefault(); toggleHub(); }
      else if (key === "p") { e.preventDefault(); openPrompter(); }
      else if (key === "m") { e.preventDefault(); openHub("memory"); }
    });
  }

  function toggleHub() {
    const dlg = buildHub();
    if (dlg.open) closeDialog(dlg); else openHub(S.hub || "publish");
  }

  function applyQueryHints() {
    const ws = qp.get("workspace");
    if (ws && ["photo", "video", "audio", "model"].includes(ws)) {
      setTimeout(() => document.querySelector(`.tab[data-t="${ws}"]`)?.click(), 120);
    }
    if (qp.get("open") === "creator") {
      setTimeout(() => openHub(qp.get("panel") || "publish"), 260);
    }
  }

  function exposeAPI() {
    window.PX = {
      version: VERSION,
      build: BUILD,
      name: APP_NAME,
      ready: true,
      openHub,
      openSettings,
      closeHub: () => closeDialog(byId("pxHub")),
      openThumb: () => { buildThumbDialog(); syncThumbDialog(); openThumb(); },
      teleprompter: { open: openPrompter, close: closePrompter, toggle: () => setPromptPlaying(!S.tp.playing), setText: promptSetText },
      platforms: PLATFORMS.map((p) => ({ ...p })),
      presets: EXPORT_PRESETS.map((p) => ({ ...p })),
      applyPlatform: (id) => {
        const p = PLATFORMS.find((x) => x.id === id);
        if (!p) throw new Error("Unknown platform: " + id);
        applyPlatform(p);
        return { width: p.w, height: p.h };
      },
      setExportPreset: (id) => {
        const p = EXPORT_PRESETS.find((x) => x.id === id);
        if (!p) throw new Error("Unknown preset: " + id);
        setExportPreset(p);
      },
      reframe,
      captions: {
        parse: parseCues,
        add: addCaptionCues,
        clear: clearCaptions,
        exportSRT,
        list: () => captionClips().map((c) => ({ start: c.start, end: c.start + c.dur, text: c.title.text }))
      },
      audio: {
        duck: duckMusic,
        removeSilence,
        normalize: normalizeClip,
        applyFx: applyAudioFx,
        resetFx: () => applyAudioFx({ ...AUDIO_FX_DEFAULTS }),
        addCensor: addCensorAtPlayhead,
        clearCensors,
        status: () => ({
          busy: !!S.audioBusy,
          bleep: bleepNode ? +bleepNode.gain.gain.value.toFixed(3) : null,
          censors: clips.reduce((n, c) => n + censorList(c).length, 0),
          baked: clips.filter((c) => !!c._pxBakedUrl).length
        })
      },
      snapshots: { save: () => makeSnapshot("manual"), list: dbAll, restore: restoreSnapshot, clear: dbClear },
      memory: { report: () => ({ heap: heapInfo(), history: historyDepth(), clips: clips.length, items: items.length, audioBuffers: audioCacheSize() }), trim: trimHistory, clearAudioCaches, releaseOrphanMedia },
      state: apiState,
      capabilities: async () => ({
        h264: await canEncode(WCC?.h264 || []),
        h265: await canEncode(WCC?.h265 || []),
        vp9: await canEncode(WCC?.vp9 || []),
        av1: await canEncode(WCC?.av1 || []),
        best: await bestFormat(),
        mediaRecorder: !!window.MediaRecorder
      }),
      settings: {
        get: () => ({ ...settings }),
        set: (patch) => {
          Object.assign(settings, patch || {});
          saveSettings();
          applyInterfaceMode();
          refreshSettings();
          return { ...settings };
        }
      },
      brand: {
        get: () => JSON.parse(JSON.stringify(brand)),
        set: (patch) => {
          Object.assign(brand, patch || {});
          if (patch && patch.wm) brand.wm = Object.assign({}, brand.wm, patch.wm);
          saveBrand();
          try { render(T); } catch {}
          return JSON.parse(JSON.stringify(brand));
        }
      },
      post: postToParent
    };
  }

  function init() {
    if (S.init) return;
    S.init = true;
    const fail = (name, fn) => {
      try { fn(); } catch (e) { console.warn("PRO X: " + name + " failed", e); }
    };

    fail("brand bar", buildBrandBar);
    fail("about", decorateAbout);
    fail("what's new", decorateWhatsNew);
    fail("help", decorateHelp);
    fail("thumbnail dialog", () => { buildThumbDialog(); syncThumbDialog(); });
    fail("teleprompter", buildPrompter);
    fail("embed", setupEmbed);
    fail("mobile bar", buildMobileBar);
    fail("side panels", tagSidePanels);
    fail("touch menus", setupTouchMenus);
    fail("safe zones", setupSafeZones);
    fail("render hooks", installHooks);
    fail("settings", applyInterfaceMode);
    fail("keys", setupKeys);
    fail("drop zone", setupDropZone);
    fail("snapshots", setupSnapshotEngine);
    fail("pwa", () => { setupPWA().catch((e) => console.info("PRO X: PWA setup skipped", e)); });
    fail("api", exposeAPI);
    fail("query hints", applyQueryHints);

    updateMemChip();
    setInterval(updateMemChip, 5000);

    // Keep the mobile bottom bar and safe guides in sync.
    window.addEventListener("resize", () => { syncMobileBar(); resizeSafe(); });
    window.addEventListener("orientationchange", () => { setTimeout(() => { syncMobileBar(); resizeSafe(); }, 160); });

    document.body.dataset.prox = VERSION;
    console.info(`${APP_NAME} ${VERSION} (${BUILD}) upgrade layer ready.`);
    setTimeout(() => {
      if (!localStorage.getItem("prox.greeted")) {
        LS.set("greeted", true);
        say("PRO X 1.0 is ready. Open the Creator Hub for captions, thumbnails, platform sizes and memory tools.");
      }
    }, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
