export const PRODUCTS = Object.freeze([
  { id: 'cake', name: 'Cake', cost: 9, price: 28, craftSeconds: 3, tags: ['birthday', 'custom'] },
  { id: 'mushroom', name: 'Mushroom', cost: 10, price: 32, craftSeconds: 3.5, tags: ['housewarming', 'custom'] },
  { id: 'dresser', name: 'Dresser', cost: 14, price: 44, craftSeconds: 4, tags: ['housewarming', 'custom'] },
  { id: 'carousel', name: 'Carousel', cost: 18, price: 56, craftSeconds: 5, tags: ['birthday', 'custom'] },
  { id: 'bunny', name: 'Bunny', cost: 12, price: 38, craftSeconds: 3.5, tags: ['housewarming', 'custom'] },
].map((product, index) => Object.freeze({ ...product, index, tags: Object.freeze(product.tags) })));

export const PALETTES = Object.freeze([
  { id: 'classic', name: 'Classic', colors: ['#f4ddad', '#bf724c', '#765744'], tint: '#c68c61', filter: 'none', decorationId: null },
  { id: 'rose', name: 'Rose', colors: ['#f7cece', '#cf7884', '#8b475e'], tint: '#d28492', filter: 'sepia(0.42) saturate(1.42) hue-rotate(314deg)', decorationId: null },
  { id: 'mint', name: 'Sea Glass', colors: ['#cdecd6', '#69b6a4', '#356d70'], tint: '#70bfa8', filter: 'sepia(0.45) saturate(1.25) hue-rotate(100deg)', decorationId: null },
  { id: 'lavender', name: 'Lavender', colors: ['#eadcf7', '#ad8dcd', '#6d5491'], tint: '#ae93ce', filter: 'sepia(0.35) saturate(1.24) hue-rotate(205deg)', decorationId: 'palette-rack' },
].map((palette) => Object.freeze({ ...palette, colors: Object.freeze(palette.colors) })));

export const DECORATIONS = Object.freeze([
  { id: 'rug', name: 'Braided rug', cost: 65, description: 'Lay a woven rug beside the counter.', paletteId: null },
  { id: 'window-plant', name: 'Window plant', cost: 85, description: 'Set a leafy plant in the front window.', paletteId: null },
  { id: 'palette-rack', name: 'Palette rack', cost: 95, description: 'Add a paint rack and unlock the Lavender palette.', paletteId: 'lavender' },
].map((decoration) => Object.freeze(decoration)));

export const SHOP_STORAGE_KEY = 'threepercent-little-shop.save.v1';
export const CLAY_BUNDLE = Object.freeze({ quantity: 5, cost: 25 });
export const UPGRADE_BASE_COST = 125;

const LEGACY_CRAFT_SECONDS = [8, 9, 11, 14, 10];
const DAY_START = 9 * 60;
const DAY_END = 21 * 60;
const LEGACY_SHIFT_SECONDS = 180;
const SHIFT_SECONDS = 300;
const MAX_TICK_SECONDS = 9;
const MAX_VISITORS = 3;
const MAX_MEMORIES = 60;
const FIRST_ARRIVAL = 10;
const ARRIVAL_GAPS = [10, 11, 13, 10, 15, 12, 16, 11];
const RESTOCK_SECONDS = 3.2;
const STOCK_ACTIVITY_SECONDS = 2.8;
const WAIT_SECONDS = { offered: 44, accepted: 75 };
const STAGE_SECONDS = { entering: 4, browsing: 8.4, waiting: WAIT_SECONDS.offered, queued: 1.8, checkout: 2.4, paying: 2.2, leaving: 4 };
const LEGACY_STAGES = { entering: 4, waiting: 60, checkout: 2.4, paying: 2.2, leaving: 4 };
const ENTER_SECONDS = [4, 5.4, 6.2];
const QUEUE_APPROACH_SECONDS = [2.2, 3.8, 5.2];
const BROWSE_EXIT_SECONDS = [4.5, 5.5, 6.3];
const PAYMENT_SECOND = STAGE_SECONDS.paying * 0.55;
const EPSILON = 0.000001;
const SAVE_INTERVAL_MS = 3000;
const GOAL_SALES = 3;
const GOAL_BONUS = 50;
const PAINT_ZONES = [0, 1, 2];
const STOCK_PALETTE_ORDER = PALETTES.map(({ id }) => id).reverse();
const SETTING_OPTIONS = {
  time: ['auto', 'day', 'evening', 'night'],
  weather: ['auto', 'clear', 'rain'],
  sound: [false, true],
};
const VISITORS = [
  { name: 'Maya', kind: 'cable-car', tag: 'birthday', request: 'I need a birthday gift. A little cake or carousel would be lovely.' },
  { name: 'Luis', kind: 'neighbor', tag: 'housewarming', request: 'A friend just moved in. Could I see a mushroom, dresser, or bunny for their new place?' },
  { name: 'Jun', kind: 'neighbor', tag: 'custom', palettes: ['rose'] },
  { name: 'Maya', kind: 'returning', tag: 'housewarming', request: 'I’m looking for a little housewarming gift. A mushroom, dresser, or bunny would be perfect.' },
  { name: 'Sophie', kind: 'neighbor', tag: 'birthday', request: 'Do you have a cake or carousel for a birthday this weekend?' },
  { name: 'Ari', kind: 'cable-car', tag: 'custom', palettes: ['mint', 'lavender'] },
];

const STREET_MOMENTS = [
  { title: 'A little street music', prompt: 'A busker pauses outside the shop. Would you welcome a song by the window?', welcome: 'You invited a song into the shop. A few more neighbors followed the music.', wave: 'You waved from the counter as the music carried down the street.' },
  { title: 'A rainy neighbor', prompt: 'A neighbor ducks in from the rain and asks if there is room to rest for a moment.', welcome: 'You offered a warm corner. Word of the kind little shop spread down the block.', wave: 'You wished the neighbor a safe walk home.' },
  { title: 'A postcard from the hill', prompt: 'A neighbor found a postcard of the hillside and wonders if it belongs in the shop window.', welcome: 'You gave the postcard a place in the window. Curious neighbors stopped to look.', wave: 'You admired the postcard together before they carried it on.' },
];
const streetMomentFor = (state) => {
  const rainy = state.settings.weather === 'rain' || state.settings.weather === 'auto' && state.day % 3 === 2;
  return STREET_MOMENTS[rainy ? 1 : (state.day + state.visitStart) % 2 === 0 ? 0 : 2];
};

const productById = (id) => PRODUCTS.find((product) => product.id === id);
const paletteById = (id) => PALETTES.find((palette) => palette.id === id);
const visitorProfile = (id) => VISITORS[(id - 1) % VISITORS.length];
const success = (message) => ({ ok: true, message });
const failure = (message) => ({ ok: false, message });
const itemCounts = (counts) => Object.fromEntries(PRODUCTS.map(({ id }, index) => [id, counts[index]]));
const paletteCounts = (classic = 0) => Object.fromEntries(PALETTES.map(({ id }, index) => [id, index === 0 ? classic : 0]));
const pieceCounts = (counts) => itemCounts(PRODUCTS.map(({ id }) => paletteCounts(counts[id])));
const emptyShift = () => ({ sales: 0, earned: 0, fulfilled: 0, missed: 0 });
const integer = (value, minimum = 0) => Number.isSafeInteger(value) && value >= minimum;
const finiteInRange = (value, minimum, maximum) => Number.isFinite(value) && value >= minimum && value <= maximum;
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeText = (value) => typeof value === 'string' && value.length <= 200 && !/[<>&\u0000-\u001f]/u.test(value);

