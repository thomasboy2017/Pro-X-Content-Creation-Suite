# Studio Editor PRO X 1.21: changes

Base file: `studio-editor-1_15_1.html` (identical to `studio-editor-1_15.html`).
New file: `studio-editor-1_21.html`, plus `sw.js`.

The app now reports version 1.21 (title, brand, About, Creator Hub, help, greeting). **Version 1.21** and **Version 1.18** entries are at the top of the What's new tab, and its banner is updated. The `sw.js` cache name is now `v1.21`, so installed copies refresh. Syntax was checked on all 8 scripts, but the app was not run in a browser, so test each change.

## 1. `sw.js` (new file)

- Gives the PWA offline mode. The app already registered `sw.js`, but the file did not exist.
- Page loads: network first, saved copy when offline.
- Scripts and decoders: cached copy first, refreshed in the background.
- Partial-file (range) requests go straight to the network so video seeking is not cached.
- Handles the app's `SKIP_WAITING` message, so the "update ready" prompt works.
- Needs https and must sit in the same folder as the HTML file.

## 2. Spaces in video text

- Cause: the video tab's keyboard shortcuts ignored only `INPUT` and `SELECT`, so typing in the title text box triggered them. Space toggled play/pause (and was blocked from typing), "s" split the clip and Delete deleted it.
- Fix: the handler now also ignores `TEXTAREA` and any editable element.

## 3. Custom fonts in the video tab

- Added a "Load font file (TTF, OTF, WOFF)…" button to the video title panel.
- Uses the existing font loader (`importFontFile`), so fonts loaded in the photo tab also appear in the video font list.
- Loaded fonts are listed by name and applied to the title immediately.

## 4. Send audio

- **Video to Audio editor:** selecting a clip with sound shows "Send audio to Audio editor". It copies the part of the sound the clip uses into the Audio workspace as a new track and switches to that tab.
- **Audio editor to video:** new "Send back to video clip" in the Audio File menu. It adds the edited track to the video timeline at the original clip's start and mutes the original clip. A track that did not come from a clip is added at the playhead.
- Source files over 512 MB are refused (the browser cannot decode them).
- If the clip's speed is not 100%, the sent audio is at normal speed.

## 5. Phone auto-fit

- Added to the existing touch layout; nothing was removed.
- Text size and button height scale with screen width.
- Buttons, menus and tabs keep a minimum tap height.
- Text boxes use at least 16px, so iPhones do not zoom in on focus.
- Landscape phones get slightly smaller sizing.

## 6. Motion graphics for titles and lower thirds

- New project buttons: **+ Animated title** (pops in) and **+ Animated lower third** (left-aligned, with an accent bar and a wipe in and out).
- New **Motion graphics** section in the title panel, for any title or lower third (not mattes):
  - Animate in / Animate out: None, Slide up, Slide from left, Pop, Wipe, Typewriter, Word by word.
  - Anim time (0.2 to 3 s), Accent bar on/off, Bar color, and a Preview animation button.
- Animations are drawn frame by frame, so they show in the preview and in exports. Text that is not animating costs nothing extra per frame.
- Spaces, multi-line text, wrapping, alignment and custom fonts all work with the animations.
- Not included: importing Adobe Premiere `.mogrt` templates. They contain an After Effects project that only Adobe's engine can render.
- Tested with a mock canvas for errors and caching; not run in a real browser.

## 7. Fonts (1.21)

- **Manage fonts** dialog in the Photo text panel and the Video title and graphic panels: preview, remove, add.
- Several font files can be added at once, or dropped anywhere on the editor.
- Fonts you add are remembered in this browser (IndexedDB) and still saved inside projects. The same file is never added twice.
- Chrome and Edge on a computer can add fonts installed on the device ("Use installed fonts"). These only exist on that device.
- Video title fonts now come in groups (Fonts, Your fonts, Installed, Google fonts). Google fonts load on demand and reload when a project is opened.

## 8. Instruments (1.21)

- **+ Instruments** in the Video project panel opens a floating panel with a piano keyboard and a drum-pad view.
- 11 instruments (piano, electric piano, organ, synth lead, synth bass, warm pad, strings, guitar pluck, marimba, bells, brass) and 5 drum kits (Acoustic, Rock, 808, Electro, Lo-fi), all synthesised, so nothing is downloaded.
- Play with the mouse or touch, your computer keyboard (labels are shown on the keys), or a MIDI keyboard or pad (Chrome or Edge).
- **Record** plays the timeline from the playhead. **Stop** renders the take and puts it on the audio track at the right time.
- Keyboard shortcuts for the editor (such as S for split) are paused for the keys the instrument uses while the panel is open.

## 9. Custom motion graphics (1.21)

- **+ Motion graphic…** menu: Blank, Callout box, Subscribe bar, Progress bar, Spinning burst, Lower third from shapes.
- Each graphic is a list of shapes: rectangle, circle, rounded bar, triangle, star and text. Every shape has position, size, rotation, opacity, color, gradient, outline and corner radius.
- Per shape animation: in, out, delay, time, and a keep-moving loop (pulse, spin, float, blink, shake). Add, copy, delete and reorder shapes.
- **Save template** writes a `.pxmg.json` file. **Load graphic…** adds a saved one as a new clip. Loaded files are checked and cleaned before use.
- Text shapes use the same font picker as titles, including your own fonts.

## 10. Photo: Develop panel and more (1.21)

- New **Develop** menu, **Develop panel…**: exposure, contrast, highlights, shadows, whites, blacks, temperature, tint, vibrance, saturation, clarity, dehaze, sharpen amount and radius, vignette, vignette midpoint, grain.
- Live preview with a histogram, **Hold for original**, **Auto**, **Reset** and 8 presets. Double-click a slider to reset it.
- **Color mixer** (hue, saturation, luminance for 8 colors) and **color grading** (shadow and highlight hue and strength, balance).
- **Local adjustments**: limit everything to a linear gradient or a radial area, with feather, invert and a Show mask view.
- **Healing brush** tool (J): click a blemish for an automatic source, or Alt-click to choose one. It matches color and brightness to the surroundings.
- **Red-eye removal** in the Develop menu (select the eyes first).
- Develop works on the active layer and respects the current selection. One undo step.
- Not included: layer masks, liquify, and a Photoshop-style patch tool.

## Testing note

The synth was rendered offline and checked for silence and clipping on every instrument and drum. The graphics and Develop engines were rendered on a real canvas and inspected. The new panels were exercised in a simulated browser. The full app was not run in a real browser, so please try each feature.
