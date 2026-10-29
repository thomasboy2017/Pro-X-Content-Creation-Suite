# Studio Editor PRO X 1.0

A local-first creative studio for photos, video, audio and 3D - delivered as one HTML file, with optional files for install, offline use and embedding.

Your media stays in the browser. Nothing is uploaded unless you choose to export or embed it yourself.

---

## Quick start

**Just edit:** open `studio-editor.html` in Chrome, Edge or Firefox. Double-clicking the file works.

**Install as a desktop app / work offline:** serve the folder over HTTP or HTTPS, then open `index.html` (or `studio-editor.html`) and use **Install** in the top bar. Browsers do not allow installation from `file://`.

Any static host works: GitHub Pages, Netlify, Cloudflare Pages, a plain web server, or a WIX site with the file uploaded to a file host.

**Embedded in WIX or another site:** see [Embedding](#embedding) and `wix-embed.html`.

---

## What is new in 1.0

### Creator Hub
One place for the publishing jobs that normally need three other apps. Open it from **Creator** in the top bar or with `Alt` + `C`.

- **Publish** - frame sizes for YouTube, YouTube 4K, Shorts, TikTok, Instagram Reels, Instagram Feed, Instagram Portrait, Facebook, LinkedIn, X and Pinterest. Choosing a platform sets the sequence size, frame rate, safe zones and a matching export preset. **Fill frame** crops existing clips to the new shape; **Fit frame** letterboxes them.
- **Captions** - paste or open SRT/VTT, parse, preview the cue table, then add the cues as caption clips on V3. Styles cover font, size, position, line width, background plate, text/plate colours, bold and shadow. **Export SRT** writes the current captions back out.
- **Thumbnail Studio** - capture the current frame or open a picture, add a headline, supporting line and badge, pick a template and a platform size, then export PNG or JPG.
- **Audio tools** - duck music under speech with volume keyframes, remove silence and close the gaps, normalise a clip to a target peak, shape **bass** and **treble**, change **tempo** (50-200% with pitch preserved) and **pitch** (-12 to +12 semitones), and add a non-destructive **censor** with a 1 kHz bleep or silence.
- **Brand kit and watermark** - name, handle, two colours, a logo, and a watermark with position, size, opacity, plate and shadow. The watermark is painted on the program monitor and every export path.
- **Export and codecs** - a live capability matrix (WebCodecs and MediaRecorder) for H.264, H.265, VP9, AV1, VP8, Opus and AAC, plus a one-click best-format check.
- **Memory and recovery** - browser heap, history depth, audio cache, orphaned media, and IndexedDB recovery snapshots with restore and delete.
- **Embed and PWA** - copy-ready iframe snippet, the full postMessage API, install status and update checks.
- **Settings** - automatic/forced mobile layout, accent colour, preview quality, safe zones, compatibility mode and autosave.

### Rendering and engine
- High-quality canvas smoothing and correct pixel ratio for preview and 3D.
- Enhanced title renderer with alignment, wrapping, padding, backgrounds, gradients and caption styling.
- Safe-zone overlays (action safe, title safe, rule of thirds, platform UI, 4:5 feed-safe box) that scale with the frame.
- AV1 and WebCodecs VP9 added to the export formats next to H.264, H.265, WebM and ProRes.
- Automatic export format selection with safe fallbacks when a hardware encoder is missing.
- Watermark compositing in preview and every export path.

### Audio tone, tempo, pitch and censors
- **Bass** and **treble** shelves (±15 dB) are rendered with an offline biquad, so the preview and every export match.
- **Tempo** (50-200%) uses overlap-add time stretching: the clip gets shorter or longer and later clips on the same track ripple out of the way.
- **Pitch** (-12 to +12 semitones) resamples and time-stretches back to the original length, so voices can go deeper or higher without changing the cut.
- Applying tone or timing writes a new local WAV, adds it to the media library and swaps it into the selected audio clip. Undo and redo restore the previous source; project files embed the rendered WAV.
- Tone and timing need an audio clip on track A1 and work on clips up to 5 minutes at a time. Censors work on video and audio clips.
- **Censor** markers are non-destructive. Park the playhead over a word and add a 1 kHz bleep or silence; the band is drawn on the timeline, survives project saves and is applied to live preview, MediaRecorder exports and the offline WebCodecs mix.
- Splitting a clip keeps each censor on the correct half. Censors are stored relative to the clip, so add or adjust them after trimming for the most accurate placement.
- Volume keyframes, fades, ducking and normalization keep working on top of all of the above.

### Memory management
- Photo undo history is capped by a configurable depth (4-60 steps) instead of a fixed 12.
- The decoded-audio cache is capped at six entries.
- Blob URLs are revoked when unused media is released.
- Memory panel with live heap, history, clip and library counts, plus explicit clean-up actions.
- **Compatibility mode** reduces effects, pixel ratio and expensive CSS for older or low-memory devices.

### Recovery
- Autosave writes project snapshots to IndexedDB every few minutes (configurable) and on demand (`Ctrl` + `Shift` + `S`).
- A recovery banner appears on the next visit if a recent snapshot exists.
- The last five snapshots are kept. Projects over 384 MB are skipped - save a `.studio` file for those.

### PWA and desktop
- Web app manifest with 32/180/192/512 icons and a maskable icon.
- Offline shell with network-first HTML and code, cache-first icons and images.
- Install button, update chip, standalone layout and safe-area padding.
- Firefox: installation uses the browser menu; the editor detects the missing `beforeinstallprompt` and explains what to do.

### Embedding
- `?embed=1` gives a compact UI, an "open standalone" escape hatch and automatic height reporting.
- `postMessage` API for state, workspace switching, theme, project load/save, frame capture and export.
- `?origin=https://your-site.example` restricts message origins if you want a hard boundary.

### Mobile and tablet
- Bottom action bar for Photo, Video, Audio, 3D, playback, the Creator Hub and settings.
- Every workspace, including 3D, Resources and What's new, is reachable from the bar or from **Settings > Jump to a workspace**.
- Side panels become touch drawers with a dimmed backdrop and close buttons.
- Tap-friendly menus, larger hit targets, safe-area padding and a full-screen hub.
- Automatic activation on coarse pointers and narrow screens; can be forced on or off in Settings.

---

## Files

| File | Purpose |
| --- | --- |
| `studio-editor.html` | The editor. Single file; the 1.0 upgrade CSS and JS are inlined. |
| `index.html` | Friendly entry point that forwards to the editor and links the manifest. |
| `manifest.webmanifest` | PWA name, icons, colours, shortcuts. |
| `sw.js` | Offline shell and update handling. |
| `icon-32.png`, `icon-180.png`, `icon-192.png`, `icon-512.png` | App and browser icons. |
| `icon-maskable-512.png` | Maskable icon for Android and desktop launchers. |
| `wix-embed.html` | Working example of the iframe + postMessage bridge. |
| `src/pro-x-v1.css`, `src/pro-x-v1.js` | Readable, unbundled upgrade layer (development only; the shipped HTML already contains both). |
| `src/app.beautified.js` | Formatted copy of the original app script, for reference and diffing. |
| `src/make-icons.ps1` | Regenerates the PNG icons. Not needed at runtime. |

Upload `studio-editor.html`, `index.html`, `manifest.webmanifest`, `sw.js` and the five PNG icons to the same folder for install and offline mode. The editor alone is enough for editing (`file://` included); the `src` folder is not needed at runtime.

---

## Embedding

### WIX
1. Upload `studio-editor.html` (and the PWA files) to a host that allows direct file links.
2. In WIX, add **Embed > Custom embed > Embed code**.
3. Paste:

```html
<iframe
  src="https://your-host.example/studio-editor.html?embed=1"
  title="Studio Editor PRO X"
  style="width:100%;height:720px;border:0;border-radius:12px;overflow:hidden"
  allow="fullscreen; clipboard-write; microphone; camera"
  loading="lazy"></iframe>
```

4. Publish. Use the Creator button inside the frame for captions, thumbnails and presets.

Some hosts block downloads or full screen inside iframes. **Open standalone** in the embed bar opens the editor in its own tab.

### postMessage API

Send messages to the iframe. Replies always include `source: "studio-pro-x"`, the same `requestId`, and a version.

```js
const frame = document.querySelector("iframe").contentWindow;
frame.postMessage({ type: "prox:ping", requestId: "1" }, "*");

window.addEventListener("message", (event) => {
  if (event.data?.source !== "studio-pro-x") return;
  console.log(event.data.type, event.data);
});
```

| Command | Payload | Reply |
| --- | --- | --- |
| `prox:ping` | - | `prox:pong` with version and state |
| `prox:state` | - | `prox:state` |
| `prox:openWorkspace` | `{ workspace }` | `prox:workspace` |
| `prox:openCreator` | `{ panel }` | `prox:creator` |
| `prox:setTheme` | `{ accent }` | `prox:theme` |
| `prox:toast` | `{ text }` | `prox:toast` |
| `prox:loadProject` | `{ buffer }` or `{ data }` | `prox:loaded` |
| `prox:getProject` | - | `prox:project` with `buffer` |
| `prox:frame` | `{ time, format }` | `prox:frame` with `buffer` |
| `prox:export` | - | `prox:export` (opens the dialog) |

Events also fire without a request: `prox:ready`, `prox:height`, `prox:captions`, `prox:preset`, `prox:watermark`, `prox:thumbnail`, `prox:panel`, `prox:teleprompter`, `prox:installed`, `prox:projectOpened`, `prox:toast`.

---

## Keyboard

| Keys | Action |
| --- | --- |
| `Alt` + `C` | Open or close the Creator Hub |
| `Alt` + `P` | Open the teleprompter |
| `Alt` + `M` | Open memory and recovery |
| `Ctrl` + `Shift` + `S` | Save a recovery snapshot |
| `Space` | Play/pause (Video) or start/pause the teleprompter |
| `Esc` | Close menus, drawers and the teleprompter |

The original editor shortcuts (`Ctrl`+`Z`, `Ctrl`+`Y`, photo tools, timeline editing) still apply.

---

## Browser support

| Browser | Editing | H.264 export | AV1 / VP9 | Install | Offline |
| --- | --- | --- | --- | --- | --- |
| Chrome / Edge (recent) | Yes | WebCodecs | WebCodecs where the GPU supports it | Yes | Yes |
| Firefox (recent) | Yes | MediaRecorder WebM, or WebCodecs where available | WebM | Browser menu | Yes |
| Safari (recent) | Yes | Limited; WebM/H.264 depends on the OS | Partial | Add to Dock (macOS) | Yes |
| Mobile Chrome / Safari | Touch layout | Device dependent | Device dependent | Add to Home Screen | Yes |

If a codec is missing, the editor falls back instead of failing the export. The Export & codecs panel always shows what the current browser reports.

---

## Tips

- Keep the tab visible during a MediaRecorder export; browsers throttle hidden tabs.
- Close other heavy tabs before a long export, or turn on Compatibility mode.
- Use **Save project** for anything important, and the recovery panel for accidents.
- Each tone/tempo/pitch apply adds a rendered WAV to the media library, so a project grows a little. Split very long audio first (the tools cap a single pass at 5 minutes) and save a `.studio` file before a big session.
- Censors are non-destructive: move or remove them at any time. They are saved with the project and are audible in the preview and every export.
- For vertical video, choose Shorts/TikTok/Reels first, then **Fill frame** on existing clips.
- Captions are ordinary clips on V3 - trim and move them like any other clip.
- The watermark is saved in this browser, not inside the project file.

---

## Credits

Studio Editor PRO X 1.0 - created by Matthew J Thomas.
Built on the original Studio Editor with Three.js, mp4-muxer and ffmpeg.wasm.
