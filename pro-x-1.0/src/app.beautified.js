const $ = e => document.getElementById(e),
  MIME = {
    studio: "application/octet-stream",
    webm: "video/webm",
    mp4: "video/mp4",
    mov: "video/quicktime",
    png: "image/png",
    jpg: "image/jpeg",
    wav: "audio/wav",
    obj: "text/plain"
  };
async function askSave(e) {
  const t = e.split(".").pop();
  if (!window.showSaveFilePicker) return null;
  try {
    return await showSaveFilePicker({
      suggestedName: e,
      types: [{
        description: t.toUpperCase() + " file",
        accept: {
          [MIME[t] || "application/octet-stream"]: ["." + t]
        }
      }]
    })
  } catch (e) {
    if ("AbortError" === e.name) throw e;
    return null
  }
}

function toast(e, t, a) {
  let o = $("toast");
  if (o || (o = document.createElement("div"), o.id = "toast", o.style.cssText = "position:fixed;right:14px;bottom:14px;max-width:380px;background:#333;color:#eee;border:1px solid #000;border-left:4px solid #378ef0;border-radius:4px;padding:10px 28px 10px 12px;z-index:9999;box-shadow:0 6px 20px #000a;font:13px system-ui,sans-serif", document.body.append(o)), o.textContent = e + " ", t) {
    const e = document.createElement("a");
    e.href = URL.createObjectURL(t), e.download = a, e.textContent = "Click here to save the file.", e.style.cssText = "color:#6aa7e6;text-decoration:underline;display:block;margin-top:4px", o.append(e)
  }
  const n = document.createElement("button");
  n.textContent = "×", n.style.cssText = "position:absolute;top:2px;right:4px;background:none;border:0;color:#aaa;cursor:pointer", n.onclick = () => o.remove(), o.append(n), clearTimeout(o._h), t || (o._h = setTimeout(() => o.remove(), 6e3))
}
let pend = null;
async function dl(e, t, a) {
  if (a) try {
    const o = await a.createWritable();
    return await o.write(e), await o.close(), void toast("Saved " + (a.name || t) + ".")
  } catch (e) {}
  pend = {
    b: e,
    n: t
  };
  const o = URL.createObjectURL(e),
    n = t.split(".").pop(),
    s = $("sprev");
  let r;
  s.innerHTML = "", "png" === n || "jpg" === n ? (r = document.createElement("img"), r.style.maxWidth = "100%") : "wav" === n ? (r = document.createElement("audio"), r.controls = !0) : "webm" !== n && "mp4" !== n || (r = document.createElement("video"), r.controls = !0, r.style.maxWidth = "100%", r.style.maxHeight = "240px"), r && (r.src = o, s.append(r)), $("sinfo").textContent = `${t} · ${(e.size/1048576).toFixed(2)} MB`;
  const i = $("sdl");
  i.href = o, i.download = t, $("stab").href = o, $("shint").textContent = window.top !== window ? "This editor is running inside another page, which often blocks downloads. For reliable saving, open studio-editor.html directly in Chrome or Edge. You can still try Open in new tab and then right-click the file to save it." : "Save file… opens your computer's save window. Download uses your browser's normal download. Open in new tab lets you right-click the file and choose Save as.", $("sdlg").showModal()
}
$("ssave").onclick = async () => {
  const {
    b: e,
    n: t
  } = pend;
  let a = null;
  try {
    a = await askSave(t)
  } catch (e) {
    return void($("shint").textContent = "The save window was closed. Use Download instead, or right-click the preview and choose Save as.")
  }
  if (a) try {
    const t = await a.createWritable();
    return await t.write(e), await t.close(), $("sdlg").close(), void toast("Saved " + a.name + ".")
  } catch (e) {}
  $("sdl").click()
}, $("sclose").onclick = () => $("sdlg").close(), $("savebtn").onclick = () => {
  const e = document.querySelector("section.on").id;
  "photo" === e ? pexp("image/png", "edit.png") : "audio" === e ? $("aexp").click() : "model" === e ? $("m3png").click() : "video" === e ? $("vexp").click() : toast("Open Photo, Video, Audio or 3D to save your work.")
};
const AC = new(window.AudioContext || window.webkitAudioContext),
  fmt = e => `${Math.floor(e/60)}:${String(Math.floor(e%60)).padStart(2,"0")}`,
  tc = e => fmt(e) + "." + String(Math.floor(e % 1 * PS.fps)).padStart(2, "0"),
  FX = [
    ["brightness", 0, 200, 100, "%"],
    ["contrast", 0, 200, 100, "%"],
    ["saturate", 0, 300, 100, "%"],
    ["hue-rotate", 0, 360, 0, "deg"],
    ["blur", 0, 20, 0, "px"],
    ["sepia", 0, 100, 0, "%"],
    ["grayscale", 0, 100, 0, "%"],
    ["invert", 0, 100, 0, "%"]
  ];

function fxPanel(e, t) {
  return FX.forEach(([a, o, n, s]) => {
    const r = document.createElement("label");
    r.className = "s", r.innerHTML = `${a.replace("-rotate","")}<input type="range" min="${o}" max="${n}" value="${s}" data-d="${s}"><output>${s}</output>`;
    const i = r.querySelector("input"),
      l = r.querySelector("output");
    i.oninput = () => {
      l.textContent = i.value, t()
    }, e.append(r)
  }), {
    get: () => [...e.querySelectorAll("input")].map((e, t) => e.value === e.dataset.d ? "" : `${FX[t][0]}(${e.value}${FX[t][4]})`).filter(Boolean).join(" "),
    reset: () => {
      e.querySelectorAll("input").forEach(e => {
        e.value = e.dataset.d, e.nextSibling.textContent = e.value
      }), t()
    }
  }
}

function wf(e, t, a, o, n, s) {
  const r = Math.max(1, Math.floor(t.length / a));
  e.fillStyle = s;
  for (let s = 0; s < a; s++) {
    let a = 1,
      i = -1;
    for (let e = 0; e < r; e++) {
      const o = t[s * r + e] || 0;
      o < a && (a = o), o > i && (i = o)
    }
    e.fillRect(s, n + (1 + a) * o / 2, 1, Math.max(1, (i - a) * o / 2))
  }
}
document.querySelectorAll(".tab").forEach(e => e.onclick = () => {
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t === e)), document.querySelectorAll("section").forEach(t => t.classList.toggle("on", t.id === e.dataset.t)), "audio" === e.dataset.t && drawW(), "video" === e.dataset.t && (vui(), window._vInit || (window._vInit = 1, clips.length || psOpen("new"))), "model" === e.dataset.t && m3start()
});
const stack = $("stack"),
  ov = $("ov"),
  ovx = ov.getContext("2d"),
  SM = document.createElement("canvas"),
  smx = SM.getContext("2d", {
    willReadFrequently: !0
  });
let L = [],
  ai = 0,
  pw = 900,
  ph = 560,
  zoom = 1,
  U = [],
  R = [],
  tool = "brush",
  FG = "#e8505b",
  BG = "#ffffff",
  before = null,
  hasSel = !1,
  pd = null,
  cloneSrc = null;
const K = (e, t, a) => Math.min(a, Math.max(t, e)),
  A = () => L[ai],
  rgb = e => [1, 3, 5].map(t => parseInt(e.slice(t, t + 2), 16)),
  FA = () => +$("famt").value,
  BM = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"];
$("bm").innerHTML = BM.map(e => `<option>${e}</option>`).join("");
const pfx = fxPanel($("pfx"), () => {
    A() && (A().adj = pfx.get(), restyle(A()))
  }),
  shCss = (e, t) => {
    const a = e.sh;
    if (!a || !a.on) return "";
    const o = a.angle * Math.PI / 180;
    return `drop-shadow(${(Math.cos(o)*a.dist*t).toFixed(2)}px ${(Math.sin(o)*a.dist*t).toFixed(2)}px ${(a.blur*t).toFixed(2)}px ${hexA(a.color,a.op/100)})`
  },
  lf = (e, t) => ((e.adj || "") + " " + shCss(e, t)).trim() || "none";

function restyle(e) {
  const t = lf(e, zoom);
  e.c.style.filter = "none" === t ? "" : t
}
const view = () => {
    stack.style.width = pw * zoom + "px", stack.style.height = ph * zoom + "px", $("zl").textContent = Math.round(100 * zoom) + "%", $("zr").value = 100 * zoom, $("pst").textContent = `${pw} × ${ph} px`, L.forEach(restyle)
  },
  fit = () => {
    zoom = Math.min(1, ($("cv").clientWidth - 48) / pw, ($("cv").clientHeight - 48) / ph), view()
  };

function resize(e, t) {
  pw = e, ph = t, SM.width = ov.width = e, SM.height = ov.height = t, hasSel = !1, view()
}

function mk(e, t, a) {
  const o = document.createElement("canvas");
  o.width = pw, o.height = ph;
  const n = o.getContext("2d", {
    willReadFrequently: !0
  });
  return t && (n.fillStyle = t, n.fillRect(0, 0, pw, ph)), a && n.putImageData(a, 0, 0), stack.insertBefore(o, ov), {
    name: e,
    c: o,
    x: n,
    vis: 1,
    op: 100,
    bm: "normal"
  }
}

function sync() {
  L.forEach((e, t) => {
    const a = e.c.style;
    a.zIndex = t, a.display = e.vis ? "" : "none", a.opacity = e.op / 100, a.mixBlendMode = e.bm
  }), A() && ($("lop").value = A().op, $("bm").value = A().bm, shSync(), txtSync())
}

function layersUI() {
  const e = $("layers");
  e.innerHTML = "", L.map((e, t) => [e, t]).reverse().forEach(([t, a]) => {
    const o = document.createElement("div");
    o.className = "lr" + (a === ai ? " a" : "");
    const n = document.createElement("button");
    n.className = "ic", n.textContent = t.vis ? "●" : "○", n.onclick = e => {
      e.stopPropagation(), t.vis = !t.vis, sync(), layersUI()
    }, o.append(n, t.name), o.onclick = () => {
      pfx.reset(), ai = a, sync(), layersUI()
    }, o.ondblclick = () => {
      const e = prompt("Layer name", t.name);
      e && (t.name = e, layersUI())
    }, e.append(o)
  })
}

function histUI() {
  const e = $("hist");
  e.innerHTML = "", [...U.map((e, t) => [e, t, 0]), ...R.slice().reverse().map((e, t) => [e, U.length + t, 1])].forEach(([t, a, o]) => {
    const n = document.createElement("div");
    n.className = "lr" + (a === U.length - 1 ? " a" : ""), n.style.opacity = o ? .5 : 1, n.textContent = t.n, n.onclick = () => {
      for (; U.length - 1 > a;) undo();
      for (; U.length - 1 < a;) redo()
    }, e.append(n)
  })
}
const snapFull = () => ({
  pw: pw,
  ph: ph,
  ai: ai,
  ls: L.map(e => ({
    n: e.name,
    vis: e.vis,
    op: e.op,
    bm: e.bm,
    d: e.x.getImageData(0, 0, pw, ph),
    txt: e.txt && JSON.parse(JSON.stringify(e.txt)),
    sh: e.sh && {
      ...e.sh
    }
  }))
});

function restoreFull(e) {
  L.forEach(e => e.c.remove()), e.pw === pw && e.ph === ph || resize(e.pw, e.ph), L = e.ls.map(e => {
    const t = mk(e.n, 0, e.d);
    return t.vis = e.vis, t.op = e.op, t.bm = e.bm, t.txt = e.txt, t.sh = e.sh, restyle(t), t
  }), ai = e.ai, sync(), layersUI()
}
const keep = () => {
  U.length > 12 && U.shift(), R = [], histUI()
};

function structural(e, t) {
  const a = snapFull();
  t(), U.push({
    n: e,
    full: a
  }), keep(), sync(), layersUI()
}

function swap(e) {
  if (e.full) {
    const t = snapFull();
    restoreFull(e.full), e.full = t
  } else {
    const t = L[e.i],
      a = t.x.getImageData(0, 0, pw, ph);
    t.x.putImageData(e.d, 0, 0), e.d = a
  }
}

function undo() {
  const e = U.pop();
  e && (swap(e), R.push(e), histUI())
}

function redo() {
  const e = R.pop();
  e && (swap(e), U.push(e), histUI())
}
const beg = () => {
  before = A().x.getImageData(0, 0, pw, ph)
};

function fin(e) {
  const t = A();
  if (t.txt && (t.txt = null), hasSel) {
    const e = document.createElement("canvas");
    e.width = pw, e.height = ph;
    const a = e.getContext("2d");
    a.drawImage(t.c, 0, 0), a.globalCompositeOperation = "destination-in", a.drawImage(SM, 0, 0), t.x.putImageData(before, 0, 0), t.x.globalCompositeOperation = "destination-out", t.x.drawImage(SM, 0, 0), t.x.globalCompositeOperation = "source-over", t.x.drawImage(e, 0, 0)
  }
  U.push({
    n: e,
    i: ai,
    d: before
  }), before = null, keep()
}

function showSel() {
  ovx.clearRect(0, 0, pw, ph), hasSel && (ovx.drawImage(SM, 0, 0), ovx.globalCompositeOperation = "source-in", ovx.fillStyle = "rgba(55,142,240,.38)", ovx.fillRect(0, 0, pw, ph), ovx.globalCompositeOperation = "source-over")
}

function setSel(e, t) {
  const a = document.createElement("canvas");
  a.width = pw, a.height = ph;
  const o = a.getContext("2d");
  o.fillStyle = "#fff", e(o), "add" === t && hasSel ? smx.drawImage(a, 0, 0) : "sub" === t && hasSel ? (smx.globalCompositeOperation = "destination-out", smx.drawImage(a, 0, 0), smx.globalCompositeOperation = "source-over") : (smx.clearRect(0, 0, pw, ph), smx.drawImage(a, 0, 0)), hasSel = !0, showSel()
}

function flood(e, t, a) {
  const o = A().x.getImageData(0, 0, pw, ph).data,
    n = new Uint8Array(pw * ph),
    s = 4 * (t * pw + e),
    r = o[s],
    i = o[s + 1],
    l = o[s + 2],
    c = o[s + 3],
    p = [e, t],
    d = a * a * 10;
  for (; p.length;) {
    const e = p.pop(),
      t = p.pop(),
      a = e * pw + t;
    if (n[a]) continue;
    const s = 4 * a,
      u = o[s] - r,
      f = o[s + 1] - i,
      h = o[s + 2] - l,
      m = o[s + 3] - c;
    u * u + f * f + h * h + m * m > d || (n[a] = 1, t > 0 && p.push(t - 1, e), t < pw - 1 && p.push(t + 1, e), e > 0 && p.push(t, e - 1), e < ph - 1 && p.push(t, e + 1))
  }
  return n
}

function conv(e, t, a = 0) {
  const o = Uint8ClampedArray.from(e);
  for (let n = 1; n < ph - 1; n++)
    for (let s = 1; s < pw - 1; s++) {
      const r = 4 * (n * pw + s);
      for (let i = 0; i < 3; i++) {
        let l = 0,
          c = 0;
        for (let e = -1; e < 2; e++)
          for (let a = -1; a < 2; a++) l += o[4 * ((n + e) * pw + s + a) + i] * t[c++];
        e[r + i] = l + a
      }
    }
}

function flt(e, t) {
  if (!A()) return;
  beg();
  const a = A().x.getImageData(0, 0, pw, ph);
  t(a.data), A().x.putImageData(a, 0, 0), fin(e)
}

function xf(e, t, a, o) {
  structural(e, () => {
    L.forEach(e => {
      const n = document.createElement("canvas");
      n.width = pw, n.height = ph, n.getContext("2d").drawImage(e.c, 0, 0), e.c.width = t, e.c.height = a, o(e.x, n)
    }), resize(t, a)
  })
}
const tmpc = () => {
  const e = document.createElement("canvas");
  return e.width = pw, e.height = ph, e
};

function fillSel(e) {
  beg();
  const t = A().x;
  t.fillStyle = e, t.fillRect(0, 0, pw, ph), fin("Fill")
}
const ACT = {
  undo: undo,
  redo: redo,
  fillfg: () => fillSel(FG),
  fillbg: () => fillSel(BG),
  clear: () => {
    beg(), A().x.clearRect(0, 0, pw, ph), fin("Clear")
  },
  rcw: () => xf("Rotate 90° CW", ph, pw, (e, t) => {
    e.translate(t.height, 0), e.rotate(Math.PI / 2), e.drawImage(t, 0, 0)
  }),
  rccw: () => xf("Rotate 90° CCW", ph, pw, (e, t) => {
    e.translate(0, t.width), e.rotate(-Math.PI / 2), e.drawImage(t, 0, 0)
  }),
  r180: () => xf("Rotate 180°", pw, ph, (e, t) => {
    e.translate(t.width, t.height), e.rotate(Math.PI), e.drawImage(t, 0, 0)
  }),
  fh: () => xf("Flip horizontal", pw, ph, (e, t) => {
    e.translate(t.width, 0), e.scale(-1, 1), e.drawImage(t, 0, 0)
  }),
  fv: () => xf("Flip vertical", pw, ph, (e, t) => {
    e.translate(0, t.height), e.scale(1, -1), e.drawImage(t, 0, 0)
  }),
  size: () => {
    const e = parseInt(prompt("New width in pixels", pw));
    if (e > 0) {
      const t = Math.max(1, Math.round(e * ph / pw));
      xf("Image size", e, t, (a, o) => a.drawImage(o, 0, 0, e, t))
    }
  },
  crop: () => {
    if (!hasSel) return;
    const e = smx.getImageData(0, 0, pw, ph).data;
    let t = pw,
      a = ph,
      o = 0,
      n = 0;
    for (let s = 0; s < ph; s++)
      for (let r = 0; r < pw; r++) e[4 * (s * pw + r) + 3] > 10 && (t = Math.min(t, r), o = Math.max(o, r), a = Math.min(a, s), n = Math.max(n, s));
    const s = o - t + 1,
      r = n - a + 1;
    s > 0 && r > 0 && xf("Crop", s, r, (e, o) => e.drawImage(o, -t, -a))
  },
  auto: () => flt("Auto levels", e => {
    const t = [255, 255, 255],
      a = [0, 0, 0];
    for (let o = 0; o < e.length; o += 4)
      for (let n = 0; n < 3; n++) e[o + n] < t[n] && (t[n] = e[o + n]), e[o + n] > a[n] && (a[n] = e[o + n]);
    for (let o = 0; o < e.length; o += 4)
      for (let n = 0; n < 3; n++) e[o + n] = 255 * (e[o + n] - t[n]) / Math.max(1, a[n] - t[n])
  }),
  lnew: () => structural("New layer", () => {
    L.splice(ai + 1, 0, mk("Layer " + (L.length + 1))), ai++
  }),
  ldup: () => structural("Duplicate layer", () => {
    const e = A(),
      t = mk(e.name + " copy", 0, e.x.getImageData(0, 0, pw, ph));
    t.op = e.op, t.bm = e.bm, L.splice(ai + 1, 0, t), ai++
  }),
  ldel: () => {
    L.length > 1 && structural("Delete layer", () => {
      A().c.remove(), L.splice(ai, 1), ai = Math.max(0, ai - 1)
    })
  },
  lmerge: () => {
    ai > 0 && structural("Merge down", () => {
      const e = A(),
        t = L[ai - 1];
      t.x.globalAlpha = e.op / 100, t.x.globalCompositeOperation = "normal" === e.bm ? "source-over" : e.bm, t.x.drawImage(e.c, 0, 0), t.x.globalAlpha = 1, t.x.globalCompositeOperation = "source-over", e.c.remove(), L.splice(ai, 1), ai--
    })
  },
  lup: () => {
    ai < L.length - 1 && structural("Move layer up", () => {
      [L[ai], L[ai + 1]] = [L[ai + 1], L[ai]], ai++
    })
  },
  ldn: () => {
    ai > 0 && structural("Move layer down", () => {
      [L[ai], L[ai - 1]] = [L[ai - 1], L[ai]], ai--
    })
  },
  all: () => setSel(e => e.fillRect(0, 0, pw, ph), "set"),
  none: () => {
    hasSel = !1, smx.clearRect(0, 0, pw, ph), showSel()
  },
  inv: () => setSel(e => {
    e.fillRect(0, 0, pw, ph), hasSel && (e.globalCompositeOperation = "destination-out", e.drawImage(SM, 0, 0))
  }, "set"),
  feather: () => {
    if (!hasSel) return;
    const e = tmpc();
    e.getContext("2d").drawImage(SM, 0, 0), smx.clearRect(0, 0, pw, ph), smx.filter = `blur(${FA()/5}px)`, smx.drawImage(e, 0, 0), smx.filter = "none", showSel()
  },
  fblur: () => {
    beg();
    const e = tmpc(),
      t = e.getContext("2d");
    t.filter = `blur(${FA()/5}px)`, t.drawImage(A().c, 0, 0), A().x.clearRect(0, 0, pw, ph), A().x.drawImage(e, 0, 0), fin("Gaussian blur")
  },
  fsharp: () => flt("Sharpen", e => {
    const t = FA() / 50;
    conv(e, [0, -t, 0, -t, 1 + 4 * t, -t, 0, -t, 0])
  }),
  fnoise: () => flt("Add noise", e => {
    const t = 2.5 * FA();
    for (let a = 0; a < e.length; a += 4) {
      const o = (Math.random() - .5) * t;
      e[a] += o, e[a + 1] += o, e[a + 2] += o
    }
  }),
  fpix: () => {
    beg();
    const e = Math.max(2, Math.round(FA() / 4)),
      t = document.createElement("canvas");
    t.width = Math.ceil(pw / e), t.height = Math.ceil(ph / e), t.getContext("2d").drawImage(A().c, 0, 0, t.width, t.height);
    const a = A().x;
    a.clearRect(0, 0, pw, ph), a.imageSmoothingEnabled = !1, a.drawImage(t, 0, 0, t.width, t.height, 0, 0, t.width * e, t.height * e), a.imageSmoothingEnabled = !0, fin("Pixelate")
  },
  femb: () => flt("Emboss", e => conv(e, [-2, -1, 0, -1, 1, 1, 0, 1, 2], 128)),
  fedge: () => flt("Edge detect", e => conv(e, [-1, -1, -1, -1, 8, -1, -1, -1, -1])),
  fvig: () => flt("Vignette", e => {
    const t = FA() / 100;
    for (let a = 0; a < ph; a++)
      for (let o = 0; o < pw; o++) {
        const n = Math.hypot((o - pw / 2) / (pw / 2), (a - ph / 2) / (ph / 2)) / 1.414,
          s = 1 - t * n * n,
          r = 4 * (a * pw + o);
        e[r] *= s, e[r + 1] *= s, e[r + 2] *= s
      }
  }),
  fpost: () => flt("Posterize", e => {
    const t = Math.max(2, Math.round(FA() / 8)),
      a = 255 / (t - 1);
    for (let o = 0; o < e.length; o++) o % 4 < 3 && (e[o] = Math.round(e[o] / 255 * (t - 1)) * a)
  }),
  finv: () => flt("Invert colors", e => {
    for (let t = 0; t < e.length; t += 4) e[t] = 255 - e[t], e[t + 1] = 255 - e[t + 1], e[t + 2] = 255 - e[t + 2]
  }),
  fdes: () => flt("Desaturate", e => {
    for (let t = 0; t < e.length; t += 4) {
      const a = .3 * e[t] + .59 * e[t + 1] + .11 * e[t + 2];
      e[t] = e[t + 1] = e[t + 2] = a
    }
  })
};

function ratioLock(e) {
  const t = $("pratio").value;
  if ("0" === t || "rect" !== tool && "ell" !== tool) return e;
  const [a, o] = t.split(":").map(Number), n = a / o, s = e[0] - pd.s[0], r = e[1] - pd.s[1];
  let i = s,
    l = r;
  return Math.abs(s) > Math.abs(r) * n ? i = Math.sign(s || 1) * Math.abs(r) * n : l = Math.sign(r || 1) * Math.abs(s) / n, [pd.s[0] + i, pd.s[1] + l]
}
const parseWH = (e, t) => {
  const a = (e || "").match(/([\d.]+)\s*[:x×]\s*([\d.]+)/i);
  return a ? [+a[1], +a[2]] : t
};
Object.assign(ACT, {
  crar: () => {
    const e = prompt("Crop to aspect ratio (examples: 16:9, 1:1, 4:5, 9:16)", "16:9"),
      [t, a] = parseWH(e, [0, 0]);
    if (!t || !a) return;
    const o = t / a;
    let n = pw,
      s = ph;
    pw / ph > o ? n = Math.round(ph * o) : s = Math.round(pw / o);
    const r = (pw - n) / 2,
      i = (ph - s) / 2;
    xf("Crop to " + t + ":" + a, n, s, (e, t) => e.drawImage(t, -r, -i))
  },
  csz: () => {
    const [e, t] = parseWH(prompt("New canvas size (width x height), centered", pw + " x " + ph), [0, 0]);
    e > 0 && t > 0 && xf("Canvas size", Math.round(e), Math.round(t), (a, o) => a.drawImage(o, (e - o.width) / 2, (t - o.height) / 2))
  },
  rany: () => {
    const e = parseFloat(prompt("Rotate by how many degrees? (positive = clockwise)", "5"));
    e && xf("Rotate " + e + "°", pw, ph, (t, a) => {
      t.translate(a.width / 2, a.height / 2), t.rotate(e * Math.PI / 180), t.drawImage(a, -a.width / 2, -a.height / 2)
    })
  },
  lscale: () => {
    const e = parseFloat(prompt("Scale layer to what percent?", "50")) / 100;
    if (!(e > 0)) return;
    beg();
    const t = tmpc();
    t.getContext("2d").drawImage(A().c, 0, 0);
    const a = A().x;
    a.clearRect(0, 0, pw, ph), a.save(), a.translate(pw / 2, ph / 2), a.scale(e, e), a.drawImage(t, -pw / 2, -ph / 2), a.restore(), fin("Scale layer")
  },
  lcopy: () => structural("Layer via copy", () => {
    const e = A(),
      t = mk(e.name + " copy"),
      a = t.x;
    a.drawImage(e.c, 0, 0), hasSel && (a.globalCompositeOperation = "destination-in", a.drawImage(SM, 0, 0), a.globalCompositeOperation = "source-over"), L.splice(ai + 1, 0, t), ai++
  }),
  lcut: () => structural("Layer via cut", () => {
    const e = A(),
      t = mk(e.name + " cut"),
      a = t.x;
    a.drawImage(e.c, 0, 0), hasSel ? (a.globalCompositeOperation = "destination-in", a.drawImage(SM, 0, 0), a.globalCompositeOperation = "source-over", e.x.globalCompositeOperation = "destination-out", e.x.drawImage(SM, 0, 0), e.x.globalCompositeOperation = "source-over") : e.x.clearRect(0, 0, pw, ph), L.splice(ai + 1, 0, t), ai++
  })
});
let pclip = null;

function selBox() {
  if (!hasSel) return {
    x: 0,
    y: 0,
    w: pw,
    h: ph
  };
  const e = smx.getImageData(0, 0, pw, ph).data;
  let t = pw,
    a = ph,
    o = -1,
    n = -1;
  for (let s = 0; s < ph; s++)
    for (let r = 0; r < pw; r++) e[4 * (s * pw + r) + 3] > 10 && (r < t && (t = r), r > o && (o = r), s < a && (a = s), s > n && (n = s));
  return o < 0 ? null : {
    x: t,
    y: a,
    w: o - t + 1,
    h: n - a + 1
  }
}

function copySel() {
  const e = selBox();
  if (!e) return !1;
  const t = tmpc(),
    a = t.getContext("2d");
  a.drawImage(A().c, 0, 0), hasSel && (a.globalCompositeOperation = "destination-in", a.drawImage(SM, 0, 0));
  const o = document.createElement("canvas");
  o.width = e.w, o.height = e.h, o.getContext("2d").drawImage(t, -e.x, -e.y), pclip = {
    c: o,
    x: e.x,
    y: e.y,
    sz: null
  };
  try {
    o.toBlob(e => {
      pclip.sz = e.size, navigator.clipboard.write([new ClipboardItem({
        "image/png": e
      })]).catch(() => {})
    })
  } catch (e) {}
  return !0
}