const isAtRegister = (visit) => visit.stage === 'checkout' || visit.stage === 'paying';
const isShopping = (visit) => ['entering', 'browsing', 'waiting'].includes(visit.stage);
const minutesAt = (remaining) => DAY_START + (1 - remaining / SHIFT_SECONDS) * (DAY_END - DAY_START);

function stageDuration(visit) {
  switch (visit.stage) {
    case 'entering': return ENTER_SECONDS[visit.browseSlot];
    case 'browsing': return STAGE_SECONDS.browsing + ((visit.id - 1) % 3) * 0.6;
    case 'waiting': return WAIT_SECONDS[visit.accepted ? 'accepted' : 'offered'];
    case 'queued': return visit.queueFromIndex === -1 ? QUEUE_APPROACH_SECONDS[visit.browseSlot] : STAGE_SECONDS.queued;
    case 'leaving': return visit.exitFrom === 'register' ? 5 : BROWSE_EXIT_SECONDS[visit.browseSlot];
    default: return STAGE_SECONDS[visit.stage];
  }
}

function unpaidReservations(state) {
  return state.visitors.filter((visit) => visit.reservationSource !== null && !visit.paid);
}

function canSettle(state, products) {
  const amount = products.reduce((total, product) => total + product.price, 0);
  const sales = state.sales + products.length;
  const bonus = sales >= GOAL_SALES && !state.goalClaimed && products.length ? GOAL_BONUS : 0;
  return [sales, state.coins + amount + bonus, state.totalEarned + amount + bonus].every((value) => integer(value));
}

function initialState() {
  const inventory = itemCounts([2, 2, 1, 1, 1]);
  const shelves = itemCounts([1, 1, 1, 1, 1]);
  return syncView({
    schemaVersion: 3,
    coins: 500,
    clay: 18,
    inventory,
    shelves,
    inventoryPieces: pieceCounts(inventory),
    shelfPieces: pieceCounts(shelves),
    shelfPalettes: itemCounts(PRODUCTS.map(() => 'classic')),
    sales: 0,
    totalEarned: 0,
    level: 1,
    day: 1,
    minute: DAY_START,
    open: false,
    closing: false,
    craft: null,
    settings: { time: 'auto', weather: 'auto', sound: false },
    goalClaimed: false,
    arrivalRemaining: FIRST_ARRIVAL,
    restockRemaining: null,
    restockProductId: null,
    shiftRemaining: SHIFT_SECONDS,
    shift: emptyShift(),
    daySummary: null,
    visitCount: 0,
    visitStart: 0,
    queueCount: 0,
    visitors: [],
    mayaGift: null,
    memories: [],
    notice: '',
    stockActivity: 0,
    stockProductId: null,
    stockPaletteId: null,
    decorations: Object.fromEntries(DECORATIONS.map(({ id }) => [id, false])),
  });
}

function syncView(state) {
  const { visitors, craft, stockActivity, restockRemaining } = state;
  for (const visit of visitors) {
    visit.progress = Math.min(1, visit.stageElapsed / stageDuration(visit));
    visit.queueProgress = visit.stage === 'queued' ? visit.progress : 0;
  }
  const checkout = visitors.find(isAtRegister);
  state.visit = visitors.find((visit) => visit.special && visit.stage === 'waiting') ??
    visitors.find((visit) => visit.special && isShopping(visit)) ??
    visitors.find((visit) => visit.special) ?? checkout ?? visitors[0] ?? null;
  state.checkoutVisitId = checkout?.id ?? null;
  state.preparing = !state.open && !state.closing && !state.daySummary && state.shiftRemaining === SHIFT_SECONDS && visitors.length === 0;
  state.minute = minutesAt(state.shiftRemaining);
  state.staff = {
    maker: craft?.phase ?? 'idle',
    cashier: checkout?.stage ?? 'idle',
    host: checkout?.stage === 'paying' && checkout.paid ? 'packing' : stockActivity > 0 || restockRemaining !== null ? 'restocking' : 'idle',
  };
  return state;
}

function paletteUnlocked(palette, decorations) {
  return palette !== undefined && (palette.decorationId === null || decorations[palette.decorationId]);
}

function readLegacyCraft(craft) {
  if (!record(craft)) return null;
  const product = productById(craft.productId);
  if (!product || craft.duration !== LEGACY_CRAFT_SECONDS[product.index] ||
      !finiteInRange(craft.remaining, 0, craft.duration) || craft.remaining === 0) return null;
  return {
    productId: product.id, paletteId: 'classic', phase: 'finishing', paintedZones: [...PAINT_ZONES],
    duration: craft.duration, remaining: craft.remaining, requestId: null, requestName: null,
  };
}

function readCraft(craft, state, legacy) {
  if (!record(craft)) return null;
  const { productId, paletteId, phase, paintedZones, duration, remaining } = craft;
  const requestId = legacy ? null : craft.requestId;
  const requestName = legacy ? null : craft.requestName;
  const product = productById(productId);
  if (!product || !paletteUnlocked(paletteById(paletteId), state.decorations) ||
      !Array.isArray(paintedZones) || paintedZones.length > PAINT_ZONES.length ||
      !paintedZones.every((zone, index) => PAINT_ZONES.includes(zone) && (index === 0 || paintedZones[index - 1] < zone)) ||
      (requestId === null ? requestName !== null : !integer(requestId, 1) || requestId > state.visitCount ||
        requestName !== visitorProfile(requestId).name || !product.tags.includes('custom'))) return null;
  if (phase === 'painting') {
    if (paintedZones.length === PAINT_ZONES.length || duration !== product.craftSeconds || remaining !== duration) return null;
  } else if (phase === 'finishing') {
    const legacyFinishing = paletteId === 'classic' && duration === LEGACY_CRAFT_SECONDS[product.index];
    if (paintedZones.length !== PAINT_ZONES.length || (!legacyFinishing && duration !== product.craftSeconds) ||
        !finiteInRange(remaining, 0, duration) || remaining === 0) return null;
  } else {
    return null;
  }
  return { productId, paletteId, phase, paintedZones: [...paintedZones], duration, remaining, requestId, requestName };
}

function readPieceCounts(pieces, counts, decorations) {
  if (!record(pieces)) return null;
  for (const { id } of PRODUCTS) {
    if (!record(pieces[id])) return null;
    let count = 0;
    for (const palette of PALETTES) {
      const quantity = pieces[id][palette.id];
      if (!integer(quantity) || (quantity > 0 && !paletteUnlocked(palette, decorations))) return null;
      count += quantity;
    }
    if (count !== counts[id]) return null;
  }
  return itemCounts(PRODUCTS.map(({ id }) => Object.fromEntries(PALETTES.map(({ id: paletteId }) => [paletteId, pieces[id][paletteId]]))));
}

function readShift(shift, maximumSales, maximumEarned) {
  if (!record(shift)) return null;
  const { sales, earned, fulfilled, missed } = shift;
  if (![sales, earned, fulfilled, missed].every((value) => integer(value)) ||
      fulfilled !== sales || sales > maximumSales || earned > maximumEarned) return null;
  return { sales, earned, fulfilled, missed };
}

