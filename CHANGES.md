# Studio Editor PRO X 1.18: changes

Base file: `studio-editor-1_15_1.html` (identical to `studio-editor-1_15.html`).
New file: `studio-editor-1_18.html`, plus `sw.js`.

The app now reports version 1.18 (title, brand, About, Creator Hub, help, greeting). A **Version 1.18** entry is at the top of the What's new tab, and its banner is updated. The `sw.js` cache name is now `v1.18`, so installed copies refresh. Syntax was checked on all 8 scripts, but the app was not run in a browser, so test each change.

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