function pasteImg(e, t, a, o) {
  structural("Paste", () => {
    const n = mk(o || "Pasted");
    n.x.drawImage(e, t, a), L.splice(ai + 1, 0, n), ai++
  }), setTool("move")
}
async function clipRead() {
  try {
    for (const e of await navigator.clipboard.read()) {
      const t = e.types.find(e => e.startsWith("image/"));
      if (t) {
        const a = new Image;
        return a.onload = () => pasteImg(a, 0, 0), void(a.src = URL.createObjectURL(await e.getType(t)))
      }
    }
  } catch (e) {}
  toast("Nothing to paste. Copy a selection first.")
}
Object.assign(ACT, {
  copy: () => {
    toast(copySel() ? "Copied." : "Make a selection first, or the layer is empty.")
  },
  cut: () => {
    if (!copySel()) return void toast("Make a selection first.");
    beg();
    const e = A().x;
    hasSel ? (e.globalCompositeOperation = "destination-out", e.drawImage(SM, 0, 0), e.globalCompositeOperation = "source-over") : e.clearRect(0, 0, pw, ph), fin("Cut")
  },
  paste: () => {
    pclip ? pasteImg(pclip.c, pclip.x, pclip.y) : navigator.clipboard && navigator.clipboard.read ? clipRead() : toast("Nothing to paste.")
  }
}), document.addEventListener("paste", e => {
  if (!$("photo").classList.contains("on") || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const t = [...e.clipboardData ? e.clipboardData.items : []].find(e => e.type.startsWith("image/")),
    a = t && t.getAsFile();
  if (!a || pclip && pclip.sz === a.size) pclip && (e.preventDefault(), pasteImg(pclip.c, pclip.x, pclip.y));
  else {
    e.preventDefault();
    const t = new Image;
    t.onload = () => pasteImg(t, 0, 0), t.src = URL.createObjectURL(a)
  }
});
const GPR = {
  "Foreground to background": 0,
  "Foreground to transparent": 1,
  Rainbow: [
    [0, "#ff0000"],
    [.17, "#ffff00"],
    [.33, "#00ff00"],
    [.5, "#00ffff"],
    [.67, "#0000ff"],
    [.83, "#ff00ff"],
    [1, "#ff0000"]
  ],
  Sunset: [
    [0, "#1a1040"],
    [.4, "#c0392b"],
    [.7, "#f39c12"],
    [1, "#fff2b0"]
  ],
  Ocean: [
    [0, "#02142b"],
    [.5, "#0a7ea4"],
    [1, "#a8f0ff"]
  ],
  "Black to white": [
    [0, "#000000"],
    [1, "#ffffff"]
  ],
  Chrome: [
    [0, "#fdfdfd"],
    [.45, "#6f7a88"],
    [.5, "#1c2530"],
    [.55, "#9fb2c4"],
    [1, "#ffffff"]
  ],
  Fire: [
    [0, "#000000"],
    [.35, "#8b0000"],
    [.65, "#ff8c00"],
    [1, "#ffffe0"]
  ]
};

function gradLUT(e) {
  const t = GPR[e],
    a = 0 === t ? [
      [0, [...rgb(FG), 255]],
      [1, [...rgb(BG), 255]]
    ] : 1 === t ? [
      [0, [...rgb(FG), 255]],
      [1, [...rgb(FG), 0]]
    ] : t.map(([e, t]) => [e, [...rgb(t), 255]]),
    o = new Uint8ClampedArray(1024);
  for (let e = 0; e < 256; e++) {
    const t = e / 255;
    let n = 1;
    for (; n < a.length - 1 && a[n][0] < t;) n++;
    const s = a[n - 1],
      r = a[n],
      i = r[0] === s[0] ? 0 : Math.min(1, Math.max(0, (t - s[0]) / (r[0] - s[0])));
    for (let t = 0; t < 4; t++) o[4 * e + t] = s[1][t] + (r[1][t] - s[1][t]) * i
  }
  return o
}

function gradFill(e, t, a, o, n) {
  const s = gradLUT(o),
    r = new ImageData(pw, ph),
    i = r.data,
    l = t[0] - e[0],
    c = t[1] - e[1],
    p = Math.hypot(l, c) || 1,
    d = p * p,
    u = Math.atan2(c, l);
  for (let t = 0; t < ph; t++)
    for (let o = 0; o < pw; o++) {
      const n = o - e[0],
        r = t - e[1];
      let f;
      "linear" === a ? f = (n * l + r * c) / d : "radial" === a ? f = Math.hypot(n, r) / p : "angle" === a ? (f = (Math.atan2(r, n) - u) / 6.2832, f -= Math.floor(f)) : f = "reflected" === a ? Math.abs(n * l + r * c) / d : (Math.abs(n) + Math.abs(r)) / p;
      const h = 255 * (f < 0 ? 0 : f > 1 ? 1 : f) | 0,
        m = 4 * (t * pw + o);
      i[m] = s[4 * h], i[m + 1] = s[4 * h + 1], i[m + 2] = s[4 * h + 2], i[m + 3] = s[4 * h + 3]
    }
  const f = tmpc();
  f.getContext("2d").putImageData(r, 0, 0);
  const h = A().x;
  h.globalAlpha = n, h.drawImage(f, 0, 0), h.globalAlpha = 1
}
$("gpr").innerHTML = Object.keys(GPR).map(e => `<option>${e}</option>`).join("");
const TFONTS = ["system-ui, sans-serif", "Georgia, serif", "Impact, sans-serif", '"Courier New", monospace', '"Trebuchet MS", sans-serif', '"Brush Script MT", cursive', '"Times New Roman", serif', "Verdana, sans-serif"];
$("tfont").innerHTML = TFONTS.map(e => `<option value='${e}'>${e.split(",")[0].replace(/"/g,"")}</option>`).join("");
const TD = () => ({
  t: "",
  x: 0,
  y: 0,
  fs: +$("tsz").value,
  font: $("tfont").value,
  bold: $("tbold").checked,
  it: $("titalic").checked,
  col: $("tcol").value,
  out: $("tout").checked,
  ocol: $("tocol").value,
  gr: $("tgr").checked,
  gcol: $("tgcol").value
});

function renderText(e) {
  const t = e.txt,
    a = e.x;
  a.clearRect(0, 0, pw, ph);
  const o = t.t.split("\n"),
    n = t.fs;
  a.font = `${t.it?"italic ":""}${t.bold?"bold ":""}${n}px ${t.font}`, a.textBaseline = "alphabetic", a.lineJoin = "round";
  let s = 0;
  o.forEach(e => s = Math.max(s, a.measureText(e).width)), o.forEach((e, o) => {
    const s = t.y + o * n * 1.2;
    if (t.out && (a.lineWidth = .07 * n, a.strokeStyle = t.ocol, a.strokeText(e, t.x, s)), t.gr) {
      const e = a.createLinearGradient(0, s - n, 0, s);
      e.addColorStop(0, t.col), e.addColorStop(1, t.gcol), a.fillStyle = e
    } else a.fillStyle = t.col;
    a.fillText(e, t.x, s)
  }), t.bx = {
    x: t.x,
    y: t.y - n,
    w: Math.max(s, .6 * n),
    h: o.length * n * 1.2 + .2 * n
  }
}
const inBox = (e, t) => e && t[0] >= e.x && t[0] <= e.x + e.w && t[1] >= e.y && t[1] <= e.y + e.h;
let ed = null;

function posEdit() {
  if (!ed) return;
  const e = ed.l.txt,
    t = $("tedit");
  t.style.left = e.x * zoom + "px", t.style.top = (e.y - e.fs) * zoom + "px", t.style.fontSize = e.fs * zoom + "px", t.style.fontFamily = e.font, t.style.fontWeight = e.bold ? "bold" : "normal", t.style.fontStyle = e.it ? "italic" : "normal", t.style.width = Math.max(140, (e.bx ? e.bx.w : 100) * zoom + 30) + "px", t.style.height = Math.max(e.fs * zoom * 1.3, (e.bx ? e.bx.h : e.fs) * zoom + 6) + "px"
}

function startEdit(e, t) {
  endEdit(), ed = {
    l: e,
    snap: t,
    start: e.txt.t
  };
  const a = $("tedit");
  a.value = e.txt.t, a.style.display = "block", posEdit(), setTimeout(() => {
    ed && ed.l === e && (a.focus(), a.setSelectionRange(a.value.length, a.value.length))
  }, 40)
}

function endEdit() {
  if (!ed) return;
  const {
    l: e,
    snap: t,
    start: a
  } = ed;
  ed = null, $("tedit").style.display = "none", e.txt.t.trim() ? e.txt.t !== a && (U.push({
    n: "Edit text",
    full: t
  }), keep()) : (e.c.remove(), L = L.filter(t => t !== e), ai = Math.max(0, Math.min(ai, L.length - 1))), sync(), layersUI()
}

function txtSync() {
  const e = A();
  if (!e || !e.txt) return;
  const t = e.txt;
  $("tfont").value = t.font, $("tsz").value = t.fs, $("tsz").nextSibling.textContent = t.fs, $("tcol").value = t.col, $("tbold").checked = t.bold, $("titalic").checked = t.it, $("tout").checked = t.out, $("tocol").value = t.ocol, $("tgr").checked = t.gr, $("tgcol").value = t.gcol
}

function textUp() {
  const e = Math.hypot(pd.last[0] - pd.s[0], pd.last[1] - pd.s[1]);
  "text" === tool && e < 3 ? startEdit(pd.tm.l, pd.tm.snap) : e >= 3 && (U.push({
    n: "Move text",
    full: pd.tm.snap
  }), keep())
}
$("tedit").addEventListener("input", () => {
  if (!ed) return;
  const e = ed.l;
  e.txt.t = $("tedit").value, e.name = "Text: " + (e.txt.t.split("\n")[0] || "").slice(0, 18), renderText(e), posEdit(), layersUI()
}), $("tedit").addEventListener("keydown", e => {
  "Escape" === e.key && (e.preventDefault(), endEdit()), e.stopPropagation()
}), $("tedit").addEventListener("blur", () => setTimeout(endEdit, 0)), ["tfont", "tsz", "tcol", "tbold", "titalic", "tout", "tocol", "tgr", "tgcol"].forEach(e => $(e).addEventListener("input", () => {
  "tsz" === e && ($("tsz").nextSibling.textContent = $("tsz").value);
  const t = A();
  t && t.txt && (Object.assign(t.txt, {
    fs: +$("tsz").value,
    font: $("tfont").value,
    bold: $("tbold").checked,
    it: $("titalic").checked,
    col: $("tcol").value,
    out: $("tout").checked,
    ocol: $("tocol").value,
    gr: $("tgr").checked,
    gcol: $("tgcol").value
  }), renderText(t), posEdit())
}));
const SHD = {
  on: 0,
  color: "#000000",
  dist: 8,
  angle: 45,
  blur: 10,
  op: 70
};

function shSync() {
  const e = A(),
    t = e && e.sh || SHD;
  $("tsh").checked = !!t.on, $("tshc").value = t.color, [
    ["tshd", "dist"],
    ["tsha", "angle"],
    ["tshb", "blur"],
    ["tsho", "op"]
  ].forEach(([e, a]) => {
    $(e).value = t[a], $(e).nextSibling.textContent = t[a]
  })
}

function splineLUT(e) {
  const t = [...e].sort((e, t) => e[0] - t[0]),
    a = t.length,
    o = t.map(e => e[0]),
    n = t.map(e => e[1]),
    s = [],
    r = [];
  for (let e = 0; e < a - 1; e++) s[e] = (n[e + 1] - n[e]) / (o[e + 1] - o[e] || 1e-6);
  r[0] = s[0], r[a - 1] = s[a - 2];
  for (let e = 1; e < a - 1; e++) r[e] = s[e - 1] * s[e] <= 0 ? 0 : (s[e - 1] + s[e]) / 2;
  for (let e = 0; e < a - 1; e++)
    if (0 === s[e]) r[e] = r[e + 1] = 0;
    else {
      const t = r[e] / s[e],
        a = r[e + 1] / s[e],
        o = t * t + a * a;
      if (o > 9) {
        const n = 3 / Math.sqrt(o);
        r[e] = n * t * s[e], r[e + 1] = n * a * s[e]
      }
    } const i = new Uint8ClampedArray(256);
  for (let e = 0; e < 256; e++) {
    const t = e / 255;
    let s = 0;
    for (; s < a - 2 && t > o[s + 1];) s++;
    const l = o[s + 1] - o[s] || 1e-6,
      c = (t - o[s]) / l,
      p = c * c,
      d = p * c,
      u = (2 * d - 3 * p + 1) * n[s] + (d - 2 * p + c) * l * r[s] + (-2 * d + 3 * p) * n[s + 1] + (d - p) * l * r[s + 1];
    i[e] = Math.round(255 * K(t < o[0] ? n[0] : t > o[a - 1] ? n[a - 1] : u, 0, 1))
  }
  return i
} ["tsh", "tshc", "tshd", "tsha", "tshb", "tsho"].forEach(e => $(e).addEventListener("input", () => {
  const t = A();
  if (!t) return;
  t.sh = t.sh || {
    ...SHD
  };
  const a = t.sh;
  a.on = $("tsh").checked ? 1 : 0, a.color = $("tshc").value, a.dist = +$("tshd").value, a.angle = +$("tsha").value, a.blur = +$("tshb").value, a.op = +$("tsho").value, "tsh" !== e && "tshc" !== e && ($(e).nextSibling.textContent = $(e).value, a.on || (a.on = 1, $("tsh").checked = !0)), restyle(t)
}));
const curvesDefault = () => ({
  m: [
    [0, 0],
    [1, 1]
  ],
  r: [
    [0, 0],
    [1, 1]
  ],
  g: [
    [0, 0],
    [1, 1]
  ],
  b: [
    [0, 0],
    [1, 1]
  ]
});

function curveLUTs(e) {
  const t = splineLUT(e.m),
    a = splineLUT(e.r),
    o = splineLUT(e.g),
    n = splineLUT(e.b),
    s = new Uint8ClampedArray(256),
    r = new Uint8ClampedArray(256),
    i = new Uint8ClampedArray(256);
  for (let e = 0; e < 256; e++) s[e] = a[t[e]], r[e] = o[t[e]], i[e] = n[t[e]];
  return [s, r, i]
}
const CVS = {
  ch: "m",
  pts: null,
  drag: -1,
  raf: 0
};

function openCurves(e, t, a, o) {
  CVS.pts = JSON.parse(JSON.stringify(e || curvesDefault())), CVS.ch = "m", CVS.onChange = t, CVS.onOk = a, CVS.onCancel = o, [...$("cch").children].forEach(e => e.setAttribute("aria-pressed", "m" === e.dataset.c)), $("cdlg").showModal(), cdraw(), t(curveLUTs(CVS.pts))
}

function cdraw() {
  const e = $("cc").getContext("2d"),
    t = 256;
  e.clearRect(0, 0, t, t), e.lineWidth = 1, e.strokeStyle = "#2a2f3a";
  for (let a = 1; a < 4; a++) e.beginPath(), e.moveTo(64 * a, 0), e.lineTo(64 * a, t), e.moveTo(0, 64 * a), e.lineTo(t, 64 * a), e.stroke();
  e.strokeStyle = "#3a4150", e.beginPath(), e.moveTo(0, t), e.lineTo(t, 0), e.stroke();
  const a = {
      m: "#e8ebf2",
      r: "#ff5a5a",
      g: "#5ade6a",
      b: "#5a9aff"
    } [CVS.ch],
    o = splineLUT(CVS.pts[CVS.ch]);
  e.strokeStyle = a, e.lineWidth = 2, e.beginPath();
  for (let a = 0; a < 256; a++) {
    const n = t - o[a] * t / 255;
    a ? e.lineTo(a, n) : e.moveTo(a, n)
  }
  e.stroke(), e.fillStyle = a, CVS.pts[CVS.ch].forEach(a => e.fillRect(a[0] * t - 4, t - a[1] * t - 4, 8, 8))
}

function cupd() {
  cdraw(), CVS.raf || (CVS.raf = requestAnimationFrame(() => {
    CVS.raf = 0, CVS.onChange(curveLUTs(CVS.pts))
  }))
}
const cpos = e => {
  const t = $("cc").getBoundingClientRect();
  return [(e.clientX - t.left) / t.width, 1 - (e.clientY - t.top) / t.height]
};
$("cc").onpointerdown = e => {
  const t = cpos(e),
    a = CVS.pts[CVS.ch];
  let o = a.findIndex(e => Math.hypot(e[0] - t[0], e[1] - t[1]) < .045);
  if (o < 0) {
    const e = K(t[0], .01, .99);
    a.push([e, K(t[1], 0, 1)]), a.sort((e, t) => e[0] - t[0]), o = a.findIndex(t => t[0] === e)
  }
  CVS.drag = o, $("cc").setPointerCapture(e.pointerId), cupd()
}, $("cc").onpointermove = e => {
  if (CVS.drag < 0) return;
  const t = cpos(e),
    a = CVS.pts[CVS.ch],
    o = CVS.drag,
    n = 0 === o || o === a.length - 1,
    s = 0 === o ? 0 : a[o - 1][0] + .01,
    r = o === a.length - 1 ? 1 : a[o + 1][0] - .01;
  a[o] = [n ? a[o][0] : K(t[0], s, r), K(t[1], 0, 1)], cupd()
}, $("cc").onpointerup = () => CVS.drag = -1, $("cc").ondblclick = e => {
  const t = cpos(e),
    a = CVS.pts[CVS.ch],
    o = a.findIndex(e => Math.hypot(e[0] - t[0], e[1] - t[1]) < .05);
  o > 0 && o < a.length - 1 && (a.splice(o, 1), cupd())
}, $("cch").onclick = e => {
  const t = e.target.dataset.c;
  t && (CVS.ch = t, [...$("cch").children].forEach(e => e.setAttribute("aria-pressed", e.dataset.c === t)), cdraw())
}, $("creset").onclick = () => {
  CVS.pts = curvesDefault(), cupd()
}, $("cok").onclick = () => {
  CVS.raf = 0, CVS.onOk(CVS.pts, curveLUTs(CVS.pts)), $("cdlg").close()
}, $("ccancel").onclick = () => {
  CVS.onCancel(), $("cdlg").close()
}, $("cdlg").addEventListener("cancel", () => CVS.onCancel()), $("pcurves").onclick = () => {
  const e = A();
  if (!e) return;
  const t = e.x.getImageData(0, 0, pw, ph);
  openCurves(null, ([a, o, n]) => {
    const s = new ImageData(new Uint8ClampedArray(t.data), pw, ph),
      r = s.data;
    for (let e = 0; e < r.length; e += 4) r[e] = a[r[e]], r[e + 1] = o[r[e + 1]], r[e + 2] = n[r[e + 2]];
    e.x.putImageData(s, 0, 0)
  }, () => {
    before = t, fin("Curves")
  }, () => e.x.putImageData(t, 0, 0))
};
const LUTS = {},
  customLUT = new Set,
  LO = [0, 0, 0];

function parseCube(e) {
  let t = 0,
    a = 3,
    o = [0, 0, 0],
    n = [1, 1, 1];
  const s = [];
  for (const r of e.split(/\r?\n/)) {
    const e = r.trim();
    if (e && "#" !== e[0])
      if (/^LUT_3D_SIZE/i.test(e)) t = +e.split(/\s+/)[1], a = 3;
      else if (/^LUT_1D_SIZE/i.test(e)) t = +e.split(/\s+/)[1], a = 1;
    else if (/^DOMAIN_MIN/i.test(e)) o = e.split(/\s+/).slice(1).map(Number);
    else if (/^DOMAIN_MAX/i.test(e)) n = e.split(/\s+/).slice(1).map(Number);
    else if (/^[-+\d.]/.test(e)) {
      const t = e.split(/\s+/).map(Number);
      t.length >= 3 && s.push(t[0], t[1], t[2])
    }
  }
  const r = 3 === a ? t * t * t * 3 : 3 * t;
  if (!t || s.length < r) throw new Error("This does not look like a valid .cube file");
  return {
    N: t,
    t: a,
    lo: o,
    hi: n,
    data: Float32Array.from(s.slice(0, r))
  }
}

function lutPx(e, t, a, o) {
  const n = e.N,
    s = e.data,
    r = e.lo,
    i = e.hi;
  let l = (t / 255 - r[0]) / (i[0] - r[0]),
    c = (a / 255 - r[1]) / (i[1] - r[1]),
    p = (o / 255 - r[2]) / (i[2] - r[2]);
  if (l = l < 0 ? 0 : l > 1 ? 1 : l, c = c < 0 ? 0 : c > 1 ? 1 : c, p = p < 0 ? 0 : p > 1 ? 1 : p, 1 === e.t) {
    const e = (e, t) => {
      const a = e * (n - 1),
        o = 0 | a,
        r = Math.min(n - 1, o + 1),
        i = a - o;
      return s[3 * o + t] * (1 - i) + s[3 * r + t] * i
    };
    return LO[0] = 255 * e(l, 0), LO[1] = 255 * e(c, 1), LO[2] = 255 * e(p, 2), LO
  }
  const d = l * (n - 1),
    u = c * (n - 1),
    f = p * (n - 1),
    h = 0 | d,
    m = 0 | u,
    g = 0 | f,
    b = Math.min(n - 1, h + 1),
    v = Math.min(n - 1, m + 1),
    w = Math.min(n - 1, g + 1),
    x = d - h,
    y = u - m,
    k = f - g,
    $ = (g * n + m) * n * 3 + 3 * h,
    M = 3 * (b - h),
    S = 3 * (v - m) * n,
    C = 3 * (w - g) * n * n;
  for (let e = 0; e < 3; e++) {
    const t = $ + e,
      a = s[t],
      o = s[t + M],
      n = s[t + S],
      r = s[t + M + S],
      i = s[t + C],
      l = s[t + M + C],
      c = s[t + S + C],
      p = a + (o - a) * x,
      d = i + (l - i) * x,
      u = p + (n + (r - n) * x - p) * y,
      f = d + (c + (s[t + M + S + C] - c) * x - d) * y;
    LO[e] = 255 * (u + (f - u) * k)
  }
  return LO
}

function genLUT(e, t, a = 17) {
  const o = new Float32Array(a * a * a * 3);
  let n = 0;
  for (let e = 0; e < a; e++)
    for (let s = 0; s < a; s++)
      for (let r = 0; r < a; r++) {
        const i = t(r / (a - 1), s / (a - 1), e / (a - 1));
        o[n++] = Math.min(1, Math.max(0, i[0])), o[n++] = Math.min(1, Math.max(0, i[1])), o[n++] = Math.min(1, Math.max(0, i[2]))
      }
  LUTS[e] = {
    N: a,
    t: 3,
    lo: [0, 0, 0],
    hi: [1, 1, 1],
    data: o
  }
}
const lum = (e, t, a) => .2126 * e + .7152 * t + .0722 * a,
  sat = (e, t, a, o) => {
    const n = lum(e, t, a);
    return [n + (e - n) * o, n + (t - n) * o, n + (a - n) * o]
  },
  sm3 = e => e * e * (3 - 2 * e);

function lutRefresh() {
  const e = '<option value="">Choose a LUT…</option>' + Object.keys(LUTS).map(e => `<option>${e}</option>`).join(""),
    t = $("plutsel").value;
  $("plutsel").innerHTML = e, $("plutsel").value = t;
  try {
    cs && $("video").classList.contains("on") && fxUI()
  } catch (e) {}
}
async function loadLUTFiles(e) {
  for (const t of e) try {
    const e = t.name.replace(/\.cube$/i, "");
    LUTS[e] = parseCube(await t.text()), customLUT.add(e), toast("Loaded LUT " + t.name + ".")
  } catch (e) {
    toast(t.name + ": " + e.message)
  }
  lutRefresh()
}
genLUT("Teal and orange", (e, t, a) => {
  const o = lum(e, t, a),
    n = 1 - o,
    s = o;
  return [e, t, a] = [e + .09 * s - .06 * n, t + .01 * s + .02 * n, a - .09 * s + .09 * n], sat(sm3(e), sm3(t), sm3(a), 1.15).map((o, n) => .7 * o + .3 * [e, t, a][n])
}), genLUT("Cinematic fade", (e, t, a) => {
  const o = sat(e, t, a, .85);
  return [.92 * o[0] + .06, .92 * o[1] + .065, .92 * o[2] + .08]
}), genLUT("Warm film", (e, t, a) => [.6 * sm3(e) + .4 * e + .03, .6 * sm3(t) + .4 * t, .6 * sm3(a) + .4 * a - .04 + .03]), genLUT("Cool blue", (e, t, a) => [e - .04, t + .01, a + .07]), genLUT("Noir (black and white)", (e, t, a) => {
  const o = .5 * sm3(sm3(lum(e, t, a))) + .5 * lum(e, t, a);
  return [o, o, o]
}), genLUT("Bleach bypass", (e, t, a) => {
  const o = lum(e, t, a);
  return sat(e, t, a, .45).map(e => .6 * e + .4 * sm3(o) + .25 * (e - .5))
}), genLUT("Vivid", (e, t, a) => sat(.5 * sm3(e) + .5 * e, .5 * sm3(t) + .5 * t, .5 * sm3(a) + .5 * a, 1.35)), $("plutf").onchange = async e => {
  await loadLUTFiles(e.target.files), e.target.value = "";
  const t = Object.keys(LUTS).pop();
  $("plutsel").value = t
}, $("vlutf").onchange = async e => {
  await loadLUTFiles(e.target.files), e.target.value = ""
}, lutRefresh();
const med9 = e => {
  for (let t = 1; t < 9; t++) {
    const a = e[t];
    let o = t - 1;
    for (; o >= 0 && e[o] > a;) e[o + 1] = e[o], o--;
    e[o + 1] = a
  }
  return e[4]
};
Object.assign(ACT, {
  lshadow: () => {
    const e = A();
    e.sh = e.sh || {
      ...SHD
    }, e.sh.on = e.sh.on ? 0 : 1, shSync(), restyle(e)
  },
  fsepia: () => flt("Sepia", e => {
    for (let t = 0; t < e.length; t += 4) {
      const a = e[t],
        o = e[t + 1],
        n = e[t + 2];
      e[t] = .393 * a + .769 * o + .189 * n, e[t + 1] = .349 * a + .686 * o + .168 * n, e[t + 2] = .272 * a + .534 * o + .131 * n
    }
  }),
  fvintage: () => flt("Vintage film", e => {
    const t = FA() / 100;
    for (let a = 0; a < e.length; a += 4) {
      let o = .9 * e[a] + 22,
        n = .88 * e[a + 1] + 20,
        s = .78 * e[a + 2] + 28;
      const r = 26 * (Math.random() - .5) * t;
      e[a] = o * (1 + .06 * t) + r, e[a + 1] = n + r, e[a + 2] = s * (1 - .1 * t) + r
    }
  }),
  fthresh: () => flt("Threshold", e => {
    const t = 2.55 * FA();
    for (let a = 0; a < e.length; a += 4) {
      const o = lum(e[a], e[a + 1], e[a + 2]) > t ? 255 : 0;
      e[a] = e[a + 1] = e[a + 2] = o
    }
  }),
  fduo: () => flt("Duotone", e => {
    const t = rgb(FG),
      a = rgb(BG);
    for (let o = 0; o < e.length; o += 4) {
      const n = lum(e[o], e[o + 1], e[o + 2]) / 255;
      for (let s = 0; s < 3; s++) e[o + s] = t[s] + (a[s] - t[s]) * n
    }
  }),
  fgmap: () => flt("Gradient map", e => {
    const t = gradLUT($("gpr").value);
    for (let a = 0; a < e.length; a += 4) {
      const o = 0 | lum(e[a], e[a + 1], e[a + 2]);
      e[a] = t[4 * o], e[a + 1] = t[4 * o + 1], e[a + 2] = t[4 * o + 2]
    }
  }),
  fdenoise: () => flt("Denoise", e => {
    const t = Uint8ClampedArray.from(e),
      a = new Array(9);
    for (let o = 1; o < ph - 1; o++)
      for (let n = 1; n < pw - 1; n++) {
        const s = 4 * (o * pw + n);
        for (let r = 0; r < 3; r++) {
          let i = 0;
          for (let e = -1; e < 2; e++)
            for (let s = -1; s < 2; s++) a[i++] = t[4 * ((o + e) * pw + n + s) + r];
          e[s + r] = med9(a)
        }
      }
  }),
  fswirl: () => flt("Swirl", e => {
    const t = Uint8ClampedArray.from(e),
      a = pw / 2,
      o = ph / 2,
      n = Math.min(pw, ph) / 2,
      s = FA() / 100 * Math.PI * 4;
    for (let r = 0; r < ph; r++)
      for (let i = 0; i < pw; i++) {
        const l = i - a,
          c = r - o,
          p = Math.hypot(l, c);
        if (p >= n) continue;
        const d = Math.atan2(c, l) + s * Math.pow(1 - p / n, 2),
          u = Math.round(a + Math.cos(d) * p),
          f = Math.round(o + Math.sin(d) * p),
          h = 4 * (r * pw + i),
          m = 4 * (K(f, 0, ph - 1) * pw + K(u, 0, pw - 1));
        e[h] = t[m], e[h + 1] = t[m + 1], e[h + 2] = t[m + 2], e[h + 3] = t[m + 3]
      }
  }),
  fwave: () => flt("Wave", e => {
    const t = Uint8ClampedArray.from(e),
      a = FA() / 3;
    for (let o = 0; o < ph; o++) {
      const n = Math.round(a * Math.sin(o / 18));
      for (let a = 0; a < pw; a++) {
        const s = 4 * (o * pw + a),
          r = 4 * (o * pw + K(a + n, 0, pw - 1));
        e[s] = t[r], e[s + 1] = t[r + 1], e[s + 2] = t[r + 2], e[s + 3] = t[r + 3]
      }
    }
  }),
  fsketch: () => flt("Pencil sketch", e => {
    const t = new Uint8ClampedArray(pw * ph);
    for (let a = 0; a < t.length; a++) t[a] = lum(e[4 * a], e[4 * a + 1], e[4 * a + 2]);
    const a = document.createElement("canvas");
    a.width = pw, a.height = ph;
    const o = a.getContext("2d"),
      n = o.createImageData(pw, ph);
    for (let e = 0; e < t.length; e++) n.data[4 * e] = n.data[4 * e + 1] = n.data[4 * e + 2] = 255 - t[e], n.data[4 * e + 3] = 255;
    o.putImageData(n, 0, 0);
    const s = tmpc().getContext("2d");
    s.filter = `blur(${Math.max(1,FA()/6)}px)`, s.drawImage(a, 0, 0);
    const r = s.getImageData(0, 0, pw, ph).data;
    for (let a = 0; a < t.length; a++) {
      const o = Math.min(255, 255 * t[a] / Math.max(1, 255 - r[4 * a]));
      e[4 * a] = e[4 * a + 1] = e[4 * a + 2] = o
    }
  }),
  fglow: () => {
    beg();
    const e = tmpc(),
      t = e.getContext("2d");
    t.filter = `blur(${FA()/4}px) brightness(1.35) contrast(1.1)`, t.drawImage(A().c, 0, 0);
    const a = A().x;
    a.globalCompositeOperation = "screen", a.globalAlpha = .75, a.drawImage(e, 0, 0), a.globalAlpha = 1, a.globalCompositeOperation = "source-over", fin("Glow")
  },
  fmotion: () => {
    const e = parseFloat(prompt("Motion blur angle in degrees", "0"));
    if (isNaN(e)) return;
    beg();
    const t = tmpc(),
      a = t.getContext("2d"),
      o = Math.max(4, Math.ceil(FA() / 3)),
      n = .8 * FA(),
      s = Math.cos(e * Math.PI / 180) * n,
      r = Math.sin(e * Math.PI / 180) * n;
    for (let e = 0; e <= o; e++) a.globalAlpha = 1 / (e + 1), a.drawImage(A().c, s * (e / o - .5), r * (e / o - .5));
    const i = A().x;
    i.clearRect(0, 0, pw, ph), i.drawImage(t, 0, 0), fin("Motion blur")
  },
  flut: () => {
    const e = LUTS[$("plutsel").value];
    if (!e) return void toast("Choose a LUT in the Adjustments panel first, or load a .cube file.");
    const t = FA() / 100;
    flt("LUT", a => {
      for (let o = 0; o < a.length; o += 4) {
        const n = lutPx(e, a[o], a[o + 1], a[o + 2]);
        a[o] += (n[0] - a[o]) * t, a[o + 1] += (n[1] - a[o + 1]) * t, a[o + 2] += (n[2] - a[o + 2]) * t
      }
    })
  }
}), document.querySelectorAll("#photo [data-a]").forEach(e => e.onclick = () => A() && ACT[e.dataset.a]());
const TL = [
    ["move", "V", "Move", "✥"],
    ["rect", "M", "Rectangular marquee", "▭"],
    ["ell", "", "Elliptical marquee", "◯"],
    ["lasso", "L", "Lasso", "➰"],
    ["wand", "W", "Magic wand", "✦"],
    ["eye", "I", "Eyedropper", "✒"],
    ["brush", "B", "Brush", "✎"],
    ["erase", "E", "Eraser", "⌫"],
    ["clone", "S", "Clone stamp (Alt-click sets source)", "⎘"],
    ["blur", "R", "Blur", "◔"],
    ["dodge", "O", "Dodge", "☀"],
    ["burn", "", "Burn", "☾"],
    ["bucket", "G", "Paint bucket", "▨"],
    ["grad", "", "Gradient", "◧"],
    ["text", "T", "Text", "T"]
  ],
  tb = $("tools");

function setTool(e) {
  tool = e, [...tb.children].forEach(t => t.setAttribute("aria-pressed", t.dataset.k === e)), $("tname").textContent = TL.find(t => t[0] === e)[2].replace(/ \(.*/, "")
}
TL.forEach(([e, t, a, o]) => {
  const n = document.createElement("button");
  n.className = "t", n.dataset.k = e, n.title = a + (t ? ` (${t})` : ""), n.setAttribute("aria-label", a), n.textContent = o, n.setAttribute("aria-pressed", e === tool), tb.append(n)
}), tb.onclick = e => {
  const t = e.target.closest("button");
  t && setTool(t.dataset.k)
};
const setFG = e => {
    FG = e, $("fg").value = e
  },
  setBG = e => {
    BG = e, $("bg").value = e
  };
$("fg").oninput = e => FG = e.target.value, $("bg").oninput = e => BG = e.target.value, $("swap").onclick = () => {
  const e = FG;
  setFG(BG), setBG(e)
}, $("psz").oninput = e => $("pszo").textContent = e.target.value, $("zr").oninput = e => {
  zoom = e.target.value / 100, view()
}, $("bm").onchange = e => {
  A().bm = e.target.value, sync()
}, $("lop").oninput = e => {
  A().op = +e.target.value, sync()
}, $("preset").onclick = () => pfx.reset(), $("padj").onclick = () => {
  if (!A()) return;
  beg();
  const e = tmpc(),
    t = e.getContext("2d");
  t.filter = pfx.get(), t.drawImage(A().c, 0, 0), A().x.clearRect(0, 0, pw, ph), A().x.drawImage(e, 0, 0), fin("Adjustments"), pfx.reset()
};
const pos = e => {
    const t = stack.getBoundingClientRect();
    return [(e.clientX - t.left) / zoom, (e.clientY - t.top) / zoom]
  },
  hexA = (e, t) => `rgba(${rgb(e).join(",")},${t})`,
  BRS = {
    round: .1,
    soft: .08,
    airbrush: .06,
    pencil: .2,
    marker: .12,
    calligraphy: .1,
    chalk: .2,
    spray: .3,
    watercolor: .08,
    bristle: .12
  };

function stamp(e, t, a, o, n, s, r, i) {
  e.fillStyle = s;
  const l = (o, n, r) => {
    if (e.globalAlpha = n, r >= .99) e.beginPath(), e.arc(t, a, o, 0, 7), e.fill();
    else {
      const n = e.createRadialGradient(t, a, o * r, t, a, o);
      n.addColorStop(0, hexA(s, 1)), n.addColorStop(1, hexA(s, 0)), e.fillStyle = n, e.beginPath(), e.arc(t, a, o, 0, 7), e.fill(), e.fillStyle = s
    }
  };
  if ("round" === n) l(o, r, i);
  else if ("soft" === n) l(o, r, 0);
  else if ("airbrush" === n) l(o, .12 * r, 0);
  else if ("watercolor" === n) l(o * (.9 + .2 * Math.random()), .07 * r, .1);
  else if ("pencil" === n) e.globalAlpha = 1, e.beginPath(), e.arc(t, a, Math.max(.6, .3 * o), 0, 7), e.fill();
  else if ("marker" === n) e.save(), e.translate(t, a), e.rotate(Math.PI / 4), e.globalAlpha = .75 * r, e.fillRect(.8 * -o, .8 * -o, 1.6 * o, 1.6 * o), e.restore();
  else if ("calligraphy" === n) e.globalAlpha = r, e.beginPath(), e.ellipse(t, a, o, .25 * o, -Math.PI / 4, 0, 7), e.fill();
  else if ("chalk" === n || "spray" === n) {
    const s = Math.ceil(o * ("chalk" === n ? 1.6 : .9));
    for (let i = 0; i < s; i++) {
      const s = 6.283 * Math.random(),
        i = Math.sqrt(Math.random()) * o;
      e.globalAlpha = r * ("chalk" === n ? .3 + .7 * Math.random() : 1);
      const l = "chalk" === n ? 1 + 2 * Math.random() : .8 + 1.6 * Math.random();
      e.fillRect(t + Math.cos(s) * i, a + Math.sin(s) * i, l, l)
    }
  } else if ("bristle" === n) {
    e.globalAlpha = .6 * r;
    for (let n = 0; n < 12; n++) {
      const s = 2.4 * n,
        r = o * (n / 12);
      e.beginPath(), e.arc(t + Math.cos(s) * r, a + Math.sin(s) * r, Math.max(.5, .1 * o), 0, 7), e.fill()
    }
  }
}

function stroke(e, t) {
  const a = A().x,
    o = $("bty").value,
    n = Math.max(.5, $("psz").value / 2),
    s = Math.max(1, 2 * n * BRS[o]),
    r = t[0] - e[0],
    i = t[1] - e[1],
    l = Math.max(1, Math.ceil(Math.hypot(r, i) / s)),
    c = $("flow").value / 100,
    p = $("bhard").value / 100;
  a.globalCompositeOperation = "erase" === tool ? "destination-out" : "source-over";
  const d = "erase" === tool ? "#000000" : FG;
  for (let t = 0; t <= l; t++) stamp(a, e[0] + r * t / l, e[1] + i * t / l, n, o, d, c, p);
  a.globalAlpha = 1, a.globalCompositeOperation = "source-over"
}

function dab(e) {
  const t = Math.max(1, Math.round($("psz").value / 2)),
    a = A().x,
    o = Math.max(0, Math.round(e[0]) - t),
    n = Math.max(0, Math.round(e[1]) - t),
    s = Math.min(pw, Math.round(e[0]) + t) - o,
    r = Math.min(ph, Math.round(e[1]) + t) - n;
  if (s < 1 || r < 1) return;
  const i = a.getImageData(o, n, s, r),
    l = i.data,
    c = Uint8ClampedArray.from(l),
    p = $("flow").value / 100;
  let d;
  "clone" === tool && (d = a.getImageData(o + pd.ox, n + pd.oy, s, r).data);
  for (let a = 0; a < r; a++)
    for (let i = 0; i < s; i++) {
      const u = Math.hypot(i + o - e[0], a + n - e[1]) / t;
      if (u > 1) continue;
      const f = p * (1 - u),
        h = 4 * (a * s + i);
      if ("clone" === tool)
        for (let e = 0; e < 4; e++) l[h + e] = c[h + e] * (1 - f) + d[h + e] * f;
      else if ("blur" === tool)
        for (let e = 0; e < 4; e++) {
          let t = 0,
            o = 0;
          for (let n = -1; n < 2; n++)
            for (let l = -1; l < 2; l++) {
              const p = i + 2 * l,
                d = a + 2 * n;
              p >= 0 && d >= 0 && p < s && d < r && (t += c[4 * (d * s + p) + e], o++)
            }
          l[h + e] = c[h + e] * (1 - f) + t / o * f
        } else {
          const e = 1 + ("dodge" === tool ? .25 : -.25) * f;
          l[h] = c[h] * e, l[h + 1] = c[h + 1] * e, l[h + 2] = c[h + 2] * e
        }
    }
  a.putImageData(i, o, n)
}
const DAB = ["clone", "blur", "dodge", "burn"],
  NAME = {
    brush: "Brush",
    erase: "Eraser",
    clone: "Clone stamp",
    blur: "Blur",
    dodge: "Dodge",
    burn: "Burn",
    move: "Move"
  };

function prev() {
  showSel();
  const e = pd.s,
    t = pd.last;
  ovx.save(), ovx.setLineDash([6 / zoom, 4 / zoom]), ovx.lineWidth = 1.5 / zoom, ovx.strokeStyle = "#fff", ovx.beginPath(), "rect" === tool ? ovx.rect(e[0], e[1], t[0] - e[0], t[1] - e[1]) : "ell" === tool ? ovx.ellipse((e[0] + t[0]) / 2, (e[1] + t[1]) / 2, Math.abs(t[0] - e[0]) / 2, Math.abs(t[1] - e[1]) / 2, 0, 0, 7) : "lasso" === tool ? pd.pts.forEach((e, t) => t ? ovx.lineTo(...e) : ovx.moveTo(...e)) : (ovx.moveTo(...e), ovx.lineTo(...t)), ovx.stroke(), ovx.restore()
}
stack.onpointerdown = e => {
  if ("tedit" === e.target.id) return;
  if (!A()) return;
  const t = pos(e),
    a = K(Math.floor(t[0]), 0, pw - 1),
    o = K(Math.floor(t[1]), 0, ph - 1);
  if (stack.setPointerCapture(e.pointerId), pd = {
      s: t,
      last: t,
      pts: [t],
      mode: e.shiftKey ? "add" : e.altKey ? "sub" : "set"
    }, "eye" === tool) {
    const e = A().x.getImageData(a, o, 1, 1).data;
    setFG("#" + [e[0], e[1], e[2]].map(e => e.toString(16).padStart(2, "0")).join("")), pd = null
  } else if ("wand" === tool) {
    const e = flood(a, o, +$("tol").value);
    setSel(t => {
      const a = t.createImageData(pw, ph);
      for (let t = 0; t < e.length; t++) e[t] && a.data.fill(255, 4 * t, 4 * t + 4);
      t.putImageData(a, 0, 0)
    }, pd.mode), pd = null
  } else if ("bucket" === tool) {
    beg();
    const e = flood(a, o, +$("tol").value),
      t = A().x.getImageData(0, 0, pw, ph),
      n = t.data,
      [s, r, i] = rgb(FG);
    for (let t = 0; t < e.length; t++) e[t] && (n[4 * t] = s, n[4 * t + 1] = r, n[4 * t + 2] = i, n[4 * t + 3] = 255);
    A().x.putImageData(t, 0, 0), fin("Paint bucket"), pd = null
  } else if ("text" === tool) {
    const e = L.slice().reverse().find(e => e.txt && e.vis && inBox(e.txt.bx, t));
    if (e) ai = L.indexOf(e), sync(), layersUI(), pd.tm = {
      l: e,
      ox: e.txt.x,
      oy: e.txt.y,
      snap: snapFull()
    };
    else {
      endEdit();
      const e = snapFull(),
        a = TD(),
        o = mk("Text");
      a.x = t[0], a.y = t[1] + .8 * a.fs, o.txt = a, L.splice(ai + 1, 0, o), ai++, sync(), layersUI(), renderText(o), startEdit(o, e), pd = null
    }
  } else if ("clone" === tool && e.altKey) cloneSrc = t, $("pst").textContent = "Clone source set. Now paint.", pd = null;
  else if ("brush" === tool || "erase" === tool) beg(), stroke(t, t);
  else if (DAB.includes(tool)) {
    if ("clone" === tool && !cloneSrc) return $("pst").textContent = "Alt-click to set the clone source first.", void(pd = null);
    beg(), cloneSrc && (pd.ox = Math.round(cloneSrc[0] - t[0]), pd.oy = Math.round(cloneSrc[1] - t[1])), dab(t)
  } else if ("move" === tool && A().txt) pd.tm = {
    l: A(),
    ox: A().txt.x,
    oy: A().txt.y,
    snap: snapFull()
  };
  else if ("move" === tool) {
    beg();
    const e = tmpc(),
      t = e.getContext("2d");
    if (t.drawImage(A().c, 0, 0), pd.cp = e, hasSel) {
      const e = tmpc(),
        a = e.getContext("2d");
      a.drawImage(A().c, 0, 0), a.globalCompositeOperation = "destination-in", a.drawImage(SM, 0, 0), pd.sel = e, pd.sm = tmpc(), pd.sm.getContext("2d").drawImage(SM, 0, 0), t.globalCompositeOperation = "destination-out", t.drawImage(SM, 0, 0)
    }
  } else "grad" === tool && beg()
}, stack.onpointermove = e => {
  let t = pos(e);
  if ($("pcur").textContent = `${Math.round(t[0])}, ${Math.round(t[1])}`, !pd) return;
  const a = pd.last;
  if (t = ratioLock(t), pd.last = t, pd.pts.push(t), "brush" === tool || "erase" === tool) stroke(a, t);
  else if (DAB.includes(tool)) dab(t);
  else if (pd.tm) {
    const e = pd.tm.l;
    e.txt.x = pd.tm.ox + t[0] - pd.s[0], e.txt.y = pd.tm.oy + t[1] - pd.s[1], renderText(e)
  } else if ("move" === tool) {
    const e = A().x,
      a = Math.round(t[0] - pd.s[0]),
      o = Math.round(t[1] - pd.s[1]);
    e.clearRect(0, 0, pw, ph), pd.sel ? (e.drawImage(pd.cp, 0, 0), e.drawImage(pd.sel, a, o), smx.clearRect(0, 0, pw, ph), smx.drawImage(pd.sm, a, o), showSel()) : e.drawImage(pd.cp, a, o)
  } else prev()
}, stack.onpointerup = () => {
  if (!pd) return;
  const e = pd.s,
    t = pd.last;
  if (pd.tm) return textUp(), void(pd = null);
  if ("move" === tool && pd.sel) {
    const e = hasSel;
    hasSel = !1, fin("Move selection"), hasSel = e
  } else NAME[tool] ? fin(NAME[tool]) : "grad" === tool ? (gradFill(e, t, $("gty").value, $("gpr").value, $("flow").value / 100), fin("Gradient"), showSel()) : "rect" !== tool && "ell" !== tool && "lasso" !== tool || ("lasso" !== tool && Math.hypot(t[0] - e[0], t[1] - e[1]) < 2 ? ACT.none() : setSel(a => {
    a.beginPath(), "rect" === tool ? a.rect(e[0], e[1], t[0] - e[0], t[1] - e[1]) : "ell" === tool ? a.ellipse((e[0] + t[0]) / 2, (e[1] + t[1]) / 2, Math.abs(t[0] - e[0]) / 2, Math.abs(t[1] - e[1]) / 2, 0, 0, 7) : (pd.pts.forEach((e, t) => t ? a.lineTo(...e) : a.moveTo(...e)), a.closePath()), a.fill()
  }, pd.mode));
  pd = null
};
const docs = [];
let di = -1,
  docN = 0;

function saveDoc() {
  if (di < 0) return;
  const e = docs[di];
  Object.assign(e, {
    L: L,
    ai: ai,
    pw: pw,
    ph: ph,
    U: U,
    R: R,
    zoom: zoom,
    hasSel: hasSel,
    sm: hasSel ? (() => {
      const e = tmpc();
      return e.getContext("2d").drawImage(SM, 0, 0), e
    })() : null
  })
}

function tabsUI() {
  const e = $("dtabs");
  e.innerHTML = "", docs.forEach((t, a) => {
    const o = document.createElement("div");
    o.className = "dtab" + (a === di ? " a" : ""), o.innerHTML = '<span></span><b title="Close this file">×</b>', o.firstChild.textContent = t.name, o.onclick = () => loadDoc(a), o.lastChild.onclick = e => {
      e.stopPropagation(), closeDoc(a)
    }, e.append(o)
  });
  const t = document.createElement("button");
  t.textContent = "＋", t.title = "New file", t.onclick = () => openNew(), e.append(t)
}

function loadDoc(e) {
  if (e === di) return;
  endEdit(), saveDoc(), L.forEach(e => e.c.remove()), di = e;
  const t = docs[e];
  L = t.L, ai = t.ai, pw = t.pw, ph = t.ph, U = t.U, R = t.R, zoom = t.zoom, SM.width = ov.width = pw, SM.height = ov.height = ph, hasSel = !1, t.sm && (smx.drawImage(t.sm, 0, 0), hasSel = !0), L.forEach(e => stack.insertBefore(e.c, ov)), view(), sync(), layersUI(), histUI(), showSel(), tabsUI()
}

function closeDoc(e) {
  if (endEdit(), 1 === docs.length) return newDoc(900, 560, "Background", "#fff", null, "Untitled-" + ++docN), docs.splice(0, 1), di = 0, void tabsUI();
  e === di ? (L.forEach(e => e.c.remove()), docs.splice(e, 1), di = -1, loadDoc(Math.min(e, docs.length - 1))) : (docs.splice(e, 1), e < di && di--, tabsUI())
}

function newDoc(e, t, a, o, n, s) {
  endEdit(), saveDoc(), L.forEach(e => e.c.remove()), U = [], R = [], resize(e, t), L = [mk(a, o)], ai = 0, n && n(L[0].x), docs.push({
    name: s || a
  }), di = docs.length - 1, fit(), saveDoc(), sync(), layersUI(), histUI(), tabsUI()
}
const NP = [
  ["HD 1920 × 1080", 1920, 1080],
  ["Full HD portrait 1080 × 1920", 1080, 1920],
  ["Square 1080 × 1080", 1080, 1080],
  ["Instagram portrait 1080 × 1350", 1080, 1350],
  ["4K 3840 × 2160", 3840, 2160],
  ["A4 at 300 dpi 2480 × 3508", 2480, 3508],
  ["US Letter at 300 dpi 2550 × 3300", 2550, 3300],
  ["Web banner 1200 × 628", 1200, 628],
  ["Custom", 0, 0]
];

function openNew() {
  $("nn").value = "Untitled-" + (docN + 1), $("np").value = 0, $("nw").value = 1920, $("nh").value = 1080, $("ndlg").showModal()
}

function pexp(e, t) {
  const a = tmpc(),
    o = a.getContext("2d");
  "image/jpeg" === e && (o.fillStyle = "#fff", o.fillRect(0, 0, pw, ph)), L.forEach(e => {
    e.vis && (o.globalAlpha = e.op / 100, o.globalCompositeOperation = "normal" === e.bm ? "source-over" : e.bm, o.filter = lf(e, 1), o.drawImage(e.c, 0, 0))
  }), a.toBlob(e => dl(e, t), e, .92)
}
$("np").innerHTML = NP.map((e, t) => `<option value="${t}">${e[0]}</option>`).join(""), $("np").onchange = () => {
  const e = NP[+$("np").value];
  e[1] && ($("nw").value = e[1], $("nh").value = e[2])
}, $("nw").oninput = $("nh").oninput = () => $("np").value = NP.length - 1, $("pnewfile").onclick = openNew, $("ncancel").onclick = () => $("ndlg").close(), $("nok").onclick = () => {
  const e = K(0 | +$("nw").value, 16, 8e3),
    t = K(0 | +$("nh").value, 16, 8e3),
    a = $("nb").value,
    o = "transparent" === a ? 0 : "custom" === a ? $("nc").value : a;
  docN++, newDoc(e, t, "Background", o, null, $("nn").value || "Untitled-" + docN), $("ndlg").close()
}, $("pf").onchange = e => {
  const t = e.target.files[0];
  if (!t) return;
  const a = new Image;
  a.onload = () => newDoc(a.width, a.height, t.name.replace(/\.\w+$/, ""), 0, e => e.drawImage(a, 0, 0)), a.src = URL.createObjectURL(t), e.target.value = ""
}, $("pf2").onchange = e => {
  const t = e.target.files[0];
  if (!t) return;
  const a = new Image;
  a.onload = () => structural("Place image", () => {
    const e = mk(t.name.replace(/\.\w+$/, ""));
    e.x.drawImage(a, 0, 0), L.splice(ai + 1, 0, e), ai++
  }), a.src = URL.createObjectURL(t), e.target.value = ""
}, $("pexp").onclick = () => pexp("image/png", "edit.png"), $("pjpg").onclick = () => pexp("image/jpeg", "edit.jpg"), addEventListener("keydown", e => {
  if (!$("photo").classList.contains("on") || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const t = e.ctrlKey || e.metaKey;
  if (t && "z" === e.key.toLowerCase()) e.preventDefault(), e.shiftKey ? redo() : undo();
  else if (t && "y" === e.key.toLowerCase()) e.preventDefault(), redo();
  else if (t && "c" === e.key.toLowerCase()) e.preventDefault(), ACT.copy();
  else if (t && "x" === e.key.toLowerCase()) e.preventDefault(), ACT.cut();
  else if (t && "a" === e.key.toLowerCase()) e.preventDefault(), ACT.all();
  else if (t && "d" === e.key.toLowerCase()) e.preventDefault(), ACT.none();
  else if (t || "Delete" !== e.key && "Backspace" !== e.key) {
    if (!t) {
      const t = TL.find(t => t[1] && t[1].toLowerCase() === e.key.toLowerCase());
      t && setTool(t[0]), "x" === e.key && $("swap").click()
    }
  } else e.preventDefault(), ACT.clear()
}), newDoc(900, 560, "Background", "#fff", null, "Untitled-1"), docN = 1;
let W = 854,
  H = 480;
const pm = $("pm"),
  px2 = pm.getContext("2d"),
  lanes = $("lanes"),
  hold = document.createElement("div");
hold.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;overflow:hidden;opacity:.01;pointer-events:none;z-index:-1", document.body.append(hold);
const oc = document.createElement("canvas");
oc.width = W, oc.height = H;
const ox = oc.getContext("2d", {
    willReadFrequently: !0
  }),
  sc = document.createElement("canvas"),
  sx2 = sc.getContext("2d"),
  xd = AC.createMediaStreamDestination();
let items = [],
  clips = [],
  cs = null,
  T = 0,
  playing = !1,
  T0 = 0,
  w0 = 0,
  pps = 40,
  rows = [],
  onend = null,
  drag = null,
  rec = null;
const clamp = (e, t = 0, a = 1) => Math.min(a, Math.max(t, e)),
  DEF = {
    scale: 100,
    px: 0,
    py: 0,
    op: 100,
    bri: 100,
    con: 100,
    sat: 100,
    hue: 0,
    warm: 0,
    tint: 0,
    lift: 0,
    gamma: 100,
    gain: 100,
    key: 0,
    kc: "#00ff00",
    ks: 40,
    kf: 10,
    blur: 0,
    vig: 0,
    pix: 0,
    grain: 0,
    sep: 0,
    gray: 0,
    inv: 0,
    mir: 0,
    vol: 100,
    tin: "none",
    tind: 1,
    tout: "none",
    toutd: 1,
    lut: "",
    luta: 100,
    deint: "auto",
    dfield: "auto",
    dthr: 10,
    lnk: 0,
    lnko: 0,
    cv: null,
    cvl: null,
    rot: 0,
    cl: 0,
    cr: 0,
    ct: 0,
    cb: 0,
    fill: 0,
    speed: 100
  },
  TR = [
    ["none", "None"],
    ["fade", "Cross dissolve"],
    ["black", "Dip to black"],
    ["wl", "Wipe left to right"],
    ["wr", "Wipe right to left"],
    ["wd", "Wipe top to bottom"],
    ["wu", "Wipe bottom to top"],
    ["iris", "Iris"],
    ["white", "Dip to white"],
    ["sl", "Slide in from right"],
    ["sr", "Slide in from left"],
    ["su", "Slide in from bottom"],
    ["zoom", "Zoom in"],
    ["blurf", "Blur dissolve"]
  ],
  SPEC = [
    ["Transform", ["scale", "Scale", 10, 300],
      ["px", "Position X", -100, 100],
      ["py", "Position Y", -100, 100],
      ["op", "Opacity", 0, 100],
      ["fill", "Fill frame (crop to fit)", 0, 1]
    ],
    ["Crop and speed", ["rot", "Rotation", -180, 180],
      ["cl", "Crop left %", 0, 50],
      ["cr", "Crop right %", 0, 50],
      ["ct", "Crop top %", 0, 50],
      ["cb", "Crop bottom %", 0, 50],
      ["speed", "Speed %", 25, 400]
    ],
    ["Color correction", ["bri", "Brightness", 0, 200],
      ["con", "Contrast", 0, 200],
      ["sat", "Saturation", 0, 300],
      ["hue", "Hue", 0, 360]
    ],
    ["Color grade", ["warm", "Warmth", -100, 100],
      ["tint", "Tint", -100, 100],
      ["lift", "Shadows", -50, 50],
      ["gamma", "Midtones", 50, 200],
      ["gain", "Highlights", 50, 200]
    ],
    ["Green screen", ["key", "Key out color", 0, 1],
      ["kc", "Key color", "color"],
      ["ks", "Similarity", 0, 100],
      ["kf", "Smoothness", 0, 100]
    ],
    ["Visual effects", ["blur", "Blur", 0, 20],
      ["vig", "Vignette", 0, 100],
      ["pix", "Pixelate", 0, 40],
      ["grain", "Film grain", 0, 100],
      ["sep", "Sepia", 0, 100],
      ["gray", "Black & white", 0, 100],
      ["inv", "Invert", 0, 100],
      ["mir", "Mirror", 0, 1]
    ],
    ["Audio", ["vol", "Volume", 0, 200]],
    ["Transitions", ["tin", "Transition in", "tr"],
      ["tind", "In duration (s)", .2, 3],
      ["tout", "Transition out", "tr"],
      ["toutd", "Out duration (s)", .2, 3]
    ]
  ],
  PS = {
    name: "Sequence 1",
    ar: "16:9",
    w: 854,
    h: 480,
    fps: 30,
    bg: "#000000",
    still: 5,
    trans: 1,
    snap: 1,
    cs: "rec709"
  };
let seqs = [{
    ps: {
      ...PS
    },
    clips: clips
  }],
  si = 0;
const LVG = {
    "Crop and speed": 2,
    Transform: 1,
    "Color correction": 1,
    "Color grade": 2,
    "Green screen": 3,
    "Visual effects": 2,
    Audio: 1,
    Transitions: 1
  },
  PRE = {
    Cinematic: {
      con: 115,
      sat: 90,
      warm: -10,
      tint: -5,
      lift: 8,
      gamma: 95,
      vig: 30
    },
    Warm: {
      warm: 40,
      sat: 110,
      gain: 105
    },
    Cool: {
      warm: -40,
      sat: 95
    },
    "Black & white": {
      gray: 100,
      con: 130,
      vig: 50
    },
    Reset: {}
  },
  endT = () => clips.reduce((e, t) => Math.max(e, t.start + t.dur), 0);

function bin() {
  const e = $("bin");
  e.innerHTML = "", items.forEach(t => {
    const a = document.createElement("button");
    a.className = "lr", a.textContent = ("image" === t.type ? "▣ " : "audio" === t.type ? "♪ " : "▶ ") + t.name, a.onclick = () => addClip(t), e.append(a)
  })
}
const cpt = e => !!document.createElement("video").canPlayType(e),
  mrs = e => window.MediaRecorder && MediaRecorder.isTypeSupported(e),
  probe = e => new Promise(t => {
    const a = document.createElement("video");
    a.muted = !0;
    const o = setTimeout(() => t(!1), 6e3);
    a.onloadeddata = () => {
      clearTimeout(o), t(a.videoWidth > 0)
    }, a.onerror = () => {
      clearTimeout(o), t(!1)
    }, a.preload = "auto", a.src = e
  });
async function sniff(e) {
  const t = async e => new TextDecoder("latin1").decode(await e.arrayBuffer()), a = await t(e.slice(0, 3e6)) + await t(e.slice(Math.max(0, e.size - 3e6)));
  return /hvc1|hev1/.test(a) ? "H.265" : /avc1/.test(a) ? "H.264" : /apch|apcn|apcs|apco|ap4h|ap4x/.test(a) ? "ProRes" : ""
}
let ff = null,
  ffMsg = "";
const b64d = e => Uint8Array.from(atob(e), e => e.charCodeAt(0)),
  bu = (e, t) => URL.createObjectURL(new Blob([b64d(e)], {
    type: t
  }));
async function loadFF() {
  if (ff) return ff;
  $("vst").textContent = "Starting the codec engine…";
  const e = window.FFA,
    t = "https://cdn.jsdelivr.net/npm/",
    a = async (e, t) => URL.createObjectURL(new Blob([await (await fetch(e)).arrayBuffer()], {
      type: t
    })), o = document.createElement("script");
  o.src = e ? bu(e.main, "text/javascript") : t + "@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js", await new Promise((e, t) => {
    o.onload = e, o.onerror = () => t(new Error("could not load the codec engine. Check your internet connection.")), document.head.append(o)
  });
  const n = new FFmpegWASM.FFmpeg;
  n.on("progress", ({
    progress: e
  }) => {
    if (!ffTot && e > 0) {
      const t = Math.round(100 * clamp(e));
      $("vst").textContent = `${ffMsg} ${t}%`, $("xprog").open && progSet(t, ffMsg)
    }
  }), n.on("log", ({
    message: e
  }) => {
    window._ffcap && window._ffcap(e);
    const t = /time=(\d+):(\d+):(\d+\.?\d*)/.exec(e);
    if (t && ffTot) {
      const e = 3600 * +t[1] + 60 * +t[2] + +t[3],
        a = Math.min(99, Math.round(e / ffTot * 100));
      $("vst").textContent = `${ffMsg} ${a}%`, $("xprog").open && progSet(a, ffMsg + " (this can take a while in the browser)")
    }
  });
  const s = e ? {
    coreURL: bu(e.core, "text/javascript"),
    wasmURL: URL.createObjectURL(new Blob([await new Response(new Blob([b64d(e.wasm)]).stream().pipeThrough(new DecompressionStream("gzip"))).blob()], {
      type: "application/wasm"
    })),
    classWorkerURL: bu(e.worker, "text/javascript")
  } : {
    coreURL: await a(t + "@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js", "text/javascript"),
    wasmURL: await a(t + "@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm", "application/wasm"),
    classWorkerURL: await a(t + "@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js", "text/javascript")
  };
  return await n.load(s), ff = n
}
async function ffrun(e, t, a, o, n, s) {
  const r = await loadFF();
  ffMsg = s, await r.writeFile(t, new Uint8Array(await e.arrayBuffer())), await r.exec(["-i", t, ...a, o]);
  const i = await r.readFile(o);
  return await r.deleteFile(t), await r.deleteFile(o), new Blob([i.buffer], {
    type: n
  })
}
const TSX = /\.(mts|m2ts|m2t|ts|mpg|mpeg|vob|mod|tod|avi|wmv|flv|3gp|mxf)$/i,
  ISTS = /\.(mts|m2ts|m2t|ts)$/i;
let ffInfo = {};

function ffParse(e) {
  let t;
  if (!ffInfo.dur && (t = /Duration:\s*(\d+):(\d+):(\d+\.?\d*)/.exec(e)) && (ffInfo.dur = 3600 * +t[1] + 60 * +t[2] + +t[3], ffTot = ffInfo.dur), !ffInfo.v && /Stream #\d+:\d+.*Video:/.test(e)) {
    const t = /Video:\s*(\w+)[^,]*,\s*(\w+)(?:\(([^)]*)\))?/.exec(e),
      a = /(\d{2,5})x(\d{2,5})/.exec(e.replace(/0x[0-9a-f]+/gi, "")),
      o = t && t[3] || "";
    ffInfo.v = t ? t[1] : "", ffInfo.pf = t ? t[2] : "", ffInfo.field = /top first/.test(o) ? "tff" : /bottom first/.test(o) ? "bff" : !/progressive/.test(o) && null, a && (ffInfo.w = +a[1], ffInfo.h = +a[2])
  }
}
async function convertMedia(e) {
  progOpen("Preparing " + e.name + " for editing…", "ff"), ffTot = 0, ffInfo = {}, ffMsg = "Preparing " + e.name;
  const t = new Promise((e, t) => {
    window._ffcancel = () => t(new Error("cancelled"))
  });
  window._ffcap = ffParse;
  try {
    const a = await Promise.race([loadFF(), t]),
      o = e.size > 157286400,
      n = (e.name.match(/\.\w+$/) || [".bin"])[0];
    let s = !1,
      r = "in" + n;
    if (o) try {
      try {
        await a.createDir("/m")
      } catch (e) {}
      await a.mount("WORKERFS", {
        files: [e]
      }, "/m"), s = !0, r = "/m/" + e.name
    } catch (e) {
      s = !1
    }
    s || await a.writeFile(r, new Uint8Array(await e.arrayBuffer()));
    const i = e => Promise.race([a.exec(["-i", r, ...e, "out.mp4"]), t]);
    await Promise.race([a.exec(["-hide_banner", "-i", r]), t]).catch(e => {
      if (String(e.message).includes("cancelled")) throw e
    });
    const l = Math.min(1920, Math.max(1280, Math.max(PS.w, PS.h))),
      c = !!window._yadif,
      p = !c && "h264" === ffInfo.v && "yuv420p" === ffInfo.pf;
    let d = -1,
      u = !1;
    if (p && (ffMsg = "Preparing " + e.name + " (fast)", d = await i(["-map", "0:v:0", "-map", "0:a:0?", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-fflags", "+genpts", "-avoid_negative_ts", "make_zero", "-movflags", "+faststart"])), 0 !== d && (u = c, ffMsg = "Converting " + e.name + " (this can take a while)", d = await i(["-map", "0:v:0", "-map", "0:a:0?", "-vf", (c ? "yadif=0:-1:0," : "") + `scale='min(${l},iw)':-2`, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-fflags", "+genpts", "-movflags", "+faststart"])), 0 !== d) throw new Error("the built-in engine could not read this file");
    const f = await a.readFile("out.mp4");
    if (await a.deleteFile("out.mp4"), s) try {
      await a.unmount("/m")
    } catch (e) {} else await a.deleteFile(r);
    return {
      blob: new Blob([f.buffer], {
        type: "video/mp4"
      }),
      interlaced: !u && ffInfo.field,
      info: {
        ...ffInfo
      },
      copied: p && 0 === d && !u
    }
  } finally {
    window._ffcap = null, window._ffcancel = null, progClose(), ffTot = 0
  }
}
$("vf").onchange = async e => {
  for (const t of [...e.target.files]) {
    if (t.type.startsWith("image")) {
      items.push({
        name: t.name,
        url: URL.createObjectURL(t),
        type: "image"
      }), bin();
      continue
    }
    if (t.type.startsWith("audio")) {
      items.push({
        name: t.name,
        url: URL.createObjectURL(t),
        type: "audio"
      }), bin();
      continue
    }
    const e = ISTS.test(t.name) ? "AVCHD / MPEG-TS" : await sniff(t),
      a = {
        name: t.name + (e ? ` [${e}]` : ""),
        type: "video"
      };
    let o = URL.createObjectURL(t),
      n = TSX.test(t.name);
    if (n || ($("vst").textContent = "Checking " + t.name + "…", n = !await probe(o)), n) try {
      const e = await convertMedia(t);
      o = URL.createObjectURL(e.blob), a.name += e.copied ? " (ready)" : " (converted)", a.interlaced = e.interlaced, toast(e.interlaced ? `${t.name}: interlaced video found (${"tff"===e.interlaced?"top":"bottom"} field first). Deinterlace is set to Auto.` : null === e.info.field && ISTS.test(t.name) ? `${t.name} is ready. If moving objects show comb-like lines, select the clip and choose a Deinterlace method in Effect controls.` : `${t.name} is ready.`)
    } catch (e) {
      String(e.message).includes("cancelled") ? toast("Import cancelled.") : ($("vst").textContent = `Could not import ${t.name}: ${e.message}`, toast(`Could not import ${t.name}: ${e.message}`));
      continue
    }
    a.url = o, items.push(a), bin(), $("vst").textContent = "Imported " + a.name
  }
  e.target.value = ""
}, $("vyad").onclick = () => {
  window._yadif = !window._yadif, $("vyad").textContent = "Import: deinterlace with yadif (slower): " + (window._yadif ? "on" : "off")
}, $("vcap").onclick = () => {
  const e = e => e ? "native" : "via built-in engine";
  $("vst").textContent = `Import: H.264 ${e(cpt('video/mp4;codecs="avc1.640028"'))}, H.265 ${e(cpt('video/mp4;codecs="hvc1.1.6.L93.B0"'))}, ProRes ${e(cpt('video/quicktime;codecs="ap4h"'))}. Export: H.264 ${e(mrs("video/mp4;codecs=avc1.640028"))}, H.265 ${e(mrs("video/mp4;codecs=hvc1.1.6.L93.B0"))}, ProRes via built-in engine.`
};
const dcv = document.createElement("canvas"),
  dcx = dcv.getContext("2d", {
    willReadFrequently: !0
  });

function deint(e, t, a, o, n) {
  const s = e.videoWidth,
    r = e.videoHeight;
  dcv.width === s && dcv.height === r || (dcv.width = s, dcv.height = r), dcx.drawImage(e, 0, 0);
  const i = dcx.getImageData(0, 0, s, r),
    l = i.data,
    c = 4 * s,
    p = Uint8ClampedArray.from(l);
  if ("blend" === t)
    for (let e = 1; e < r - 1; e++) {
      const t = e * c;
      for (let e = 0; e < c; e++) l[t + e] = p[t - c + e] + 2 * p[t + e] + p[t + c + e] >> 2
    } else if ("adaptive" === t) {
      const e = o * o,
        t = "bff" === a ? 1 : 0;
      for (let a = 1; a < r - 1; a++) {
        if ((1 & a) === t) continue;
        const o = a * c;
        for (let t = 0; t < s; t++) {
          const a = o + 4 * t,
            n = 77 * p[a - c] + 150 * p[a - c + 1] + 29 * p[a - c + 2] >> 8,
            s = 77 * p[a] + 150 * p[a + 1] + 29 * p[a + 2] >> 8;
          (s - n) * (s - (77 * p[a + c] + 150 * p[a + c + 1] + 29 * p[a + c + 2] >> 8)) > e && (l[a] = p[a - c] + p[a + c] >> 1, l[a + 1] = p[a - c + 1] + p[a + c + 1] >> 1, l[a + 2] = p[a - c + 2] + p[a + c + 2] >> 1)
        }
      }
    } else {
      const e = "bob" === t ? n + ("bff" === a ? 1 : 0) & 1 : "bff" === a ? 1 : 0;
      for (let t = 0; t < r; t++) {
        if ((1 & t) === e) continue;
        const a = (t > 0 ? t - 1 : t + 1) * c,
          o = (t < r - 1 ? t + 1 : t - 1) * c,
          n = t * c;
        for (let e = 0; e < c; e++) l[n + e] = p[a + e] + p[o + e] >> 1
      }
    } return dcx.putImageData(i, 0, 0), dcv
}

function deintUI(e) {
  const t = cs.fx,
    a = document.createElement("b");
  a.textContent = "Deinterlace (1080i and camcorder video)", a.dataset.min = 2;
  const o = (e, a, o) => {
      const n = document.createElement("label");
      n.className = "s", n.dataset.min = 2, n.style.gridTemplateColumns = "96px 1fr", n.innerHTML = `${e}<select>${a.map(([e,t])=>`<option value="${e}">${t}</option>`).join("")}</select>`;
      const s = n.querySelector("select");
      return s.value = t[o], s.onchange = () => {
        vpush(), t[o] = s.value, vui()
      }, n
    },
    n = document.createElement("label");
  n.className = "s", n.dataset.min = 2, n.innerHTML = `Sensitivity<input type="range" min="1" max="60" value="${t.dthr}"><output>${t.dthr}</output>`;
  const s = n.querySelector("input");
  s.oninput = () => {
    t.dthr = +s.value, n.querySelector("output").textContent = s.value, vui()
  };
  const r = document.createElement("div");
  r.dataset.min = 2, r.style.cssText = "color:var(--mut);font-size:11px", r.textContent = "Use this if moving objects show fine comb-like lines. Auto uses what was found when the video was imported.", e.append(a, o("Method", [
    ["auto", "Auto"],
    ["off", "Off"],
    ["adaptive", "Adaptive (best)"],
    ["blend", "Blend"],
    ["discard", "One field only"],
    ["bob", "Alternate fields"]
  ], "deint"), o("Field order", [
    ["auto", "Auto"],
    ["tff", "Top field first"],
    ["bff", "Bottom field first"]
  ], "dfield"), n, r)
}

function getDur(e, t) {
  return new Promise(a => {
    const o = () => isFinite(e.duration) && e.duration > 0;
    if (o()) return void a(e.duration);
    let n = !1;
    const s = t => {
        if (!n) {
          n = !0, clearTimeout(i);
          try {
            e.currentTime = 0
          } catch (e) {}
          a(t)
        }
      },
      r = () => {
        o() && s(e.duration)
      };
    e.addEventListener("durationchange", r), e.addEventListener("timeupdate", r);
    try {
      e.currentTime = 1e101
    } catch (e) {}
    const i = setTimeout(async () => {
      if (!n) try {
        s((await AC.decodeAudioData(await (await fetch(t.url)).arrayBuffer())).duration)
      } catch (e) {
        s(0)
      }
    }, 2500)
  })
}

function addClip(e) {
  const t = "audio" === e.type,
    a = "video" === e.type || t,
    o = t ? new Audio : a ? document.createElement("video") : new Image,
    n = n => {
      vpush();
      const s = a ? n : PS.still;
      let r = t ? -1 : [0, 1, 2].find(e => !clips.some(t => t.track === e && t.start < T + s && t.start + t.dur > T));
      void 0 === r && (r = 2);
      const i = {
        name: e.name,
        el: o,
        track: r,
        start: T,
        in: 0,
        dur: s,
        src: a ? s : 1e9,
        fx: {
          ...DEF
        },
        g: null,
        audio: t,
        it: e
      };
      if (a) {
        const e = AC.createGain();
        AC.createMediaElementSource(o).connect(e), e.connect(AC.destination), e.connect(xd), i.g = e, o.onseeked = () => {
          playing || render(T)
        }
      }
      clips.push(i), cs = i, tl(), fxUI(), render(T)
    };
  a ? (o.preload = "auto", o.playsInline = !0, o.onloadedmetadata = async () => {
    const t = await getDur(o, e);
    t ? n(t) : toast("Could not read the length of " + e.name + ".")
  }, o.onerror = () => toast("This browser could not open " + e.name + "."), o.src = e.url, hold.append(o)) : (o.onload = n, o.src = e.url)
}

function pix(e, t) {
  const a = ox.getImageData(0, 0, W, H),
    o = a.data,
    n = new Uint8ClampedArray(256);
  for (let t = 0; t < 256; t++) n[t] = 255 * Math.pow(clamp(t / 255 * e.gain / 100 + e.lift / 200), 100 / e.gamma);
  const s = parseInt(e.kc.slice(1), 16),
    r = s >> 16,
    i = s >> 8 & 255,
    l = 255 & s,
    c = e.ks / 150,
    p = c + e.kf / 300 + .001,
    d = .4 * e.warm,
    u = .3 * e.tint,
    f = i > r && i > l,
    h = e.lut && LUTS[e.lut],
    m = (e.luta ?? 100) / 100;
  for (let a = 0; a < o.length; a += 4) {
    let s = o[a],
      g = o[a + 1],
      b = o[a + 2],
      v = o[a + 3];
    if (v) {
      if (e.key) {
        const e = Math.hypot(s - r, g - i, b - l) / 441;
        if (v = e < c ? 0 : e < p ? v * (e - c) / (p - c) : v, !v) {
          o[a + 3] = 0;
          continue
        }
        f ? g = Math.min(g, Math.max(s, b)) : b = Math.min(b, Math.max(s, g))
      }
      if (t) {
        const t = e.grain ? (Math.random() - .5) * e.grain * 2.5 : 0;
        s = n[0 | clamp(s + d, 0, 255)] + t, g = n[0 | clamp(g + u, 0, 255)] + t, b = n[0 | clamp(b - d, 0, 255)] + t
      }
      if (e.cvl && (s = e.cvl[0][0 | s], g = e.cvl[1][0 | g], b = e.cvl[2][0 | b]), h) {
        const e = lutPx(h, s, g, b);
        s += (e[0] - s) * m, g += (e[1] - g) * m, b += (e[2] - b) * m
      }
      o[a] = s, o[a + 1] = g, o[a + 2] = b, o[a + 3] = v
    }
  }
  ox.putImageData(a, 0, 0)
}

function draw(e, t) {
  const a = fxAt(e, t),
    o = e.el,
    n = o.videoWidth || o.naturalWidth || o.width,
    s = o.videoHeight || o.naturalHeight || o.height;
  if (!n) return;
  const r = n * (1 - (a.cl + a.cr) / 100),
    i = s * (1 - (a.ct + a.cb) / 100),
    l = (a.fill ? Math.max : Math.min)(W / r, H / i) * a.scale / 100,
    c = r * l,
    p = i * l;
  ox.clearRect(0, 0, W, H), ox.save();
  const d = [];
  100 !== a.bri && d.push(`brightness(${a.bri}%)`), 100 !== a.con && d.push(`contrast(${a.con}%)`), 100 !== a.sat && d.push(`saturate(${a.sat}%)`), a.hue && d.push(`hue-rotate(${a.hue}deg)`), a.blur && d.push(`blur(${a.blur}px)`), a.sep && d.push(`sepia(${a.sep}%)`), a.gray && d.push(`grayscale(${a.gray}%)`), a.inv && d.push(`invert(${a.inv}%)`), ox.filter = d.length ? d.join(" ") : "none", ox.translate(W / 2 + a.px * W / 100, H / 2 + a.py * H / 100), ox.rotate(a.rot * Math.PI / 180), a.mir && ox.scale(-1, 1);
  const u = "auto" === a.deint ? e.it && e.it.interlaced ? "adaptive" : "off" : a.deint;
  let f = o;
  e.g && "off" !== u && o.videoWidth && (f = deint(o, u, "auto" === a.dfield ? e.it && "bff" === e.it.interlaced ? "bff" : "tff" : a.dfield, a.dthr, Math.floor((e.start + t) * PS.fps + 1e-6))), ox.drawImage(f, n * a.cl / 100, s * a.ct / 100, r, i, -c / 2, -p / 2, c, p), ox.restore();
  const h = a.warm || a.tint || a.lift || 100 !== a.gamma || 100 !== a.gain || a.grain;
  if ((a.key || h || a.cvl || a.lut && LUTS[a.lut]) && pix(a, h), a.vig) {
    ox.globalCompositeOperation = "source-atop";
    const e = ox.createRadialGradient(W / 2, H / 2, .3 * H, W / 2, H / 2, .65 * W);
    e.addColorStop(0, "rgba(0,0,0,0)"), e.addColorStop(1, `rgba(0,0,0,${a.vig/100})`), ox.fillStyle = e, ox.fillRect(0, 0, W, H), ox.globalCompositeOperation = "source-over"
  }
  if (a.pix) {
    const e = 1 + a.pix,
      t = Math.ceil(W / e),
      o = Math.ceil(H / e);
    sc.width = t, sc.height = o, sx2.drawImage(oc, 0, 0, t, o), ox.clearRect(0, 0, W, H), ox.imageSmoothingEnabled = !1, ox.drawImage(sc, 0, 0, t, o, 0, 0, W, H), ox.imageSmoothingEnabled = !0
  }
  px2.save(), px2.globalAlpha = a.op / 100;
  let m = 0,
    g = 0;
  [
    [a.tin, clamp(t / a.tind)],
    [a.tout, clamp((e.dur - t) / a.toutd)]
  ].forEach(([e, t]) => {
    if (!("none" === e || t >= 1))
      if ("fade" === e) px2.globalAlpha *= t;
      else if ("black" === e) m = Math.max(m, 1 - t);
    else if ("white" === e) g = Math.max(g, 1 - t);
    else if ("sl" === e) px2.translate(W * (1 - t), 0);
    else if ("sr" === e) px2.translate(-W * (1 - t), 0);
    else if ("su" === e) px2.translate(0, H * (1 - t));
    else if ("zoom" === e) {
      px2.translate(W / 2, H / 2);
      const e = .25 + .75 * t;
      px2.scale(e, e), px2.translate(-W / 2, -H / 2), px2.globalAlpha *= t
    } else "blurf" === e ? (px2.globalAlpha *= t, px2.filter = `blur(${(24*(1-t)).toFixed(1)}px)`) : (px2.beginPath(), "wl" === e ? px2.rect(0, 0, W * t, H) : "wr" === e ? px2.rect(W * (1 - t), 0, W * t, H) : "wd" === e ? px2.rect(0, 0, W, H * t) : "wu" === e ? px2.rect(0, H * (1 - t), W, H * t) : px2.arc(W / 2, H / 2, t * Math.hypot(W, H) / 2, 0, 7), px2.clip())
  }), px2.drawImage(oc, 0, 0), px2.filter = "none", m && (px2.globalAlpha = m, px2.fillStyle = "#000", px2.fillRect(0, 0, W, H)), g && (px2.globalAlpha = g, px2.fillStyle = "#fff", px2.fillRect(0, 0, W, H)), px2.restore()
}
const afac = (e, t) => "fade" === e || "black" === e || "white" === e ? t : 1,
  audFac = (e, t, a) => {
    const o = clamp(t / e.tind),
      n = clamp((a - t) / e.toutd);
    return (e.lnk ? Math.sqrt(o) : afac(e.tin, o)) * (e.lnko ? Math.sqrt(n) : afac(e.tout, n))
  };

function render(e) {
  const t = clips.filter(t => e >= t.start && e < t.start + t.dur).sort((e, t) => e.track - t.track || e.start - t.start);
  clips.forEach(e => {
    e.g && !t.includes(e) && (e._pl = !1, e.el.paused || e.el.pause())
  }), t.forEach(t => {
    const a = e - t.start,
      o = t.el,
      n = fxAt(t, a);
    if (t.g) {
      const e = n.speed / 100,
        s = t.in + a * e,
        r = performance.now();
      playing ? (o.playbackRate !== e && (o.playbackRate = e), o.paused ? t._pl || (t._pl = !0, t._pt = r, Math.abs(o.currentTime - s) > .15 && (o.currentTime = s), o.play().catch(() => {
        t._pl = !1
      })) : (t._pl = !0, Math.abs(o.currentTime - s) > .6 && !o.seeking && r - (t._pt || 0) > 900 && r - (t._ls || 0) > 1e3 && (o.currentTime = s, t._ls = r))) : (t._pl = !1, o.paused || o.pause(), Math.abs(o.currentTime - s) > SEEKTOL && (o.currentTime = s)), t.g.gain.value = n.vol / 100 * audFac(n, a, t.dur)
    }
  }), t.some(e => e.g && e.el.videoWidth && e.el.readyState < 2) || (px2.fillStyle = PS.bg, px2.fillRect(0, 0, W, H), t.forEach(t => draw(t, e - t.start)))
}

function ui() {
  const e = $("vph");
  e && (e.style.left = T * pps + "px"), $("tc").textContent = tc(T) + " / " + tc(endT()), kfSync()
}
const vui = () => {
  render(T), ui()
};

function play() {
  !playing && clips.length && ("running" === AC.state ? play2() : AC.resume().catch(() => {}).then(() => {
    playing || play2()
  }))
}

function play2() {
  !playing && clips.length && (T >= endT() && (T = 0), playing = !0, T0 = T, w0 = performance.now(), tick())
}

function pause() {
  playing = !1, clips.forEach(e => {
    e._pl = !1, e.g && e.el.pause()
  })
}

function tick() {
  if (playing)
    if (T = T0 + (performance.now() - w0) / 1e3, T >= endT()) {
      if (T = endT(), pause(), render(T), ui(), onend) {
        const e = onend;
        onend = null, e()
      }
    } else render(T), ui(), requestAnimationFrame(tick)
}

function tl() {
  const e = Math.max(endT() + 10, 30) * pps;
  lanes.style.cssText = "flex:none;width:" + e + "px", lanes.innerHTML = '<div id="ruler"></div>', rows = [];
  for (let e = 0; e < 4; e++) {
    const e = document.createElement("div");
    e.className = "ln", lanes.append(e), rows.push(e)
  }
  const t = [1, 2, 5, 10, 30, 60, 120].find(e => e * pps >= 60) || 120;
  for (let a = 0; a < e / pps; a += t) {
    const e = document.createElement("span");
    e.style.left = a * pps + "px", e.textContent = fmt(a), $("ruler").append(e)
  }
  clips.forEach(e => {
    const t = document.createElement("div");
    t.className = "clip2" + (e === cs ? " a" : ""), t.style.left = e.start * pps + "px", t.style.width = e.dur * pps + "px", t.innerHTML = '<span class="h" data-h="l"></span><span class="h" data-h="r"></span>' + e.name, e === cs && e.kf && kfDiamonds(e, t), rows[e.track < 0 ? 3 : 2 - e.track].append(t), t.onpointerdown = a => {
      a.stopPropagation(), vpush();
      const o = a.target.dataset.h || "m",
        n = a.clientX,
        s = e.start,
        r = e.dur,
        i = e.in;
      cs !== e && (cs = e, fxUI(), document.querySelectorAll(".clip2.a").forEach(e => e.classList.remove("a")), t.classList.add("a"), document.querySelectorAll(".kfd").forEach(e => e.remove()), e.kf && kfDiamonds(e, t)), t.setPointerCapture(a.pointerId), t.onpointermove = a => {
        let l = (a.clientX - n) / pps;
        if ("m" === o) {
          if (e.start = snapT(Math.max(0, s + l), e), !e.audio) {
            const t = rows.findIndex(e => a.clientY < e.getBoundingClientRect().bottom);
            e.track = t < 0 || 3 === t ? 0 : 2 - t
          }
        } else "l" === o ? (l = Math.min(Math.max(l, -Math.min(s, i)), r - .2), e.start = s + l, e.in = i + l * (e.fx.speed / 100), e.dur = r - l) : e.dur = Math.max(.2, Math.min(r + l, (e.src - i) / (e.fx.speed / 100)));
        t.style.left = e.start * pps + "px", t.style.width = e.dur * pps + "px"
      }, t.onpointerup = () => {
        t.onpointermove = t.onpointerup = null, tl(), render(T), ui()
      }
    }
  }), junctions(), lanes.insertAdjacentHTML("beforeend", '<div id="vph"></div>'), ui(), navUI()
}
const seek = e => {
  pause(), T = clamp((e.clientX - lanes.getBoundingClientRect().left) / pps, 0, 1e5), render(T), ui()
};

function fxUI() {
  const e = $("fxp");
  if (e.innerHTML = "", kfRows = [], !cs) return void(e.textContent = "Select a clip on the timeline to edit its effects.");
  const t = cs.fx,
    a = document.createElement("select");
  a.innerHTML = "<option>Grade preset…</option>" + Object.keys(PRE).map(e => `<option>${e}</option>`).join(""), a.onchange = () => {
    PRE[a.value] && (Object.assign(t, {
      warm: 0,
      tint: 0,
      lift: 0,
      gamma: 100,
      gain: 100,
      con: 100,
      sat: 100,
      gray: 0,
      vig: 0
    }, PRE[a.value]), fxUI(), vui())
  }, e.append(a), motionUI(e), lutUI(e), curvesUI(e), deintUI(e), cs.title && titleUI(e), SPEC.forEach(([a, ...o]) => {
    const n = document.createElement("b");
    n.textContent = a, n.dataset.min = LVG[a], e.append(n), o.forEach(([o, n, s, r]) => {
      const i = document.createElement("label");
      let l, c;
      i.className = "s", "tr" === s ? (i.innerHTML = n + "<select>" + TR.map(([e, t]) => `<option value="${e}">${t}</option>`).join("") + "</select>", l = i.querySelector("select"), l.value = t[o], i.style.gridTemplateColumns = "96px 1fr") : "color" === s ? (i.innerHTML = n + `<input type="color" value="${t[o]}">`, l = i.querySelector("input"), i.style.gridTemplateColumns = "96px 1fr") : 1 === r ? (i.innerHTML = n + `<input type="checkbox"${t[o]?" checked":""}>`, l = i.querySelector("input"), i.style.gridTemplateColumns = "96px 1fr") : (i.innerHTML = `${n}<input type="range" min="${s}" max="${r}" step="${r<4?.1:1}" value="${t[o]}"><output>${t[o]}</output>`, l = i.querySelector("input"), c = i.querySelector("output"), i.style.gridTemplateColumns = "96px 1fr 34px" + (KFP.has(o) ? " 22px" : ""), KFP.has(o) && kbtn(i, o, l, c)), l.oninput = l.onchange = () => {
        {
          const e = "checkbox" === l.type ? +l.checked : "tr" === s || "color" === s ? l.value : +l.value;
          cs.kf && cs.kf[o] && cs.kf[o].length ? T >= cs.start && T < cs.start + cs.dur && (setKF(cs, o, stOf(cs, T), e), tl()) : t[o] = e
        }
        if (c && (c.textContent = l.value), "speed" === o) {
          const e = cs._sp || 100;
          cs.dur = Math.max(.2, cs.dur * e / t.speed), cs._sp = t.speed, tl()
        }
        playing || vui()
      }, i.dataset.min = LVG[a], e.append(i)
    })
  })
}
lanes.onpointerdown = e => {
  e.target.closest("#ruler") ? (drag = "seek", lanes.setPointerCapture(e.pointerId), seek(e)) : (e.target === lanes || e.target.classList.contains("ln")) && (cs = null, tl(), fxUI())
}, lanes.onpointermove = e => "seek" === drag && seek(e), lanes.onpointerup = () => drag = null, $("vpl").onclick = () => playing ? pause() : play(), $("vb").onclick = () => {
  pause(), T = Math.max(0, T - 1 / PS.fps), vui()
}, $("vf1").onclick = () => {
  pause(), T += 1 / PS.fps, vui()
}, $("vz").oninput = e => {
  pps = +e.target.value, tl()
}, $("vsplit").onclick = () => {
  const e = cs;
  if (!e || T <= e.start + .1 || T >= e.start + e.dur - .1) return;
  vpush();
  const t = T - e.start,
    a = {
      ...e,
      fx: {
        ...e.fx
      },
      kf: e.kf && JSON.parse(JSON.stringify(e.kf)),
      start: T,
      in: e.in + t * (e.fx.speed / 100),
      dur: e.dur - t
    };
  e.dur = t, e.fx.tout = "none", a.fx.tin = "none", clips.push(a), cs = a, tl(), fxUI(), render(T)
}, $("vdel").onclick = () => {
  cs && (vpush(), cs.g && cs.el.pause(), clips = clips.filter(e => e !== cs), cs = null, tl(), fxUI(), render(T))
}, addEventListener("keydown", e => {
  $("video").classList.contains("on") && !/INPUT|SELECT/.test(e.target.tagName) && (" " === e.key ? (e.preventDefault(), $("vpl").click()) : "s" === e.key ? $("vsplit").click() : "Delete" === e.key && $("vdel").click())
});
const FONTS = ["system-ui, sans-serif", "Georgia, serif", "Impact, sans-serif", '"Courier New", monospace', '"Trebuchet MS", sans-serif', '"Brush Script MT", cursive'],
  TT = {
    title: {
      text: "Your title",
      size: 9,
      y: 50,
      bg: 0
    },
    low: {
      text: "Name\nSubtitle",
      size: 5,
      y: 82,
      bg: 60
    },
    sub: {
      text: "Subtitle text",
      size: 4.5,
      y: 90,
      bg: 0
    },
    mat: {
      text: "",
      size: 9,
      y: 50,
      bg: 100
    }
  };

function titleCanvas(e) {
  const t = e.title,
    a = e.el,
    o = a.getContext("2d");
  a.width = W, a.height = H, o.clearRect(0, 0, W, H);
  const n = t.text.split("\n"),
    s = t.size * H / 100,
    r = 1.2 * s;
  o.font = `${t.bold?"bold ":""}${s}px ${t.font}`, o.textAlign = "center", o.textBaseline = "middle";
  const i = Math.max(0, ...n.map(e => o.measureText(e).width)),
    l = t.y * H / 100 - (n.length - 1) * r / 2;
  o.globalAlpha = t.bg / 100, o.fillStyle = t.bgc, t.full ? o.fillRect(0, 0, W, H) : t.bg && t.text && o.fillRect(W / 2 - i / 2 - .6 * s, l - r / 2 - .3 * s, i + 1.2 * s, n.length * r + .6 * s), o.globalAlpha = 1, t.shadow && (o.shadowColor = "rgba(0,0,0,.65)", o.shadowBlur = .2 * s, o.shadowOffsetY = .05 * s), n.forEach((e, a) => {
    const n = l + a * r;
    (t.stroke && "#000000" !== t.stroke || t.size > 0) && (o.lineWidth = .08 * s, o.strokeStyle = t.stroke, o.strokeText(e, W / 2, n)), o.fillStyle = t.color, o.fillText(e, W / 2, n)
  })
}

function addTitle(e) {
  vpush();
  const t = TT[e],
    a = {
      name: "mat" === e ? "Color matte" : "Title: " + t.text.split("\n")[0],
      el: document.createElement("canvas"),
      track: 2,
      start: T,
      in: 0,
      dur: 5,
      src: 1e9,
      fx: {
        ...DEF,
        tin: "fade",
        tout: "fade"
      },
      g: null,
      title: {
        color: "#ffffff",
        stroke: "#000000",
        font: FONTS[0],
        bold: 1,
        shadow: 1,
        bgc: "mat" === e ? "#3a73b5" : "#1a1a1a",
        full: "mat" === e,
        ...t
      }
    };
  "mat" === e && (a.fx.tin = a.fx.tout = "none"), titleCanvas(a), clips.push(a), cs = a, tl(), fxUI(), render(T)
}

function titleUI(e) {
  const t = cs.title,
    a = document.createElement("b");
  a.textContent = "Title", e.append(a);
  const o = document.createElement("textarea");
  o.value = t.text, o.rows = 3, o.style.cssText = "width:100%;background:var(--p2);color:var(--tx);border:1px solid var(--ln);border-radius:3px;padding:4px", o.oninput = () => {
    t.text = o.value, cs.name = "Title: " + o.value.split("\n")[0], titleCanvas(cs), playing || vui()
  }, e.append(o);
  const n = (t, a, o, n, s) => {
    const r = document.createElement("label");
    r.className = "s", r.style.gridTemplateColumns = "96px 1fr", r.innerHTML = `${t}<${a} ${o}></${a}>`;
    const i = r.querySelector(a);
    s && s(i), i.oninput = () => {
      n(i), titleCanvas(cs), playing || vui()
    }, e.append(r)
  };
  n("Font", "select", "", e => t.font = e.value, e => {
    e.innerHTML = FONTS.map(e => `<option value='${e}'>${e.split(",")[0].replace(/"/g,"")}</option>`).join(""), e.value = t.font
  }), [
    ["Size", "size", 2, 30],
    ["Vertical %", "y", 5, 95],
    ["Box opacity", "bg", 0, 100]
  ].forEach(([e, a, o, s]) => n(e, "input", `type="range" min="${o}" max="${s}" value="${t[a]}"`, e => t[a] = +e.value)), [
    ["Text color", "color"],
    ["Outline", "stroke"],
    ["Box color", "bgc"]
  ].forEach(([e, a]) => n(e, "input", `type="color" value="${t[a]}"`, e => t[a] = e.value)), [
    ["Bold", "bold"],
    ["Shadow", "shadow"]
  ].forEach(([e, a]) => n(e, "input", 'type="checkbox"' + (t[a] ? " checked" : ""), e => t[a] = +e.checked))
}

function applyRes() {
  const e = 0 | +$("xw").value,
    t = 0 | +$("xh").value;
  e >= 64 && t >= 64 && (e !== W || t !== H) && (PS.w = e, PS.h = t, PS.ar = "custom", applyPS())
}
$("vtit").onclick = () => addTitle("title"), $("vlow").onclick = () => addTitle("low"), $("vsub").onclick = () => addTitle("sub"), $("vmat").onclick = () => addTitle("mat"), $("vexp").onclick = () => {
  const e = `${W}x${H}`;
  $("xr").value = [...$("xr").options].some(t => t.value === e) ? e : "c", $("xw").value = W, $("xh").value = H, [...$("xfps").options].some(e => e.value == PS.fps) && ($("xfps").value = PS.fps), $("xcs").value = PS.cs, $("vdlg").showModal()
}, $("xr").onchange = e => {
  if ("c" !== e.target.value) {
    const [t, a] = e.target.value.split("x");
    $("xw").value = t, $("xh").value = a
  }
}, $("xcancel").onclick = () => $("vdlg").close(), $("xapply").onclick = () => {
  applyRes(), $("vdlg").close()
}, $("xgo").onclick = () => {
  applyRes(), $("vdlg").close(), vexport()
};
let xCancel = !1,
  progMode = "",
  ffTot = 0;

function progOpen(e, t) {
  xCancel = !1, progMode = t || "", $("xpt").textContent = e, $("xbar").value = 0, $("xpi").textContent = "", $("xprog").open || $("xprog").showModal()
}

function progClose() {
  progMode = "", $("xprog").open && $("xprog").close()
}

function progSet(e, t) {
  $("xbar").value = e, $("xpi").textContent = t || ""
}
$("xpc").onclick = () => {
  if (xCancel = !0, window._ffcancel && window._ffcancel(), "ff" === progMode) {
    if (ff) {
      try {
        ff.terminate()
      } catch (e) {}
      ff = null
    }
    progClose(), toast("Export cancelled.")
  }
}, $("xprog").addEventListener("cancel", e => {
  e.preventDefault(), $("xpc").click()
});
const WCC = {
    h264: [{
      codec: "avc1.640033",
      mux: "avc",
      extra: {
        avc: {
          format: "avc"
        }
      }
    }, {
      codec: "avc1.64002A",
      mux: "avc",
      extra: {
        avc: {
          format: "avc"
        }
      }
    }, {
      codec: "avc1.640028",
      mux: "avc",
      extra: {
        avc: {
          format: "avc"
        }
      }
    }, {
      codec: "avc1.4D4028",
      mux: "avc",
      extra: {
        avc: {
          format: "avc"
        }
      }
    }, {
      codec: "avc1.42E028",
      mux: "avc",
      extra: {
        avc: {
          format: "avc"
        }
      }
    }],
    h265: [{
      codec: "hvc1.1.6.L153.B0",
      mux: "hevc",
      extra: {
        hevc: {
          format: "hevc"
        }
      }
    }, {
      codec: "hvc1.1.6.L120.B0",
      mux: "hevc",
      extra: {
        hevc: {
          format: "hevc"
        }
      }
    }, {
      codec: "hvc1.1.6.L93.B0",
      mux: "hevc",
      extra: {
        hevc: {
          format: "hevc"
        }
      }
    }]
  },
  WCA = [{
    codec: "mp4a.40.2",
    mux: "aac"
  }, {
    codec: "opus",
    mux: "opus"
  }],
  abCache = new Map,
  nap = e => new Promise(t => setTimeout(t, e));
async function settle() {
  const e = performance.now();
  for (; performance.now() - e < 4e3;) {
    if (!clips.some(e => e.g && (e.el.seeking || e.el.readyState < 2))) return;
    await nap(6)
  }
}
async function mixAudio(e, t) {
  const a = new OfflineAudioContext(2, Math.max(1, Math.ceil(e * t)), t);
  let o = !1;
  for (const e of clips) {
    if (!e.g) continue;
    const t = e.el.currentSrc || e.el.src;
    let n = abCache.get(t);
    if (!n) try {
      n = await AC.decodeAudioData(await (await fetch(t)).arrayBuffer()), abCache.set(t, n)
    } catch (e) {
      continue
    }
    const s = e.fx.speed / 100,
      r = a.createGain(),
      i = a.createBufferSource();
    i.buffer = n, i.playbackRate.value = s, i.connect(r), r.connect(a.destination);
    const l = Math.max(2, Math.ceil(e.dur / .04));
    for (let t = 0; t <= l; t++) {
      const a = Math.min(e.dur, .04 * t),
        o = fxAt(e, a);
      r.gain.setValueAtTime(o.vol / 100 * audFac(o, a, e.dur), e.start + a)
    }
    r.gain.setValueAtTime(0, e.start + e.dur), i.start(e.start, e.in, e.dur * s), o = !0
  }
  return o ? a.startRendering() : null
}

function h264List(e, t, a) {
  const o = Math.ceil(e / 16) * Math.ceil(t / 16) * a,
    n = o <= 245760 ? "28" : o <= 522240 ? "2A" : "33",
    s = ["28", "2A", "33"].filter(e => e >= n),
    r = {
      avc: {
        format: "avc"
      }
    };
  return [...s.map(e => ({
    codec: "avc1.6400" + e,
    mux: "avc",
    extra: r
  })), ...s.map(e => ({
    codec: "avc1.4D40" + e,
    mux: "avc",
    extra: r
  })), ...s.map(e => ({
    codec: "avc1.42E0" + e,
    mux: "avc",
    extra: r
  }))]
}
async function probeSeek(e) {
  const t = endT();
  if (!clips.some(e => e.g)) return 0;
  const a = Math.max(0, Math.min(.3 * t, t - 9 / e));
  let o = 0;
  for (let t = 0; t < 8; t++) {
    const n = performance.now();
    T = a + t / e, render(T), await settle(), render(T), t > 0 && (o += performance.now() - n)
  }
  return o / 7
}
async function wcExport(e, t, a, o, n, s) {
  if ("h264" !== e && "h265" !== e && !window.__wcTest || "420" !== n || 8 !== s || !window.VideoEncoder || !window.VideoFrame || !window.Mp4Muxer) return !1;
  const r = W - W % 2,
    i = H - H % 2,
    l = window.__wcTest;
  let c = null;
  for (const o of l ? l.video : "h264" === e ? h264List(r, i, t) : WCC[e]) try {
    const e = {
      codec: o.codec,
      width: r,
      height: i,
      bitrate: 1e6 * a,
      framerate: t,
      latencyMode: "quality",
      ...o.extra
    };
    if ((await VideoEncoder.isConfigSupported(e)).supported) {
      c = {
        ...o,
        cfg: e
      };
      break
    }
  } catch (e) {}
  if (!c) return !1;
  const p = 48e3;
  let d = null;
  if (window.AudioEncoder && window.AudioData)
    for (const e of l ? l.audio : WCA) try {
      const t = {
        codec: e.codec,
        sampleRate: p,
        numberOfChannels: 2,
        bitrate: 1e3 * o
      };
      if ((await AudioEncoder.isConfigSupported(t)).supported) {
        d = {
          ...e,
          cfg: t
        };
        break
      }
    } catch (e) {}
  const u = endT(),
    f = Math.max(1, Math.ceil(u * t));
  progOpen("Encoding " + ("avc" === c.mux ? "H.264" : "hevc" === c.mux ? "H.265" : c.mux.toUpperCase()) + " on your " + ("vp9" === c.mux ? "" : "hardware/") + "encoder…", "wc");
  let h = null;
  const m = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget,
      video: {
        codec: c.mux,
        width: r,
        height: i,
        frameRate: t
      },
      audio: d ? {
        codec: d.mux,
        sampleRate: p,
        numberOfChannels: 2
      } : void 0,
      fastStart: "in-memory",
      firstTimestampBehavior: "offset"
    }),
    g = new VideoEncoder({
      output: (e, t) => m.addVideoChunk(e, t),
      error: e => h = e
    });
  g.configure(c.cfg);
  const b = T,
    v = SEEKTOL;
  pause(), SEEKTOL = Math.min(.04, .5 / t);
  const w = performance.now();
  let x = null;
  r === W && i === H || (x = document.createElement("canvas"), x.width = r, x.height = i);
  try {
    let e = 0,
      a = -1;
    const o = async (o, n) => {
      let s = pm;
      x && (x.getContext("2d").drawImage(pm, 0, 0), s = x);
      let r = void 0 === n ? Math.round(1e6 * o / t) : n;
      r <= a && (r = a + 1e3), a = r;
      const i = new VideoFrame(s, {
        timestamp: r,
        duration: Math.round(1e6 / t)
      });
      for (; g.encodeQueueSize > 8;) await nap(2);
      g.encode(i, {
        keyFrame: e % (2 * t) == 0
      }), e++, i.close()
    }, n = $("xmode").value, s = "auto" === n ? await probeSeek(t) : 0, r = "fast" === n || "auto" === n && s * f / 1e3 > 3 * u;
    if (progSet(0, r ? "Your footage seeks slowly, so it is encoded while playing. Keep this tab visible." : "Rendering frame by frame…"), r) {
      SEEKTOL = .04, await AC.resume().catch(() => {}), T = 0, render(0), play2();
      let e = -1,
        a = !1;
      for (; !xCancel && !h && !a;) {
        await new Promise(e => requestAnimationFrame(e)), a = !playing;
        const n = a ? u : T;
        (a || n - e >= .9 / t) && (await o(0, Math.round(1e6 * Math.min(n, u))), e = n), progSet(Math.round(Math.min(n, u) / u * 92), `Encoding while playing: ${n.toFixed(1)} of ${u.toFixed(1)} s`)
      }
      pause()
    } else
      for (let e = 0; e < f && !xCancel && !h; e++) {
        const a = Math.min(e / t, Math.max(0, u - 1e-6));
        if (T = a, render(a), await settle(), render(a), await o(e), e % 3 == 0) {
          const t = (performance.now() - w) / 1e3,
            a = (e + 1) / Math.max(.1, t);
          progSet(Math.round((e + 1) / f * 92), `Frame ${e+1} of ${f} · ${a.toFixed(1)} fps · about ${Math.max(0,Math.round((f-e)/a))} s left`), await nap(0)
        }
      }
    if (!xCancel && !h && (await g.flush(), d)) {
      progSet(93, "Mixing audio…");
      const e = await mixAudio(u, p);
      if (e) {
        const t = new AudioEncoder({
          output: (e, t) => m.addAudioChunk(e, t),
          error: e => h = e
        });
        t.configure(d.cfg);
        const a = e.getChannelData(0),
          o = e.getChannelData(1),
          n = 4800;
        for (let e = 0; e < a.length && !h; e += n) {
          const s = Math.min(n, a.length - e),
            r = new Float32Array(2 * s);
          r.set(a.subarray(e, e + s), 0), r.set(o.subarray(e, e + s), s);
          const i = new AudioData({
            format: "f32-planar",
            sampleRate: p,
            numberOfFrames: s,
            numberOfChannels: 2,
            timestamp: Math.round(e / p * 1e6),
            data: r
          });
          for (t.encode(i), i.close(); t.encodeQueueSize > 16;) await nap(2)
        }
        await t.flush(), t.close()
      }
    }
  } catch (e) {
    h = e
  }
  if (SEEKTOL = v, T = b, "closed" !== g.state && g.close(), xCancel) return progClose(), toast("Export cancelled."), vui(), !0;
  if (h) return progClose(), toast("Hardware encoding failed: " + (h.message || h) + " Trying another method…"), vui(), !1;
  progSet(98, "Finishing the file…"), m.finalize();
  const y = new Blob([m.target.buffer], {
    type: "video/mp4"
  });
  return progClose(), vui(), $("vst").textContent = `Export finished in ${Math.round((performance.now()-w)/1e3)} s.`, await dl(y, "sequence.mp4"), !0
}
async function vexport() {
  if (!clips.length) return void toast("Add clips to the timeline first.");
  if (rec) return void toast("An export is already running.");
  if (!window.MediaRecorder) return void toast("This browser cannot record video. Use Chrome, Edge or Firefox.");
  pause();
  const e = $("xf").value,
    t = +$("xfps").value || 30,
    a = +$("xbr").value || 20,
    o = +$("xab").value || 192,
    n = $("xch").value,
    s = +$("xbd").value;
  if (await wcExport(e, t, a, o, n, s)) return;
  T = 0;
  const r = pm.captureStream(t);
  xd.stream.getAudioTracks().forEach(e => r.addTrack(e));
  const i = [..."420" !== n || 10 === s || "pc" === $("xrg").value || "rec709" !== $("xcs").value ? [] : "h264" === e ? ["video/mp4;codecs=avc1.640028,mp4a.40.2"] : "h265" === e ? ["video/mp4;codecs=hvc1.1.6.L93.B0,mp4a.40.2", "video/mp4;codecs=hev1.1.6.L93.B0,mp4a.40.2"] : [], "video/webm;codecs=vp9,opus", "video/webm"].find(mrs);
  if (!i) return void toast("No supported video recording format in this browser.");
  const l = i.startsWith("video/mp4"),
    c = [];
  rec = new MediaRecorder(r, {
    mimeType: i,
    videoBitsPerSecond: 1e6 * a,
    audioBitsPerSecond: 1e3 * o
  }), rec.ondataavailable = e => c.push(e.data), rec.onstop = async () => {
    const r = new Blob(c, {
      type: i.split(";")[0]
    });
    if (rec = null, !r.size) return void toast("The recording was empty.");
    if ("webm" === e || l) return await dl(r, "sequence." + (l ? "mp4" : "webm"), null), void($("vst").textContent = "Export finished.");
    const p = {
        rec709: ["bt709", "bt709", "bt709"],
        rec601: ["smpte170m", "smpte170m", "smpte170m"],
        srgb: ["bt709", "bt709", "iec61966-2-1"]
      } [$("xcs").value],
      d = "pc" === $("xrg").value,
      u = "prores" === e ? 4 === +$("xpp").value ? "yuv444p10le" : "yuv422p10le" : `yuv${n}p` + (10 === s && "h265" === e ? "10le" : ""),
      f = "scale=trunc(iw/2)*2:trunc(ih/2)*2:out_range=" + (d ? "pc" : "tv"),
      h = ["-colorspace", p[0], "-color_primaries", p[1], "-color_trc", p[2], "-color_range", d ? "pc" : "tv"],
      m = {
        h264: [
          ["-c:v", "libx264", "-preset", "veryfast", "-b:v", a + "M", "-pix_fmt", u, "-c:a", "aac", "-b:a", o + "k"], "mp4", "video/mp4"
        ],
        h265: [
          ["-c:v", "libx265", "-preset", "veryfast", "-b:v", a + "M", "-tag:v", "hvc1", "-pix_fmt", u, "-c:a", "aac", "-b:a", o + "k"], "mp4", "video/mp4"
        ],
        prores: [
          ["-c:v", "prores_ks", "-profile:v", $("xpp").value, "-pix_fmt", u, "-c:a", "pcm_s16le"], "mov", "video/quicktime"
        ]
      } [e];
    ffTot = endT(), progOpen("Encoding with the built-in engine…", "ff");
    try {
      const a = await ffrun(r, "in.webm", ["-r", String(t), "-vsync", "cfr", "-vf", f, ...h, ...m[0]], "out." + m[1], m[2], "Encoding " + e + "…");
      progClose(), ffTot = 0, await dl(a, "sequence." + m[1], null), $("vst").textContent = "Export finished."
    } catch (e) {
      progClose(), ffTot = 0, $("vst").textContent = "Encoding failed: " + e.message, toast("Encoding failed: " + e.message)
    }
  }, onend = () => rec.stop(), rec.start(), play(), $("vst").textContent = "Rendering in real time…"
}
const tlg = () => $("lanes").parentElement;

