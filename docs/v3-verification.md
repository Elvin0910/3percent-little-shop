# v3 repair verification

## Scope

Repair the owner-reported one-at-a-time traffic, immediate arrivals, repetitive forced crafting, unclear Classic/Rose request context, and awkward visitor poses. Preserve the approved San Francisco scene and local-only runtime.

The starting published source is `3b156ada31c4a7f3e94fba35116b34d35b39573b` (v2). The v3 contract is in `v3-fix-contract.md`.

## Browser observations

The initial v3 implementation was exercised through the managed preview using actual controls and Canvas screenshots:

- An existing v2 browser save retained its balance, colored stock, decorations, and current day after migration.
- Immediately after opening, there were no visitors and the first-arrival timer was about 9.95 seconds. The first entering state appeared at 10 seconds of open-shift time.
- Three independent visitors were observed at once: an optional requester, a browsing or arriving shopper, and a shopper checking out or leaving. Ordinary sales increased the balance without recommendation or crafting clicks.
- A general Classic Mushroom completed with the label **For shop stock** while Jun's optional Rose request remained pending.
- Accepting Jun's request and choosing its workbench fixed the palette to Rose before charging. Refreshing after the first painted region restored the same requester, palette, and 1/3 progress.
- Finishing that piece displayed **For Jun / Rose Mushroom** and **The finished piece went straight to checkout**. A subsequent live snapshot showed Jun leaving with a paid Rose piece while another customer used the register.
- Declining a later Sea Glass request left ordinary trade running.
- Early closing stopped admissions, drained the visits, and produced a summary without advancing the displayed clock. Preparing the next day displayed 9 AM, a closed shop, and zero visitors.
- Portrait (390 x 844) and landscape (844 x 390) layouts were inspected. The portrait dock retained all four controls at 48 pixels high; the request card sat above the activity strip and dock.

## Movement corrections

The replacement visitor atlas is 1774 x 887 RGBA with six columns and three rows: grounded idle, four walking poses, and a bag pose. The legacy atlas is fetched only if the new one cannot load. Walking phase follows distance, and stationary visitors use idle frames.

Live inspection prompted longer initial queue approaches (2.2, 3.8, and 5.2 seconds by browsing slot), separate doorway lanes, and greater separation at the register. The final register correction was checked in offline Canvas snapshots against the observed handoff: queue feet are `[842,579]`, `[758,574]`, and `[683,580]`, with checkout through `[838,554]`, `[823,537]`, and `[806,524]`. The two foot anchors in the reproduced overlap increased from about 24 to 59 pixels apart. The narrow doorway can still show brief shoulder overlap in depth.

## Automated checks

The engine suite covers delayed and overlapping arrivals, autonomous purchases, stock conservation, timed restocking, optional request binding, reservation-safe payment, queue reload and early close, direct storage offers, palette persistence, old-save migration, clock bounds, and deterministic time stepping. Both the initial implementation and the restored source passed all 18 cases. Syntax and whitespace checks passed.

A separate DOM wiring smoke used the actual engine and exercised general versus request-bound crafting, direct storage offers, closing and next-day preparation, draft selection across unrelated arrivals, and completion after a requester departed. It passed again against the restored engine and UI, including the cleared stale announcement.

## Recovery and limits

A final browser file-chooser operation timed out and the execution environment was replaced before publication. Work resumed from the saved v2 source and the retained v3 changes. The exact original visitor atlas was recovered without generating a replacement. The restored source passed its checks and was pushed as checkpoint `7631605dbb43d6ab28b90da6d84960e1c2a50ec5` before further browser work.

The remaining register-handoff review then passed in the browser using the real renderer and deterministic engine states at 0.265 and 0.72 seconds after departure starts. The departing guest, incoming checkout guest, and third browsing guest were distinguishable. All scene assets loaded, and the inspected game-origin error log was empty. The temporary verification page was removed. Final screenshots are in `screenshots/little-shop-v3-handoff.jpg` and `screenshots/little-shop-v3-customer-flow.jpg`.

The visual checks sample actual intermediate frames; they do not establish that every possible pair of paths is collision-free. The game remains a small illustrated 2D prototype with authored paths. Accounts, cloud saves, Shopify rewards, and multiplayer are outside this repair.