function requestText(profile, paletteId) {
  if (paletteId !== null) return `Could I get a little keepsake painted in ${paletteById(paletteId).name}?`;
  return profile.request ?? (profile.tag === 'birthday' ? 'I’m looking for a birthday gift.' : 'I’m looking for a housewarming gift.');
}

function readLegacyVisit(visit, state) {
  if (!record(visit)) return null;
  const { id, kind, paletteId, stage, stageElapsed, productId, offerPaletteId, paid, message, previousGift } = visit;
  if (!integer(id, 1) || id !== state.visitCount || typeof stage !== 'string' || !Object.hasOwn(LEGACY_STAGES, stage) ||
      !finiteInRange(stageElapsed, 0, LEGACY_STAGES[stage]) || (stage !== 'waiting' && stageElapsed === LEGACY_STAGES[stage]) ||
      typeof paid !== 'boolean' || !safeText(message)) return null;
  const profile = visitorProfile(id);
  const special = Boolean(profile.palettes);
  const legacyPalettes = (id - 1) % VISITORS.length === 2 ? ['mint'] : ['rose', 'lavender'];
  if (![profile.kind, 'rain', ...(profile.kind === 'returning' ? ['neighbor'] : [])].includes(kind) ||
      (kind === 'returning' ? !productById(previousGift) : previousGift !== null) ||
      (special ? !legacyPalettes.includes(paletteId) || !paletteUnlocked(paletteById(paletteId), state.decorations) : paletteId !== null)) return null;
  const paymentDone = (stage === 'paying' && stageElapsed >= PAYMENT_SECOND) || (stage === 'leaving' && productId !== null);
  const hasOffer = isAtRegister({ stage }) || paymentDone;
  if (paid !== paymentDone || (hasOffer && !productById(productId)?.tags.includes(profile.tag))) return null;
  return readVisit({
    id, kind, tag: profile.tag, paletteId, previousGift, special, browseSlot: 0,
    stage: !special && stage === 'waiting' ? 'browsing' : stage,
    stageElapsed: stage === 'waiting' ? 0 : stageElapsed,
    accepted: special && hasOffer, productId, offerPaletteId, paid, message,
    reservationSource: hasOffer ? 'shelf' : null,
    queueOrder: null, queueIndex: null, queueFromIndex: null,
    exitFrom: stage === 'leaving' ? (paid ? 'register' : 'browse') : null,
  }, state);
}

function readVisit(visit, state) {
  if (!record(visit)) return null;
  const { id, kind, tag, paletteId, previousGift, special, accepted, browseSlot, stage, stageElapsed,
    productId, offerPaletteId, reservationSource, paid, message, queueOrder, queueIndex, queueFromIndex, exitFrom } = visit;
  if (!integer(id, 1) || id > state.visitCount || !integer(browseSlot) || browseSlot >= MAX_VISITORS ||
      typeof stage !== 'string' || !Object.hasOwn(STAGE_SECONDS, stage) ||
      !['cable-car', 'neighbor', 'rain', 'returning'].includes(kind) ||
      (kind === 'returning' ? !productById(previousGift) : previousGift !== null) ||
      typeof special !== 'boolean' || typeof accepted !== 'boolean' || typeof paid !== 'boolean' || !safeText(message)) return null;
  const profile = visitorProfile(id);
  if (special ? tag !== 'custom' || !profile.palettes || !paletteUnlocked(paletteById(paletteId), state.decorations) :
    !['birthday', 'housewarming'].includes(tag) || paletteId !== null || accepted || stage === 'waiting') return null;
  const duration = stageDuration(visit);
  if (!finiteInRange(stageElapsed, 0, duration) || (stage !== 'queued' && stageElapsed === duration)) return null;
  const inQueue = stage === 'queued';
  if (inQueue ? !integer(queueOrder, 1) || queueOrder > state.queueCount ||
      !integer(queueIndex) || queueIndex >= MAX_VISITORS || !integer(queueFromIndex, -1) || queueFromIndex >= MAX_VISITORS :
    queueOrder !== null || queueIndex !== null || queueFromIndex !== null) return null;
  const paymentDone = stage === 'paying' && stageElapsed >= PAYMENT_SECOND || stage === 'leaving' && exitFrom === 'register';
  const hasOffer = inQueue || isAtRegister(visit) || paymentDone;
  if (paid !== paymentDone || (stage === 'leaving' ? !['browse', 'register'].includes(exitFrom) : exitFrom !== null)) return null;
  if (hasOffer ? !productById(productId) || !paletteUnlocked(paletteById(offerPaletteId), state.decorations) ||
      !['shelf', 'inventory'].includes(reservationSource) || (special && (!accepted || paletteId !== offerPaletteId)) ||
      (reservationSource === 'inventory' && !special) : productId !== null || offerPaletteId !== null || reservationSource !== null) return null;
  return {
    id, name: profile.name, kind, spriteRow: (id - 1) % 3, browseSlot, special, accepted, tag,
    request: requestText({ ...profile, tag }, paletteId), paletteId, stage, stageElapsed, productId,
    offerPaletteId, reservationSource, paid, message, previousGift, queueOrder, queueIndex, queueFromIndex, exitFrom,
  };
}