function navUI() {
  const e = tlg(),
    t = Math.max(50, e.clientWidth - 70) / pps,
    a = e.scrollLeft / pps,
    o = Math.max(1.1 * endT(), a + t, 10);
  $("nvw").style.left = a / o * 100 + "%", $("nvw").style.width = Math.max(1, t / o * 100) + "%", $("nav").dataset.tot = o
}

function navSet(e, t) {
  const a = tlg(),
    o = Math.max(50, a.clientWidth - 70);
  t = Math.max(t, e + .5), pps = K(o / (t - e), 2, 800), $("vz").value = pps, tl(), a.scrollLeft = e * pps, navUI()
}
let nd = null;
$("nav").onpointerdown = e => {
  const t = tlg(),
    a = +$("nav").dataset.tot || 10,
    o = $("nav").clientWidth,
    n = Math.max(50, t.clientWidth - 70) / pps,
    s = t.scrollLeft / pps,
    r = (e.clientX - $("nav").getBoundingClientRect().left) / o * a;
  if (nd = {
      m: "nbl" === e.target.id ? "l" : "nbr" === e.target.id ? "r" : "p",
      tot: a,
      W0: o,
      v0: s,
      v1: s + n,
      t0: r
    }, "p" === nd.m && !e.target.closest("#nvw")) {
    const e = Math.max(0, r - n / 2);
    navSet(e, e + n), nd.v0 = e, nd.v1 = e + n
  }
  $("nav").setPointerCapture(e.pointerId)
}, $("nav").onpointermove = e => {
  if (!nd) return;
  const t = (e.clientX - $("nav").getBoundingClientRect().left) / nd.W0 * nd.tot - nd.t0;
  if ("l" === nd.m) navSet(Math.max(0, Math.min(nd.v0 + t, nd.v1 - .5)), nd.v1);
  else if ("r" === nd.m) navSet(nd.v0, Math.max(nd.v0 + .5, nd.v1 + t));
  else {
    const e = Math.max(0, nd.v0 + t);
    navSet(e, e + (nd.v1 - nd.v0))
  }
}, $("nav").onpointerup = () => nd = null, tlg().addEventListener("scroll", navUI), $("vfit").onclick = () => navSet(0, 1.04 * Math.max(endT(), 2));
let trPair = null;
const trName = e => (TR.find(t => t[0] === e) || [0, e])[1];
$("trt").innerHTML = TR.filter(e => "none" !== e[0]).map(([e, t]) => `<option value="${e}">${t}</option>`).join("");
const isCut = (e, t) => {
  const a = t.start - (e.start + e.dur);
  return a <= .5 && a >= .95 * -Math.min(e.dur, t.dur)
};

