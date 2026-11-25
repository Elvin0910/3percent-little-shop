# Little Shop v3 correction contract

## Problem and scope

The owner reported one-at-a-time traffic, abrupt opening arrivals, forced crafting for every visitor, an unnatural pedestrian gait, and a screenshot where a Rose request sits behind a completed Classic piece. A second screenshot shows after-midnight trading with shift time left. Fix the underlying shop loop, motion, and request context. Preserve the approved detailed San Francisco scene, its proportions, three founders, products, and local-only runtime. Preserve real save balances and paid work. No backend, account integration, or extra paid APIs.

## Ownership

- Engine: `dist/game-state.js`, `tests/game-state.test.mjs`, and API clarifications below.
- Scene: `dist/scene.js`, `dist/config.js`.
- UI: `dist/app.js`, `dist/index.html`, `dist/styles.css`.
- Root: generated art, integration/browser verification, documentation, publication.

## Agreed behavior

1. Up to three real visitors are present concurrently. They have independent arrival, browsing/request, queue, checkout, paying, and leaving state. A waiting optional request never blocks normal shoppers. One cashier serves one customer at a time.
2. Opening has about a ten-second first-arrival grace period. Later arrivals are staggered, deterministically varied around 10 to 16 seconds, subject to room. The ordinary shopper browses for several seconds before choosing available stock and paying automatically. Prefer their gift category, then another available gift; if nothing is for sale, they leave politely.
3. Special color requests are optional, first appearing after ordinary visitors. At most one unresolved optional request at a time. The owner can accept, offer an already matching stocked piece, or decline. Ordinary trade continues while a request waits.
4. The host automatically moves one stored piece to a depleted display after a short real restock timer. This never creates stock or spends money. Manual stocking remains available and respects reserved stock.
5. A day has a preparation state, then an approximately five-minute open shift. `nextDay()` resets the clock to 9 AM and prepares the next day with `open:false`; it does not spawn anyone. The day clock derives from open-shift progress and remains within 9 AM to 9 PM. Closed preparation, manual closing, and finishing departures do not push it past midnight. Closing admits no new shoppers and resolves accepted sales exactly once before summary.
6. Workbench actions for a request carry its explicit visitor ID and required palette from start through completion. General crafting stays general. A Classic piece must never be described as fulfilling a Rose order. If the original requester has left, the finished piece remains valid stock and the UI says so.
7. At all times, a piece committed to a queued customer cannot be committed to another customer. Money and stock change exactly once at payment. Reloading, closing, restocking, and saving mid-queue do not duplicate sales or stock.

## Shared API baseline

Keep exports, catalog data, old public actions, stable storage key, painting, decorations, and save/export/import behavior. Bump the serialized schema and migrate v1/v2 saves.

- `state.visitors`: array of visit records. Keep `state.visit` as a derived compatibility view, favoring the optional request; the scene must render all `visitors`, not just this view.
- Each visit includes stable `id`, `name`, `kind`, `spriteRow`, `browseSlot`, `special`, `accepted`, `tag`, `request`, `paletteId`, `stage`, `progress`, `productId`, `offerPaletteId`, `paid`, `message`, plus serializable timers needed by the engine. Additional visual route/queue indices can be derived and documented by the engine.
- Phases include `entering`, `browsing`, `waiting` (optional request), `queued`, `checkout`, `paying`, `leaving`. Keep old timing meanings for checkout/payment where sensible. Only the simulation drives customer movement progress.
- `acceptRequest(visitId)`, `declineCustomer(visitId?)`, `recommend(productId, visitId?)`, and `craftForRequest(visitId, productId)` return `{ok,message}`. `craftForRequest` uses the requested palette and records `requestId` on the craft and `crafted` event. It can accept the request as part of that explicit action. General `craft(productId,paletteId)` has no request binding.
- `availableOnShelf(productId, paletteId?)` reports unreserved sellable counts. Reservation totals derive from live unpaid visitors so saves cannot carry inconsistent extra reservation records.
- `state.checkoutVisitId`, `state.arrivalRemaining`, `state.stockActivity`, `state.staff`, and existing summary/shift fields are observable. Add an explicit `state.preparing` if helpful. Keep `shelfPalettes` correct.
- The engine must send the exact completed interface and timing table to both scene and UI agents before their final integration.

### Implemented timing and routes

