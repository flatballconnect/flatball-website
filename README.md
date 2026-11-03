# flatballconnect.app

The website for Flatball Connect: a home page, the privacy policy and the
account-deletion page the app stores require, the install page, the rules
pages and the page a shared game's link lands on. Plain HTML and one
stylesheet in the app's colours, served by GitHub Pages at
flatballconnect.app (`CNAME`).

The privacy policy states only what the app does; when the app starts
collecting or sharing something new, update `privacy/` (and its date) and,
for anything about deletion, `delete-account/`, in the same change.

- **`rules/` and `sitemap.xml` are generated** from the app's own content
  by `tool/build-rules.py` (the app's repo is expected at `../flatball`):
  the 12 Quick Reference calls, each with its steps, hand signal and the
  WFDF rules behind it word for word, and the 24 hand signals with the
  app's drawings. Never edit them by hand; rerun the script after the
  app's `rulebook.json`, `hand_signals.json` or `glossary.json` change.
  `--check` fails if they are stale.
- **`game/`** reads the shared game from the live database with the app's
  publishable key (public by design, and in every APK): `game_by_id`
  answers signed out with the game and its counts, never who is going.
- **Downloads** point at `releases/latest/download/flatball.apk`, a copy of
  the universal APK that the app's `tool/release-android.sh` uploads with
  every release since 0.14.2. `release.js` reads the latest release from
  GitHub's API to show its version and what's new.
- **`og.jpg`**, the picture a shared link shows, is drawn by
  `swift tool/draw-og-image.swift ../flatball/icons/app/app_icon.png`.
  `apple-touch-icon.png` and `icon-192.png` are the app's launcher icon at
  180 and 192 px (`sips -z`).
- **`404.html`** is served by GitHub Pages for any missing path, at that
  path, so its links start from the root.