function junctions() {
  for (let e = 0; e < 3; e++) {
    const t = clips.filter(t => t.track === e && !t.audio).sort((e, t) => e.start - t.start);
    for (let a = 0; a < t.length - 1; a++) {
      const o = t[a],
        n = t[a + 1];
      if (!isCut(o, n)) continue;
      const s = rows[2 - e],
        r = n.start - (o.start + o.dur),
        i = n.fx.lnk && "none" !== n.fx.tin,
        l = i ? Math.max(0, -r) : 0;
      if (i && l > 0) {
        const e = document.createElement("div");
        e.className = "jr", e.style.left = n.start * pps + "px", e.style.width = Math.max(8, l * pps) + "px", s.append(e)
      }
      const c = document.createElement("div");
      c.className = "jn" + (i ? " on" : ""), c.style.left = (n.start + l / 2) * pps + "px", c.textContent = i ? "⧖" : "+", c.title = i ? `${trName(n.fx.tin)}, ${n.fx.tind.toFixed(1)} s. Click to change.` : "Add a transition between these two clips", c.onpointerdown = e => e.stopPropagation(), c.onclick = e => {
        e.stopPropagation(), openTrans(o, n)
      }, s.append(c)
    }
  }
}

function ensureSeparateEl(e, t) {
  return new Promise(a => {
    if (!e.g || !t.g || t.el !== e.el) return void a();
    const o = document.createElement("video");
    o.preload = "auto", o.playsInline = !0, o.onloadedmetadata = () => {
      const t = AC.createGain();
      AC.createMediaElementSource(o).connect(t), t.connect(AC.destination), t.connect(xd), e.el = o, e.g = t, o.onseeked = () => {
        playing || render(T)
      }, a()
    }, o.onerror = () => a(), o.src = e.el.currentSrc || e.el.src, hold.append(o)
  })
}

function linkTrans(e, t, a, o) {
  o = Math.max(.2, Math.min(o, .9 * Math.min(e.dur, t.dur)));
  const n = e.start + e.dur - o - t.start;
  return Math.abs(n) > 1e-6 && clips.forEach(e => {
    e.track === t.track && e.start >= t.start - 1e-6 && (e.start = Math.max(0, e.start + n))
  }), t.fx.tin = a, t.fx.tind = o, t.fx.lnk = 1, e.fx.lnko = 1, e.fx.toutd = o, e.fx.tout = "none", o
}

function openTrans(e, t) {
  trPair = {
    A: e,
    B: t,
    all: !1
  };
  const a = t.fx.lnk && "none" !== t.fx.tin;
  $("trh").textContent = "Transition between clips", $("trt").value = a ? t.fx.tin : "fade", $("trd").value = a ? t.fx.tind : PS.trans, $("trd").nextSibling.textContent = (+$("trd").value).toFixed(1), $("trrem").style.display = a ? "" : "none", $("trp").parentElement.style.display = "", $("trdlg").showModal()
}
$("vtall").onclick = () => {
  trPair = {
    all: !0
  }, $("trh").textContent = "Add a transition at every cut", $("trt").value = "fade", $("trd").value = PS.trans, $("trd").nextSibling.textContent = (+$("trd").value).toFixed(1), $("trrem").style.display = "none", $("trp").parentElement.style.display = "none", $("trdlg").showModal()
}, $("trd").oninput = () => $("trd").nextSibling.textContent = (+$("trd").value).toFixed(1), $("trok").onclick = async () => {
  vpush();
  const e = $("trt").value,
    t = +$("trd").value;
  if ($("trdlg").close(), trPair.all) {
    for (let a = 0; a < 3; a++) {
      const o = clips.filter(e => e.track === a && !e.audio).sort((e, t) => e.start - t.start);
      for (let a = 0; a < o.length - 1; a++) {
        const n = o[a],
          s = o[a + 1];
        isCut(n, s) && (await ensureSeparateEl(s, n), linkTrans(n, s, e, t))
      }
    }
    toast("Added a transition at every cut.")
  } else {
    const {
      A: a,
      B: o
    } = trPair;
    await ensureSeparateEl(o, a);
    const n = linkTrans(a, o, e, t);
    tl(), vui(), $("trp").checked && (T = Math.max(0, o.start - 1), render(T), ui(), play(), clearTimeout(window._trT), window._trT = setTimeout(pause, 1e3 * (n + 2)))
  }
  tl(), vui()
}, $("trrem").onclick = () => {
  vpush();
  const {
    A: e,
    B: t
  } = trPair;
  t.fx.tin = "none", t.fx.lnk = 0, e.fx.lnko = 0, $("trdlg").close(), tl(), vui()
}, $("trcancel").onclick = () => $("trdlg").close(), $("vclose").onclick = () => {
  vpush();
  for (let e = -1; e < 3; e++) {
    const t = clips.filter(t => t.track === e).sort((e, t) => e.start - t.start);
    if (!t.length) continue;
    let a = t[0].start + t[0].dur;
    for (let e = 1; e < t.length; e++) {
      const o = t[e];
      o.start > a + 1e-6 && (o.start = a), a = Math.max(a, o.start + o.dur)
    }
  }
  tl(), vui(), toast("Closed the gaps between clips.")
};
const ARS = {
    "16:9": 16 / 9,
    "9:16": 9 / 16,
    "1:1": 1,
    "4:3": 4 / 3,
    "4:5": .8,
    "21:9": 21 / 9,
    "2.39:1": 2.39
  },
  VU = [],
  VR = [],
  vsnap = () => clips.map(e => ({
    ...e,
    fx: {
      ...e.fx
    },
    title: e.title && {
      ...e.title
    },
    kf: e.kf && JSON.parse(JSON.stringify(e.kf))
  }));

function vpush() {
  VU.push(vsnap()), VU.length > 40 && VU.shift(), VR.length = 0
}

function vrestore(e) {
  clips = e, cs = null, clips.forEach(e => e.title && titleCanvas(e)), tl(), fxUI(), render(T)
}

function vundo() {
  VU.length && (VR.push(vsnap()), vrestore(VU.pop()))
}

function vredo() {
  VR.length && (VU.push(vsnap()), vrestore(VR.pop()))
}

function snapT(e, t) {
  if (!PS.snap) return e;
  const a = 8 / pps,
    o = [T, 0, ...clips.filter(e => e !== t).flatMap(e => [e.start, e.start + e.dur])];
  for (const n of o) {
    if (Math.abs(e - n) < a) return n;
    if (Math.abs(e + t.dur - n) < a) return n - t.dur
  }
  return e
}

function applyPS() {
  W = PS.w, H = PS.h, pm.width = oc.width = W, pm.height = oc.height = H, DEF.tind = DEF.toutd = PS.trans, clips.forEach(e => e.title && titleCanvas(e)), seqUI(), vui()
}

function seqUI() {
  const e = $("seqsel");
  e.innerHTML = seqs.map((e, t) => `<option value="${t}">${t===si?PS.name:e.ps.name}</option>`).join(""), e.value = si, $("ptag").textContent = `${W}×${H} · ${PS.fps} fps`
}

function useSeq(e) {
  seqs[si] = {
    ps: {
      ...PS
    },
    clips: clips
  }, si = e, Object.assign(PS, seqs[e].ps), clips = seqs[e].clips, cs = null, T = 0, pause(), VU.length = VR.length = 0, applyPS(), tl(), fxUI(), render(0)
}

function psCalc() {
  const e = $("psa").value;
  if ("custom" === e) return;
  const t = ARS[e],
    a = +$("psr").value;
  let o, n;
  t >= 1 ? (n = a, o = Math.round(a * t)) : (o = a, n = Math.round(a / t)), $("psw").value = o + o % 2, $("psh").value = n + n % 2
}

function psOpen(e) {
  window._pmode = e || "", $("pdlg").querySelector("h3").textContent = "new" === e ? "New project" : "Project and sequence settings", $("pok").textContent = "new" === e ? "Create project" : "OK", $("pnew").style.display = "new" === e ? "none" : "", $("psn").value = PS.name, $("psa").value = PS.ar;
  const t = Math.min(PS.w, PS.h);
  [...$("psr").options].some(e => +e.value === t) && ($("psr").value = t), $("psw").value = PS.w, $("psh").value = PS.h, $("psf").value = String(PS.fps), $("psb").value = PS.bg, $("psd").value = PS.still, $("psx").value = PS.trans, $("psm").checked = !!PS.snap, $("psc").value = PS.cs, $("pdlg").showModal()
}
$("seqsel").onchange = e => useSeq(+e.target.value), $("psa").onchange = $("psr").onchange = psCalc, $("psw").oninput = $("psh").oninput = () => $("psa").value = "custom", $("pok").onclick = () => {
  "new" === window._pmode && (clips = [], seqs = [{
    ps: {
      ...PS
    },
    clips: clips
  }], si = 0, cs = null, T = 0, pause(), VU.length = VR.length = 0, items.length = 0, bin(), window._pmode = "", tl()), "custom" !== $("psa").value && psCalc(), Object.assign(PS, {
    name: $("psn").value || "Sequence",
    ar: $("psa").value,
    w: Math.max(64, 0 | +$("psw").value),
    h: Math.max(64, 0 | +$("psh").value),
    fps: +$("psf").value || 30,
    bg: $("psb").value,
    still: +$("psd").value || 5,
    trans: +$("psx").value || 1,
    snap: $("psm").checked ? 1 : 0,
    cs: $("psc").value
  }), $("pdlg").close(), applyPS()
}, $("pcancel").onclick = () => $("pdlg").close(), $("pnew").onclick = () => {
  $("pdlg").close(), seqs[si] = {
    ps: {
      ...PS
    },
    clips: clips
  }, seqs.push({
    ps: {
      ...PS,
      name: "Sequence " + (seqs.length + 1)
    },
    clips: []
  }), useSeq(seqs.length - 1), psOpen()
}, $("vproj").onclick = $("vproj2").onclick = () => psOpen(), $("vnew").onclick = () => {
  clips.length && !confirm("Start a new project? The current timeline and media list will be cleared.") || psOpen("new")
}, $("vundo").onclick = vundo, $("vredo").onclick = vredo, $("vrip").onclick = () => {
  if (!cs) return;
  vpush();
  const e = cs,
    t = e.start + e.dur;
  e.g && e.el.pause(), clips = clips.filter(t => t !== e), clips.forEach(a => {
    a.track === e.track && a.start >= t - .01 && (a.start -= e.dur)
  }), cs = null, tl(), fxUI(), render(T)
}, $("fxp").addEventListener("pointerdown", vpush), seqUI();
let SEEKTOL = .04;

