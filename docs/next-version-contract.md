# Little Shop v2 implementation contract

Preserve the approved fixed camera, detailed San Francisco artwork, local-only runtime, original brand mood, and existing private Site. No backend or runtime model calls. Deliver the agreed shop behavior and a compact playable loop.

## Ownership

- Engine agent: `dist/game-state.js`, `tests/game-state.test.mjs`, and this contract's API details after notifying collaborators.
- Scene agent: `dist/scene.js`, `dist/config.js`.
- UI agent: `dist/app.js`, `dist/index.html`, `dist/styles.css`.
- Root: skill installation, generated art in `dist/assets/`, integration, browser QA, README, publication.

## Required shared API

Keep `PRODUCTS`, `ShopGame`, `SHOP_STORAGE_KEY`, `CLAY_BUNDLE`, and the existing engine actions. Add exported `PALETTES` and `DECORATIONS` arrays. Every action returns `{ok,message}`. Preserve `game.state`, `game.environment`, `game.tick(seconds)`, save/export/import/reset behavior and existing events. Top-level counts `inventory[id]` and `shelves[id]` remain available to the renderer/UI.

- `craft(productId, paletteId = 'classic')`: start a job, debit once. Job has `productId,paletteId,phase,paintedZones,duration,remaining`. Phase is `painting` until three distinct zones are painted, then `finishing` for a short automatic finish. `paint(zoneIndex)` validates 0,1,2 and advances once per zone. On completion store an item with its palette. Do not lose palette provenance when stocking or saving.
- `recommend(productId)`: offer a stocked piece to the current waiting customer. Match the requested tag and optional palette. Give explicit friendly feedback on mismatch; never take payment for an unavailable piece. Correct offer starts checkout. One active customer, one sale per completed payment.
- `declineCustomer()`: politely let a waiting customer leave without a sale, no hard fail.
- `buyDecoration(id)`: spend once and persist an immediately visible upgrade.
- `nextDay()`: close the day summary and start the next short shift. A shift is approximately 180 active seconds. If a customer is mid-transaction at closing, finish or cancel coherently before the summary. Never silently discard paid state or paid stock.

## Observable state

- `visit` is null or `{id,name,kind,request,tag,paletteId,stage,progress,productId,paid,message}`. Stages are `entering`, `waiting`, `checkout`, `paying`, `leaving`. `progress` is normalized within the current stage and derives from engine time, never a second render timer. `waiting` does not time out aggressively.
- `staff` exposes `{maker,cashier,host}` activity strings, or the scene derives equivalent activity from craft/visit plus a short `stockActivity` timer.
- `decorations` is a serializable owned-id record. Include a rug, a window accent/plant, and one useful palette unlock if feasible.
- `daySummary` is null or concise shift data including sales, earned, requests fulfilled/missed, and a useful next-day hint. `shiftRemaining` is readable. Keep normal day/night and clear/rain settings; existing manual previews still work.
- `shelfPalettes[id]` exposes the visible front piece's palette for scene display. Engine may add `inventoryPieces` and `shelfPieces` internally, but counts must agree and v1 saves must migrate without dropping coins/stock.
- `notice` or an equivalent short field describes a cable-car visitor, a rain shelter visitor, or returning neighbor. These are authored deterministic events, not external services.

## Engine integration details

- `PRODUCTS[].tags` uses `birthday`, `housewarming`, and `custom`. `PALETTES` holds `{id,name,colors,tint,filter,decorationId}` for `classic`, `rose`, `mint` (Sea Glass), and `lavender`. Only Lavender requires a decoration. `DECORATIONS` holds `{id,name,cost,description,paletteId}` for `rug`, `window-plant`, and `palette-rack`. Only `palette-rack` unlocks a palette.
- `paintedZones` is a numerically ordered list of zone indices. `duration` and `remaining` describe the finishing timer, which starts after the third zone. `inventoryPieces[productId][paletteId]` and `shelfPieces[productId][paletteId]` are counts. `stock(productId, quantity, paletteId)` can move an exact palette. Omitting the palette prioritizes painted pieces. `shelfPalettes[productId]` is `null` when its shelf is empty.
- Visit IDs are increasing integers. Visitor kinds are `cable-car`, `neighbor`, `rain`, and `returning`. `visit.paletteId` is the requested palette, while `visit.offerPaletteId` is the piece selected for checkout. Entering takes 4 seconds, checkout takes 2.4 seconds, paying takes 2.2 seconds, and leaving takes 4 seconds. Waiting progress reaches 1 after a minute and stays there until the player acts or the shift closes. At 55% of paying, the engine removes the selected piece and credits one payment. Unpaid departure keeps `productId` and `offerPaletteId` null.
- `staff.maker` is `idle`, `painting`, or `finishing`. `staff.cashier` is `idle`, `checkout`, or `paying`. `staff.host` is `idle`, `restocking`, or `packing`. `stockActivity` is the seconds left in a 2.8-second restock action. Renderer routes and poses use these signals or the underlying visit, job, and restock data.
- The shift counts down only while the shop is open. During an elapsed shift, `closing` stays true until the final visitor leaves. Closing finishes accepted orders and dismisses unanswered requests. `daySummary` contains `{day,sales,earned,fulfilled,missed,hint}` after departure. `nextDay()` reopens at 9 AM and keeps the economy, decorations, and visitor history.
- `sale` and `crafted` events provide `paletteId`. New events are `visitor`, `request`, `checkout`, `paying`, `departure`, `visitEnded`, `declined`, `shiftEnd`, `nextDay`, and `decoration`. `shiftEnd` carries `summary` after all visit activity ends. `notice` is a short string. `game.environment` and `game.getEnvironment()` provide the same view.
- Schema v2 keeps the existing local storage key. V1 imports assign Classic to existing stock and resume paid crafts at their original remaining time. The engine saves visit transitions and payments before emitting events. Reloads resume the stored stage and timer from active play.

## Loop and art boundaries

Three authored request categories: birthday (cake/carousel), housewarming (mushroom/dresser/bunny), and a custom palette request. Include clear names and short readable requests. First request should be easy to fulfill from starting stock. Let subsequent requests motivate painting and restocking. A returning visitor can mention the previous gift.

Maker paints only during a real job, then uses a tools-down idle. Cashier stays behind register and reacts during payment. Host does packing/restocking when meaningful and waits otherwise. Customer walks through the doorway, browses, stops on the public side of the register, pays, receives a bag and exits. Correct route geometry and foreground masks; pedestrians avoid the hydrant. Root will supply an optional transparent `founders.png` sheet, 4 columns x 3 rows, rows maker/cashier/host. Use fixed bottom anchors and a coherent scale. Keep detailed raster people/art, never replace them with generic stick figures.

UI should make the current request and next action obvious while keeping the shop visible. Use a compact contextual order card. Painting can use a focused workbench panel with a large product preview, palette choices and three clear paint regions. Decoration buying has immediate visual results. Never label a mere tint as a completed physical paint animation. Expose a concise read-only `render_game_to_text()` debugging snapshot for QA if helpful; production business actions must remain real engine actions.

## Verification

Verify one payment per customer, state/animation alignment, no sale without available stock, craft palette persistence, no duplicate paint charge, v1 migration and reload mid-visit, decoration persistence, clean closing/reopening, and no offline windfall. Review desktop and portrait/landscape phone screenshots and actual gameplay. Browser QA and final deployment belong to root.