function readShopActivity(data, state, legacy) {
  const { shiftRemaining, visitCount, mayaGift, notice, stockActivity, daySummary } = data;
  const shiftLength = legacy ? LEGACY_SHIFT_SECONDS : SHIFT_SECONDS;
  if (!finiteInRange(shiftRemaining, 0, shiftLength) || (state.open && shiftRemaining === 0) || !integer(visitCount) ||
      (mayaGift !== null && !productById(mayaGift)) || !safeText(notice) ||
      !finiteInRange(stockActivity, 0, STOCK_ACTIVITY_SECONDS)) return false;
  Object.assign(state, {
    shiftRemaining: legacy ? shiftRemaining / shiftLength * SHIFT_SECONDS : shiftRemaining,
    visitCount, mayaGift, notice, stockActivity,
  });
  if (legacy) {
    if (!finiteInRange(data.saleElapsed, 0, 3) || (data.saleElapsed > 0 && (!state.open || data.visit !== null))) return false;
    const visit = data.visit === null ? null : readLegacyVisit(data.visit, state);
    if (data.visit !== null && !visit || !state.open && visit?.stage === 'waiting') return false;
    state.visitors = visit ? [visit] : [];
    state.closing = shiftRemaining === 0 && daySummary === null;
  } else {
    const { arrivalRemaining, restockRemaining, restockProductId, closing, visitStart, queueCount, visitors, stockProductId, stockPaletteId } = data;
    if (!finiteInRange(arrivalRemaining, 0, Math.max(...ARRIVAL_GAPS)) ||
        (restockRemaining !== null && (!state.open || !finiteInRange(restockRemaining, 0, RESTOCK_SECONDS) || restockRemaining === 0)) ||
        (restockRemaining === null ? restockProductId !== null : !productById(restockProductId)) ||
        typeof closing !== 'boolean' || (closing && state.open) ||
        !integer(visitStart) || visitStart > visitCount || !integer(queueCount) || queueCount > visitCount ||
        !Array.isArray(visitors) || visitors.length > MAX_VISITORS ||
        (stockProductId !== null && (!productById(stockProductId) || !stockActivity)) ||
        (stockPaletteId !== null && (!paletteUnlocked(paletteById(stockPaletteId), state.decorations) || !stockProductId))) return false;
    Object.assign(state, { arrivalRemaining, restockRemaining, restockProductId, closing, visitStart, queueCount, stockProductId, stockPaletteId });
    state.visitors = visitors.map((visit) => readVisit(visit, state));
    if (state.visitors.some((visit) => !visit || visit.id <= visitStart)) return false;
  }

  const { visitors } = state;
  const queue = visitors.filter((visit) => visit.stage === 'queued').sort((left, right) => left.queueOrder - right.queueOrder);
  const reservations = unpaidReservations(state);
  if (new Set(visitors.map(({ id }) => id)).size !== visitors.length ||
      new Set(visitors.map(({ browseSlot }) => browseSlot)).size !== visitors.length ||
      visitors.filter(isAtRegister).length > 1 || visitors.filter((visit) => visit.special && isShopping(visit)).length > 1 ||
      queue.some((visit, index) => index > 0 && (queue[index - 1].queueOrder >= visit.queueOrder || queue[index - 1].queueIndex >= visit.queueIndex)) ||
      !canSettle(state, reservations.map(({ productId }) => productById(productId)))) return false;
  for (const visit of reservations) {
    const { productId, offerPaletteId, reservationSource } = visit;
    const committed = reservations.filter((reserved) => reserved.productId === productId && reserved.offerPaletteId === offerPaletteId && reserved.reservationSource === reservationSource);
    if (committed.length > state[`${reservationSource}Pieces`][productId][offerPaletteId]) return false;
  }
  const paid = visitors.filter((visit) => visit.paid);
  if (paid.length > state.shift.sales || paid.reduce((total, visit) => total + productById(visit.productId).price, 0) > state.shift.earned) return false;

  if (daySummary !== null) {
    const stats = readShift(daySummary, state.sales, state.totalEarned);
    if (!stats || daySummary.day !== state.day || !safeText(daySummary.hint) || visitors.length || state.open || state.closing ||
        (legacy && shiftRemaining !== 0) || Object.keys(stats).some((key) => stats[key] !== state.shift[key])) return false;
    state.daySummary = { day: state.day, ...stats, hint: daySummary.hint };
  } else if (state.closing ? !visitors.length : shiftRemaining === 0) {
    return false;
  }
  return true;
}

function parseSave(json) {
  if (typeof json !== 'string' || json.length > 16384) return null;
  try {
    const data = JSON.parse(json);
    if (!record(data) || ![1, 2, 3].includes(data.schemaVersion)) return null;
    const { coins, clay, inventory, shelves, sales, totalEarned, level, day, minute,
      open, craft, settings, goalClaimed } = data;
    const legacy = data.schemaVersion < 3;
    if (![coins, clay, sales, totalEarned].every((value) => integer(value)) ||
        !integer(level, 1) || !integer(day, 1) ||
        !(legacy ? (finiteInRange(minute, 0, 1440) && minute < 1440) : finiteInRange(minute, DAY_START, DAY_END)) ||
        typeof open !== 'boolean' || typeof goalClaimed !== 'boolean' ||
        !record(inventory) || !record(shelves) || !record(settings)) return null;
    for (const { id } of PRODUCTS) {
      if (!integer(inventory[id]) || !integer(shelves[id]) || shelves[id] > level + 2) return null;
    }
    for (const [key, options] of Object.entries(SETTING_OPTIONS)) {
      if (!options.includes(settings[key])) return null;
    }

    const state = Object.assign(initialState(), {
      coins, clay, sales, totalEarned, level, day, open, goalClaimed,
      inventory: itemCounts(PRODUCTS.map(({ id }) => inventory[id])),
      shelves: itemCounts(PRODUCTS.map(({ id }) => shelves[id])),
      settings: { time: settings.time, weather: settings.weather, sound: settings.sound },
    });
    if (data.schemaVersion === 1) {
      const { saleElapsed = 0 } = data;
      if (!finiteInRange(saleElapsed, 0, MAX_TICK_SECONDS) || saleElapsed === MAX_TICK_SECONDS) return null;
      state.craft = craft === null ? null : readLegacyCraft(craft);
      if (craft !== null && !state.craft) return null;
      state.inventoryPieces = pieceCounts(state.inventory);
      state.shelfPieces = pieceCounts(state.shelves);
      state.shelfPalettes = itemCounts(PRODUCTS.map(({ id }) => state.shelves[id] ? 'classic' : null));
      state.notice = 'Your original shop save is ready for the new shift.';
      return syncView(state);
    }

    const { decorations, shelfPalettes } = data;
    if (!record(decorations) || DECORATIONS.some(({ id }) => typeof decorations[id] !== 'boolean') || !record(shelfPalettes)) return null;
    state.decorations = Object.fromEntries(DECORATIONS.map(({ id }) => [id, decorations[id]]));
    state.inventoryPieces = readPieceCounts(data.inventoryPieces, state.inventory, state.decorations);
    state.shelfPieces = readPieceCounts(data.shelfPieces, state.shelves, state.decorations);
    state.shift = readShift(data.shift, state.sales, state.totalEarned);
    if (!state.inventoryPieces || !state.shelfPieces || !state.shift) return null;
    for (const { id } of PRODUCTS) {
      const paletteId = shelfPalettes[id];
      if (state.shelves[id] === 0 ? paletteId !== null : !paletteById(paletteId) || state.shelfPieces[id][paletteId] === 0) return null;
    }
    state.shelfPalettes = itemCounts(PRODUCTS.map(({ id }) => shelfPalettes[id]));
    if (!readShopActivity(data, state, legacy) || state.shift.sales + state.shift.missed > state.visitCount - state.visitStart) return null;
    const memories = data.memories === undefined ? [] : data.memories;
    if (!Array.isArray(memories) || memories.length > MAX_MEMORIES || memories.some((memory) =>
      !record(memory) || !integer(memory.day, 1) || memory.day > state.day ||
      !integer(memory.visitId, 1) || memory.visitId > state.visitCount ||
      !['street', 'returning'].includes(memory.type) ||
      !(memory.type === 'street' ? ['welcome', 'wave'].includes(memory.choice) : ['listen', 'suggest'].includes(memory.choice)) ||
      !safeText(memory.text)) || new Set(memories.map(({ visitId }) => visitId)).size !== memories.length) return null;
    state.memories = memories.map(({ day, visitId, type, choice, text }) => ({ day, visitId, type, choice, text }));
    state.craft = craft === null ? null : readCraft(craft, state, legacy);
    if (craft !== null && !state.craft) return null;
    const requester = state.visitors.find((visit) => visit.id === state.craft?.requestId);
    if (requester && (!requester.accepted || requester.paletteId !== state.craft.paletteId)) return null;
    return syncView(state);
  } catch {
    return null;
  }
}

export class ShopGame {
  #storage;
  #now;
  #onEvent;
  #lastSaveAt;
  #state;

  constructor({ storage, now = () => Date.now(), onEvent = () => {} } = {}) {
    this.#now = now;
    this.#onEvent = onEvent;
    this.#lastSaveAt = now();
    try {
      this.#storage = storage === undefined ? globalThis.localStorage : storage;
      this.#state = parseSave(this.#storage?.getItem(SHOP_STORAGE_KEY));
    } catch {
      this.#state = null;
    }
    this.#state ??= initialState();
  }

  get state() {
    return this.#state;
  }