function curvesUI(e) {
  const t = cs.fx,
    a = document.createElement("b");
  a.textContent = "Curves", a.dataset.min = 2;
  const o = document.createElement("button");
  o.textContent = t.cvl ? "Edit curves… (active)" : "Curves…", o.dataset.min = 2, o.onclick = () => {
    const e = t.cv,
      a = t.cvl;
    vpush(), openCurves(t.cv, e => {
      t.cvl = e, vui()
    }, (e, a) => {
      t.cv = e, t.cvl = a, fxUI(), vui()
    }, () => {
      t.cv = e, t.cvl = a, vui()
    })
  };
  const n = document.createElement("button");
  n.textContent = "Reset curves", n.dataset.min = 2, n.onclick = () => {
    vpush(), t.cv = null, t.cvl = null, fxUI(), vui()
  }, e.append(a, o, n)
}

function lutUI(e) {
  const t = cs.fx,
    a = document.createElement("b");
  a.textContent = "LUT (color look)";
  const o = document.createElement("select");
  o.innerHTML = '<option value="">No LUT</option>' + Object.keys(LUTS).map(e => `<option>${e}</option>`).join(""), o.value = t.lut || "", o.onchange = () => {
    vpush(), t.lut = o.value, vui()
  };
  const n = document.createElement("label");
  n.className = "bt", n.textContent = "Load .cube file…", n.style.textAlign = "center", n.htmlFor = "vlutf";
  const s = document.createElement("label");
  s.className = "s", s.innerHTML = `Strength<input type="range" min="0" max="100" value="${t.luta??100}"><output>${t.luta??100}</output>`;
  const r = s.querySelector("input");
  r.oninput = () => {
    t.luta = +r.value, s.querySelector("output").textContent = r.value, vui()
  }, e.append(a, o, n, s)
}
let kfRows = [];
const KFP = new Set(["scale", "px", "py", "op", "rot", "cl", "cr", "ct", "cb", "bri", "con", "sat", "hue", "warm", "tint", "lift", "gamma", "gain", "blur", "vig", "pix", "grain", "sep", "gray", "inv", "vol"]),
  stOf = (e, t) => e.in + (t - e.start) * (e.fx.speed / 100),
  kfAt = (e, t, a) => {
    const o = .5 / PS.fps * (e.fx.speed / 100);
    return e.kf[t].findIndex(e => Math.abs(e[0] - a) <= o)
  };

function setKF(e, t, a, o) {
  e.kf = e.kf || {};
  const n = e.kf[t] = e.kf[t] || [],
    s = kfAt(e, t, a);
  s >= 0 ? n[s][1] = o : (n.push([a, o]), n.sort((e, t) => e[0] - t[0]))
}

function fxAt(e, t) {
  const a = e.kf;
  if (!a) return e.fx;
  const o = Object.keys(a).filter(e => a[e].length);
  if (!o.length) return e.fx;
  const n = e.in + t * (e.fx.speed / 100),
    s = {
      ...e.fx
    };
  for (const t of o) {
    const o = a[t];
    let r;
    if (n <= o[0][0]) r = o[0][1];
    else if (n >= o[o.length - 1][0]) r = o[o.length - 1][1];
    else {
      let t = 1;
      for (; o[t][0] < n;) t++;
      const a = o[t - 1],
        s = o[t];
      let i = (n - a[0]) / (s[0] - a[0]);
      "hold" === e.ease ? i = 0 : "linear" !== e.ease && (i = i * i * (3 - 2 * i)), r = a[1] + (s[1] - a[1]) * i
    }
    s[t] = r
  }
  return s
}

function kbtn(e, t, a, o) {
  const n = document.createElement("button");
  n.className = "kb", n.dataset.min = 2, n.textContent = "◇", n.title = "Add or remove a keyframe at the playhead (Shift-click clears all keyframes for this setting)", n.onclick = e => {
    if (e.shiftKey) return vpush(), cs.kf && delete cs.kf[t], tl(), kfSync(), void vui();
    if (T < cs.start || T >= cs.start + cs.dur) return void toast("Move the playhead over the clip first.");
    vpush();
    const o = stOf(cs, T);
    cs.kf = cs.kf || {};
    const n = cs.kf[t] = cs.kf[t] || [],
      s = n.length ? kfAt(cs, t, o) : -1;
    s >= 0 ? (n.splice(s, 1), n.length || (cs.fx[t] = +a.value)) : setKF(cs, t, o, +a.value), tl(), kfSync(), vui()
  }, e.append(n), kfRows.push({
    k: t,
    i: a,
    o: o,
    b: n
  })
}

function kfSync() {
  if (!cs || !kfRows.length) return;
  const e = T - cs.start,
    t = fxAt(cs, e),
    a = e >= 0 && e < cs.dur,
    o = stOf(cs, T);
  kfRows.forEach(e => {
    const n = cs.kf && cs.kf[e.k],
      s = n && n.length;
    s && (e.i.value = t[e.k], e.o && (e.o.textContent = Math.round(10 * t[e.k]) / 10)), e.b.textContent = s && a && kfAt(cs, e.k, o) >= 0 ? "◆" : "◇", e.b.style.color = s ? "#ffcc00" : ""
  })
}

function kfDiamonds(e, t) {
  const a = e.fx.speed / 100,
    o = new Set;
  Object.values(e.kf).forEach(e => e.forEach(e => o.add(e[0]))), o.forEach(o => {
    const n = (o - e.in) / a;
    if (n < -1e-6 || n > e.dur + 1e-6) return;
    const s = document.createElement("i");
    s.className = "kfd", s.style.left = n * pps + "px", s.title = "Keyframe", s.onpointerdown = t => {
      t.stopPropagation(), pause(), T = e.start + n, render(T), ui()
    }, t.append(s)
  })
}
const MOT = {
  "Slow zoom in": {
    scale: [100, 125]
  },
  "Slow zoom out": {
    scale: [125, 100]
  },
  "Pan right": {
    scale: [118, 118],
    px: [-8, 8]
  },
  "Pan left": {
    scale: [118, 118],
    px: [8, -8]
  },
  "Drift up": {
    scale: [112, 112],
    py: [6, -6]
  },
  "Fade in and out": {
    op: [0, 100, 100, 0]
  },
  "Clear animation": null
};

function motionUI(e) {
  const t = document.createElement("select");
  t.innerHTML = "<option>Motion preset…</option>" + Object.keys(MOT).map(e => `<option>${e}</option>`).join(""), t.onchange = () => {
    if (!(t.value in MOT)) return;
    vpush();
    const e = cs,
      a = e.in,
      o = e.in + e.dur * e.fx.speed / 100,
      n = MOT[t.value];
    e.kf = e.kf || {}, n ? Object.entries(n).forEach(([t, n]) => {
      e.kf[t] = 2 === n.length ? [
        [a, n[0]],
        [o, n[1]]
      ] : [
        [a, n[0]],
        [a + .15 * (o - a), n[1]],
        [a + .85 * (o - a), n[2]],
        [o, n[3]]
      ]
    }) : e.kf = {}, tl(), fxUI(), vui()
  };
  const a = document.createElement("select");
  a.dataset.min = 3, a.innerHTML = '<option value="smooth">Keyframes: smooth</option><option value="linear">Keyframes: linear</option><option value="hold">Keyframes: hold</option>', a.value = cs.ease || "smooth", a.onchange = () => {
    cs.ease = a.value, vui()
  }, e.append(t, a)
}
tl(), fxUI(), render(0);
const gn = AC.createGain();
gn.connect(AC.destination);
let buf = null,
  sel = [0, 0],
  ah = [],
  src = null,
  dragS = null,
  ati = -1,
  srcs = [],
  mrec = null;
const tracks = [],
  reg = () => sel[1] > sel[0] ? sel : [0, buf.length],
  maxLen = () => tracks.reduce((e, t, a) => {
    const o = a === ati ? buf : t.buf;
    return Math.max(e, o ? o.length : 0)
  }, 0);

function syncTrack() {
  if (ati >= 0 && tracks[ati]) {
    const e = tracks[ati];
    e.buf = buf, e.ah = ah, e.sel = sel
  }
}

function markActive() {
  document.querySelectorAll("#atracks .tk").forEach((e, t) => e.classList.toggle("a", t === ati))
}

function switchTrack(e) {
  if (e === ati || e < 0 || e >= tracks.length) return;
  syncTrack(), ati = e;
  const t = tracks[e];
  buf = t.buf, ah = t.ah, sel = t.sel, markActive(), drawW(), info()
}

function addTrack(e, t) {
  syncTrack(), tracks.push({
    name: t || "Track " + (tracks.length + 1),
    buf: e,
    ah: [],
    sel: [0, 0],
    gain: 1,
    mute: !1,
    solo: !1
  }), ati = tracks.length - 1;
  const a = tracks[ati];
  buf = a.buf, ah = a.ah, sel = a.sel, trackUI(), drawW(), info()
}

function removeTrack(e) {
  if (syncTrack(), stopA(), tracks.splice(e, 1), tracks.length) {
    ati = Math.min(e, tracks.length - 1);
    const t = tracks[ati];
    buf = t.buf, ah = t.ah, sel = t.sel
  } else ati = -1, buf = null, ah = [], sel = [0, 0];
  trackUI(), drawW(), info()
}
const gainOf = e => e.mute || tracks.some(e => e.solo) && !e.solo ? 0 : e.gain,
  applyGains = () => tracks.forEach(e => {
    e.node && (e.node.gain.value = gainOf(e))
  });

function info() {
  const e = $("ast");
  if (!buf || ati < 0) return void(e.textContent = tracks.length ? "Click a track to select it." : "No tracks yet. Open audio, press Record, or add an empty track. Drag across a waveform to select.");
  const t = buf.sampleRate,
    [a, o] = reg();
  e.textContent = `${tracks[ati].name} · ${buf.numberOfChannels>1?"Stereo":"Mono"} · ${t} Hz    Selection ${(a/t).toFixed(3)} – ${(o/t).toFixed(3)} s    Length ${((o-a)/t).toFixed(3)} s    Tracks ${tracks.length}`;
  const n = document.querySelectorAll("#atracks .ti")[ati];
  n && (n.textContent = `${buf.numberOfChannels>1?"Stereo":"Mono"}, ${t} Hz`)
}

function trackUI() {
  const e = $("atracks");
  e.innerHTML = "", tracks.length ? (tracks.forEach((t, a) => {
    const o = document.createElement("div");
    o.className = "tk" + (a === ati ? " a" : ""), o.innerHTML = '<div class="tp"><input class="tn"><span class="ti" style="color:var(--mut)"></span><div class="row"><button class="tm" aria-pressed="false">Mute</button><button class="ts" aria-pressed="false">Solo</button><button class="tx" title="Remove this track">✕</button></div><label class="s" style="grid-template-columns:36px 1fr">Gain<input type="range" class="tg" min="0" max="1.5" step="0.05"></label></div><div class="wv"><canvas class="wcv"></canvas><div class="aph" style="display:none"></div></div>';
    const n = e => o.querySelector(e),
      s = n(".wcv");
    t.cv = s, n(".tn").value = t.name, n(".tn").oninput = e => t.name = e.target.value, n(".tg").value = t.gain, n(".tg").oninput = e => {
      t.gain = +e.target.value, applyGains()
    };
    [
      [".tm", t.mute],
      [".ts", t.solo]
    ].forEach(([e, t]) => {
      n(e).setAttribute("aria-pressed", t), n(e).style.background = t ? ".tm" === e ? "var(--ac2)" : "var(--ac)" : ""
    }), n(".tm").onclick = () => {
      t.mute = !t.mute, tracks.forEach(e => e.cv && 0), document.querySelectorAll("#atracks .tk").forEach((e, t) => {
        const a = tracks[t];
        e.querySelector(".tm").style.background = a.mute ? "var(--ac2)" : "", e.querySelector(".tm").setAttribute("aria-pressed", a.mute)
      }), drawW(), applyGains()
    }, n(".ts").onclick = () => {
      t.solo = !t.solo, document.querySelectorAll("#atracks .tk").forEach((e, t) => {
        const a = tracks[t];
        e.querySelector(".ts").style.background = a.solo ? "var(--ac)" : "", e.querySelector(".ts").setAttribute("aria-pressed", a.solo)
      }), applyGains()
    }, n(".tx").onclick = () => removeTrack(a), n(".tp").onclick = e => {
      "INPUT" !== e.target.tagName && "BUTTON" !== e.target.tagName && switchTrack(a)
    };
    const r = e => {
      const t = s.getBoundingClientRect();
      return Math.min(buf.length, Math.round(K((e.clientX - t.left) / t.width, 0, 1) * maxLen()))
    };
    s.onpointerdown = e => {
      switchTrack(a), buf && (dragS = r(e), sel = [dragS, dragS], s.setPointerCapture(e.pointerId), drawW(), info())
    }, s.onpointermove = e => {
      if (null === dragS || a !== ati) return;
      const t = r(e);
      sel = [Math.min(t, dragS), Math.max(t, dragS)], drawW(), info()
    }, s.onpointerup = () => dragS = null, e.append(o)
  }), drawW()) : e.innerHTML = '<div style="padding:22px;color:var(--mut)">No tracks yet. Use <b>File &gt; Open audio</b>, press <b>Record</b>, or choose <b>Tracks &gt; Add empty track</b>. Add as many tracks as you like and they play together.</div>'
}

function drawW() {
  const e = maxLen();
  tracks.forEach((t, a) => {
    const o = t.cv;
    if (!o || !o.isConnected) return;
    const n = o.getContext("2d"),
      s = devicePixelRatio,
      r = o.width = o.clientWidth * s,
      i = o.height = o.clientHeight * s,
      l = 20 * s,
      c = a === ati ? buf : t.buf,
      p = a === ati ? sel : t.sel;
    if (n.fillStyle = "#1a1a1a", n.fillRect(0, 0, r, i), n.fillStyle = "#262626", n.fillRect(0, 0, r, l), !c || !e) return;
    const d = e / c.sampleRate,
      u = [1, 2, 5, 10, 30, 60, 120, 300].find(e => d / e <= 14) || 300;
    n.fillStyle = "#8c8c8c", n.font = 10 * s + "px system-ui";
    for (let e = 0; e <= d; e += u) {
      const t = e / d * r;
      n.fillRect(t, .5 * l, 1, .5 * l), n.fillText(fmt(e), t + 3, .45 * l)
    }
    p[1] > p[0] && (n.fillStyle = "#34445f", n.fillRect(p[0] / e * r, l, (p[1] - p[0]) / e * r, i - l));
    const f = Math.min(2, c.numberOfChannels),
      h = (i - l) / f,
      m = Math.max(1, Math.round(c.length / e * r));
    for (let e = 0; e < f; e++) n.fillStyle = "#333", n.fillRect(0, l + h * e + h / 2, m, 1), wf(n, c.getChannelData(e), m, .94 * h, l + h * e + .03 * h, t.mute ? "#666" : a === ati ? "#5aa2f0" : "#4670a0")
  })
}
addEventListener("resize", drawW), trackUI(), $("af").onchange = async e => {
  for (const t of e.target.files) try {
    addTrack(await AC.decodeAudioData(await t.arrayBuffer()), t.name.replace(/\.\w+$/, ""))
  } catch (e) {
    toast("Could not decode " + t.name + ". Try WAV, MP3 or M4A.")
  }
  e.target.value = ""
}, $("aaddt").onclick = () => {
  const e = AC.sampleRate;
  addTrack(AC.createBuffer(2, Math.max(5 * e, maxLen() || 0), e), "Empty track")
}, $("anew").onclick = () => {
  tracks.length && !confirm("Start a new audio project? All tracks will be removed.") || (stopA(), tracks.length = 0, ati = -1, buf = null, ah = [], sel = [0, 0], trackUI(), info())
}, $("ashift").onclick = () => {
  if (!buf) return;
  const e = Math.round(parseFloat(prompt("Shift this track by how many seconds? (positive adds silence at the start, negative trims the start)", "1")) * buf.sampleRate);
  e && rebuild(Math.max(1, buf.length + e), (t, a) => {
    e > 0 ? t.set(a, e) : t.set(a.subarray(-e))
  })
};
const clone = e => {
  const t = AC.createBuffer(e.numberOfChannels, e.length, e.sampleRate);
  for (let a = 0; a < t.numberOfChannels; a++) t.getChannelData(a).set(e.getChannelData(a));
  return t
};

function fx(e) {
  if (!buf) return;
  ah.push(buf);
  const [t, a] = reg(), o = clone(buf);
  for (let n = 0; n < o.numberOfChannels; n++) e(o.getChannelData(n), t, a);
  buf = o, drawW(), info()
}

function rebuild(e, t) {
  ah.push(buf);
  const a = AC.createBuffer(buf.numberOfChannels, e, buf.sampleRate);
  for (let e = 0; e < a.numberOfChannels; e++) t(a.getChannelData(e), buf.getChannelData(e));
  buf = a, sel = [0, 0], drawW(), info()
}
const on = (e, t) => e.forEach(e => $(e).onclick = t);

function stopA() {
  srcs.forEach(e => {
    try {
      e.stop()
    } catch (e) {}
  });
  try {
    src && src.stop()
  } catch (e) {}
  srcs = [], src = null, document.querySelectorAll(".aph").forEach(e => e.style.display = "none")
}
async function mixdown() {
  syncTrack();
  const e = AC.sampleRate,
    t = new OfflineAudioContext(2, Math.max(1, maxLen()), e);
  return tracks.forEach(e => {
    if (!e.buf) return;
    const a = t.createGain(),
      o = t.createBufferSource();
    a.gain.value = gainOf(e), a.connect(t.destination), o.buffer = e.buf, o.connect(a), o.start()
  }), t.startRendering()
}

function wavBlob(e) {
  const t = e.numberOfChannels,
    a = e.length * t * 2,
    o = new DataView(new ArrayBuffer(44 + a)),
    n = (e, t) => [...t].forEach((t, a) => o.setUint8(e + a, t.charCodeAt(0)));
  n(0, "RIFF"), o.setUint32(4, 36 + a, !0), n(8, "WAVEfmt "), o.setUint32(16, 16, !0), o.setUint16(20, 1, !0), o.setUint16(22, t, !0), o.setUint32(24, e.sampleRate, !0), o.setUint32(28, e.sampleRate * t * 2, !0), o.setUint16(32, 2 * t, !0), o.setUint16(34, 16, !0), n(36, "data"), o.setUint32(40, a, !0);
  let s = 44;
  const r = [...Array(t)].map((t, a) => e.getChannelData(a));
  for (let a = 0; a < e.length; a++)
    for (let e = 0; e < t; e++) {
      const t = Math.max(-1, Math.min(1, r[e][a]));
      o.setInt16(s, t < 0 ? 32768 * t : 32767 * t, !0), s += 2
    }
  return new Blob([o], {
    type: "audio/wav"
  })
}
$("ag").oninput = e => $("ago").textContent = e.target.value + " dB", $("agb").onclick = () => {
  const e = 10 ** ($("ag").value / 20);
  fx((t, a, o) => {
    for (let n = a; n < o; n++) t[n] = Math.max(-1, Math.min(1, t[n] * e))
  })
}, $("afi").onclick = () => fx((e, t, a) => {
  for (let o = t; o < a; o++) e[o] *= (o - t) / (a - t)
}), $("afo").onclick = () => fx((e, t, a) => {
  for (let o = t; o < a; o++) e[o] *= 1 - (o - t) / (a - t)
}), on(["asil", "asil2"], () => fx((e, t, a) => e.fill(0, t, a))), $("arev").onclick = () => fx((e, t, a) => e.subarray(t, a).reverse()), $("anorm").onclick = () => {
  if (!buf) return;
  const [e, t] = reg();
  let a = 0;
  for (let o = 0; o < buf.numberOfChannels; o++) {
    const n = buf.getChannelData(o);
    for (let o = e; o < t; o++) a = Math.max(a, Math.abs(n[o]))
  }
  a > 0 && fx((e, t, o) => {
    for (let n = t; n < o; n++) e[n] *= .97 / a
  })
}, on(["atrim", "atrim2"], () => {
  if (!buf || sel[1] <= sel[0]) return;
  const [e, t] = sel;
  rebuild(t - e, (a, o) => a.set(o.subarray(e, t)))
}), on(["acut", "acut2"], () => {
  if (!buf || sel[1] <= sel[0]) return;
  const [e, t] = sel;
  rebuild(buf.length - (t - e), (a, o) => {
    a.set(o.subarray(0, e)), a.set(o.subarray(t), e)
  })
}), on(["aun", "aun2"], () => {
  ah.length && (buf = ah.pop(), sel = [0, 0], drawW(), info())
}), $("asall").onclick = () => {
  buf && (sel = [0, buf.length], drawW(), info())
}, $("astop").onclick = stopA, $("aplay").onclick = () => {
  if (!buf) return;
  syncTrack(), stopA(), AC.resume();
  const e = buf.sampleRate,
    t = maxLen(),
    [a, o] = sel[1] > sel[0] ? sel : [0, t],
    n = AC.currentTime;
  tracks.forEach(t => {
    if (!t.buf || a >= t.buf.length) return;
    const n = AC.createGain();
    n.gain.value = gainOf(t), n.connect(gn), t.node = n;
    const s = AC.createBufferSource();
    s.buffer = t.buf, s.connect(n), s.start(0, a / e, Math.max(.001, (Math.min(o, t.buf.length) - a) / e)), srcs.push(s)
  }), src = srcs[0] || null;
  const s = srcs;
  ! function r() {
    const i = a + (AC.currentTime - n) * e;
    srcs !== s || i >= o ? srcs === s && stopA() : (document.querySelectorAll(".aph").forEach(e => {
      e.style.display = "block", e.style.left = i / t * 100 + "%"
    }), requestAnimationFrame(r))
  }()
}, $("aexp").onclick = async () => {
  if (!tracks.length) return void toast("Add or open audio first, then export.");
  toast("Mixing " + tracks.length + " track" + (tracks.length > 1 ? "s" : "") + "…");
  const e = wavBlob(await mixdown());
  if (window._toVideo) return window._toVideo = 0, items.push({
    name: "Audio mixdown.wav",
    url: URL.createObjectURL(e),
    type: "audio"
  }), bin(), void toast("Audio added to the Video library.");
  dl(e, "mixdown.wav")
};
const recToggle = async () => {
  if (mrec) mrec.stop();
  else try {
    const e = await navigator.mediaDevices.getUserMedia({
        audio: !0
      }),
      t = [];
    mrec = new MediaRecorder(e), mrec.ondataavailable = e => t.push(e.data), mrec.onstop = async () => {
      e.getTracks().forEach(e => e.stop()), mrec = null, $("arec").textContent = "● Record", $("arec").style.background = "";
      try {
        addTrack(await AC.decodeAudioData(await new Blob(t).arrayBuffer()), "Recording " + (tracks.length + 1))
      } catch (e) {
        toast("Could not read the recording.")
      }
    }, mrec.start(), $("arec").textContent = "■ Stop recording", $("arec").style.background = "var(--ac2)"
  } catch (e) {
    toast("Microphone access was blocked or no microphone was found.")
  }
};
$("arec").onclick = $("arec2").onclick = recToggle;
let aclip = null;
$("acopy").onclick = () => {
  !buf || sel[1] <= sel[0] ? toast("Select a region first.") : (aclip = [...Array(buf.numberOfChannels)].map((e, t) => buf.getChannelData(t).slice(sel[0], sel[1])), toast("Copied " + ((sel[1] - sel[0]) / buf.sampleRate).toFixed(2) + " s."))
}, $("apaste").onclick = () => {
  if (!buf || !aclip) return void toast("Copy a region first.");
  ah.push(buf);
  const e = sel[0] || 0,
    t = aclip[0].length,
    a = AC.createBuffer(buf.numberOfChannels, buf.length + t, buf.sampleRate);
  for (let o = 0; o < a.numberOfChannels; o++) {
    const n = a.getChannelData(o),
      s = buf.getChannelData(o);
    n.set(s.subarray(0, e)), n.set(aclip[Math.min(o, aclip.length - 1)], e), n.set(s.subarray(e), e + t)
  }
  buf = a, sel = [e, e + t], drawW(), info()
}, $("aspd").onclick = () => {
  if (!buf) return;
  const e = parseFloat(prompt("Speed factor (0.5 = half speed and lower pitch, 2 = double speed)", "1.25"));
  if (!(e > 0)) return;
  ah.push(buf);
  const t = Math.floor(buf.length / e),
    a = AC.createBuffer(buf.numberOfChannels, t, buf.sampleRate);
  for (let o = 0; o < a.numberOfChannels; o++) {
    const n = a.getChannelData(o),
      s = buf.getChannelData(o);
    for (let a = 0; a < t; a++) {
      const t = a * e,
        o = 0 | t,
        r = t - o;
      n[a] = s[o] * (1 - r) + (s[o + 1] || 0) * r
    }
  }
  buf = a, sel = [0, 0], drawW(), info()
}, $("aecho").onclick = () => {
  if (!buf) return;
  const e = Math.round(.25 * buf.sampleRate);
  fx((t, a, o) => {
    for (let n = a + e; n < o; n++) t[n] += .4 * t[n - e]
  })
}, $("asendv").onclick = () => {
  tracks.length ? (window._toVideo = 1, $("aexp").click()) : toast("Open audio first.")
};
const mixN = (e, t, a, o) => {
    const n = e.createGain(),
      s = e.createGain(),
      r = e.createGain();
    return s.gain.value = 1 - o / 100, r.gain.value = o / 100, t.connect(s), s.connect(n), a.connect(r), r.connect(n), n
  },
  lfo = (e, t, a, o) => {
    const n = e.createOscillator(),
      s = e.createGain();
    n.frequency.value = t, s.gain.value = a, n.connect(s), s.connect(o), n.start()
  },
  bq = (e, t, a, o, n) => {
    const s = e.createBiquadFilter();
    return s.type = t, s.frequency.value = a, o && (s.Q.value = o), void 0 !== n && (s.gain.value = n), s
  },
  AFX = {
    Reverb: {
      lv: 1,
      p: [
        ["Room size (s)", .2, 4, 1.6],
        ["Wet %", 0, 100, 30]
      ],
      g: (e, t, a) => {
        const o = Math.floor(e.sampleRate * a[0]),
          n = e.createBuffer(2, o, e.sampleRate);
        for (let e = 0; e < 2; e++) {
          const t = n.getChannelData(e);
          for (let e = 0; e < o; e++) t[e] = (2 * Math.random() - 1) * Math.pow(1 - e / o, 3)
        }
        const s = e.createConvolver();
        return s.buffer = n, t.connect(s), mixN(e, t, s, a[1])
      }
    },
    "Delay / echo": {
      lv: 1,
      p: [
        ["Time (ms)", 20, 1500, 350],
        ["Feedback %", 0, 90, 40]
      ],
      f: (e, t, a, o, n) => {
        const s = Math.round(t[0] / 1e3 * a),
          r = t[1] / 100;
        for (let t = o + s; t < n; t++) e[t] += e[t - s] * r
      }
    },
    "Low-pass filter": {
      lv: 1,
      p: [
        ["Cutoff (Hz)", 100, 18e3, 4e3]
      ],
      g: (e, t, a) => {
        const o = bq(e, "lowpass", a[0], .7);
        return t.connect(o), o
      }
    },
    "High-pass filter": {
      lv: 1,
      p: [
        ["Cutoff (Hz)", 20, 8e3, 200]
      ],
      g: (e, t, a) => {
        const o = bq(e, "highpass", a[0], .7);
        return t.connect(o), o
      }
    },
    "Noise gate": {
      lv: 1,
      p: [
        ["Threshold (dB)", -80, -10, -45],
        ["Release (ms)", 5, 500, 80]
      ],
      f: (e, t, a, o, n) => {
        const s = 10 ** (t[0] / 20),
          r = Math.exp(-1 / (a * t[1] / 1e3));
        let i = 0,
          l = 0;
        for (let t = o; t < n; t++) {
          const a = Math.abs(e[t]);
          i = a > i ? a : i * r + a * (1 - r);
          const o = i > s ? 1 : 0;
          l += (o - l) * (o > l ? .01 : .002), e[t] *= l
        }
      }
    },
    Chorus: {
      lv: 2,
      p: [
        ["Rate (Hz)", .1, 5, 1.2],
        ["Depth (ms)", 1, 15, 6],
        ["Mix %", 0, 100, 50]
      ],
      g: (e, t, a) => {
        const o = e.createGain(),
          n = (n, s) => {
            const r = e.createDelay(.1);
            r.delayTime.value = n, lfo(e, a[0] * s, a[1] / 2e3, r.delayTime), t.connect(r), r.connect(o)
          };
        return n(.02, 1), n(.027, 1.13), mixN(e, t, o, a[2])
      }
    },
    Flanger: {
      lv: 2,
      p: [
        ["Rate (Hz)", .05, 3, .4],
        ["Depth (ms)", .5, 6, 3],
        ["Mix %", 0, 100, 50]
      ],
      g: (e, t, a) => {
        const o = e.createDelay(.05),
          n = e.createGain();
        return o.delayTime.value = .004, n.gain.value = .5, lfo(e, a[0], a[1] / 2e3, o.delayTime), t.connect(o), o.connect(n), n.connect(o), mixN(e, t, o, a[2])
      }
    },
    Tremolo: {
      lv: 2,
      p: [
        ["Rate (Hz)", .5, 20, 5],
        ["Depth %", 0, 100, 70]
      ],
      g: (e, t, a) => {
        const o = e.createGain();
        return o.gain.value = 1 - a[1] / 200, lfo(e, a[0], a[1] / 200, o.gain), t.connect(o), o
      }
    },
    Distortion: {
      lv: 2,
      p: [
        ["Drive", 1, 100, 30],
        ["Mix %", 0, 100, 100]
      ],
      g: (e, t, a) => {
        const o = e.createWaveShaper(),
          n = a[0],
          s = 1024,
          r = new Float32Array(s);
        for (let e = 0; e < s; e++) {
          const t = 2 * e / s - 1;
          r[e] = (1 + n) * t / (1 + n * Math.abs(t))
        }
        return o.curve = r, t.connect(o), mixN(e, t, o, a[1])
      }
    },
    "Telephone / radio": {
      lv: 2,
      p: [
        ["Low (Hz)", 100, 2e3, 300],
        ["High (Hz)", 1e3, 12e3, 3400]
      ],
      g: (e, t, a) => {
        const o = bq(e, "highpass", a[0], .7),
          n = bq(e, "lowpass", a[1], .7);
        return t.connect(o), o.connect(n), n
      }
    },
    "Pan (stereo)": {
      lv: 2,
      p: [
        ["Pan (-100 left, 100 right)", -100, 100, 0]
      ],
      f: (e, t, a, o, n, s) => {
        const r = t[0] / 100,
          i = 0 === s ? Math.min(1, 1 - r) : Math.min(1, 1 + r);
        for (let t = o; t < n; t++) e[t] *= i
      }
    },
    "Parametric EQ": {
      lv: 3,
      p: [
        ["Frequency (Hz)", 40, 12e3, 1e3],
        ["Gain (dB)", -18, 18, 6],
        ["Q", .3, 8, 1]
      ],
      g: (e, t, a) => {
        const o = bq(e, "peaking", a[0], a[2], a[1]);
        return t.connect(o), o
      }
    },
    Compressor: {
      lv: 3,
      p: [
        ["Threshold (dB)", -60, 0, -24],
        ["Ratio", 1, 20, 4],
        ["Makeup gain (dB)", 0, 18, 6]
      ],
      g: (e, t, a) => {
        const o = e.createDynamicsCompressor(),
          n = e.createGain();
        return o.threshold.value = a[0], o.ratio.value = a[1], o.attack.value = .005, o.release.value = .15, n.gain.value = 10 ** (a[2] / 20), t.connect(o), o.connect(n), n
      }
    },
    "Robot voice": {
      lv: 3,
      p: [
        ["Frequency (Hz)", 20, 400, 60]
      ],
      f: (e, t, a, o, n) => {
        for (let s = o; s < n; s++) e[s] *= Math.sin(2 * Math.PI * t[0] * s / a)
      }
    },
    Bitcrusher: {
      lv: 3,
      p: [
        ["Bits", 2, 16, 6],
        ["Downsample", 1, 32, 4]
      ],
      f: (e, t, a, o, n) => {
        const s = 2 ** (t[0] - 1);
        let r = 0;
        for (let a = o; a < n; a++)(a - o) % Math.round(t[1]) === 0 && (r = Math.round(e[a] * s) / s), e[a] = r
      }
    },
    "Invert phase": {
      lv: 3,
      p: [],
      f: (e, t, a, o, n) => {
        for (let t = o; t < n; t++) e[t] = -e[t]
      }
    },
    "Remove DC offset": {
      lv: 3,
      p: [],
      f: (e, t, a, o, n) => {
        let s = 0;
        for (let t = o; t < n; t++) s += e[t];
        s /= n - o || 1;
        for (let t = o; t < n; t++) e[t] -= s
      }
    }
  };
async function afxRender(e, t, a, o, n) {
  const s = AFX[e],
    r = a.sampleRate,
    i = clone(a),
    l = i.numberOfChannels;
  if (s.f) {
    for (let e = 0; e < l; e++) s.f(i.getChannelData(e), t, r, o, n, e);
    return i
  }
  const c = n - o,
    p = new OfflineAudioContext(l, c, r),
    d = p.createBuffer(l, c, r);
  for (let e = 0; e < l; e++) d.getChannelData(e).set(i.getChannelData(e).subarray(o, n));
  const u = p.createBufferSource();
  u.buffer = d, s.g(p, u, t).connect(p.destination), u.start();
  const f = await p.startRendering();
  for (let e = 0; e < l; e++) i.getChannelData(e).set(f.getChannelData(e).subarray(0, c), o);
  return i
}
const afxP = () => AFX[$("afxs").value].p.map((e, t) => +$("ap" + t).value);

function afxUI() {
  const e = AFX[$("afxs").value],
    t = $("afxp");
  t.innerHTML = "", e.p.length ? e.p.forEach((e, a) => {
    const o = e[2] - e[1] > 50 ? 1 : .01;
    t.insertAdjacentHTML("beforeend", `<label>${e[0]}</label><div class="row"><input type="range" id="ap${a}" min="${e[1]}" max="${e[2]}" step="${o}" value="${e[3]}"><output style="flex:none;width:52px;text-align:right">${e[3]}</output></div>`);
    const n = $("ap" + a);
    n.oninput = () => n.nextSibling.textContent = n.value
  }) : t.innerHTML = '<span style="grid-column:1/3;color:var(--mut)">No settings. Press Apply.</span>'
}
Object.keys(AFX).forEach(e => {
  const t = document.createElement("button");
  t.textContent = e + "…", t.dataset.min = AFX[e].lv, t.onclick = () => {
    buf ? ($("afxs").value = e, afxUI(), $("adlg").showModal()) : toast("Open an audio file first.")
  }, $("afxm").append(t)
}), $("afxs").innerHTML = Object.keys(AFX).map(e => `<option>${e}</option>`).join(""), $("afxs").onchange = afxUI, afxUI(), $("afxc").onclick = () => $("adlg").close(), $("afxo").onclick = async () => {
  const e = $("afxs").value;
  if (!buf) return;
  const [t, a] = reg();
  try {
    const o = await afxRender(e, afxP(), buf, t, a);
    ah.push(buf), buf = o, drawW(), info(), $("adlg").close(), toast(e + " applied.")
  } catch (t) {
    toast("Could not apply " + e + ": " + t.message)
  }
}, $("afxv").onclick = async () => {
  if (!buf) return;
  const e = buf.sampleRate,
    [t, a] = reg(),
    o = Math.min(a, t + 6 * e),
    n = o - t,
    s = AC.createBuffer(buf.numberOfChannels, n, e);
  for (let e = 0; e < s.numberOfChannels; e++) s.getChannelData(e).set(buf.getChannelData(e).subarray(t, o));
  try {
    const e = await afxRender($("afxs").value, afxP(), s, 0, n);
    stopA(), AC.resume();
    const t = AC.createBufferSource();
    t.buffer = e, t.connect(gn), t.start(), src = t
  } catch (e) {
    toast("Preview failed: " + e.message)
  }
}, ["mb", "mt", "mc", "mr", "ml"].forEach(e => $(e).oninput = e => e.target.nextSibling.textContent = e.target.value), $("mgo").onclick = async () => {
  if (!buf) return;
  ah.push(buf);
  const e = new OfflineAudioContext(buf.numberOfChannels, buf.length, buf.sampleRate),
    t = e.createBufferSource();
  t.buffer = buf;
  const a = e.createBiquadFilter();
  a.type = "lowshelf", a.frequency.value = 120, a.gain.value = +$("mb").value;
  const o = e.createBiquadFilter();
  o.type = "highshelf", o.frequency.value = 8e3, o.gain.value = +$("mt").value;
  const n = e.createDynamicsCompressor();
  n.threshold.value = +$("mc").value, n.ratio.value = +$("mr").value, n.attack.value = .01, n.release.value = .2;
  const s = e.createGain();
  s.gain.value = 10 ** (Math.min(12, -$("mc").value / 3) / 20);
  const r = e.createDynamicsCompressor();
  r.threshold.value = +$("ml").value, r.knee.value = 0, r.ratio.value = 20, r.attack.value = .001, r.release.value = .08, t.connect(a), a.connect(o), o.connect(n), n.connect(s), s.connect(r), r.connect(e.destination), t.start();
  const i = await e.startRendering();
  let l = 0;
  for (let e = 0; e < i.numberOfChannels; e++) {
    const t = i.getChannelData(e);
    for (let e = 0; e < t.length; e++) l = Math.max(l, Math.abs(t[e]))
  }
  const c = l > 0 ? 10 ** (+$("ml").value / 20) / l : 1;
  let p = 0,
    d = 0;
  for (let e = 0; e < i.numberOfChannels; e++) {
    const t = i.getChannelData(e);
    for (let e = 0; e < t.length; e++) t[e] *= c, p += t[e] * t[e], d++
  }
  buf = i, sel = [0, 0], drawW(), info(), $("ast").textContent += `    Mastered: peak ${(20*Math.log10(l*c)).toFixed(1)} dBFS, RMS ${(10*Math.log10(p/d)).toFixed(1)} dBFS`
};
const m3c = $("m3c"),
  S3 = new THREE.Scene,
  C3 = new THREE.PerspectiveCamera(50, 1, .1, 500);
