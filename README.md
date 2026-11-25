# 3% Little Shop

A small, browser-local San Francisco gift-shop game built around the approved 3PERCENT concept art.

**Current source:** Neighborhood v2, frozen build identity `93173ca1f16a4242ac9f5f023dd84d9d808c7f4d0931ceae3ac679bb4815f773`. This private repository is the main source for further development. It does not publish a new game version or change the existing Sites preview.

## Run locally

Requires Python 3 and Node.js for tests. No package installation or build step is needed.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/dist/` in a browser. Run `npm test` for state checks. Game progress stays in that browser's local storage; no account or API key is needed.

The Neighbors button adds a clear/rain street encounter and a distinct Maya return choice. A story remains available until answered or the shop closes. Choices save as shop memories; welcoming the postcard leaves a small card in the window. This is a first playable slice, not a complete NPC, animal, or collection system.

## Collaboration

Create a branch for each change, for example `feature/maya-order` or `experiment/animal-cameo`. Keep AI-assisted work on a branch or separate copy and provide a short summary, changed files, and test steps. Director integrates; independent playtest QA checks a frozen build before merge. Do not push secrets, customer data, or unverified external art.

Run `sh tools/export_zip.sh` to create a ZIP from the current committed source in `exports/`. It excludes uncommitted files and is intended for a tool that cannot connect to GitHub. Review the tool's privacy and file terms before uploading it, and return its edits as a patch or branch for review.

See [version history](docs/VERIFIED_BUILDS.md) and [art source notes](docs/ASSET_PROVENANCE.md). No public license is granted by this private repository.

## Play

- Prepare stock before opening a roughly five-minute shift. The first guest arrives after a short opening grace period; later arrivals are staggered, with room for three visitors at once.
- Ordinary guests browse available gifts and buy automatically. The cashier serves a queue, while the host refills depleted displays from existing storage. Stock is reserved per customer and money changes once at payment.
- Special color requests are optional. Accept one, offer a matching piece, or let the guest browse another day. Other shoppers keep moving while a request waits. Request crafting keeps that guest and palette attached to the piece; general crafting is marked as shop stock.
- Make ceramics at the workbench: choose a design and palette, paint its top, middle, and base, then let it finish. Crafting uses one clay and the listed amount of virtual money. The finished piece retains its palette in storage, on the shelf, and across saves.
- The three founders have separate visual roles: making, taking payment, and packing/restocking. Their active and idle poses follow gameplay state.
- Buy a braided rug, a window plant, or a palette rack with shop earnings. The rack also unlocks Lavender. Classic, Rose, and Sea Glass are available from the start.
- The first three sales award a one-time virtual $50 bonus. Clay and display capacity are available in the stock panel.
- Close for today or finish the shift, let accepted sales settle, then read the summary. The next day starts in preparation at 9 AM. The shop clock follows shift progress and stays between 9 AM and 9 PM. Automatic weather varies by game day; the environment panel also previews day, dusk, night, clear weather, and light rain. These are authored game conditions, not live San Francisco weather.

Progress is saved in this browser under the stable key `threepercent-little-shop.save.v1`. The data uses schema version 3 and migrates earlier saves while preserving their balance, stock, settings, and paid work. Export/import can move a save manually. There is no account database, cross-device synchronization, Shopify integration, real-money reward, or background income while the page is closed.

## Source structure

- `dist/index.html`, `dist/styles.css`, `dist/app.js`: interface and interaction wiring.
- `dist/game-state.js`: deterministic requests, payment stages, painting, economy, shifts, weather settings, and save validation/migration.
- `dist/scene.js`: layered Canvas scene, state-driven visitors and staff, foreground occlusion, cable car, product displays, decorations, and visual weather.
- `dist/product-art.js`: shared ceramic coloring used by the workbench and cached shelf sprites.
- `dist/config.js`: editable brand and asset configuration.
- `dist/assets/`: the background and independently replaceable transparent sprite atlases.
- `tests/game-state.test.mjs`: focused game-state checks.- `tools/export_zip.sh`: exports committed source for offline collaborators.

## Replace art later

The current ceramic designs and brand lettering are concept placeholders. Preserve the approved camera and shop proportions when updating the background. Replace the product atlas, brand logo configuration, or individual scene asset settings without rewriting the economy. Sprite placement is configurable through the scene asset configuration.

The product atlas has five equal columns, in this order: cake, mushroom, dresser, carousel, bunny. The v3 visitor atlas has six columns and three rows: standing, four walking poses, and standing with a paper bag. Each row is a different visitor. The original four-column, two-row people atlas remains a fallback. The original painter atlas has three columns and one row. The founders atlas has four columns and three rows, in maker/cashier/host order; each row contains role-specific idle and working poses. These characters are illustrative placeholders, not verified portraits of the founders. Transparent padding is trimmed at runtime with consistent row anchors. All animation is rendered locally; there are no model calls during play.

## Verification

Run `node --test tests/game-state.test.mjs`. Serve `dist/` with the supported static preview or hosting workflow; this project has no dependency installation or build step. `render_game_to_text()` returns a read-only JSON snapshot for inspection. The engine checks do not replace browser checks of the Canvas path, foreground overlap, painting feedback, payment, or phone layout.

