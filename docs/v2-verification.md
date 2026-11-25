# V2 verification

## Automated checks

The 14 engine checks cover exactly-once payment, inventory conservation, palette provenance, save validation and migration, decorations, shift closing, and bounded elapsed time. A deterministic simulation additionally played eight shifts, recorded 62 unique payments, and round-tripped 783 active saves without inconsistency.

The scene checks include representative entry, checkout, payment, departure, foreground masks, and upgrade states. A pixel comparison verified that a cached custom-palette shelf sprite matches the shared workbench artwork helper. Module syntax and diff-whitespace checks passed.

## Interactive browser checks

The browser pass used the same static source through the supported local Site preview.

- The original browser save migrated successfully before a new internal test shop was started.
- Birthday and housewarming recommendations moved guests to the register. The balance stayed unchanged during checkout and increased once during payment.
- A Sea Glass custom request led to three-region painting, completion, stocking, and a matching offer. Refreshing retained the request, balance, palette, and owned rug. Refreshing after payment did not add another payment.
- Sampled doorway, counter, display, and hydrant paths had coherent foreground depth. The cashier stands behind the register, and the maker uses the seated tools-down idle when no craft is active.
- The rug, window plant, and palette rack could be purchased once and appeared in the scene.
- A 390 × 844 iframe checked the portrait responsive layout and actual painting interactions. An 844 × 390 iframe checked landscape. The observed portrait dock overflow was corrected; all four actions fit within the 390-pixel viewport with 48-pixel button heights.
- The observed difference between the custom workbench colors and the shelf colors was corrected by sharing one artwork function.
- The full first shift closed with five fulfilled requests, one missed request, and $232 earned including the one-time bonus. Opening the next day reset the shift to 3:00 and 9 AM, retained the shop balance and upgrades, and changed the authored weather to light rain.

## Scope

These are prototype checks, not a broad device performance benchmark or a user study. The game remains local to the browser. It has no real reward redemption, customer login, multiplayer, or Shopify storefront integration. Private Site publication is verified separately by the hosting service.