let R3, glOK = !0;
try {
  R3 = new THREE.WebGLRenderer({
    canvas: m3c,
    antialias: !0,
    powerPreference: "high-performance"
  })
} catch (e) {
  glOK = !1, R3 = new Proxy({
    shadowMap: {},
    capabilities: {},
    getContext: () => ({
      getExtension: () => null,
      getParameter: () => "no GPU"
    })
  }, {
    get: (e, t) => t in e ? e[t] : () => {}
  })
}
R3.shadowMap.enabled = !0, R3.shadowMap.type = THREE.PCFSoftShadowMap, R3.toneMapping = THREE.ACESFilmicToneMapping, R3.outputEncoding = THREE.sRGBEncoding, R3.setPixelRatio(Math.min(2, devicePixelRatio)), S3.background = new THREE.Color("#2b3140");
const grid = new THREE.GridHelper(40, 40, 6715272, 3817810),
  amb = new THREE.AmbientLight(16777215, .45),
  sun = new THREE.DirectionalLight(16777215, 1.2),
  gnd = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({
    opacity: .3
  })),
  bh = new THREE.BoxHelper(new THREE.Object3D, 16763904);
sun.position.set(6, 10, 5), sun.castShadow = !0, sun.shadow.mapSize.set(2048, 2048), Object.assign(sun.shadow.camera, {
  left: -15,
  right: 15,
  top: 15,
  bottom: -15,
  near: .5,
  far: 60
}), sun.shadow.camera.updateProjectionMatrix(), gnd.rotation.x = -Math.PI / 2, gnd.receiveShadow = !0, bh.visible = !1, S3.add(grid, amb, sun, gnd, bh);
let az = .8,
  elv = .45,
  dist = 14,
  so = null,
  cnt = 0,
  m3run = !1,
  last3 = 0,
  tt = 0,
  pd3 = null;
const objs = [],
  tgt = new THREE.Vector3(0, 1, 0);

function cam3() {
  C3.position.set(tgt.x + dist * Math.cos(elv) * Math.sin(az), tgt.y + dist * Math.sin(elv), tgt.z + dist * Math.cos(elv) * Math.cos(az)), C3.lookAt(tgt)
}
cam3();
{
  const e = R3.getContext(),
    t = e.getExtension("WEBGL_debug_renderer_info"),
    a = t ? e.getParameter(t.UNMASKED_RENDERER_WEBGL) : "GPU";
  $("m3st").textContent = glOK ? `${R3.capabilities.isWebGL2?"WebGL 2":"WebGL 1"} · ${a} · ` + (/swiftshader|llvmpipe|software/i.test(a) ? "software rendering (no GPU found)" : "hardware accelerated") : "WebGL is not available in this browser, so 3D is disabled."
}
const S = (e, t, a, o, n, s) => `<label class="s"><span>${t}</span><input type="range" id="${e}" min="${a}" max="${o}" step="${n}" value="${s}"><output>${s}</output></label>`,
  C = (e, t, a) => `<label class="s" style="grid-template-columns:76px 1fr"><span>${t}</span><input type="color" id="${e}" value="${a}"></label>`,
  K3 = (e, t, a) => `<label class="s" style="grid-template-columns:96px 1fr"><span>${t}</span><input type="checkbox" id="${e}"${a?" checked":""}></label>`;
$("m3prop").innerHTML = `<div id="m3none" style="color:var(--mut)">Add a shape from the Add menu, then click it to edit.</div>\n<div id="m3tr">${S("tpx","Position X",-10,10,.1,0)}${S("tpy","Position Y",-10,10,.1,0)}${S("tpz","Position Z",-10,10,.1,0)}${S("trx","Rotate X",-180,180,1,0)}${S("try","Rotate Y",-180,180,1,0)}${S("trz","Rotate Z",-180,180,1,0)}${S("tsc","Scale",.1,5,.05,1)}<div data-min="2">${S("tsx","Stretch X",.1,5,.05,1)}${S("tsy","Stretch Y",.1,5,.05,1)}${S("tsz","Stretch Z",.1,5,.05,1)}</div><div class="row"><button id="m3dup">Duplicate</button><button id="m3del">Delete</button></div></div>\n<div id="m3mt"><b>Material</b><label class="s" style="grid-template-columns:76px 1fr" data-min="2"><span>Shading</span><select id="m3sh"><option value="standard">Standard (PBR)</option><option value="phong">Phong</option><option value="lambert">Lambert</option><option value="toon">Toon</option><option value="unlit">Unlit</option><option value="normal">Normals</option></select></label>\n${C("m3col","Color","#c8d0e0")}<div data-min="2">${S("m3met","Metalness",0,1,.01,.2)}${S("m3rou","Roughness",0,1,.01,.5)}${S("m3opa","Opacity",0,1,.01,1)}\n<div id="m3pbr"><b>Texture maps (PBR)</b><label class="s" style="grid-template-columns:96px 1fr"><span>Color map</span><select id="m3tx"></select></label><div id="m3maps"></div>\n${S("m3rx","Tiling X",.1,20,.1,1)}${S("m3ry","Tiling Y",.1,20,.1,1)}${S("m3ns","Normal strength",0,3,.05,1)}<button id="m3apbr" title="Builds normal and roughness maps from the color map">Make normal + roughness from color map</button></div>${K3("m3wire","Wireframe")}</div>\n<div data-min="3">${C("m3em","Emissive","#000000")}${K3("m3flat","Flat shading")}</div></div>\n<div id="m3sp" data-min="2"><b>Shape</b><div id="m3spp"></div>\n<div style="color:var(--mut);font-size:11px">Changing the size sliders rebuilds the shape and clears bends and sculpting.</div>\n<b>Bend and twist</b>${S("md","Amount",-1,1,.01,.3)}<div class="row"><button data-md="twist">Twist</button><button data-md="taper">Taper</button><button data-md="bend">Bend</button><button data-md="noise">Rough</button></div><button id="m3rs">Reset shape</button>\n<b>Sculpt</b>${K3("m3sc","Sculpt mode (drag on object)")}${S("m3sr","Brush size",.1,3,.05,.6)}${S("m3ss","Strength",.01,1,.01,.3)}\n<label class="s" style="grid-template-columns:76px 1fr"><span>Brush</span><select id="m3sm"><option value="push">Pull out</option><option value="pull">Push in</option><option value="smooth">Smooth</option></select></label></div>\n<div id="m3cut" data-min="2"><b>Cut in half</b><label class="s" style="grid-template-columns:76px 1fr"><span>Axis</span><select id="m3ca"><option value="x">X (left and right)</option><option value="y" selected>Y (top and bottom)</option><option value="z">Z (front and back)</option></select></label>\n${S("m3co","Position",-1,1,.01,0)}${S("m3cg","Gap",0,1.5,.05,.3)}${K3("m3cp","Show cut plane",1)}<button id="m3cb" class="p">Cut in half</button></div>\n<div id="m3lt"><b>Light</b>${S("l3i","Intensity",0,10,.1,2)}${C("l3c","Color","#ffd9a0")}</div>\n<div id="m3fx"><b>Effect</b><div id="m3fk">${S("e3k","Intensity",.1,3,.1,1)}${S("e3s","Size",.2,3,.1,1)}</div><div id="m3wt">${S("e3w","Wave height",0,1,.01,.25)}</div><div id="m3gun"><button id="m3fire" class="p">Fire!</button>${K3("m3auto","Auto fire")}</div></div>`, $("m3scene").innerHTML = `${S("s3i","Sun",0,3,.05,1.2)}${S("s3a","Sun angle",0,360,1,40)}${S("s3m","Ambient",0,2,.05,.45)}<div data-min="3">${S("s3x","Exposure",.2,3,.05,1)}</div>${C("s3bg","Background","#2b3140")}${K3("s3sh","Shadows",1)}${K3("s3gr","Grid",1)}`;
const SHP = {
    cube: [
      ["w", "Width", .2, 8, 2, .05],
      ["h", "Height", .2, 8, 2, .05],
      ["d", "Depth", .2, 8, 2, .05],
      ["s", "Segments", 1, 32, 10, 1]
    ],
    sphere: [
      ["r", "Radius", .2, 4, 1.2, .05],
      ["ws", "Width segments", 6, 96, 48, 1],
      ["hs", "Height segments", 4, 64, 32, 1]
    ],
    cylinder: [
      ["rt", "Top radius", 0, 4, 1, .05],
      ["rb", "Bottom radius", 0, 4, 1, .05],
      ["h", "Height", .2, 8, 2.4, .05],
      ["rs", "Radial segments", 3, 96, 48, 1],
      ["hs", "Height segments", 1, 48, 16, 1]
    ],
    cone: [
      ["r", "Radius", .1, 4, 1.1, .05],
      ["h", "Height", .2, 8, 2.4, .05],
      ["rs", "Radial segments", 3, 96, 48, 1],
      ["hs", "Height segments", 1, 48, 16, 1]
    ],
    torus: [
      ["r", "Radius", .2, 4, 1.1, .05],
      ["t", "Tube", .05, 2, .4, .05],
      ["rs", "Radial segments", 3, 64, 24, 1],
      ["ts", "Tubular segments", 3, 128, 64, 1]
    ],
    plane: [
      ["w", "Width", .2, 12, 5, .05],
      ["h", "Height", .2, 12, 5, .05],
      ["s", "Segments", 1, 64, 24, 1]
    ]
  },
  GEOP = {
    cube: e => new THREE.BoxGeometry(e.w, e.h, e.d, e.s, e.s, e.s),
    sphere: e => new THREE.SphereGeometry(e.r, e.ws, e.hs),
    cylinder: e => new THREE.CylinderGeometry(e.rt, e.rb, e.h, e.rs, e.hs),
    cone: e => new THREE.ConeGeometry(e.r, e.h, e.rs, e.hs),
    torus: e => new THREE.TorusGeometry(e.r, e.t, e.rs, e.ts),
    plane: e => new THREE.PlaneGeometry(e.w, e.h, e.s, e.s)
  },
  defGP = e => Object.fromEntries(SHP[e].map(e => [e[0], e[4]])),
  GEO = Object.fromEntries(Object.keys(SHP).map(e => [e, () => GEOP[e](defGP(e))])),
  MATS = {
    standard: THREE.MeshStandardMaterial,
    phong: THREE.MeshPhongMaterial,
    lambert: THREE.MeshLambertMaterial,
    toon: THREE.MeshToonMaterial,
    unlit: THREE.MeshBasicMaterial,
    normal: THREE.MeshNormalMaterial
  },
  texC = {};

function TEX(e) {
  if (texC[e]) return texC[e];
  const t = document.createElement("canvas");
  t.width = t.height = 256;
  const a = t.getContext("2d");
  if ("checker" === e)
    for (let e = 0; e < 8; e++)
      for (let t = 0; t < 8; t++) a.fillStyle = (e + t) % 2 ? "#ddd" : "#333", a.fillRect(32 * e, 32 * t, 32, 32);
  else if ("bricks" === e) {
    a.fillStyle = "#8a3b2b", a.fillRect(0, 0, 256, 256), a.fillStyle = "#d8c9b0";
    for (let e = 0; e < 8; e++) {
      a.fillRect(0, 32 * e, 256, 3);
      for (let t = 0; t < 4; t++) a.fillRect(64 * t + (e % 2 ? 32 : 0), 32 * e, 3, 32)
    }
  } else if ("noise" === e) {
    const e = a.createImageData(256, 256);
    for (let t = 0; t < e.data.length; t += 4) {
      const a = 100 + 120 * Math.random();
      e.data[t] = e.data[t + 1] = e.data[t + 2] = a, e.data[t + 3] = 255
    }
    a.putImageData(e, 0, 0)
  } else if ("wood" === e)
    for (let e = 0; e < 256; e++) a.fillStyle = `hsl(28,${45+8*Math.sin(e/6)}%,${32+10*Math.sin(e/9+3*Math.sin(e/31))}%)`, a.fillRect(0, e, 256, 1);
  if ("tiles" === e) {
    a.fillStyle = "#cfcabd", a.fillRect(0, 0, 256, 256);
    for (let e = 0; e < 4; e++)
      for (let t = 0; t < 4; t++) {
        const o = 205 + (7 * e + 13 * t) % 5 * 4;
        a.fillStyle = `rgb(${o},${o-6},${o-14})`, a.fillRect(64 * e + 3, 64 * t + 3, 58, 58)
      }
  }
  const o = new THREE.CanvasTexture(t);
  return o.wrapS = o.wrapT = THREE.RepeatWrapping, o.encoding = THREE.sRGBEncoding, texC[e] = o
}
const BUILTIN = {
    checker: "Checker",
    bricks: "Bricks",
    noise: "Noise",
    wood: "Wood",
    tiles: "Tiles"
  },
  SLOTS = [
    ["normal", "Normal map"],
    ["rough", "Roughness map"],
    ["metal", "Metalness map"],
    ["ao", "AO map"],
    ["emis", "Emissive map"],
    ["bump", "Bump map"],
    ["alpha", "Opacity map"]
  ];
let texSlot = "tex";
const texOptions = () => '<option value="none">None</option>' + Object.entries(BUILTIN).map(([e, t]) => `<option value="${e}">${t}</option>`).join("") + Object.keys(texC).filter(e => e.startsWith("up:") || e.startsWith("gen:")).map(e => `<option value="${e}">${e.startsWith("up:")?e.slice(3):e.startsWith("gen:n")?"Generated normal map":"Generated roughness map"}</option>`).join("") + '<option value="__load">Load image…</option>',
  fillTexSel = (e, t) => {
    e.innerHTML = texOptions(), e.value = [...e.options].some(e => e.value === t) ? t : "none"
  },
  texOf = (e, t, a) => {
    if (!e || "none" === e) return null;
    const o = e in BUILTIN ? TEX(e) : texC[e];
    if (!o) return null;
    const n = o.clone();
    return n.wrapS = n.wrapT = THREE.RepeatWrapping, n.repeat.set(a[0], a[1]), n.encoding = t ? THREE.sRGBEncoding : THREE.LinearEncoding, n.needsUpdate = !0, n
  };

function applyMat(e) {
  const t = e.userData.mp;
  if ("water" === e.userData.type) return e.material.color.set(t.color), void(e.material.opacity = t.opacity);
  t.maps = t.maps || {}, t.rep = t.rep || [1, 1];
  const a = {
      wireframe: !!t.wire,
      flatShading: !!t.flat,
      transparent: t.opacity < 1,
      opacity: t.opacity,
      side: THREE.DoubleSide
    },
    o = "standard" === t.shader,
    n = o || "phong" === t.shader,
    s = n || "lambert" === t.shader;
  "normal" !== t.shader && (a.color = t.color), o && (a.metalness = t.metal, a.roughness = t.rough), "phong" === t.shader && (a.shininess = 100 * (1 - t.rough)), s && (a.emissive = t.emis);
  const r = texOf(t.tex, !0, t.rep);
  if (r && (a.map = r), n) {
    const e = texOf(t.maps.normal, !1, t.rep);
    e && (a.normalMap = e, a.normalScale = new THREE.Vector2(t.ns ?? 1, t.ns ?? 1));
    const o = texOf(t.maps.bump, !1, t.rep);
    o && (a.bumpMap = o, a.bumpScale = t.ns ?? 1);
    const n = texOf(t.maps.alpha, !1, t.rep);
    n && (a.alphaMap = n, a.transparent = !0)
  }
  if (o) {
    const o = texOf(t.maps.rough, !1, t.rep);
    o && (a.roughnessMap = o);
    const n = texOf(t.maps.metal, !1, t.rep);
    n && (a.metalnessMap = n);
    const s = texOf(t.maps.ao, !1, t.rep);
    if (s) {
      a.aoMap = s;
      const t = e.geometry;
      t.attributes.uv && !t.attributes.uv2 && t.setAttribute("uv2", t.attributes.uv)
    }
  }
  if (s) {
    const e = texOf(t.maps.emis, !0, t.rep);
    e && (a.emissiveMap = e, t.emis && "#000000" !== t.emis || (a.emissive = "#ffffff"))
  }
  e.material.dispose(), e.material = new MATS[t.shader](a)
}

function autoPBR(e) {
  const t = e.userData.mp;
  if (!t || !t.tex || "none" === t.tex) return void toast("Choose a Color map first.");
  const a = t.tex in BUILTIN ? TEX(t.tex) : texC[t.tex];
  if (!a || !a.image) return void toast("Could not read that image.");
  const o = 512,
    n = document.createElement("canvas");
  n.width = n.height = o;
  const s = n.getContext("2d");
  s.drawImage(a.image, 0, 0, o, o);
  const r = s.getImageData(0, 0, o, o).data,
    i = new Float32Array(o * o);
  for (let e = 0; e < o * o; e++) i[e] = (.3 * r[4 * e] + .59 * r[4 * e + 1] + .11 * r[4 * e + 2]) / 255;
  const l = document.createElement("canvas");
  l.width = l.height = o;
  const c = l.getContext("2d"),
    p = c.createImageData(o, o),
    d = document.createElement("canvas");
  d.width = d.height = o;
  const u = d.getContext("2d"),
    f = u.createImageData(o, o);
  for (let e = 0; e < o; e++)
    for (let t = 0; t < o; t++) {
      const a = 3 * (i[e * o + (t + o - 1) % o] - i[e * o + (t + 1) % o]),
        n = 3 * (i[(e + o - 1) % o * o + t] - i[(e + 1) % o * o + t]),
        s = Math.hypot(a, n, 1),
        r = 4 * (e * o + t);
      p.data[r] = 255 * (a / s * .5 + .5), p.data[r + 1] = 255 * (n / s * .5 + .5), p.data[r + 2] = 255 * (1 / s * .5 + .5), p.data[r + 3] = 255;
      const l = 255 * (.35 + .6 * (1 - i[e * o + t]));
      f.data[r] = f.data[r + 1] = f.data[r + 2] = l, f.data[r + 3] = 255
    }
  c.putImageData(p, 0, 0), u.putImageData(f, 0, 0);
  const h = Date.now();
  texC["gen:n:" + h] = new THREE.CanvasTexture(l), texC["gen:r:" + h] = new THREE.CanvasTexture(d), t.maps = t.maps || {}, t.maps.normal = "gen:n:" + h, t.maps.rough = "gen:r:" + h, applyMat(e), syncUI(), toast("Made normal and roughness maps from the color map.")
}

function reg3(e, t) {
  e.userData.type = t, e.userData.name = t + " " + ++cnt, S3.add(e), objs.push(e), select(e), olist()
}

function addMesh(e) {
  const t = new THREE.Mesh(GEO[e](), new THREE.MeshStandardMaterial);
  t.castShadow = t.receiveShadow = !0, t.position.y = "plane" === e ? .01 : 1.2, "plane" === e && (t.rotation.x = -Math.PI / 2), t.userData.mp = {
    shader: "standard",
    color: "#c8d0e0",
    metal: .2,
    rough: .5,
    opacity: 1,
    wire: 0,
    flat: 0,
    tex: "none",
    emis: "#000000"
  }, t.userData.gp = defGP(e), applyMat(t), reg3(t, e)
}

function addPoint() {
  const e = new THREE.PointLight(16767392, 2, 30, 1.5);
  e.position.set(2, 3, 2), e.add(new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), new THREE.MeshBasicMaterial({
    color: 16767392
  }))), reg3(e, "light")
}
$("m3maps").innerHTML = SLOTS.map(([e, t]) => `<label class="s" style="grid-template-columns:96px 1fr"><span>${t}</span><select id="map_${e}"></select></label>`).join("");
const PVS = "attribute float aSize;attribute float aAlpha;attribute vec3 aColor;varying float vA;varying vec3 vC;void main(){vA=aAlpha;vC=aColor;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*(400./-mv.z);gl_Position=projectionMatrix*mv;}",
  PFS = "varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d)*vA;if(a<.01)discard;gl_FragColor=vec4(vC,a);}",
  rnd = Math.random,
  PFX3 = {
    fire: {
      N: 500,
      rate: 170,
      g: 0,
      add: 1,
      init: (e, t, a) => (a[3 * e] = .5 * (rnd() - .5), a[3 * e + 1] = 0, a[3 * e + 2] = .5 * (rnd() - .5), t[3 * e] = 0, t[3 * e + 1] = 1.6 + 1.4 * rnd(), t[3 * e + 2] = 0, .5 + .7 * rnd()),
      step(e, t, a, o, n, s) {
        o[3 * e] += (6 * (rnd() - .5) - 3 * n[3 * e]) * a, o[3 * e + 2] += (6 * (rnd() - .5) - 3 * n[3 * e + 2]) * a, s.s = .9 - .7 * t, s.a = .9 * (1 - t), s.c = t < .3 ? [1, .95 - 1.6 * t, .6 - 2 * t] : [1 - .6 * (t - .3), .47 - .6 * (t - .3), 0]
      }
    },
    smoke: {
      N: 300,
      rate: 35,
      g: 0,
      add: 0,
      init: (e, t, a) => (a[3 * e] = .4 * (rnd() - .5), a[3 * e + 1] = 0, a[3 * e + 2] = .4 * (rnd() - .5), t[3 * e] = .2 + .3 * rnd(), t[3 * e + 1] = .6 + .6 * rnd(), t[3 * e + 2] = .3 * (rnd() - .5), 3 + 2 * rnd()),
      step(e, t, a, o, n, s) {
        s.s = .7 + 2.4 * t, s.a = Math.min(1, 8 * t) * (1 - t) * .45;
        const r = .28 + .3 * t;
        s.c = [r, r, r]
      }
    },
    spark: {
      N: 140,
      rate: 0,
      g: -9,
      add: 1,
      init(e, t, a) {
        const o = e % 12 == 0;
        return a[3 * e] = a[3 * e + 1] = a[3 * e + 2] = 0, t[3 * e] = (rnd() - .5) * (o ? .4 : 4), t[3 * e + 1] = (rnd() - .5) * (o ? .4 : 4) + (o ? 0 : 1), t[3 * e + 2] = o ? 1.2 : 6 + 10 * rnd(), o ? .07 : .25 + .3 * rnd()
      },
      step(e, t, a, o, n, s) {
        const r = e % 12 == 0;
        s.s = r ? 1.5 * (1 - t) : .12, s.a = 1 - t, s.c = r ? [1, .92, .6] : [1, .6 - .4 * t, .2]
      }
    },
    puff: {
      N: 30,
      rate: 0,
      g: 0,
      add: 0,
      init: (e, t, a) => (a[3 * e] = a[3 * e + 1] = a[3 * e + 2] = 0, t[3 * e] = .8 * (rnd() - .5), t[3 * e + 1] = .8 * (rnd() - .5) + .3, t[3 * e + 2] = 1 + 2 * rnd(), 1.2 + rnd()),
      step(e, t, a, o, n, s) {
        o[3 * e] *= 1 - a, o[3 * e + 2] *= 1 - 1.5 * a, s.s = .3 + 1.4 * t, s.a = .5 * (1 - t), s.c = [.5, .5, .5]
      }
    }
  };

function emitter(e) {
  const t = PFX3[e],
    a = t.N,
    o = new Float32Array(3 * a),
    n = new Float32Array(3 * a),
    s = new Float32Array(a),
    r = new Float32Array(a),
    i = new Float32Array(3 * a),
    l = new Float32Array(a).fill(-1),
    c = new Float32Array(a),
    p = new THREE.BufferGeometry;
  p.setAttribute("position", new THREE.BufferAttribute(o, 3)), p.setAttribute("aSize", new THREE.BufferAttribute(s, 1)), p.setAttribute("aAlpha", new THREE.BufferAttribute(r, 1)), p.setAttribute("aColor", new THREE.BufferAttribute(i, 3));
  const d = new THREE.Points(p, new THREE.ShaderMaterial({
    vertexShader: PVS,
    fragmentShader: PFS,
    transparent: !0,
    depthWrite: !1,
    blending: t.add ? THREE.AdditiveBlending : THREE.NormalBlending
  }));
  d.frustumCulled = !1;
  let u = 0;
  const f = {
      s: 0,
      a: 0,
      c: [1, 1, 1]
    },
    h = e => {
      l[e] = 0, c[e] = t.init(e, n, o)
    };
  return d.userData.k = 1, d.userData.sc = 1, d.userData.burst = e => {
    for (let t = 0, o = 0; t < a && o < e; t++) l[t] < 0 && (h(t), o++)
  }, d.userData.update = (e, m) => {
    u += (m ? t.rate * d.userData.k : 0) * e;
    for (let p = 0; p < a; p++) {
      if (l[p] < 0) {
        if (!(u >= 1)) {
          r[p] = 0;
          continue
        }
        u--, h(p)
      }
      if (l[p] += e, l[p] > c[p]) {
        l[p] = -1, r[p] = 0;
        continue
      }
      const a = l[p] / c[p];
      t.step(p, a, e, n, o, f), n[3 * p + 1] += t.g * e, o[3 * p] += n[3 * p] * e, o[3 * p + 1] += n[3 * p + 1] * e, o[3 * p + 2] += n[3 * p + 2] * e, s[p] = f.s * d.userData.sc, r[p] = f.a, i[3 * p] = f.c[0], i[3 * p + 1] = f.c[1], i[3 * p + 2] = f.c[2]
    }
    const g = p.attributes;
    g.position.needsUpdate = g.aSize.needsUpdate = g.aAlpha.needsUpdate = g.aColor.needsUpdate = !0
  }, d
}

function water() {
  const e = new THREE.PlaneGeometry(14, 14, 70, 70);
  e.rotateX(-Math.PI / 2);
  const t = new THREE.Mesh(e, new THREE.MeshPhysicalMaterial({
    color: "#2a7fbf",
    roughness: .08,
    metalness: .1,
    transparent: !0,
    opacity: .82,
    clearcoat: 1
  }));
  t.receiveShadow = !0;
  const a = e.attributes.position.array.slice();
  return t.userData.amp = .25, t.userData.mp = {
    color: "#2a7fbf",
    opacity: .82
  }, t.userData.update = (o, n) => {
    const s = t.userData.amp,
      r = e.attributes.position.array;
    for (let e = 0; e < r.length; e += 3) {
      const t = a[e],
        o = a[e + 2];
      r[e + 1] = s * (Math.sin(.9 * t + 1.6 * n) + .7 * Math.sin(1.3 * o + 1.1 * n) + .4 * Math.sin(.5 * (t + o) + 2.2 * n)) * .5
    }
    e.attributes.position.needsUpdate = !0, e.computeVertexNormals()
  }, t
}

function bang() {
  const e = .5 * AC.sampleRate | 0,
    t = AC.createBuffer(1, e, AC.sampleRate),
    a = t.getChannelData(0);
  for (let t = 0; t < e; t++) a[t] = (2 * Math.random() - 1) * Math.exp(-t / AC.sampleRate * 14);
  const o = AC.createBufferSource(),
    n = AC.createBiquadFilter();
  o.buffer = t, n.type = "lowpass", n.frequency.value = 2500, o.connect(n), n.connect(AC.destination), AC.resume(), o.start()
}

function gun() {
  const e = new THREE.Group,
    t = new THREE.MeshStandardMaterial({
      color: "#2a2a2e",
      metalness: .9,
      roughness: .3
    }),
    a = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.4, 16), t),
    o = new THREE.Mesh(new THREE.BoxGeometry(.28, .5, 1), t),
    n = emitter("spark"),
    s = emitter("puff"),
    r = new THREE.PointLight(16755285, 0, 12);
  a.rotation.x = Math.PI / 2, a.position.z = .9, o.position.set(0, -.2, .2), a.castShadow = o.castShadow = !0, n.position.z = s.position.z = 1.65, r.position.z = 1.9, e.add(a, o, n, s, r), e.position.y = 1.2;
  const i = e.userData;
  return i.parts = [n, s], i.fl = r, i.kick = 0, i.br = a, i.fire = () => {
    n.userData.burst(70), s.userData.burst(10), r.intensity = 10, i.kick = .12, bang()
  }, e
}

function add3(e) {
  if (GEO[e]) addMesh(e);
  else if ("point" === e) addPoint();
  else if ("water" === e) {
    const e = water();
    e.position.y = .1, reg3(e, "water")
  } else if ("gun" === e) reg3(gun(), "gun");
  else {
    reg3(emitter(e), e)
  }
}

function select(e) {
  so = e, e ? (bh.visible = !e.isLight, bh.setFromObject(e)) : bh.visible = !1, olist(), syncUI()
}

function olist() {
  const e = $("ol");
  e.innerHTML = "", objs.forEach(t => {
    const a = document.createElement("div");
    a.className = "lr" + (t === so ? " a" : ""), a.textContent = t.userData.name, a.onclick = () => select(t), e.append(a)
  })
}

function syncUI() {
  const e = so,
    t = e && e.userData,
    a = (e, t) => {
      const a = $(e);
      a.value = t, "range" === a.type && (a.nextSibling.textContent = (+t).toFixed(2))
    },
    o = (e, t) => $(e).style.display = t ? "" : "none";
  if (o("m3none", !e), ["m3tr", "m3mt", "m3lt", "m3fx", "m3sp", "m3cut"].forEach(e => o(e, 0)), e) {
    if (o("m3tr", 1), a("tpx", e.position.x), a("tpy", e.position.y), a("tpz", e.position.z), a("trx", 180 * e.rotation.x / Math.PI), a("try", 180 * e.rotation.y / Math.PI), a("trz", 180 * e.rotation.z / Math.PI), a("tsc", e.scale.x), a("tsx", e.scale.x), a("tsy", e.scale.y), a("tsz", e.scale.z), e.isMesh) {
      o("m3mt", 1);
      const e = t.mp;
      a("m3col", e.color), a("m3opa", e.opacity);
      const n = "water" === t.type;
      o("m3sh", !n), ["m3met", "m3rou", "m3wire", "m3em", "m3flat"].forEach(e => $(e).closest("label").style.display = n ? "none" : ""), $("m3pbr").style.display = n ? "none" : "", n || (a("m3sh", e.shader), a("m3met", e.metal), a("m3rou", e.rough), fillTexSel($("m3tx"), e.tex || "none"), SLOTS.forEach(([t]) => fillTexSel($("map_" + t), (e.maps || {})[t] || "none")), a("m3rx", (e.rep || [1, 1])[0]), a("m3ry", (e.rep || [1, 1])[1]), a("m3ns", e.ns ?? 1), a("m3em", e.emis), $("m3wire").checked = !!e.wire, $("m3flat").checked = !!e.flat)
    }
    if (e.isMesh && "water" !== t.type && (o("m3sp", 1), o("m3cut", 1), $("m3spp").innerHTML = t.gp ? SHP[t.type].map(e => S("sp_" + e[0], e[1], e[2], e[3], e[5], t.gp[e[0]])).join("") : '<div style="color:var(--mut);font-size:11px">Size sliders are only available for fresh shapes. This one was cut or sculpted, so use Stretch, Bend and Sculpt.</div>'), e.isLight && (o("m3lt", 1), a("l3i", e.intensity), a("l3c", "#" + e.color.getHexString())), ["fire", "smoke", "gun", "water"].includes(t.type))
      if (o("m3fx", 1), o("m3fk", "water" !== t.type && "gun" !== t.type || "gun" === t.type), o("m3wt", "water" === t.type), o("m3gun", "gun" === t.type), "water" === t.type) a("e3w", t.amp);
      else {
        const e = "gun" === t.type ? t.parts[0].userData : t;
        a("e3k", e.k || 1), a("e3s", e.sc || 1)
      }
  }
}
document.querySelectorAll("#model [data-m]").forEach(e => e.onclick = () => add3(e.dataset.m)), $("m3prop").oninput = e => {
  if (!so) return;
  const t = e.target,
    a = t.id,
    o = "checkbox" === t.type ? t.checked : "range" === t.type ? +t.value : t.value,
    n = so.userData;
  "range" === t.type && (t.nextSibling.textContent = (+t.value).toFixed(2));
  const s = Math.PI / 180,
    r = n.mp,
    i = {
      m3sh: "shader",
      m3col: "color",
      m3met: "metal",
      m3rou: "rough",
      m3opa: "opacity",
      m3wire: "wire",
      m3flat: "flat",
      m3tx: "tex",
      m3em: "emis"
    };
  if ("tsx" === a) so.scale.x = o;
  else if ("tsy" === a) so.scale.y = o;
  else if ("tsz" === a) so.scale.z = o;
  else if (a.startsWith("sp_")) n.gp && (n.gp[a.slice(3)] = o, n.modified = 0, so.geometry.dispose(), so.geometry = GEOP[n.type](n.gp), applyMat(so));
  else if ("m3rx" === a || "m3ry" === a) r.rep = r.rep || [1, 1], r.rep["m3rx" === a ? 0 : 1] = o, applyMat(so);
  else if ("m3ns" === a) r.ns = o, applyMat(so);
  else if ("m3sc" === a) sculptOn = o;
  else if ("tpx" === a) so.position.x = o;
  else if ("tpy" === a) so.position.y = o;
  else if ("tpz" === a) so.position.z = o;
  else if ("trx" === a) so.rotation.x = o * s;
  else if ("try" === a) so.rotation.y = o * s;
  else if ("trz" === a) so.rotation.z = o * s;
  else if ("tsc" === a) so.scale.setScalar(o);
  else if ("l3i" === a) so.intensity = o;
  else if ("l3c" === a) so.color.set(o), so.children[0].material.color.set(o);
  else if ("e3w" === a) n.amp = o;
  else if ("e3k" === a || "e3s" === a) {
    ("gun" === n.type ? n.parts : [so]).forEach(e => {
      "e3k" === a ? e.userData.k = o : e.userData.sc = o
    }), "gun" === n.type && "e3k" === a && (n.power = o)
  } else if ("m3auto" === a) n.auto = o;
  else if (a.startsWith("map_")) {
    if ("__load" === o) return texSlot = a.slice(4), $("m3tex").click(), void syncUI();
    r.maps = r.maps || {}, r.maps[a.slice(4)] = o, applyMat(so)
  } else if (i[a] && r) {
    if ("m3tx" === a && "__load" === o) return texSlot = "tex", $("m3tex").click(), void syncUI();
    r[i[a]] = o, applyMat(so)
  }
  bh.setFromObject(so)
}, $("m3prop").onclick = e => {
  const t = e.target;
  if (t.dataset && t.dataset.md && so && so.isMesh && (modify(so, t.dataset.md, +$("md").value), bh.setFromObject(so)), "m3rs" === t.id && so && so.isMesh && resetShape(so), "m3cb" === t.id && cutObject(), "m3apbr" === t.id && so && so.isMesh && autoPBR(so), "m3fire" === e.target.id && so && so.userData.fire && so.userData.fire(), "m3del" === e.target.id && so && (S3.remove(so), objs.splice(objs.indexOf(so), 1), select(null)), "m3dup" === e.target.id && so && so.isMesh && "water" !== so.userData.type) {
    const e = new THREE.Mesh(so.geometry.clone(), so.material.clone());
    e.castShadow = e.receiveShadow = !0, e.userData = JSON.parse(JSON.stringify(so.userData)), e.position.copy(so.position), e.position.x += 1.5, e.rotation.copy(so.rotation), e.scale.copy(so.scale), reg3(e, e.userData.type)
  }
}, $("m3tex").onchange = e => {
  const t = e.target.files[0];
  t && ((new THREE.TextureLoader).load(URL.createObjectURL(t), e => {
    e.wrapS = e.wrapT = THREE.RepeatWrapping;
    const a = "up:" + t.name;
    if (texC[a] = e, so && so.userData.mp) {
      const e = so.userData.mp;
      "tex" === texSlot ? e.tex = a : (e.maps = e.maps || {}, e.maps[texSlot] = a), applyMat(so), syncUI(), toast("Loaded " + t.name + ".")
    }
  }), e.target.value = "")
}, $("m3scene").oninput = e => {
  const t = e.target,
    a = t.id,
    o = "checkbox" === t.type ? t.checked : "range" === t.type ? +t.value : t.value;
  if ("range" === t.type && (t.nextSibling.textContent = (+t.value).toFixed(2)), "s3i" === a) sun.intensity = o;
  else if ("s3a" === a) {
    const e = o * Math.PI / 180;
    sun.position.set(9 * Math.cos(e), 10, 9 * Math.sin(e))
  } else "s3m" === a ? amb.intensity = o : "s3x" === a ? R3.toneMappingExposure = o : "s3bg" === a ? S3.background.set(o) : "s3sh" === a ? R3.shadowMap.enabled = sun.castShadow = o : "s3gr" === a && (grid.visible = o)
};
const ORIG = new WeakMap,
  NB = new WeakMap;
let sculptOn = !1;

function modify(e, t, a) {
  e.userData.modified = 1;
  const o = e.geometry;
  ORIG.has(o) || ORIG.set(o, o.attributes.position.array.slice()), o.computeBoundingBox();
  const n = o.boundingBox,
    s = Math.max(.001, n.max.y - n.min.y),
    r = (n.max.y + n.min.y) / 2,
    i = o.attributes.position;
  for (let e = 0; e < i.count; e++) {
    let o = i.getX(e),
      n = i.getY(e),
      l = i.getZ(e);
    const c = (n - r) / s;
    if ("twist" === t) {
      const e = a * Math.PI * 2 * c,
        t = Math.cos(e),
        n = Math.sin(e);
      [o, l] = [o * t - l * n, o * n + l * t]
    } else if ("taper" === t) {
      const e = 1 - a * (c + .5);
      o *= e, l *= e
    } else if ("bend" === t) o += 3 * a * c * c * s;
    else {
      const e = Math.sin(3.1 * o + 1.7 * n + 2.3 * l) * Math.cos(2.9 * n - 1.3 * l) + .4 * Math.sin(7.7 * o + 5.1 * l),
        t = Math.hypot(o, n, l) || 1;
      o += o / t * e * a * .25, n += n / t * e * a * .25, l += l / t * e * a * .25
    }
    i.setXYZ(e, o, n, l)
  }
  i.needsUpdate = !0, o.computeVertexNormals(), o.computeBoundingSphere()
}