| Engine phase | Duration and behavior |
| --- | --- |
| Preparation | Runs at 9 AM with `open:false` and `preparing:true`. The next shift starts with an explicit open action. |
| Open shift | 300 seconds of open time, mapped linearly from 9 AM to 9 PM. First arrival after 10 seconds, then deterministic 10–16 second gaps. A due arrival waits for a free visitor slot. |
| Entering | 4, 5.4 or 6.2 seconds by `browseSlot`. `progress` follows the route to that slot. |
| Browsing | 8.4, 9 or 9.6 seconds by visitor ID. Ordinary shoppers choose sellable stock and queue or leave. An optional request becomes actionable when its visitor reaches `waiting`. |
| Waiting | 44 seconds initially. First acceptance restarts the timer at 75 seconds. A repeated acceptance keeps the existing timer. |
| Queued | Approach takes 2.2, 3.8 or 5.2 seconds by `browseSlot`. Rank advances take 1.8 seconds. `queueFromIndex` is `-1` for a browse-slot origin. `queueIndex` counts from the head at 0. `queueProgress` is normalized and stays at 1 until the next move. |
| Checkout | 2.4 seconds from the queue head to the register. `checkoutVisitId` points to the current register customer. |
| Paying | 2.2 seconds at the register. Stock and funds change together at 55% progress. |
| Leaving | 4.5, 5.5 or 6.3 seconds from `exitFrom:'browse'` by `browseSlot`, or 5 seconds from `exitFrom:'register'`. |
| Host restock | A 3.2-second timer for a physically empty display with sellable storage stock. `restockProductId` and `restockRemaining` describe the pending move. Afterward `stockActivity` counts down from 2.8 seconds and `stockProductId` and `stockPaletteId` identify the move. |

- `setOpen(false)` pauses arrivals and the day clock and lets committed sales finish. `setOpen(true)` resumes the same shift. `closeShift()` ends the day early, freezes the clock at its current time, and shows the summary after remaining visitors leave. At natural closing the clock reaches 9 PM.
- `recommend(productId, visitId, source = 'shelf')` accepts and reserves the exact requested palette from an available shelf or storage piece. Pass `'inventory'` to offer from storage. `availableOnShelf(productId, paletteId?)` and `availableInStorage(productId, paletteId?)` subtract live unpaid reservations. A visitor retains its `reservationSource` as sale metadata after payment.
- `craftForRequest(visitId, productId)` requires an explicit waiting visitor ID and uses that visitor’s palette. The charged job stores `requestId` and `requestName`. A finished piece is reserved from storage for the same visitor while the request is active, even with a full display. The `crafted` event reports `productId`, `paletteId`, `requestId`, `requestName` and `queued`. A general craft has null request fields. Finishing a job for a departed visitor produces available storage stock.
- `visitors` is the serialized source of truth. `visit`, `checkoutVisitId`, `progress`, `queueProgress`, `staff`, `preparing` and the shop clock are derived when loading. Schema 3 validates combined unpaid reservations and preserves already charged crafts and payment status when migrating v1/v2. V2 open-shift progress maps proportionally onto the new clock.

## Rendering and interaction

The scene assigns three persistent browsing positions and a small real queue, with coherent counter/door/furniture depth. The queue advances smoothly rather than teleporting or stacking. Standing customers use a standing pose. Walk cadence follows distance, stays consistent with travel speed, and avoids the previous one-legged/skipping poses. Root will supply an optional replacement `visitors-v3.png` atlas, six columns and three rows: column 0 idle, columns 1 to 4 walk contact/passing phases, column 5 idle holding a small paper bag. All face screen-right at the same camera angle. Use consistent per-row scale and bottom anchors; inspect actual atlas before wiring indices. Retain the existing people asset only as a fallback.

The UI shows compact shop activity and the optional request, not a mandatory offer modal for every normal guest. Make preparation, automatic cashier/host work, and request choice legible. Preserve the four-action mobile dock. Request-specific crafting clearly names the customer and palette before charging. Do not let a new background arrival silently change an already selected piece or palette. Clearly distinguish an unrelated completed piece from the current optional request.

## Verification gates

Exercise concurrent shoppers, delayed first arrival, autonomous normal purchases, one optional order with other guests continuing, exact requested-palette crafting, shared-stock reservation, one cashier queue, v2 migration mid-payment and mid-craft, preparing next day, clock bounds, empty shelves, pause/resume, reload, and mobile layout. Watch the actual walk cycle and intermediate entry/queue/payment/exit frames in the browser. A passing engine test alone is not evidence of believable motion or enjoyable pacing.