  get environment() {
    return this.getEnvironment();
  }

  currentMoment() {
    const state = this.#state;
    if (!state.open || state.daySummary) return null;
    const available = state.visitors.filter((visit) =>
      ['entering', 'browsing', 'waiting'].includes(visit.stage) &&
      !state.memories.some(({ visitId }) => visitId === visit.id));
    const returning = available.find((visit) => visit.kind === 'returning' && visit.previousGift);
    if (returning) return {
      visitId: returning.id, type: 'returning', title: `${returning.name} is back`,
      prompt: `The ${productById(returning.previousGift).name.toLowerCase()} was a hit. ${returning.name} has a story to tell.`,
      options: [
        { id: 'listen', label: 'Ask how the gift was received' },
        { id: 'suggest', label: 'Show another little treasure' },
      ],
    };
    const neighborId = state.visitStart + 2;
    if (state.visitCount < neighborId || state.memories.some(({ visitId }) => visitId === neighborId)) return null;
    const event = streetMomentFor(state);
    return {
      visitId: neighborId, type: 'street', title: event.title, prompt: event.prompt,
      options: [
        { id: 'welcome', label: 'Welcome them in · $3' },
        { id: 'wave', label: 'Wave and keep working' },
      ],
    };
  }

  respondMoment(visitId, choice) {
    const moment = this.currentMoment();
    if (!moment || moment.visitId !== visitId || !moment.options.some(({ id }) => id === choice)) {
      return failure('This neighborhood moment has passed.');
    }
    const state = this.#state;
    if (moment.type === 'street' && choice === 'welcome' && state.coins < 3) return failure('You need $3 to offer a warm welcome.');
    let text;
    if (moment.type === 'street') {
      const event = streetMomentFor(state);
      text = event[choice];
      if (choice === 'welcome') {
        state.coins -= 3;
        state.arrivalRemaining = Math.min(state.arrivalRemaining, 4);
      }
    } else {
      text = choice === 'listen'
        ? `${state.visitors.find(({ id }) => id === visitId).name} told you how much the little gift meant.`
        : `${state.visitors.find(({ id }) => id === visitId).name} promised to tell a friend about the shop.`;
      if (choice === 'suggest') state.arrivalRemaining = Math.min(state.arrivalRemaining, 4);
    }
    if (state.memories.length >= MAX_MEMORIES) state.memories.shift();
    state.memories.push({ day: state.day, visitId, type: moment.type, choice, text });
    state.notice = text;
    return this.#finish(text, [{ type: 'memory', visitId, choice, message: text }]);
  }

  tick(dtSeconds) {
    if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
    const state = this.#state;
    const events = [];
    let elapsed = Math.min(dtSeconds, MAX_TICK_SECONDS);
    while (elapsed > 0) {
      this.#scheduleRestock();
      const finishing = state.craft?.phase === 'finishing' ? state.craft : null;
      const nextArrival = state.open && state.visitors.length < MAX_VISITORS && integer(state.visitCount + 1)
        ? state.arrivalRemaining : Infinity;
      const step = Math.min(elapsed, nextArrival, state.open ? state.shiftRemaining : Infinity,
        finishing?.remaining ?? Infinity, state.restockRemaining ?? Infinity,
        ...state.visitors.map((visit) => this.#untilVisitChanges(visit)));
      elapsed -= step;
      if (state.open) {
        state.shiftRemaining = Math.max(0, state.shiftRemaining - step);
        state.arrivalRemaining = Math.max(0, state.arrivalRemaining - step);
      }
      if (finishing) finishing.remaining -= step;
      if (state.restockRemaining !== null) state.restockRemaining -= step;
      state.stockActivity = Math.max(0, state.stockActivity - step);
      if (!state.stockActivity) {
        state.stockProductId = null;
        state.stockPaletteId = null;
      }
      for (const visit of state.visitors) visit.stageElapsed = Math.min(stageDuration(visit), visit.stageElapsed + step);

      if (finishing && finishing.remaining <= EPSILON) this.#completeCraft(finishing, events);
      if (state.open && state.shiftRemaining <= EPSILON) {
        state.shiftRemaining = 0;
        this.#stopAdmissions(events, true);
      }
      for (const visit of [...state.visitors]) this.#advanceVisit(visit, events);
      this.#refreshQueue(events);
      if (state.restockRemaining !== null && state.restockRemaining <= EPSILON) this.#restock(events);
      if (state.open && state.visitors.length < MAX_VISITORS && state.arrivalRemaining <= EPSILON && integer(state.visitCount + 1)) {
        this.#startVisit(events);
      }
      if (state.closing && !state.visitors.length) this.#summarizeShift(events);
    }
    this.#scheduleRestock();
    syncView(state);
    const current = this.#now();
    if (events.length || current < this.#lastSaveAt || current - this.#lastSaveAt >= SAVE_INTERVAL_MS) this.save();
    for (const event of events) this.#onEvent(event);
  }

  #completeCraft(craft, events) {
    const state = this.#state;
    const { productId, paletteId, requestId, requestName } = craft;
    const product = productById(productId);
    const piece = `${paletteById(paletteId).name} ${product.name.toLowerCase()}`;
    state.inventory[productId]++;
    state.inventoryPieces[productId][paletteId]++;
    state.craft = null;
    const requester = state.visitors.find((visit) => visit.id === requestId && visit.stage === 'waiting' && visit.accepted);
    const queued = Boolean(requester && this.#reserve(requester, product, paletteId, 'inventory', events));
    events.push({
      type: 'crafted', productId, paletteId, quantity: 1, requestId, requestName, queued,
      message: queued ? `${requestName} is taking the ${piece} to the register.` :
        requestId === null || requester ? `${piece} is ready to stock.` : `${piece} is ready to stock. ${requestName} no longer needs this piece.`,
    });
  }

  #untilVisitChanges(visit) {
    const duration = stageDuration(visit);
    if (visit.stage === 'queued' && visit.stageElapsed >= duration) return Infinity;
    const end = visit.stage === 'paying' && !visit.paid ? PAYMENT_SECOND : duration;
    return Math.max(0, end - visit.stageElapsed);
  }

  #advanceVisit(visit, events) {
    const state = this.#state;
    if (visit.stage === 'queued' || this.#untilVisitChanges(visit) > EPSILON) return;
    if (visit.stage === 'entering') {
      if (state.open) this.#moveVisitTo(visit, 'browsing');
      else this.#letVisitorLeave(visit, `${visit.name} will visit another day.`, events);
    } else if (visit.stage === 'browsing') {
      if (visit.special) {
        this.#moveVisitTo(visit, 'waiting');
        events.push({ type: 'request', visitId: visit.id, message: visit.request });
      } else {
        this.#chooseGift(visit, events);
      }
    } else if (visit.stage === 'waiting') {
      this.#letVisitorLeave(visit, `${visit.name} will stop by another time.`, events);
    } else if (visit.stage === 'checkout') {
      this.#moveVisitTo(visit, 'paying');
      events.push({ type: 'paying', visitId: visit.id, message: `${visit.name} is paying at the register.` });
    } else if (visit.stage === 'paying' && !visit.paid) {
      visit.stageElapsed = Math.max(visit.stageElapsed, PAYMENT_SECOND);
      this.#takePayment(visit, events);
    } else if (visit.stage === 'paying') {
      this.#moveVisitTo(visit, 'leaving');
      visit.exitFrom = 'register';
      events.push({ type: 'departure', visitId: visit.id, paid: true, message: `${visit.name} left with a little treasure.` });
    } else {
      state.visitors = state.visitors.filter(({ id }) => id !== visit.id);
      events.push({ type: 'visitEnded', visitId: visit.id, paid: visit.paid, message: visit.message });
    }
  }

  #chooseGift(visit, events) {
    const state = this.#state;
    const start = (visit.id - 1) % PRODUCTS.length;
    const order = [...PRODUCTS.slice(start), ...PRODUCTS.slice(0, start)];
    const available = order.filter(({ id }) => this.availableOnShelf(id) > 0);
    const product = available.find(({ tags }) => tags.includes(visit.tag)) ?? available[0];
    if (product) {
      const featured = state.shelfPalettes[product.id];
      const paletteId = [featured, ...STOCK_PALETTE_ORDER].find((id) => this.availableOnShelf(product.id, id) > 0);
      if (this.#reserve(visit, product, paletteId, 'shelf', events)) return;
    }
    const message = product ? `${visit.name} will stop by another time.` : `${visit.name} didn’t find a gift today and will stop by again.`;
    this.#letVisitorLeave(visit, message, events);
  }

  #startVisit(events) {
    const state = this.#state;
    const id = ++state.visitCount;
    const profile = visitorProfile(id);
    const previousGift = profile.kind === 'returning' ? state.mayaGift : null;
    const kind = previousGift ? 'returning' : this.environment.weather === 'rain' ? 'rain' : profile.kind === 'returning' ? 'neighbor' : profile.kind;
    const special = Boolean(profile.palettes) && id - state.visitStart > 2 &&
      !state.visitors.some((visit) => visit.special && isShopping(visit));
    const tag = special || !profile.palettes ? profile.tag : id % 2 ? 'birthday' : 'housewarming';
    const paletteId = special ? profile.palettes.findLast((id) => paletteUnlocked(paletteById(id), state.decorations)) : null;
    const request = requestText({ ...profile, tag }, paletteId);
    state.notice = {
      'cable-car': `${profile.name} just stepped off the cable car.`,
      neighbor: `${profile.name} stopped in from the neighborhood.`,
      rain: `${profile.name} stepped inside to get out of the rain.`,
      returning: previousGift ? `${profile.name} is back. The ${productById(previousGift).name.toLowerCase()} was a hit!` : '',
    }[kind];
    const browseSlot = ENTER_SECONDS.findIndex((_, slot) => !state.visitors.some((visit) => visit.browseSlot === slot));
    state.visitors.push({
      id, name: profile.name, kind, spriteRow: (id - 1) % 3, browseSlot, special, accepted: false,
      request, tag, paletteId, stage: 'entering', stageElapsed: 0, productId: null, offerPaletteId: null,
      reservationSource: null, paid: false, message: special ? request : `${profile.name} is looking for a gift.`, previousGift,
      queueOrder: null, queueIndex: null, queueFromIndex: null, exitFrom: null,
    });
    state.arrivalRemaining = ARRIVAL_GAPS[(id - state.visitStart - 1) % ARRIVAL_GAPS.length];
    events.push({ type: 'visitor', visitId: id, kind, special, message: state.notice });
  }

  #moveVisitTo(visit, stage) {
    visit.stage = stage;
    visit.stageElapsed = 0;
    visit.queueOrder = null;
    visit.queueIndex = null;
    visit.queueFromIndex = null;
  }