function resetShape(e) {
  const t = e.userData;
  if (t.gp && (t.modified = 0), t.gp) e.geometry.dispose(), e.geometry = GEOP[t.type](t.gp), applyMat(e);
  else {
    const t = ORIG.get(e.geometry);
    t && (e.geometry.attributes.position.array.set(t), e.geometry.attributes.position.needsUpdate = !0, e.geometry.computeVertexNormals())
  }
  bh.setFromObject(e)
}

function weld(e) {
  if (NB.has(e.geometry)) return;
  const t = e.geometry,
    a = t.attributes.position,
    o = t.attributes.uv,
    n = new Map,
    s = [],
    r = [],
    i = t.index ? Array.from(t.index.array) : [...Array(a.count).keys()],
    l = new Int32Array(a.count);
  for (let e = 0; e < a.count; e++) {
    const t = a.getX(e).toFixed(4) + "," + a.getY(e).toFixed(4) + "," + a.getZ(e).toFixed(4);
    let i = n.get(t);
    void 0 === i && (i = s.length / 3, n.set(t, i), s.push(a.getX(e), a.getY(e), a.getZ(e)), o && r.push(o.getX(e), o.getY(e))), l[e] = i
  }
  const c = new THREE.BufferGeometry;
  c.setAttribute("position", new THREE.Float32BufferAttribute(s, 3)), o && c.setAttribute("uv", new THREE.Float32BufferAttribute(r, 2)), c.setIndex(i.map(e => l[e])), c.computeVertexNormals();
  const p = Array.from({
    length: s.length / 3
  }, () => new Set);
  for (let e = 0; e < c.index.count; e += 3) {
    const t = c.index.getX(e),
      a = c.index.getX(e + 1),
      o = c.index.getX(e + 2);
    p[t].add(a).add(o), p[a].add(t).add(o), p[o].add(t).add(a)
  }
  const d = t;
  ORIG.set(c, c.attributes.position.array.slice()), NB.set(c, p.map(e => [...e])), e.geometry = c, e.userData.gp = null, d.dispose()
}
const rcast = new THREE.Raycaster;

function hitMesh(e) {
  const t = m3c.getBoundingClientRect();
  return rcast.setFromCamera(new THREE.Vector2((e.clientX - t.left) / t.width * 2 - 1, -(e.clientY - t.top) / t.height * 2 + 1), C3), rcast.intersectObject(so, !1)[0]
}

function sculptAt(e) {
  const t = so;
  weld(t);
  const a = t.geometry,
    o = a.attributes.position,
    n = a.attributes.normal,
    s = NB.get(a),
    r = t.worldToLocal(e.point.clone()),
    i = Math.max(t.scale.x, t.scale.y, t.scale.z),
    l = +$("m3sr").value / i,
    c = .05 * +$("m3ss").value / i,
    p = $("m3sm").value,
    d = o.array.slice();
  for (let e = 0; e < o.count; e++) {
    const t = o.getX(e) - r.x,
      a = o.getY(e) - r.y,
      i = o.getZ(e) - r.z,
      u = Math.hypot(t, a, i);
    if (u >= l) continue;
    const f = (1 - u / l) ** 2;
    if ("smooth" === p) {
      const t = s[e];
      if (!t.length) continue;
      let a = 0,
        n = 0,
        r = 0;
      t.forEach(e => {
        a += d[3 * e], n += d[3 * e + 1], r += d[3 * e + 2]
      }), a /= t.length, n /= t.length, r /= t.length;
      const i = .5 * f;
      o.setXYZ(e, d[3 * e] + (a - d[3 * e]) * i, d[3 * e + 1] + (n - d[3 * e + 1]) * i, d[3 * e + 2] + (r - d[3 * e + 2]) * i)
    } else {
      const t = ("push" === p ? 1 : -1) * c * f;
      o.setXYZ(e, o.getX(e) + n.getX(e) * t, o.getY(e) + n.getY(e) * t, o.getZ(e) + n.getZ(e) * t)
    }
  }
  o.needsUpdate = !0, a.computeVertexNormals(), bh.setFromObject(t)
}

function sliceGeo(e, t, a) {
  const o = e.index ? e.toNonIndexed() : e.clone(),
    n = o.attributes.position,
    s = o.attributes.normal,
    r = o.attributes.uv,
    i = {
      x: 0,
      y: 1,
      z: 2
    } [t],
    l = [],
    c = [],
    p = [],
    d = e => ({
      p: [n.getX(e), n.getY(e), n.getZ(e)],
      n: s ? [s.getX(e), s.getY(e), s.getZ(e)] : [0, 1, 0],
      u: r ? [r.getX(e), r.getY(e)] : [0, 0]
    }),
    u = (e, t, a) => ({
      p: e.p.map((e, o) => e + (t.p[o] - e) * a),
      n: e.n.map((e, o) => e + (t.n[o] - e) * a),
      u: e.u.map((e, o) => e + (t.u[o] - e) * a)
    }),
    f = (e, t) => {
      const o = [],
        n = [];
      for (let s = 0; s < e.length; s++) {
        const r = e[s],
          l = e[(s + 1) % e.length],
          c = (r.p[i] - a) * t,
          p = (l.p[i] - a) * t;
        if (c >= 0 && o.push(r), c > 0 && p < 0 || c < 0 && p > 0) {
          const e = u(r, l, c / (c - p));
          e.p[i] = a, o.push(e), n.push(e)
        }
      }
      return [o, n]
    };
  for (let e = 0; e < n.count; e += 3) {
    const t = [d(e), d(e + 1), d(e + 2)];
    for (const [e, a] of [
        [1, l],
        [-1, c]
      ]) {
      const [o, n] = f(t, e);
      for (let e = 1; e < o.length - 1; e++) a.push(o[0], o[e], o[e + 1]);
      1 === e && 2 === n.length && p.push([n[0].p, n[1].p])
    }
  }
  const h = e => e.map(e => e.toFixed(4)).join(","),
    m = new Map,
    g = new Map;
  for (const [e, t] of p) {
    const a = h(e),
      o = h(t);
    a !== o && (g.set(a, e), g.set(o, t), m.has(a) || m.set(a, []), m.has(o) || m.set(o, []), m.get(a).push(o), m.get(o).push(a))
  }
  const b = new Set,
    v = [];
  for (const e of m.keys()) {
    if (b.has(e)) continue;
    const t = [];
    let a = e,
      o = null;
    for (; a && !b.has(a);) {
      b.add(a), t.push(g.get(a));
      const e = m.get(a).find(e => e !== o && !b.has(e));
      o = a, a = e
    }
    t.length > 2 && v.push(t)
  }
  const w = {
      x: [1, 2],
      y: [0, 2],
      z: [0, 1]
    } [t],
    x = e => e.map(e => new THREE.Vector2(e[w[0]], e[w[1]])),
    y = v.map(e => ({
      l: e,
      v: x(e)
    }));
  y.forEach(e => e.a = (e => {
    let t = 0;
    for (let a = 0; a < e.length; a++) {
      const o = e[a],
        n = e[(a + 1) % e.length];
      t += o.x * n.y - n.x * o.y
    }
    return t / 2
  })(e.v)), y.forEach(e => {
    const t = y.filter(t => t !== e && Math.abs(t.a) > Math.abs(e.a) && ((e, t) => {
      let a = !1;
      for (let o = 0, n = t.length - 1; o < t.length; n = o++) t[o].y > e.y != t[n].y > e.y && e.x < (t[n].x - t[o].x) * (e.y - t[o].y) / (t[n].y - t[o].y) + t[o].x && (a = !a);
      return a
    })(e.v[0], t.v)).sort((e, t) => Math.abs(e.a) - Math.abs(t.a))[0];
    e.par = t || null
  });
  const k = [];
  y.filter(e => !e.par).forEach(e => {
    const t = y.filter(t => t.par === e);
    let a = e.l.slice(),
      o = e.v.slice();
    e.a < 0 && (a.reverse(), o.reverse());
    const n = [...a],
      s = [...o],
      r = [];
    t.forEach(e => {
      let t = e.l.slice(),
        a = e.v.slice();
      e.a > 0 && (t.reverse(), a.reverse()), r.push(a), n.push(...t), s.push(...a)
    });
    let i = [];
    try {
      i = THREE.ShapeUtils.triangulateShape(o, r)
    } catch (e) {}
    i.forEach(e => k.push(e.map(e => n[e])))
  });
  const $ = new THREE.Vector3;
  $.setComponent(i, 1);
  const M = (e, t) => {
    if (e.length < 3) return null;
    const a = [],
      o = [],
      n = [];
    e.forEach(e => {
      a.push(...e.p), o.push(...e.n), n.push(...e.u)
    });
    const s = $.clone().multiplyScalar(-t);
    k.forEach(e => {
      const [t, r, i] = e.map(e => new THREE.Vector3(...e));
      ((new THREE.Vector3).crossVectors(r.clone().sub(t), i.clone().sub(t)).dot(s) < 0 ? [t, i, r] : [t, r, i]).forEach(e => {
        a.push(e.x, e.y, e.z), o.push(s.x, s.y, s.z), n.push(.25 * e.getComponent(w[0]) + .5, .25 * e.getComponent(w[1]) + .5)
      })
    });
    const r = new THREE.BufferGeometry;
    return r.setAttribute("position", new THREE.Float32BufferAttribute(a, 3)), r.setAttribute("normal", new THREE.Float32BufferAttribute(o, 3)), r.setAttribute("uv", new THREE.Float32BufferAttribute(n, 2)), r
  };
  return [M(l, 1), M(c, -1)]
}

function cutObject() {
  const e = so;
  if (!e || !e.isMesh || "water" === e.userData.type) return;
  e.geometry.computeBoundingBox();
  const t = e.geometry.boundingBox,
    a = $("m3ca").value,
    o = {
      x: 0,
      y: 1,
      z: 2
    } [a],
    n = t.min.getComponent(o),
    s = t.max.getComponent(o),
    r = (s + n) / 2 + +$("m3co").value * (s - n) / 2 + 1e-4 * (s - n),
    [i, l] = sliceGeo(e.geometry, a, r);
  if (!i || !l) return void toast("The cut plane does not pass through the object. Move the Position slider.");
  const c = +$("m3cg").value,
    p = new THREE.Vector3;
  p.setComponent(o, 1), p.applyQuaternion(e.quaternion);
  const d = e.userData.name,
    u = e.userData.type,
    f = (t, a) => {
      const o = new THREE.Mesh(t, e.material.clone());
      return o.castShadow = o.receiveShadow = !0, o.position.copy(e.position).addScaledVector(p, a * c / 2), o.quaternion.copy(e.quaternion), o.scale.copy(e.scale), o.userData = JSON.parse(JSON.stringify(e.userData)), o.userData.gp = null, o
    };
  S3.remove(e), objs.splice(objs.indexOf(e), 1), e.geometry.dispose();
  const h = f(i, 1),
    m = f(l, -1);
  reg3(h, u), reg3(m, u), h.userData.name = d + " (half A)", m.userData.name = d + " (half B)", select(h), olist(), toast("Cut into two halves. Each half is closed and can be moved or edited.")
}
const cutPlane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({
  color: 16734842,
  transparent: !0,
  opacity: .25,
  side: THREE.DoubleSide,
  depthWrite: !1
}));

function updateCutPlane() {
  const e = so && so.isMesh && "water" !== so.userData.type && $("m3cp").checked && $("model").classList.contains("on") && "none" !== getComputedStyle($("m3cut")).display;
  if (cutPlane.visible = !!e, !e) return;
  const t = so,
    a = $("m3ca").value,
    o = {
      x: 0,
      y: 1,
      z: 2
    } [a];
  t.geometry.computeBoundingBox();
  const n = t.geometry.boundingBox,
    s = n.min.getComponent(o),
    r = n.max.getComponent(o),
    i = (r + s) / 2 + +$("m3co").value * (r - s) / 2,
    l = new THREE.Vector3;
  n.getCenter(l), l.setComponent(o, i), cutPlane.position.copy(t.localToWorld(l)), cutPlane.quaternion.copy(t.quaternion).multiply((new THREE.Quaternion).setFromEuler("x" === a ? new THREE.Euler(0, Math.PI / 2, 0) : "y" === a ? new THREE.Euler(-Math.PI / 2, 0, 0) : new THREE.Euler))
}

function pick(e) {
  const t = m3c.getBoundingClientRect(),
    a = new THREE.Vector2((e.clientX - t.left) / t.width * 2 - 1, -(e.clientY - t.top) / t.height * 2 + 1),
    o = new THREE.Raycaster;
  o.setFromCamera(a, C3);
  const n = o.intersectObjects(objs, !0)[0];
  let s = n && n.object;
  for (; s && !objs.includes(s);) s = s.parent;
  select(s || null)
}

function m3size() {
  const e = $("m3wrap").clientWidth,
    t = $("m3wrap").clientHeight;
  if (!e || !t) return;
  let a = e,
    o = t;
  const n = $("m3ar").value;
  if ("0" !== n) {
    const [s, r] = n.split(":").map(Number), i = s / r;
    e / t > i ? a = Math.round(t * i) : o = Math.round(e / i)
  }
  m3c.style.width = a + "px", m3c.style.height = o + "px", R3.setSize(a, o, !1), C3.aspect = a / o, C3.updateProjectionMatrix()
}

function m3start() {
  m3size(), m3run || (m3run = !0, last3 = performance.now(), requestAnimationFrame(loop3))
}

function loop3(e) {
  if (!$("model").classList.contains("on") && !rec3) return void(m3run = !1);
  const t = Math.min(.05, (e - last3) / 1e3);
  last3 = e, tt += t, objs.forEach(e => {
    const a = e.userData;
    "fire" === a.type || "smoke" === a.type ? a.update(t, !0) : "water" === a.type ? a.update(t, tt) : "gun" === a.type && (a.parts.forEach(e => e.userData.update(t, !1)), a.fl.intensity *= Math.exp(25 * -t), a.kick *= Math.exp(12 * -t), a.br.position.z = .9 - a.kick, a.auto && tt - (a.t || 0) > .2 && (a.fire(), a.t = tt))
  }), so && "gun" !== so.userData.type ? bh.setFromObject(so) : so && bh.setFromObject(so.userData.br), updateCutPlane(), R3.render(S3, C3), requestAnimationFrame(loop3)
}
cutPlane.visible = !1, S3.add(cutPlane), m3c.onpointerdown = e => {
  if (sculptOn && so && so.isMesh && "water" !== so.userData.type && 0 === e.button) {
    const t = hitMesh(e);
    if (t) return pd3 = {
      sculpt: 1,
      mv: 0
    }, sculptAt(t), void m3c.setPointerCapture(e.pointerId)
  }
  pd3 = {
    x: e.clientX,
    y: e.clientY,
    mv: 0,
    b: e.button,
    sh: e.shiftKey
  }, m3c.setPointerCapture(e.pointerId)
}, m3c.onpointermove = e => {
  if (pd3 && pd3.sculpt) {
    const t = hitMesh(e);
    return void(t && sculptAt(t))
  }
  if (!pd3) return;
  const t = e.clientX - pd3.x,
    a = e.clientY - pd3.y;
  if (pd3.x = e.clientX, pd3.y = e.clientY, pd3.mv += Math.abs(t) + Math.abs(a), 2 === pd3.b || pd3.sh) {
    const e = .0015 * dist,
      o = new THREE.Vector3;
    C3.updateMatrix(), o.setFromMatrixColumn(C3.matrix, 0), tgt.addScaledVector(o, -t * e), tgt.y += a * e
  } else az -= .006 * t, elv = K(elv + .006 * a, -1.4, 1.5);
  cam3()
}, m3c.onpointerup = e => {
  pd3 && pd3.sculpt || pd3 && pd3.mv < 4 && pick(e), pd3 = null
}, m3c.onwheel = e => {
  e.preventDefault(), dist = K(dist * (1 + .001 * e.deltaY), 2, 80), cam3()
}, m3c.oncontextmenu = e => e.preventDefault(), $("m3ar").onchange = m3size, addEventListener("resize", () => $("model").classList.contains("on") && m3size());
let rec3 = !1;

function shot(e) {
  const t = grid.visible,
    a = bh.visible,
    o = cutPlane.visible;
  grid.visible = bh.visible = cutPlane.visible = !1, R3.render(S3, C3), m3c.toBlob(n => {
    grid.visible = t, bh.visible = a, cutPlane.visible = o, e(n)
  }, "image/png")
}
$("m3png").onclick = () => shot(e => dl(e, "render.png")), $("m3obj").onclick = () => {
  let e = "# Studio Editor\n",
    t = 1;
  objs.forEach(a => {
    if (!a.isMesh || "water" === a.userData.type) return;
    a.updateMatrixWorld();
    const o = a.geometry,
      n = o.attributes.position,
      s = o.index,
      r = new THREE.Vector3;
    e += `o ${a.userData.name}\n`;
    for (let t = 0; t < n.count; t++) r.fromBufferAttribute(n, t).applyMatrix4(a.matrixWorld), e += `v ${r.x.toFixed(5)} ${r.y.toFixed(5)} ${r.z.toFixed(5)}\n`;
    const i = s ? s.count : n.count;
    for (let a = 0; a < i; a += 3) {
      const o = e => (s ? s.getX(a + e) : a + e) + t;
      e += `f ${o(0)} ${o(1)} ${o(2)}\n`
    }
    t += n.count
  }), dl(new Blob([e], {
    type: "text/plain"
  }), "model.obj")
};
const goTab = e => document.querySelector(`.tab[data-t=${e}]`).click();

function placeBlob(e, t) {
  const a = new Image;
  a.onload = () => {
    const e = Math.min(1, pw / a.width, ph / a.height);
    structural("Place image", () => {
      const o = mk(t);
      o.x.drawImage(a, 0, 0, a.width * e, a.height * e), L.splice(ai + 1, 0, o), ai++
    })
  }, a.src = URL.createObjectURL(e)
}
$("m3p").onclick = () => shot(e => {
  placeBlob(e, "3D render"), goTab("photo")
}), $("m3v").onclick = () => shot(e => {
  items.push({
    name: "3D render.png",
    url: URL.createObjectURL(e),
    type: "image"
  }), bin(), $("m3st").textContent = "Added a still to the Video library."
}), $("m3r").onclick = () => {
  if (rec3) return;
  rec3 = !0;
  const e = ["video/webm;codecs=vp9", "video/webm"].find(mrs),
    t = new MediaRecorder(m3c.captureStream(30), {
      mimeType: e,
      videoBitsPerSecond: 12e6
    }),
    a = [];
  t.ondataavailable = e => a.push(e.data), t.onstop = () => {
    rec3 = !1, items.push({
      name: "3D render.webm",
      url: URL.createObjectURL(new Blob(a, {
        type: "video/webm"
      })),
      type: "video"
    }), bin(), $("m3st").textContent = "Added a 5 second clip to the Video library."
  }, t.start(), $("m3st").textContent = "Recording 5 seconds. Stay on this tab…", setTimeout(() => t.stop(), 5e3)
};
const photoCanvas = () => {
  const e = tmpc(),
    t = e.getContext("2d");
  return L.forEach(e => {
    e.vis && (t.globalAlpha = e.op / 100, t.globalCompositeOperation = "normal" === e.bm ? "source-over" : e.bm, t.filter = lf(e, 1), t.drawImage(e.c, 0, 0))
  }), e
};
$("psendv").onclick = () => photoCanvas().toBlob(e => {
  items.push({
    name: "Photo.png",
    url: URL.createObjectURL(e),
    type: "image"
  }), bin(), $("vst").textContent = "Photo added to the Video library."
}), $("vtophoto").onclick = () => {
  render(T), pm.toBlob(e => {
    placeBlob(e, "Video frame"), goTab("photo")
  })
}, addEventListener("keydown", e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const t = e.ctrlKey || e.metaKey,
    a = e.key.toLowerCase(),
    o = e => $(e).classList.contains("on");
  o("video") && t && "z" === a ? (e.preventDefault(), e.shiftKey ? vredo() : vundo()) : o("video") && t && "y" === a && (e.preventDefault(), vredo()), o("model") && !t && ("Delete" === e.key && so && $("m3del").click(), "f" === a && so && (tgt.copy(so.position), cam3()))
});
const goFS = e => {
    try {
      const t = (e.requestFullscreen || e.webkitRequestFullscreen).call(e);
      t && t.catch && t.catch(() => toast("Full screen was blocked here. If the editor is inside another page, open it directly in the browser."))
    } catch (e) {
      toast("This browser does not allow full screen here.")
    }
  },
  inFS = () => document.fullscreenElement || document.webkitFullscreenElement;
$("fsbtn").onclick = () => inFS() ? (document.exitFullscreen || document.webkitExitFullscreen).call(document) : goFS(document.documentElement), $("vfsb").onclick = () => goFS($("pm")), $("m3fs").onclick = () => goFS($("m3wrap")), document.addEventListener("fullscreenchange", () => {
  $("fsbtn").textContent = document.fullscreenElement === document.documentElement ? "Exit full screen" : "⛶ Full screen", $("model").classList.contains("on") && setTimeout(m3size, 60)
});
const HELP = {
  start: ["Start here", '<p>This editor has four workspaces. Pick one with the tabs along the top: <b>Photo</b>, <b>Video</b>, <b>Audio</b> and <b>3D</b>. Everything runs in your browser and your files never leave your computer.</p>\n <h4>1. Choose your level</h4><p>The menu at the top right switches between <b>Simple</b>, <b>Advanced</b> and <b>Pro</b>. Simple hides the harder tools so it is easy to start. Pro shows everything.</p>\n <h4>2. Make or open something</h4><ul><li>Photo: <b>File &gt; New file</b> or <b>Open</b>. Each file gets its own tab.</li><li>Video: a <b>New project</b> window appears the first time. Choose a shape (aspect ratio), size and frame rate.</li><li>Audio: <b>File &gt; Open audio</b>, press <b>Record</b>, or add an empty track.</li><li>3D: use the <b>Add</b> menu.</li></ul>\n <h4>3. Save your work</h4><p>Press the blue <b>Save file</b> button. A "Your file is ready" window opens. Press <b>Save file…</b> to choose where it goes, or <b>Download</b>. If your browser blocks saving, open the editor file directly in Chrome or Edge instead of inside another page.</p>\n <h4>4. Move work between workspaces</h4><ul><li>Photo &gt; File &gt; Send to Video library</li><li>Video &gt; File &gt; Send current frame to Photo</li><li>3D &gt; Send to Photo, or to the Video library as a still or a 5 second clip</li><li>Audio &gt; File &gt; Send to Video library</li></ul>\n <h4>Handy keys</h4><p><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo, <kbd>Ctrl</kbd>+<kbd>Y</kbd> redo, <kbd>Space</kbd> play or pause in Video. The <b>⛶ Full screen</b> button makes the editor fill your screen.</p>'],
  photo: ["Photo", "<h4>Getting started</h4><ol><li><b>File &gt; New file</b> (or the ＋ next to the tabs) and pick a size. Or <b>File &gt; Open</b> to edit a picture.</li><li>Every file has a tab at the top. Click a tab to switch, × to close.</li><li>Pick a tool on the left, then click or drag on the picture.</li></ol>\n <h4>Tools</h4><ul><li><b>Move</b> (V) moves a layer, or just the selected part if you have a selection.</li><li><b>Marquee, Lasso, Magic wand</b> (M, L, W) make selections. Hold <kbd>Shift</kbd> to add, <kbd>Alt</kbd> to subtract.</li><li><b>Brush, Eraser</b> (B, E): ten brush shapes and a Hardness slider in the options bar.</li><li><b>Clone, Blur, Dodge, Burn</b> (Pro). Alt-click to set the clone source.</li><li><b>Paint bucket, Gradient</b> (G): five gradient shapes and eight presets.</li><li><b>Eyedropper</b> (I) picks a color.</li></ul>\n <h4>Text</h4><p>Pick the <b>Text</b> tool (T), click the picture and just type. Press <kbd>Esc</kbd> when you finish. <b>Drag the text to move it</b>, or click it to edit again. Change font, size, color, outline and gradient in the Text panel.</p>\n <h4>Drop shadow</h4><p>Select a layer and tick <b>Enable drop shadow</b> in the Drop shadow panel. It works on every layer and updates live.</p>\n <h4>Layers</h4><p>Use the buttons above the layer list: New, Copy, Delete, Up, Down and Merge. Click the dot to hide a layer. Change opacity and blend mode below the buttons.</p>\n <h4>Color and looks</h4><ul><li><b>Adjustments</b> sliders preview live. Press <b>Apply</b> to keep them.</li><li><b>Curves…</b> reshapes tone and color. Click the line to add points, drag to bend, double-click a point to remove it.</li><li><b>LUT:</b> load a <code>.cube</code> file or pick a built-in look, then Apply LUT.</li></ul>\n <h4>Content-aware tools</h4><ul><li><b>Image &gt; Content-aware scale…</b> resizes the picture while keeping people and objects from stretching. Select what to protect first, then tick Protect.</li><li><b>Edit &gt; Content-aware fill…</b> removes the selected area and fills it from the picture around it. The result goes on its own layer.</li></ul><h4>Copy and paste</h4><p>Select with a shape tool, then <kbd>Ctrl</kbd>+<kbd>C</kbd>, <kbd>Ctrl</kbd>+<kbd>X</kbd> and <kbd>Ctrl</kbd>+<kbd>V</kbd>. Paste makes a new layer you can drag.</p>"],
  video: ["Video", "<h4>Getting started</h4><ol><li>Fill in the <b>New project</b> window: aspect ratio (16:9 widescreen, 9:16 vertical, 1:1 square and more), size, frame rate.</li><li><b>File &gt; Import media</b> to add videos, pictures and music to the Project list.</li><li>Click an item in the list to put it on the timeline at the playhead.</li><li>Press <b>Play / pause</b> (or <kbd>Space</kbd>) to watch.</li></ol>\n <h4>Editing on the timeline</h4><ul><li>Drag a clip to move it. Drag its left or right edge to trim.</li><li>Higher tracks (V3) cover lower tracks (V1). A1 is for music.</li><li><b>Split</b> (<kbd>S</kbd>) cuts the clip at the playhead. <b>Delete</b> removes it. <b>Ripple delete</b> also closes the gap.</li><li>Click the ruler to move the playhead. Clips snap to each other.</li></ul>\n <h4>Zoom brackets</h4><p>The bar above the timeline has two brackets <b>[ ]</b>. Drag them to zoom the timeline to a section. Drag the middle to scroll. Press <b>Fit</b> to see everything.</p>\n <h4>Transitions between clips</h4><p>Put two clips next to each other on the same track. A small yellow <b>+</b> appears where they meet. Click it, pick a look (cross dissolve, wipes, slides, zoom, blur and more) and a length. The first clip overlaps the second so one blends into the next and you never see a black screen. <b>Timeline &gt; Add a transition at every cut</b> does all cuts at once, and <b>Close gaps between clips</b> removes empty space that would show black.</p><h4>Titles</h4><p>Press <b>+ Title</b>, <b>+ Lower third</b>, <b>+ Subtitle</b> or <b>+ Matte</b>, then edit the text and style in Effect controls.</p>\n <h4>Effect controls</h4><ul><li><b>Transitions:</b> set In and Out to dissolve, dip to black, wipes or iris.</li><li><b>Motion presets:</b> slow zoom, pans and fades in one click.</li><li><b>Keyframes:</b> click ◇ beside a setting at different playhead positions to animate it.</li><li><b>Color:</b> correction sliders, grading, <b>Curves…</b> and <b>LUT</b>.</li><li><b>Green screen:</b> pick the key color and tune the sliders (Pro). Put a background clip on a lower track.</li><li><b>Crop, rotation, speed</b> and <b>Fill frame</b> fit clips to your aspect ratio.</li></ul>\n <h4>Camcorder files (.MTS) and interlaced video</h4><p><b>File &gt; Import media</b> accepts .MTS, .M2TS, .TS and many other formats. The built-in engine prepares them for editing. If a clip shows fine comb-like lines on moving objects (common with 1080i), select the clip and open <b>Deinterlace</b> in Effect controls. Auto uses what was detected on import, or pick Adaptive. For the best quality, switch on <b>File &gt; Import: deinterlace with yadif</b> before importing.</p><h4>Export</h4><p><b>File &gt; Export sequence</b> opens the settings: format (WebM, H.264, H.265, ProRes), size, frame rate and bit rates. H.264 and H.265 use your computer's encoder when it has one.</p>"],
  audio: ["Audio", "<h4>Getting started</h4><ol><li><b>File &gt; Open audio</b> adds each file as its own track. You can pick several files at once.</li><li>Or press <b>● Record</b> to record from your microphone onto a new track.</li><li><b>Tracks &gt; Add empty track</b> makes a blank track.</li></ol>\n <h4>Working with tracks</h4><ul><li>Each track has <b>Mute</b>, <b>Solo</b>, a <b>Gain</b> slider and ✕ to remove it.</li><li>Click a track to make it the active one. Edits and effects only change the active track.</li><li>All tracks play together. Press ▶ to hear the mix.</li></ul>\n <h4>Editing</h4><p>Drag across a waveform to select a section. Use the toolbar and the Edit menu for Trim, Cut, Silence, Copy and Paste. Without a selection, effects apply to the whole track. <b>Undo</b> brings back the last change on that track.</p>\n <h4>Effects</h4><p>Open the <b>Effect</b> menu. Fade, Normalize, Reverse and Change speed are quick. The effect dialog has sliders and a <b>Preview</b> button that plays the first 6 seconds before you apply it. Included: reverb, delay, filters, noise gate, chorus, flanger, tremolo, distortion, telephone, pan, EQ, compressor, robot voice, bitcrusher and more.</p>\n <h4>Mastering (Pro)</h4><p>The Mastering bar adds bass, treble, a compressor and a limiter, then sets the loudest peak.</p>\n <h4>Save</h4><p><b>File &gt; Export mixdown as WAV</b> mixes every track into one file.</p>"],
  model: ["3D", "<h4>Getting started</h4><ol><li>Open the <b>Add</b> menu and pick a shape.</li><li><b>Drag</b> empty space to orbit. <b>Shift-drag</b> or right-drag to pan. <b>Wheel</b> to zoom. <b>Click</b> an object to select it.</li><li>Edit it in the Properties panel on the right.</li></ol>\n <h4>Position and size</h4><p>Sliders move, rotate and scale. <b>Stretch X, Y, Z</b> change each direction on its own.</p>\n <h4>Materials and textures</h4><ul><li>Color, metalness, roughness and opacity are at the top.</li><li><b>Texture maps (PBR):</b> choose built-in patterns or <b>Load image…</b> for the Color, Normal, Roughness, Metalness, AO, Emissive, Bump and Opacity slots.</li><li><b>Make normal + roughness from color map</b> builds two maps for you from the Color map.</li><li><b>Tiling X and Y</b> repeat the texture. <b>Normal strength</b> sets the bump depth.</li></ul>\n <h4>Changing the shape</h4><ul><li><b>Shape sliders</b> change width, height, segments and more.</li><li><b>Twist, Taper, Bend, Rough</b> deform the object. Press <b>Reset shape</b> to undo.</li><li><b>Sculpt:</b> tick Sculpt mode and drag on the object to pull out, push in or smooth.</li></ul>\n <h4>Cut in half</h4><p>Pick an axis, move <b>Position</b> (the pink plane shows where), set a <b>Gap</b> and press <b>Cut in half</b>. You get two closed pieces you can move and edit.</p>\n <h4>Lights and effects</h4><p>Add point lights from the Add menu. The Scene panel controls the sun, shadows and exposure. The Effects menu adds fire, smoke, water and a gunshot with <b>Fire!</b>.</p>\n <h4>Save</h4><p>Save file exports a PNG render. <b>File &gt; Export model (OBJ)</b> saves the shapes. Use <b>Send to</b> to place renders in Photo or Video.</p>"]
};

function helpOpen(e) {
  const t = $("hnav");
  t.innerHTML = "", Object.entries(HELP).forEach(([a, o]) => {
    const n = document.createElement("button");
    n.textContent = o[0], n.setAttribute("aria-pressed", a === e), n.onclick = () => helpOpen(a), t.append(n)
  }), $("hbody").innerHTML = "<h3>" + HELP[e][0] + " guide</h3>" + HELP[e][1], $("hbody").scrollTop = 0, $("hdlg").open || $("hdlg").showModal()
}
$("helpbtn").onclick = () => {
  const e = document.querySelector("section.on").id;
  helpOpen(HELP[e] ? e : "start")
}, $("hclose").onclick = () => $("hdlg").close(), document.querySelectorAll("section .mb").forEach(e => {
  const t = e.closest("section").id;
  if (!HELP[t]) return;
  const a = document.createElement("button");
  a.className = "hb", a.textContent = "? How to use", a.onclick = () => helpOpen(t), e.append(a), e.style.alignItems = "center"
});
const RES = [
  ["Free photos and video clips", [
    ["Unsplash", "High quality photos you can use for free.", "https://unsplash.com"],
    ["Pexels", "Free photos and stock video clips.", "https://www.pexels.com"],
    ["Pixabay", "Photos, illustrations, videos and music.", "https://pixabay.com"],
    ["Coverr", "Free stock video loops and clips.", "https://coverr.co"],
    ["Mixkit", "Free video clips, music and sound effects.", "https://mixkit.co"],
    ["Videvo", "Free stock footage and motion graphics.", "https://www.videvo.net"],
    ["Wikimedia Commons", "Millions of freely licensed images and media.", "https://commons.wikimedia.org"],
    ["Internet Archive", "Public domain video, audio and books.", "https://archive.org"]
  ]],
  ["Music and sound effects", [
    ["YouTube Audio Library", "Free music and sound effects. Open YouTube Studio, then choose Audio library (needs a YouTube account).", "https://studio.youtube.com/"],
    ["Freesound", "Huge community library of sound effects and recordings.", "https://freesound.org"],
    ["Free Music Archive", "Free music with clear license labels.", "https://freemusicarchive.org"],
    ["Incompetech", "Royalty free music by Kevin MacLeod.", "https://incompetech.com/music/royalty-free/"],
    ["Pixabay Music", "Free music tracks for videos.", "https://pixabay.com/music/"],
    ["ccMixter", "Remixable Creative Commons music.", "https://dig.ccmixter.org"],
    ["Zapsplat", "Free sound effects (account needed).", "https://www.zapsplat.com"]
  ]],
  ["3D models, textures and HDRIs", [
    ["Poly Haven", "Free HDRIs, PBR textures and 3D models.", "https://polyhaven.com"],
    ["ambientCG", "Free PBR texture sets: color, normal, roughness and more.", "https://ambientcg.com"],
    ["Sketchfab free models", "Browse downloadable 3D models.", "https://sketchfab.com/features/free-3d-models"],
    ["Kenney assets", "Free game and 3D asset packs.", "https://kenney.nl/assets"],
    ["Quaternius", "Free low poly 3D model packs.", "https://quaternius.com"]
  ]],
  ["Fonts, icons and licenses", [
    ["Google Fonts", "Free fonts. Install one, then pick it in your system.", "https://fonts.google.com"],
    ["Font Squirrel", "Free fonts for commercial use.", "https://www.fontsquirrel.com"],
    ["Flaticon", "Free icons (credit may be required).", "https://www.flaticon.com"],
    ["Openverse", "Search Creative Commons images and audio.", "https://openverse.org"],
    ["Creative Commons licenses", "What the CC license labels mean.", "https://creativecommons.org/about/cclicenses/"]
  ]]
];
$("resbox").innerHTML = "<h2>Resources</h2><p>Free places to find pictures, footage, music, sound effects, 3D textures and fonts. Links open in a new tab. <b>Always read each site's license</b> before you publish. Some need a credit.</p>\n <h3>How to use what you download</h3><p><b>Photo:</b> File &gt; Open. <b>Video:</b> File &gt; Import media (videos, pictures and music). <b>Audio:</b> File &gt; Open audio. <b>3D:</b> in Texture maps, choose Load image… (PBR sets from ambientCG and Poly Haven give you color, normal and roughness images to drop into the matching slots). For looks, load any <code>.cube</code> LUT file in Photo or Video.</p>" + RES.map(([e, t]) => `<h3>${e}</h3><div class="cards">${t.map(([e,t,a])=>`<a class="card" href="${a}" target="_blank" rel="noopener noreferrer"><b>${e}</b><span>${t}</span><em>${a.replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"")}</em></a>`).join("")}</div>`).join("") + '<h3>Need help using the editor?</h3><p><button id="resHelp" class="p">Open the how-to guides</button></p>', $("resHelp").onclick = () => helpOpen("start");
const WN = [
  ["Photo", ["Content-aware scale: resize while protecting people and objects", "Content-aware fill: remove objects and fill from the surroundings, on a new layer", "New file dialog and a tab for every open file", "Text tool types right on the picture, can be moved and edited again", "Drop shadow is a live layer style that works on any layer", "Curves adjustment", "Layer buttons: New, Copy, Delete, Up, Down, Merge", "Ten brushes, five gradient shapes, many more filters", "Load .cube LUTs and use built-in looks", "Copy, cut, paste and moving only the selected pixels"]],
  ["Video", ["Camcorder .MTS, .M2TS and .TS import, plus AVI, MPG, VOB and more", "Deinterlacing for 1080i and other interlaced video: adaptive, blend, one field, alternate fields, or yadif on import", "Transitions between clips: click the + where two clips meet, no more black screen at the cut", "New project window with aspect ratio, size and frame rate", "Timeline zoom brackets and a Fit button", "Curves and LUTs on every clip", "Keyframes with motion presets", "Titles, lower thirds and color mattes", "Hardware H.264 and H.265 export with a real progress bar", "Multiple sequences, project settings, snapping, undo and redo"]],
  ["Audio", ["Multiple tracks with mute, solo and gain", "Record from the microphone onto a new track", "17 effects with a preview, plus mastering", "Mixdown to WAV", "New project button"]],
  ["3D", ["PBR texture maps: color, normal, roughness, metalness, AO, emissive, bump, opacity", "Make normal and roughness maps from a color map", "Shape sliders, bend, twist, taper and sculpting", "Cut any object in half with a closed cap", "Fire, smoke, water and gunshot effects"]],
  ["Everywhere", ["Full screen button", "How-to guides for every workspace (the ? Help button)", "Resources tab with free media and texture sites", "Save file window with preview, Save and Download", "Simple, Advanced and Pro levels"]]
];
$("wnbox").innerHTML = "<h2>What's new</h2><p>Everything added in this version.</p>" + WN.map(([e, t]) => `<div class="wn"><h4>${e}</h4><ul>${t.map(e=>`<li>${e}</li>`).join("")}</ul></div>`).join("");
const MAGIC = "STUDIOPRJ1\n",
  enc8 = new TextEncoder,
  dec8 = new TextDecoder,
  canvasBlob = e => new Promise(t => e.toBlob(t, "image/png")),
  loadImg = e => new Promise((t, a) => {
    const o = new Image;
    o.onload = () => t(o), o.onerror = a, o.src = URL.createObjectURL(e)
  });
async function savePhoto(e) {
  saveDoc();
  const t = [];
  for (const a of docs) {
    const o = [];
    for (const t of a.L) o.push({
      name: t.name,
      vis: t.vis,
      op: t.op,
      bm: t.bm,
      sh: t.sh || null,
      txt: t.txt ? JSON.parse(JSON.stringify(t.txt)) : null,
      asset: e(await canvasBlob(t.c), t.name + ".png", "image/png")
    });
    t.push({
      name: a.name,
      pw: a.pw,
      ph: a.ph,
      ai: a.ai,
      layers: o
    })
  }
  return {
    docs: t,
    di: di
  }
}
async function loadPhoto(e, t) {
  endEdit(), L.forEach(e => e.c.remove()), docs.length = 0, di = -1, L = [], U = [], R = [];
  for (const a of e.docs) {
    const e = [];
    for (const o of a.layers) {
      const n = document.createElement("canvas");
      n.width = a.pw, n.height = a.ph;
      const s = n.getContext("2d", {
        willReadFrequently: !0
      });
      s.drawImage(await loadImg(t[o.asset].blob), 0, 0), e.push({
        name: o.name,
        c: n,
        x: s,
        vis: o.vis,
        op: o.op,
        bm: o.bm,
        sh: o.sh || void 0,
        txt: o.txt || void 0
      })
    }
    docs.push({
      name: a.name,
      L: e,
      ai: a.ai,
      pw: a.pw,
      ph: a.ph,
      U: [],
      R: [],
      zoom: Math.min(1, (($("cv").clientWidth || 900) - 48) / a.pw, (($("cv").clientHeight || 600) - 48) / a.ph),
      hasSel: !1,
      sm: null
    })
  }
  loadDoc(Math.min(e.di || 0, docs.length - 1)), tabsUI()
}
async function saveVideo(e) {
  seqs[si] = {
    ps: {
      ...PS
    },
    clips: clips
  };
  const t = [];
  for (const a of items) {
    const o = await (await fetch(a.url)).blob();
    t.push({
      name: a.name,
      type: a.type,
      il: a.interlaced ?? null,
      asset: e(o, a.name, o.type || ("audio" === a.type ? "audio/mpeg" : "video/mp4"))
    })
  }
  const a = seqs.map(e => ({
      ps: e.ps,
      clips: e.clips.map(e => {
        const {
          cvl: t,
          ...a
        } = e.fx;
        return {
          name: e.name,
          track: e.track,
          start: e.start,
          in: e.in,
          dur: e.dur,
          src: e.src,
          fx: a,
          kf: e.kf || null,
          ease: e.ease || null,
          audio: !!e.audio,
          title: e.title || null,
          sp: e._sp || null,
          item: e.it ? items.indexOf(e.it) : -1
        }
      })
    })),
    o = [];
  for (const t of customLUT) {
    const a = LUTS[t];
    a && o.push({
      name: t,
      N: a.N,
      t: a.t,
      lo: a.lo,
      hi: a.hi,
      asset: e(new Blob([a.data]), t + ".f32")
    })
  }
  return {
    items: t,
    seqs: a,
    si: si,
    luts: o
  }
}

function restoreClip(e, t) {
  return new Promise(a => {
    const o = "audio" === e.type,
      n = "video" === e.type || o,
      s = o ? new Audio : n ? document.createElement("video") : new Image,
      r = () => {
        const r = {
          ...t,
          el: s,
          fx: {
            ...DEF,
            ...t.fx
          },
          g: null,
          it: e,
          audio: o
        };
        if (n) {
          const e = AC.createGain();
          AC.createMediaElementSource(s).connect(e), e.connect(AC.destination), e.connect(xd), r.g = e, s.onseeked = () => {
            playing || render(T)
          }
        }
        a(r)
      };
    n ? (s.preload = "auto", s.playsInline = !0, s.onloadedmetadata = async () => {
      await getDur(s, e), r()
    }, s.onerror = () => a(null), s.src = e.url, hold.append(s)) : (s.onload = r, s.onerror = () => a(null), s.src = e.url)
  })
}
async function loadVideo(e, t) {
  pause(), clips = [], cs = null, T = 0, VU.length = VR.length = 0, items.length = 0;
  for (const a of e.luts || []) LUTS[a.name] = {
    N: a.N,
    t: a.t,
    lo: a.lo,
    hi: a.hi,
    data: new Float32Array(await t[a.asset].blob.arrayBuffer())
  }, customLUT.add(a.name);
  lutRefresh(), e.items.forEach(e => items.push({
    name: e.name,
    type: e.type,
    interlaced: e.il ?? void 0,
    url: URL.createObjectURL(t[e.asset].blob)
  })), bin();
  const a = [];
  for (const t of e.seqs) {
    const e = [];
    for (const a of t.clips) {
      let t = null;
      if (a.title) t = {
        ...a,
        el: document.createElement("canvas"),
        fx: {
          ...DEF,
          ...a.fx
        },
        g: null
      };
      else {
        const e = items[a.item];
        e && (t = await restoreClip(e, a))
      }
      t && (t.kf = a.kf || void 0, t.ease = a.ease || void 0, t._sp = a.sp || void 0, e.push(t))
    }
    a.push({
      ps: t.ps,
      clips: e
    })
  }
  seqs = a, si = Math.min(e.si || 0, seqs.length - 1), Object.assign(PS, seqs[si].ps), clips = seqs[si].clips, applyPS(), clips.forEach(e => {
    e.title && titleCanvas(e), e.fx.cv && (e.fx.cvl = curveLUTs(e.fx.cv))
  }), seqUI(), tl(), fxUI(), render(0)
}
async function saveAudio(e) {
  return syncTrack(), {
    ati: ati,
    tracks: tracks.map(t => {
      const a = t.buf,
        o = a.numberOfChannels,
        n = new Float32Array(a.length * o);
      for (let e = 0; e < o; e++) n.set(a.getChannelData(e), e * a.length);
      return {
        name: t.name,
        gain: t.gain,
        mute: t.mute,
        solo: t.solo,
        ch: o,
        len: a.length,
        sr: a.sampleRate,
        asset: e(new Blob([n]), t.name + ".f32")
      }
    })
  }
}
async function loadAudio(e, t) {
  stopA(), tracks.length = 0, ati = -1, buf = null, ah = [], sel = [0, 0];
  for (const a of e.tracks) {
    const e = new Float32Array(await t[a.asset].blob.arrayBuffer()),
      o = AC.createBuffer(a.ch, a.len, a.sr);
    for (let t = 0; t < a.ch; t++) o.getChannelData(t).set(e.subarray(t * a.len, (t + 1) * a.len));
    addTrack(o, a.name);
    const n = tracks[tracks.length - 1];
    n.gain = a.gain, n.mute = a.mute, n.solo = a.solo
  }
  trackUI(), tracks.length && switchTrack(Math.min(e.ati || 0, tracks.length - 1)), info()
}
async function saveModel(e) {
  const t = new Set,
    a = [],
    o = t => {
      const a = {};
      return ["position", "normal", "uv"].forEach(o => {
        t.attributes[o] && (a[o] = e(new Blob([t.attributes[o].array]), o + ".f32"))
      }), t.index && (a.index = e(new Blob([Uint32Array.from(t.index.array)]), "index.u32")), a
    };
  for (const e of objs) {
    const n = e.userData,
      s = {
        type: n.type,
        name: n.name,
        pos: e.position.toArray(),
        rot: [e.rotation.x, e.rotation.y, e.rotation.z],
        scale: e.scale.toArray()
      };
    e.isLight ? (s.kind = "light", s.color = "#" + e.color.getHexString(), s.intensity = e.intensity) : "water" === n.type ? (s.kind = "water", s.amp = n.amp, s.mp = n.mp) : "gun" === n.type ? (s.kind = "gun", s.k = n.parts[0].userData.k, s.sc = n.parts[0].userData.sc, s.auto = !!n.auto) : "fire" === n.type || "smoke" === n.type ? (s.kind = "fx", s.k = n.k, s.sc = n.sc) : e.isMesh && (s.kind = "mesh", s.mp = JSON.parse(JSON.stringify(n.mp)), s.gp = n.gp || null, s.modified = !!n.modified, n.gp && !n.modified || (s.geo = o(e.geometry)), [s.mp.tex, ...Object.values(s.mp.maps || {})].forEach(e => {
      e && (e.startsWith("up:") || e.startsWith("gen:")) && t.add(e)
    })), a.push(s)
  }
  const n = {};
  for (const a of t) {
    const t = texC[a];
    if (!t || !t.image) continue;
    const o = t.image,
      s = document.createElement("canvas");
    s.width = o.naturalWidth || o.width, s.height = o.naturalHeight || o.height, s.getContext("2d").drawImage(o, 0, 0), n[a] = e(await canvasBlob(s), a.replace(/[^\w.-]/g, "_") + ".png", "image/png")
  }
  return {
    objs: a,
    tex: n,
    scene: Object.fromEntries(["s3i", "s3a", "s3m", "s3x", "s3bg", "s3sh", "s3gr"].map(e => {
      return [e, (t = e, "checkbox" === $(t).type ? $(t).checked : $(t).value)];
      var t
    })),
    cam: {
      az: az,
      elv: elv,
      dist: dist,
      tgt: tgt.toArray()
    }
  }
}
async function loadModel(e, t) {
  objs.slice().forEach(e => S3.remove(e)), objs.length = 0, select(null), cnt = 0;
  for (const a of Object.keys(e.tex || {})) await new Promise(o => (new THREE.TextureLoader).load(URL.createObjectURL(t[e.tex[a]].blob), e => {
    e.wrapS = e.wrapT = THREE.RepeatWrapping, texC[a] = e, o()
  }, void 0, o));
  const a = async (e, a) => new a(await t[e].blob.arrayBuffer());
  for (const t of e.objs) {
    let e;
    if ("light" === t.kind) addPoint(), e = objs[objs.length - 1], e.color.set(t.color), e.intensity = t.intensity, e.children[0].material.color.set(t.color);
    else if ("water" === t.kind) e = water(), e.userData.type = "water", e.userData.amp = t.amp, e.userData.mp = t.mp, applyMat(e), reg3(e, "water");
    else if ("gun" === t.kind) e = gun(), e.userData.parts.forEach(e => {
      e.userData.k = t.k, e.userData.sc = t.sc
    }), e.userData.auto = t.auto, reg3(e, "gun");
    else if ("fx" === t.kind) e = emitter(t.type), e.userData.k = t.k, e.userData.sc = t.sc, reg3(e, t.type);
    else {
      let o;
      t.geo ? (o = new THREE.BufferGeometry, o.setAttribute("position", new THREE.BufferAttribute(await a(t.geo.position, Float32Array), 3)), t.geo.normal && o.setAttribute("normal", new THREE.BufferAttribute(await a(t.geo.normal, Float32Array), 3)), t.geo.uv && o.setAttribute("uv", new THREE.BufferAttribute(await a(t.geo.uv, Float32Array), 2)), t.geo.index && o.setIndex(new THREE.BufferAttribute(await a(t.geo.index, Uint32Array), 1)), t.geo.normal || o.computeVertexNormals()) : o = GEOP[t.type](t.gp), e = new THREE.Mesh(o, new THREE.MeshStandardMaterial), e.castShadow = e.receiveShadow = !0, e.userData.mp = t.mp, e.userData.gp = t.gp, e.userData.modified = t.modified ? 1 : 0, applyMat(e), reg3(e, t.type)
    }
    e.position.fromArray(t.pos), e.rotation.set(...t.rot), e.scale.fromArray(t.scale), e.userData.name = t.name
  }
  for (const [t, a] of Object.entries(e.scene || {})) {
    const e = $(t);
    "checkbox" === e.type ? e.checked = a : e.value = a, e.dispatchEvent(new Event("input", {
      bubbles: !0
    }))
  }
  e.cam && (az = e.cam.az, elv = e.cam.elv, dist = e.cam.dist, tgt.fromArray(e.cam.tgt), cam3()), select(null), olist()
}
async function buildProject(e, t) {
  const a = [],
    o = (e, t, o) => (a.push({
      blob: e,
      name: t,
      mime: o || e.type || "application/octet-stream",
      size: e.size
    }), a.length - 1),
    n = {};
  e.photo && (n.photo = await savePhoto(o)), e.video && (n.video = await saveVideo(o)), e.audio && (n.audio = await saveAudio(o)), e.model && (n.model = await saveModel(o));
  const s = enc8.encode(JSON.stringify({
      app: "Studio Editor",
      version: 1,
      name: t,
      saved: (new Date).toISOString(),
      parts: n,
      assets: a.map(e => ({
        name: e.name,
        mime: e.mime,
        size: e.size
      }))
    })),
    r = new Uint8Array(15);
  return r.set(enc8.encode(MAGIC)), new DataView(r.buffer).setUint32(11, s.length, !0), new Blob([r, s, ...a.map(e => e.blob)], {
    type: "application/octet-stream"
  })
}
async function readProject(e) {
  const t = 11,
    a = new Uint8Array(await e.slice(0, 15).arrayBuffer());
  if (dec8.decode(a.slice(0, t)) !== MAGIC) throw new Error("That is not a Studio Editor project file.");
  const o = new DataView(a.buffer).getUint32(t, !0),
    n = JSON.parse(dec8.decode(new Uint8Array(await e.slice(15, 15 + o).arrayBuffer())));
  let s = 15 + o;
  return n.assets = n.assets.map(t => {
    const a = e.slice(s, s + t.size, t.mime);
    return s += t.size, {
      ...t,
      blob: a
    }
  }), n
}
const hasWork = {
  photo: () => docs.length > 1 || docs.some((e, t) => (t === di ? U : e.U).length > 0) || L.length > 1,
  video: () => clips.length > 0 || items.length > 0 || seqs.length > 1,
  audio: () => tracks.length > 0,
  model: () => objs.length > 0
};

function projSummary() {
  return syncTrack(), saveDoc(), {
    photo: `${docs.length} file${docs.length>1?"s":""}, ${docs.reduce((e,t)=>e+t.L.length,0)} layers`,
    video: `${seqs.length>1?seqs.length+" sequences, ":""}${clips.length} clips, ${items.length} media files`,
    audio: `${tracks.length} track${1===tracks.length?"":"s"}`,
    model: `${objs.length} object${1===objs.length?"":"s"}`
  }
}
$("projSave").onclick = () => {
  const e = projSummary();
  [
    ["p", "photo", "prp"],
    ["v", "video", "prv"],
    ["a", "audio", "pra"],
    ["m", "model", "prm"]
  ].forEach(([t, a, o]) => {
    $(o).checked = hasWork[a](), $("pr" + t + "s").textContent = "· " + e[a]
  }), $("prdlg").showModal()
}, $("prcancel").onclick = () => $("prdlg").close(), $("prok").onclick = async () => {
  const e = {
    photo: $("prp").checked,
    video: $("prv").checked,
    audio: $("pra").checked,
    model: $("prm").checked
  };
  if (!Object.values(e).some(Boolean)) return void toast("Tick at least one workspace to save.");
  $("prdlg").close();
  const t = ($("prn").value || "My project").replace(/[\\/:*?"<>|]/g, "_");
  toast("Saving project…");
  try {
    const a = await buildProject(e, t);
    await dl(a, t + ".studio")
  } catch (e) {
    toast("Could not save the project: " + e.message)
  }
}, $("projOpen").onclick = () => $("projFile").click(), $("projFile").onchange = async e => {
  const t = e.target.files[0];
  if (e.target.value = "", t) try {
    const e = await readProject(t),
      a = {
        photo: "Photo",
        video: "Video",
        audio: "Audio",
        model: "3D"
      },
      o = Object.keys(e.parts);
    if (!confirm('Open "' + t.name + '"? This replaces your current work in: ' + o.map(e => a[e]).join(", ") + ".")) return;
    toast("Opening project…"), e.parts.photo && await loadPhoto(e.parts.photo, e.assets), e.parts.video && await loadVideo(e.parts.video, e.assets), e.parts.audio && await loadAudio(e.parts.audio, e.assets), e.parts.model && await loadModel(e.parts.model, e.assets), $("prn").value = e.name || t.name.replace(/\.studio$/i, ""), toast("Project opened. Keep editing, then press Save project again to update it.")
  } catch (e) {
    toast("Could not open that project: " + e.message)
  }
}, document.querySelectorAll("section .mb").forEach(e => {
  const t = e.closest("section").id;
  if (!["photo", "video", "audio", "model"].includes(t)) return;
  const a = e.querySelector(".m .dd");
  if (!a) return;
  const o = document.createElement("button");
  o.textContent = "Save project…", o.onclick = () => $("projSave").click();
  const n = document.createElement("button");
  n.textContent = "Open project…", n.onclick = () => $("projOpen").click(), a.append(o, n)
}), addEventListener("beforeunload", e => {
  Object.values(hasWork).some(e => {
    try {
      return e()
    } catch (e) {
      return !1
    }
  }) && (e.preventDefault(), e.returnValue = "")
});
const lumA = (e, t, a, o) => {
  const n = .299 * e + .587 * t + .114 * a;
  return o < 255 ? n * o / 255 + 255 * (1 - o / 255) : n
};

function carvePass(e, t, a) {
  return new Promise(async (o, n) => {
    try {
      const {
        layers: n,
        gray: s,
        prot: r,
        W: i,
        H: l
      } = e, c = Math.abs(t - i);
      if (!c) return void o(e);
      const p = t > i,
        d = Float32Array.from(s),
        u = r ? Uint8Array.from(r) : null,
        f = new Int32Array(i * l),
        h = new Float32Array(i * l),
        m = new Float32Array(i * l),
        g = new Int32Array(l),
        b = [];
      let v = i;
      for (let e = 0; e < l; e++)
        for (let t = 0; t < i; t++) f[e * i + t] = t;
      const w = (e, t) => {
        const a = e * i,
          o = t > 0 ? t - 1 : t,
          n = t < v - 1 ? t + 1 : t,
          s = e > 0 ? e - 1 : e,
          r = e < l - 1 ? e + 1 : e;
        let c = Math.abs(d[a + n] - d[a + o]) + Math.abs(d[r * i + t] - d[s * i + t]);
        return u && u[a + t] && (c += 1e5), c
      };
      for (let e = 0; e < l; e++)
        for (let t = 0; t < v; t++) h[e * i + t] = w(e, t);
      for (let e = 0; e < c; e++) {
        for (let e = 0; e < v; e++) m[e] = h[e];
        for (let e = 1; e < l; e++) {
          const t = e * i,
            a = t - i;
          for (let e = 0; e < v; e++) {
            let o = m[a + e];
            e > 0 && m[a + e - 1] < o && (o = m[a + e - 1]), e < v - 1 && m[a + e + 1] < o && (o = m[a + e + 1]), m[t + e] = h[t + e] + o
          }
        }
        let t = 0,
          o = 1 / 0;
        const n = (l - 1) * i;
        for (let e = 0; e < v; e++) m[n + e] < o && (o = m[n + e], t = e);
        g[l - 1] = t;
        for (let e = l - 1; e > 0; e--) {
          const t = (e - 1) * i,
            a = g[e];
          let o = a,
            n = m[t + a];
          a > 0 && m[t + a - 1] < n && (n = m[t + a - 1], o = a - 1), a < v - 1 && m[t + a + 1] < n && (o = a + 1), g[e - 1] = o
        }
        if (p) {
          const e = new Int32Array(l);
          for (let t = 0; t < l; t++) e[t] = f[t * i + g[t]];
          b.push(e)
        }
        for (let e = 0; e < l; e++) {
          const t = e * i,
            a = g[e];
          d.copyWithin(t + a, t + a + 1, t + v), h.copyWithin(t + a, t + a + 1, t + v), f.copyWithin(t + a, t + a + 1, t + v), u && u.copyWithin(t + a, t + a + 1, t + v)
        }
        v--;
        for (let e = 0; e < l; e++) {
          let t = g[e],
            a = t;
          e > 0 && (t = Math.min(t, g[e - 1]), a = Math.max(a, g[e - 1])), e < l - 1 && (t = Math.min(t, g[e + 1]), a = Math.max(a, g[e + 1]));
          for (let o = Math.max(0, t - 2); o <= Math.min(v - 1, a + 1); o++) h[e * i + o] = w(e, o)
        }
        if (e % 12 == 0 && (a(e / c), await nap(0), xCancel)) throw new Error("cancelled")
      }
      const x = (e, a, o) => {
        const n = new e.constructor(t * l * a);
        if (p) {
          const s = new Uint8Array(i * l);
          b.forEach(e => {
            for (let t = 0; t < l; t++) s[t * i + e[t]] = 1
          });
          for (let r = 0; r < l; r++) {
            let l = r * t * a;
            for (let t = 0; t < i; t++) {
              const c = (r * i + t) * a;
              for (let t = 0; t < a; t++) n[l + t] = e[c + t];
              if (l += a, s[r * i + t]) {
                const s = (r * i + Math.min(i - 1, t + 1)) * a;
                for (let t = 0; t < a; t++) n[l + t] = "max" === o ? Math.max(e[c + t], e[s + t]) : e[c + t] + e[s + t] >> (e instanceof Float32Array ? 0 : 1);
                if (e instanceof Float32Array && "max" !== o)
                  for (let t = 0; t < a; t++) n[l + t] = (e[c + t] + e[s + t]) / 2;
                l += a
              }
            }
          }
        } else
          for (let o = 0; o < l; o++)
            for (let s = 0; s < t; s++) {
              const r = (o * i + f[o * i + s]) * a,
                l = (o * t + s) * a;
              for (let t = 0; t < a; t++) n[l + t] = e[r + t]
            }
        return n
      };
      o({
        layers: n.map(e => x(e, 4)),
        gray: x(s, 1),
        prot: r ? x(r, 1, "max") : null,
        W: t,
        H: l
      })
    } catch (e) {
      n(e)
    }
  })
}

function transposeSt(e) {
  const {
    W: t,
    H: a
  } = e, o = (e, o) => {
    const n = new e.constructor(e.length);
    for (let s = 0; s < a; s++)
      for (let r = 0; r < t; r++) {
        const i = (s * t + r) * o,
          l = (r * a + s) * o;
        for (let t = 0; t < o; t++) n[l + t] = e[i + t]
      }
    return n
  };
  return {
    layers: e.layers.map(e => o(e, 4)),
    gray: o(e.gray, 1),
    prot: e.prot ? o(e.prot, 1) : null,
    W: a,
    H: t
  }
}
async function contentAwareScale(e, t, a) {
  let o = pw,
    n = ph;
  progOpen("Content-aware scale…", "job");
  try {
    const s = L.map(e => e.x.getImageData(0, 0, o, n).data),
      r = photoCanvas().getContext("2d").getImageData(0, 0, o, n).data,
      i = new Float32Array(o * n);
    for (let e = 0; e < o * n; e++) i[e] = lumA(r[4 * e], r[4 * e + 1], r[4 * e + 2], r[4 * e + 3]);
    let l = null;
    if (a && hasSel) {
      const e = smx.getImageData(0, 0, o, n).data;
      l = new Uint8Array(o * n);
      for (let t = 0; t < o * n; t++) l[t] = e[4 * t + 3] > 127 ? 1 : 0
    }
    let c = {
      layers: s,
      gray: i,
      prot: l,
      W: o,
      H: n
    };
    const p = Math.abs(e - o) + Math.abs(t - n);
    let d = 0;
    const u = (e, t) => progSet(Math.round((d + e * t) / p * 95), `Working… ${Math.round((d+e*t)/p*100)}%`);
    e !== o && (c = await carvePass(c, e, t => u(t, Math.abs(e - o))), d += Math.abs(e - o)), t !== n && (c = transposeSt(c), c = await carvePass(c, t, e => u(e, Math.abs(t - n))), c = transposeSt(c)), structural("Content-aware scale", () => {
      L.forEach((e, t) => {
        e.c.width = c.W, e.c.height = c.H, e.x.putImageData(new ImageData(c.layers[t], c.W, c.H), 0, 0), e.txt = null
      }), resize(c.W, c.H)
    }), fit(), toast(`Resized to ${c.W} × ${c.H} px.`)
  } catch (e) {
    String(e.message).includes("cancelled") ? toast("Cancelled.") : toast("Could not scale: " + e.message)
  } finally {
    progClose()
  }
}
async function contentAwareFill(e, t) {
  const a = pw,
    o = ph,
    n = a * o,
    s = photoCanvas().getContext("2d").getImageData(0, 0, a, o).data,
    r = smx.getImageData(0, 0, a, o).data,
    i = new Uint8Array(n);
  let l = a,
    c = o,
    p = -1,
    d = -1;
  for (let e = 0; e < o; e++)
    for (let t = 0; t < a; t++) r[4 * (e * a + t) + 3] > 127 && (i[e * a + t] = 1, t < l && (l = t), t > p && (p = t), e < c && (c = e), e > d && (d = e));
  if (p < 0) return void toast("There is no selection to fill.");
  for (let t = 0; t < e; t++) {
    const e = Uint8Array.from(i);
    for (let t = Math.max(0, c - 1); t <= Math.min(o - 1, d + 1); t++)
      for (let n = Math.max(0, l - 1); n <= Math.min(a - 1, p + 1); n++) {
        const s = t * a + n;
        !i[s] && (n > 0 && i[s - 1] || n < a - 1 && i[s + 1] || t > 0 && i[s - a] || t < o - 1 && i[s + a]) && (e[s] = 1)
      }
    i.set(e), l = Math.max(0, l - 1), c = Math.max(0, c - 1), p = Math.min(a - 1, p + 1), d = Math.min(o - 1, d + 1)
  }
  const u = new Uint8Array(n),
    f = new Uint8Array(n),
    h = new Float32Array(n),
    m = new Float32Array(n);
  let g = 0;
  for (let e = 0; e < n; e++) {
    const t = !i[e] && s[4 * e + 3] >= 128;
    u[e] = t ? 1 : 0, f[e] = i[e] ? 0 : 1, h[e] = f[e], m[e] = .299 * s[4 * e] + .587 * s[4 * e + 1] + .114 * s[4 * e + 2], i[e] && g++
  }
  const b = "fast" === t ? 3 : "high" === t ? 6 : 4,
    v = "fast" === t ? 3 : "high" === t ? 1 : 2,
    w = "fast" === t ? 1500 : "high" === t ? 7e3 : 3500,
    x = (2 * b + 1) * (2 * b + 1),
    y = new Int32Array((a + 1) * (o + 1));
  for (let e = 0; e < o; e++) {
    let t = 0;
    for (let o = 0; o < a; o++) t += u[e * a + o], y[(e + 1) * (a + 1) + o + 1] = y[e * (a + 1) + o + 1] + t
  }
  const k = (e, t) => {
      if (e - b < 0 || t - b < 0 || e + b >= a || t + b >= o) return !1;
      const n = (t - b) * (a + 1) + e - b,
        s = (t - b) * (a + 1) + e + b + 1,
        r = (t + b + 1) * (a + 1) + e - b;
      return y[(t + b + 1) * (a + 1) + e + b + 1] - y[s] - y[r] + y[n] === x
    },
    $ = Math.min("high" === t ? 420 : 300, Math.max(60, 2 * Math.max(p - l, d - c) + 30)),
    M = [];
  for (let e = Math.max(b, c - $); e <= Math.min(o - 1 - b, d + $); e += v)
    for (let t = Math.max(b, l - $); t <= Math.min(a - 1 - b, p + $); t += v) k(t, e) && M.push(e * a + t);
  for (let e = 0; e < w; e++) {
    const e = b + Math.floor(Math.random() * (a - 2 * b)),
      t = b + Math.floor(Math.random() * (o - 2 * b));
    k(e, t) && M.push(t * a + e)
  }
  if (!M.length) return void toast("There is not enough clear picture around the selection to copy from. Try a smaller selection.");
  const S = Int32Array.from(M),
    C = new Set,
    E = new Float32Array(n),
    T = (e, t) => e < 0 || t < 0 || e >= a || t >= o ? 1 : f[t * a + e],
    A = (e, t) => {
      let n = 0,
        s = 0;
      for (let r = -b; r <= b; r++) {
        const i = t + r;
        if (!(i < 0 || i >= o))
          for (let t = -b; t <= b; t++) {
            const o = e + t;
            o < 0 || o >= a || (n += h[i * a + o], s++)
          }
      }
      return n / s
    },
    R = e => {
      const t = e % a,
        n = e / a | 0,
        s = A(t, n);
      let r = T(t + 1, n - 1) + 2 * T(t + 1, n) + T(t + 1, n + 1) - T(t - 1, n - 1) - 2 * T(t - 1, n) - T(t - 1, n + 1),
        i = T(t - 1, n + 1) + 2 * T(t, n + 1) + T(t + 1, n + 1) - T(t - 1, n - 1) - 2 * T(t, n - 1) - T(t + 1, n - 1);
      const l = Math.hypot(r, i) || 1,
        c = -r / l,
        p = -i / l;
      let d = 0,
        u = 0,
        h = 0;
      for (let e = -b; e <= b; e++) {
        const s = n + e;
        if (!(s < 1 || s >= o - 1))
          for (let e = -b; e <= b; e++) {
            const o = t + e;
            if (o < 1 || o >= a - 1) continue;
            const n = s * a + o;
            if (f[n] && f[n - 1] && f[n + 1] && f[n - a] && f[n + a]) {
              const e = (m[n + 1] - m[n - 1]) / 2,
                t = (m[n + a] - m[n - a]) / 2,
                o = e * e + t * t;
              o > d && (d = o, u = e, h = t)
            }
          }
      }
      return s * (Math.abs(-h * c + u * p) / 255 + .001)
    },
    I = (e, t) => !f[t * a + e] && (e > 0 && f[t * a + e - 1] || e < a - 1 && f[t * a + e + 1] || t > 0 && f[(t - 1) * a + e] || t < o - 1 && f[(t + 1) * a + e]);
  for (let e = Math.max(0, c - 1); e <= Math.min(o - 1, d + 1); e++)
    for (let t = Math.max(0, l - 1); t <= Math.min(a - 1, p + 1); t++)
      if (I(t, e)) {
        const o = e * a + t;
        C.add(o), E[o] = R(o)
      } progOpen("Content-aware fill…", "job");
  const P = g;
  let D = 0;
  const F = new Int32Array(x),
    U = new Float32Array(x),
    H = new Float32Array(x),
    O = new Float32Array(x);
  try {
    for (; g > 0 && C.size;) {
      let e = -1,
        t = -1;
      for (const a of C) E[a] > t && (t = E[a], e = a);
      const n = e % a,
        r = e / a | 0,
        i = A(n, r);
      let l = 0;
      for (let e = -b; e <= b; e++) {
        const t = r + e;
        if (!(t < 0 || t >= o))
          for (let o = -b; o <= b; o++) {
            const r = n + o;
            if (r < 0 || r >= a) continue;
            const i = t * a + r;
            f[i] && (F[l] = e * a + o, U[l] = s[4 * i], H[l] = s[4 * i + 1], O[l] = s[4 * i + 2], l++)
          }
      }
      let c = 1 / 0,
        p = -1;
      for (let e = 0; e < S.length; e++) {
        const t = S[e];
        let a = 0,
          o = 0;
        for (; o < l; o++) {
          const e = 4 * (t + F[o]),
            n = s[e] - U[o],
            r = s[e + 1] - H[o],
            i = s[e + 2] - O[o];
          if (a += n * n + r * r + i * i, a >= c) break
        }
        o === l && a < c && (c = a, p = t)
      }
      p < 0 && (p = S[Math.floor(Math.random() * S.length)]);
      for (let e = -b; e <= b; e++) {
        const t = r + e;
        if (!(t < 0 || t >= o))
          for (let o = -b; o <= b; o++) {
            const r = n + o;
            if (r < 0 || r >= a) continue;
            const l = t * a + r;
            if (!f[l]) {
              const t = 4 * (p + e * a + o);
              s[4 * l] = s[t], s[4 * l + 1] = s[t + 1], s[4 * l + 2] = s[t + 2], s[4 * l + 3] = 255, m[l] = .299 * s[4 * l] + .587 * s[4 * l + 1] + .114 * s[4 * l + 2], f[l] = 1, h[l] = i, g--, C.delete(l)
            }
          }
      }
      const d = b + 1;
      for (let e = Math.max(0, r - d); e <= Math.min(o - 1, r + d); e++)
        for (let t = Math.max(0, n - d); t <= Math.min(a - 1, n + d); t++) {
          const o = e * a + t;
          f[o] ? C.delete(o) : I(t, e) && C.add(o)
        }
      for (let e = Math.max(0, r - d - b); e <= Math.min(o - 1, r + d + b); e++)
        for (let t = Math.max(0, n - d - b); t <= Math.min(a - 1, n + d + b); t++) {
          const o = e * a + t;
          C.has(o) && (E[o] = R(o))
        }
      if (++D % 6 == 0 && (progSet(Math.round((P - g) / P * 98), `Filled ${P-g} of ${P} pixels`), await nap(0), xCancel)) throw new Error("cancelled")
    }
    const e = new Uint8ClampedArray(4 * n);
    for (let t = 0; t < n; t++) i[t] && (e[4 * t] = s[4 * t], e[4 * t + 1] = s[4 * t + 1], e[4 * t + 2] = s[4 * t + 2], e[4 * t + 3] = 255);
    structural("Content-aware fill", () => {
      const t = mk("Content-aware fill");
      t.x.putImageData(new ImageData(e, a, o), 0, 0), L.splice(ai + 1, 0, t), ai++
    }), toast("Filled. The result is on its own layer, so you can hide or undo it.")
  } catch (e) {
    String(e.message).includes("cancelled") ? toast("Cancelled.") : toast("Could not fill: " + e.message)
  } finally {
    progClose()
  }
}
ACT.cas = () => {
  $("cascur").textContent = pw + " × " + ph + " px", $("casw").value = pw, $("cash").value = ph, $("casp").disabled = !hasSel, $("casp").checked = hasSel, $("casdlg").showModal()
}, ACT.caf = () => {
  hasSel ? $("cfdlg").showModal() : toast("Select the area you want to remove first. Use a marquee, lasso or the magic wand.")
}, $("cascancel").onclick = () => $("casdlg").close(), $("cfcancel").onclick = () => $("cfdlg").close(), $("casok").onclick = () => {
  const e = K(0 | +$("casw").value, 16, 8e3),
    t = K(0 | +$("cash").value, 16, 8e3);
  $("casdlg").close(), e === pw && t === ph || ((Math.abs(e - pw) > 1 * pw || Math.abs(t - ph) > 1 * ph) && toast("Large changes can look odd. Try to stay within about 50% for the best result."), contentAwareScale(e, t, $("casp").checked && hasSel))
}, $("cfok").onclick = () => {
  $("cfdlg").close(), contentAwareFill(K(0 | +$("cfx").value, 0, 40), $("cfq").value)
}, [
  ["#tools [data-k=ell]", 2],
  ["#tools [data-k=lasso]", 2],
  ["#tools [data-k=wand]", 2],
  ["#tools [data-k=bucket]", 2],
  ["#tools [data-k=grad]", 2],
  ["#tools [data-k=clone]", 3],
  ["#tools [data-k=blur]", 3],
  ["#tools [data-k=dodge]", 3],
  ["#tools [data-k=burn]", 3],
  ["#photo .mb .m:nth-child(5)", 2],
  ["#photo .mb .m:nth-child(6)", 2],
  ["#psendv", 2],
  ["#pcurves", 2],
  ["#bm", 3],
  ["#vcap", 2],
  ["#vrip", 2],
  ["#seqsel", 2],
  ["#vtophoto", 2]
].forEach(([e, t]) => document.querySelectorAll(e).forEach(e => e.dataset.min = t)), [
  ["bhard", "label", 2],
  ["gty", "label", 2],
  ["famt", "label", 2],
  ["pratio", "label", 2],
  ["tol", "label", 2],
  ["flow", "label", 2],
  ["vz", "label", 2],
  ["ag", "label", 2],
  ["agb", "button", 2],
  ["mgo", ".opt", 3],
  ["hist", ".pn", 2]
].forEach(([e, t, a]) => {
  const o = "button" === t ? $(e) : $(e).closest(t);
  o && (o.dataset.min = a)
});
const setLv = e => {
  document.body.dataset.lv = e, $("lvl").value = e;
  try {
    localStorage.setItem("studioLv", e)
  } catch (e) {}
};
let lv0 = "2";
try {
  lv0 = localStorage.getItem("studioLv") || "2"
} catch (e) {}
setLv(lv0), $("lvl").onchange = e => setLv(e.target.value), $("about").onclick = () => $("abt").showModal(), $("abtc").onclick = () => $("abt").close();