  #reserve(visit, product, paletteId, source, events) {
    const state = this.#state;
    const available = source === 'shelf' ? this.availableOnShelf(product.id, paletteId) : this.availableInStorage(product.id, paletteId);
    const reserving = [...unpaidReservations(state).map(({ productId }) => productById(productId)), product];
    const queueIndex = Math.max(-1, ...state.visitors.filter((guest) => guest.stage === 'queued').map((guest) => guest.queueIndex)) + 1;
    if (!available || !canSettle(state, reserving) || !integer(state.queueCount + 1) || queueIndex >= MAX_VISITORS) return false;
    this.#moveVisitTo(visit, 'queued');
    visit.accepted = visit.special;
    visit.productId = product.id;
    visit.offerPaletteId = paletteId;
    visit.reservationSource = source;
    visit.queueOrder = ++state.queueCount;
    visit.queueIndex = queueIndex;
    visit.queueFromIndex = -1;
    visit.message = `${visit.name} chose a ${product.name.toLowerCase()} and joined the checkout line.`;
    events.push({ type: 'queued', visitId: visit.id, productId: product.id, paletteId, message: visit.message });
    return true;
  }

  #refreshQueue(events) {
    const state = this.#state;
    const queue = state.visitors.filter((visit) => visit.stage === 'queued').sort((left, right) => left.queueOrder - right.queueOrder);
    const front = queue[0];
    const inPosition = (visit) => visit.stageElapsed >= stageDuration(visit);
    if (front?.queueIndex === 0 && inPosition(front) && !state.visitors.some(isAtRegister)) {
      const { productId, offerPaletteId } = front;
      this.#moveVisitTo(front, 'checkout');
      front.message = `${front.name} is headed to the register.`;
      events.push({ type: 'checkout', visitId: front.id, productId, paletteId: offerPaletteId, message: front.message });
      queue.shift();
    }
    if (queue.every(inPosition)) {
      queue.forEach((visit, index) => {
        if (visit.queueIndex === index) return;
        visit.queueFromIndex = visit.queueIndex;
        visit.queueIndex = index;
        visit.stageElapsed = 0;
      });
    }
  }

  #takePayment(visit, events) {
    const state = this.#state;
    const product = productById(visit.productId);
    const paletteId = visit.offerPaletteId;
    const source = visit.reservationSource;
    const pieces = state[`${source}Pieces`][product.id];
    pieces[paletteId]--;
    state[source === 'shelf' ? 'shelves' : 'inventory'][product.id]--;
    if (source === 'shelf' && state.shelfPalettes[product.id] === paletteId && !pieces[paletteId]) {
      state.shelfPalettes[product.id] = STOCK_PALETTE_ORDER.find((id) => pieces[id] > 0) ?? null;
    }
    state.sales++;
    state.coins += product.price;
    state.totalEarned += product.price;
    state.shift.sales++;
    state.shift.fulfilled++;
    state.shift.earned += product.price;
    if (visit.name === 'Maya') state.mayaGift = product.id;
    visit.paid = true;
    visit.message = `${visit.name} bought ${product.name.toLowerCase()} for $${product.price}.`;
    events.push({
      type: 'sale', productId: product.id, paletteId, visitId: visit.id, amount: product.price, special: visit.special,
      message: `Sold ${product.name} for $${product.price}.`,
    });

    if (state.sales >= GOAL_SALES && !state.goalClaimed) {
      state.goalClaimed = true;
      state.coins += GOAL_BONUS;
      state.totalEarned += GOAL_BONUS;
      state.shift.earned += GOAL_BONUS;
      events.push({ type: 'goal', amount: GOAL_BONUS, message: `First ${GOAL_SALES} sales! You earned a $${GOAL_BONUS} bonus.` });
    }
  }

  #letVisitorLeave(visit, message, events) {
    this.#moveVisitTo(visit, 'leaving');
    visit.exitFrom = 'browse';
    visit.message = message;
    this.#state.shift.missed++;
    events.push({ type: 'declined', visitId: visit.id, special: visit.special, message });
  }

  #stopAdmissions(events, closeForDay = false) {
    const state = this.#state;
    state.open = false;
    state.closing = closeForDay;
    state.restockRemaining = null;
    state.restockProductId = null;
    for (const visit of state.visitors) {
      const finishing = state.craft?.requestId === visit.id && state.craft.phase === 'finishing';
      if (visit.stage === 'browsing' || (visit.stage === 'waiting' && !finishing)) {
        this.#letVisitorLeave(visit, `${visit.name} will visit another day.`, events);
      }
    }
    events.push({ type: 'open', open: false, message: closeForDay ? 'The shop is closing for today.' : 'The shift is paused.' });
    if (state.closing && !state.visitors.length) this.#summarizeShift(events);
  }

  #summarizeShift(events) {
    const state = this.#state;
    const hint = state.shift.missed > 0 ? 'A well-stocked display gives browsing guests more choices.' :
      'Paint a few extra colors to prepare for special requests.';
    state.closing = false;
    state.daySummary = { day: state.day, ...state.shift, hint };
    state.notice = 'The shift is complete.';
    events.push({ type: 'shiftEnd', summary: state.daySummary, message: state.notice });
  }

  craft(productId, paletteId = 'classic') {
    return this.#startCraft(productId, paletteId);
  }

  craftForRequest(visitId, productId) {
    const visit = integer(visitId, 1) ? this.#waitingRequest(visitId) : null;
    if (!this.#state.open || !visit) return failure('This customer is no longer waiting for a piece.');
    if (!productById(productId)?.tags.includes(visit.tag)) return failure('Choose an item that fits this request.');
    return this.#startCraft(productId, visit.paletteId, visit);
  }

  #startCraft(productId, paletteId, visit = null) {
    const product = productById(productId);
    if (!product) return failure('Choose an item to craft.');
    const palette = paletteById(paletteId);
    if (!palette) return failure('Choose a valid paint palette.');
    const state = this.#state;
    if (!paletteUnlocked(palette, state.decorations)) return failure(`Buy the palette rack to unlock ${palette.name}.`);
    if (state.craft) return failure('Finish your current craft first.');
    if (state.clay < 1) return failure('You need 1 clay to craft an item.');
    if (state.coins < product.cost) return failure(`You need $${product.cost} to craft ${product.name}.`);
    if (!integer(state.inventory[productId] + 1)) return failure('Make some room in storage first.');

    state.clay--;
    state.coins -= product.cost;
    state.craft = {
      productId, paletteId, phase: 'painting', paintedZones: [], duration: product.craftSeconds, remaining: product.craftSeconds,
      requestId: visit?.id ?? null, requestName: visit?.name ?? null,
    };
    if (visit) this.#markAccepted(visit);
    return this.#finish(visit ? `Paint the ${palette.name} ${product.name.toLowerCase()} for ${visit.name}.` :
      `Paint all three areas of your ${product.name.toLowerCase()}.`);
  }

  paint(zoneIndex) {
    if (!PAINT_ZONES.includes(zoneIndex)) return failure('Choose one of the three paint areas.');
    const craft = this.#state.craft;
    if (!craft || craft.phase !== 'painting') return failure('Start a new piece to paint it.');
    if (craft.paintedZones.includes(zoneIndex)) return failure('That area is already painted.');
    craft.paintedZones.push(zoneIndex);
    craft.paintedZones.sort();
    if (craft.paintedZones.length === PAINT_ZONES.length) {
      craft.phase = 'finishing';
      return this.#finish('All three areas are painted. Your piece is finishing.');
    }
    return this.#finish(`${craft.paintedZones.length} of 3 areas painted.`);
  }

  availableOnShelf(productId, paletteId) {
    return this.#availablePieces('shelf', productId, paletteId);
  }

  availableInStorage(productId, paletteId) {
    return this.#availablePieces('inventory', productId, paletteId);
  }

  #availablePieces(source, productId, paletteId) {
    if (!productById(productId) || (paletteId != null && !paletteById(paletteId))) return 0;
    const state = this.#state;
    const count = paletteId == null ? state[source === 'shelf' ? 'shelves' : 'inventory'][productId] : state[`${source}Pieces`][productId][paletteId];
    const reserved = unpaidReservations(state).filter((visit) => visit.reservationSource === source && visit.productId === productId &&
      (paletteId == null || paletteId === visit.offerPaletteId)).length;
    return count - reserved;
  }

  #moveToShelf(productId, quantity, paletteOrder) {
    const state = this.#state;
    const capacity = Math.min(Number.MAX_SAFE_INTEGER, state.level + 2) - state.shelves[productId];
    let remaining = Math.min(quantity, capacity);
    let moved = 0;
    for (const paletteId of paletteOrder) {
      const count = Math.min(remaining, this.availableInStorage(productId, paletteId));
      if (!count) continue;
      state.inventoryPieces[productId][paletteId] -= count;
      state.shelfPieces[productId][paletteId] += count;
      if (moved === 0) state.shelfPalettes[productId] = paletteId;
      moved += count;
      remaining -= count;
    }
    state.inventory[productId] -= moved;
    state.shelves[productId] += moved;
    return moved;
  }

  #scheduleRestock() {
    const state = this.#state;
    if (!state.open) return;
    const depleted = (id) => state.shelves[id] === 0 && this.availableInStorage(id) > 0;
    if (state.restockProductId && depleted(state.restockProductId)) return;
    state.restockProductId = PRODUCTS.find(({ id }) => depleted(id))?.id ?? null;
    state.restockRemaining = state.restockProductId ? RESTOCK_SECONDS : null;
  }

  #stocked(productId, paletteId) {
    const state = this.#state;
    state.stockActivity = STOCK_ACTIVITY_SECONDS;
    state.stockProductId = productId;
    state.stockPaletteId = paletteId;
  }

  #restock(events) {
    const state = this.#state;
    const product = productById(state.restockProductId);
    state.restockProductId = null;
    state.restockRemaining = null;
    if (state.shelves[product.id] !== 0 || !this.#moveToShelf(product.id, 1, STOCK_PALETTE_ORDER)) return;
    const paletteId = state.shelfPalettes[product.id];
    this.#stocked(product.id, paletteId);
    events.push({ type: 'stocked', automatic: true, productId: product.id, paletteId, quantity: 1, message: `The host restocked ${product.name.toLowerCase()}.` });
  }

  stock(productId, qty = 1, paletteId) {
    const product = productById(productId);
    if (!product || !integer(qty, 1)) return failure('Choose an item and a positive quantity.');
    if (paletteId !== undefined && !paletteById(paletteId)) return failure('Choose a valid paint palette.');
    const state = this.#state;
    const available = this.availableInStorage(productId, paletteId);
    if (available === 0) return failure(`You have no ${paletteId ? `${paletteById(paletteId).name} ` : ''}${product.name.toLowerCase()} in storage.`);
    const moved = this.#moveToShelf(productId, qty, paletteId === undefined ? STOCK_PALETTE_ORDER : [paletteId]);
    if (!moved) return failure(`The ${product.name.toLowerCase()} shelf is full.`);
    this.#stocked(productId, state.shelfPalettes[productId]);
    return this.#finish(`Stocked ${moved} × ${product.name}.`, [{ type: 'stocked', productId, paletteId, quantity: moved }]);
  }

  stockAll() {
    const state = this.#state;
    const items = {};
    let quantity = 0;
    for (const { id } of PRODUCTS) {
      const moved = this.#moveToShelf(id, state.inventory[id], STOCK_PALETTE_ORDER);
      if (moved) {
        items[id] = moved;
        quantity += moved;
      }
    }
    if (!quantity) return failure('There is nothing to move onto the shelves.');
    this.#stocked(null, null);
    return this.#finish(`Stocked ${quantity} ${quantity === 1 ? 'item' : 'items'}.`, [{ type: 'stocked', quantity, items }]);
  }

  #waitingRequest(visitId) {
    return this.#state.visitors.find((visit) => visit.special && visit.stage === 'waiting' && (visitId === undefined || visit.id === visitId));
  }

  #markAccepted(visit) {
    if (visit.accepted) return;
    visit.accepted = true;
    visit.stageElapsed = 0;
    const palette = paletteById(visit.paletteId);
    visit.message = `${visit.name} will wait for a ${palette.name} piece.`;
  }

  acceptRequest(visitId) {
    const visit = integer(visitId, 1) ? this.#waitingRequest(visitId) : null;
    if (!this.#state.open || !visit) return failure('This customer is no longer waiting for a piece.');
    this.#markAccepted(visit);
    return this.#finish(visit.message);
  }

  recommend(productId, visitId, source = 'shelf') {
    const visit = this.#waitingRequest(visitId);
    if (!this.#state.open || !visit) return failure('Wait for a customer to make a request.');
    const product = productById(productId);
    if (!product) return failure('Choose an item to offer.');
    if (!['shelf', 'inventory'].includes(source)) return failure('Choose where to find the piece.');
    const paletteId = visit.paletteId;
    if (!product.tags.includes(visit.tag)) return failure(`${visit.name} has something different in mind. ${visit.request}`);
    if (!this.#availablePieces(source, productId, paletteId)) {
      const where = source === 'shelf' ? 'on the shelf' : 'in storage';
      const message = `${visit.name} would love it in ${paletteById(paletteId).name}. There isn’t one available ${where}.`;
      visit.message = message;
      this.save();
      return failure(message);
    }
    const events = [];
    if (!this.#reserve(visit, product, paletteId, source, events)) return failure('This shop has reached its sales limit.');
    return this.#finish(visit.message, events);
  }

  declineCustomer(visitId) {
    const visit = this.#waitingRequest(visitId);
    if (!visit) return failure('There’s no waiting request to turn down.');
    const events = [];
    const message = `${visit.name} will stop by another time.`;
    this.#letVisitorLeave(visit, message, events);
    return this.#finish(message, events);
  }

  setOpen(open) {
    if (typeof open !== 'boolean') return failure('Choose whether to open or pause the shop.');
    const state = this.#state;
    if (open && (state.closing || state.daySummary)) return failure('Start the next shift to reopen the shop.');
    const message = open ? 'The shop is open.' : 'The shift is paused.';
    if (open === state.open) return success(message);
    const events = [];
    if (open) {
      state.open = true;
      events.push({ type: 'open', open: true, message });
    } else {
      this.#stopAdmissions(events);
    }
    return this.#finish(message, events);
  }

  closeShift() {
    const state = this.#state;
    if (state.closing) return success('The shop is closing for today.');
    if (state.preparing || state.daySummary) return failure('Open the shop before closing for today.');
    const events = [];
    this.#stopAdmissions(events, true);
    return this.#finish(state.closing ? 'The shop is closing for today.' : state.notice, events);
  }

  buyDecoration(id) {
    const decoration = DECORATIONS.find((item) => item.id === id);
    if (!decoration) return failure('Choose a decoration for the shop.');
    const state = this.#state;
    if (state.decorations[id]) return failure(`${decoration.name} is already in your shop.`);
    if (state.coins < decoration.cost) return failure(`You need $${decoration.cost} to buy ${decoration.name.toLowerCase()}.`);
    state.coins -= decoration.cost;
    state.decorations[id] = true;
    return this.#finish(`Added ${decoration.name.toLowerCase()} to your shop.`, [{ type: 'decoration', decorationId: id }]);
  }

  nextDay() {
    const state = this.#state;
    if (!state.daySummary) return failure('Finish this shift before starting the next one.');
    if (!integer(state.day + 1)) return failure('This shop has reached its day limit.');
    state.day++;
    state.shiftRemaining = SHIFT_SECONDS;
    state.shift = emptyShift();
    state.daySummary = null;
    state.visitStart = state.visitCount;
    state.arrivalRemaining = FIRST_ARRIVAL;
    state.open = false;
    const message = `Day ${state.day} is ready for preparation.`;
    state.notice = message;
    return this.#finish(message, [{ type: 'nextDay', day: state.day, message }]);
  }

  buyClay() {
    const { cost, quantity } = CLAY_BUNDLE;
    const state = this.#state;
    if (state.coins < cost) return failure(`You need $${cost} to buy clay.`);
    if (!integer(state.clay + quantity)) return failure('There is no room to store more clay.');
    state.coins -= cost;
    state.clay += quantity;
    return this.#finish(`Bought ${quantity} clay for $${cost}.`);
  }

  upgrade() {
    const state = this.#state;
    const cost = UPGRADE_BASE_COST * state.level;
    if (state.coins < cost) return failure(`You need $${cost} to upgrade.`);
    state.coins -= cost;
    state.level++;
    return this.#finish(`Level ${state.level}! Each shelf fits ${state.level + 2} items.`, [{ type: 'upgrade', level: state.level }]);
  }

  setSetting(key, value) {
    if (!Object.hasOwn(SETTING_OPTIONS, key) || !SETTING_OPTIONS[key].includes(value)) return failure('Choose a valid setting.');
    this.#state.settings[key] = value;
    return this.#finish('Setting saved.');
  }

  reset() {
    this.#state = initialState();
    return this.#finish('Started a new shop.');
  }

  exportSave() {
    return JSON.stringify(this.#state);
  }

  importSave(json) {
    const imported = parseSave(json);
    if (!imported) return failure('This shop save is invalid.');
    this.#state = imported;
    return this.#finish('Shop save loaded.');
  }

  save() {
    this.#lastSaveAt = this.#now();
    try {
      if (!this.#storage) return failure('Browser storage is unavailable.');
      this.#storage.setItem(SHOP_STORAGE_KEY, this.exportSave());
      return success('Shop saved.');
    } catch {
      return failure('Browser storage is unavailable.');
    }
  }

  #finish(message, events = []) {
    this.#scheduleRestock();
    syncView(this.#state);
    this.save();
    for (const event of events) this.#onEvent({ message, ...event });
    return success(message);
  }

  getEnvironment() {
    const { day, minute, settings } = this.#state;
    const weather = settings.weather === 'auto' ? (day % 3 === 2 ? 'rain' : 'clear') : settings.weather;
    if (settings.time !== 'auto') {
      return { phase: settings.time, nightAmount: { day: 0, evening: 0.55, night: 1 }[settings.time], weather };
    }
    if (minute < 330 || minute >= 1260) return { phase: 'night', nightAmount: 1, weather };
    if (minute < 420) return { phase: 'night', nightAmount: (420 - minute) / 90, weather };
    if (minute < 1020) return { phase: 'day', nightAmount: 0, weather };
    return { phase: 'evening', nightAmount: (minute - 1020) / 240, weather };
  }
}
