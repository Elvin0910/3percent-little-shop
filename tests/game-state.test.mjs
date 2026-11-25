import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLAY_BUNDLE,
  DECORATIONS,
  PALETTES,
  PRODUCTS,
  SHOP_STORAGE_KEY,
  ShopGame,
  UPGRADE_BASE_COST,
} from '../dist/game-state.js';

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

function load(game, overrides) {
  const state = { ...JSON.parse(game.exportSave()), ...overrides };
  assert.equal(game.importSave(JSON.stringify(state)).ok, true);
}

function advance(game, seconds, maximumStep = 9) {
  while (seconds > 0) {
    const elapsed = Math.min(seconds, maximumStep);
    game.tick(elapsed);
    seconds -= elapsed;
  }
}

function openForFirstRequest(game) {
  assert.equal(game.setOpen(true).ok, true);
  advance(game, 47);
  assert.equal(game.state.visit.stage, 'waiting');
  assert.equal(game.state.visit.paletteId, 'rose');
  return game.state.visit;
}

function paintAll(game) {
  [0, 1, 2].forEach((zone) => assert.equal(game.paint(zone).ok, true));
}

function finishCraft(game, productId, paletteId) {
  assert.equal(game.craft(productId, paletteId).ok, true);
  paintAll(game);
  game.tick(game.state.craft.duration);
  assert.equal(game.state.craft, null);
}

const quantities = (quantity = 0) => Object.fromEntries(PRODUCTS.map(({ id }) => [id, quantity]));
const paletteQuantities = (classic = 0) => Object.fromEntries(PALETTES.map(({ id }) => [id, id === 'classic' ? classic : 0]));
const pieceQuantities = (counts) => Object.fromEntries(PRODUCTS.map(({ id }) => [id, paletteQuantities(counts[id])]));
const shelfColors = (counts) => Object.fromEntries(PRODUCTS.map(({ id }) => [id, counts[id] ? 'classic' : null]));
const counts = (game) => PRODUCTS.reduce((total, { id }) => total + game.state.inventory[id] + game.state.shelves[id], 0);

const legacyShop = (overrides = {}) => ({
  schemaVersion: 1,
  coins: 140,
  clay: 3,
  inventory: { cake: 0, mushroom: 2, dresser: 0, carousel: 0, bunny: 1 },
  shelves: { cake: 0, mushroom: 1, dresser: 0, carousel: 0, bunny: 2 },
  sales: 5,
  totalEarned: 200,
  level: 2,
  day: 4,
  minute: 700,
  open: true,
  craft: { productId: 'carousel', remaining: 8, duration: 14 },
  settings: { time: 'evening', weather: 'clear', sound: true },
  goalClaimed: true,
  saleElapsed: 8.8,
  ...overrides,
});

test('a craft debits once, waits for three distinct zones and preserves its stocked palette', () => {
  const events = [];
  const storage = memoryStorage();
  const options = { storage, onEvent: (event) => events.push(event) };
  let game = new ShopGame(options);
  const cake = PRODUCTS.find(({ id }) => id === 'cake');

  assert.equal(game.craft(cake.id, 'mint').ok, true);
  assert.equal(game.state.clay, 17);
  assert.equal(game.state.coins, 500 - cake.cost);
  assert.deepEqual(game.state.craft, {
    productId: 'cake', paletteId: 'mint', phase: 'painting', paintedZones: [],
    duration: cake.craftSeconds, remaining: cake.craftSeconds, requestId: null, requestName: null,
  });
  assert.equal(game.state.staff.maker, 'painting');
  assert.equal(game.craft('mushroom').ok, false);
  assert.equal(game.paint(2).ok, true);
  assert.equal(game.paint(2).ok, false);
  assert.equal(game.paint(3).ok, false);
  assert.equal(game.paint('0').ok, false);
  assert.equal(game.paint(0).ok, true);
  game.tick(9);
  assert.equal(game.state.inventory.cake, 2);
  assert.equal(game.state.craft.remaining, cake.craftSeconds);

  game = new ShopGame(options);
  assert.deepEqual(game.state.craft.paintedZones, [0, 2]);
  assert.equal(game.paint(1).ok, true);
  assert.equal(game.state.staff.maker, 'finishing');
  assert.equal(game.paint(1).ok, false);
  game.tick(cake.craftSeconds - 0.1);
  assert.equal(game.state.inventory.cake, 2);
  game.tick(0.1);
  assert.equal(game.state.inventory.cake, 3);
  assert.equal(game.state.inventoryPieces.cake.mint, 1);
  assert.equal(game.state.craft, null);
  assert.equal(game.state.staff.maker, 'idle');
  assert.equal(game.state.coins, 500 - cake.cost);
  assert.deepEqual(events.filter(({ type }) => type === 'crafted').map(({ productId, paletteId }) => [productId, paletteId]), [['cake', 'mint']]);

  assert.equal(game.stock('cake').ok, true);
  assert.equal(game.state.inventoryPieces.cake.mint, 0);
  assert.equal(game.state.shelfPieces.cake.mint, 1);
  assert.equal(game.state.shelfPalettes.cake, 'mint');
  assert.equal(game.state.staff.host, 'restocking');
  game = new ShopGame(options);
  assert.equal(game.state.shelfPieces.cake.mint, 1);
  assert.equal(game.state.shelfPalettes.cake, 'mint');
  game.tick(3);
  assert.equal(game.state.staff.host, 'idle');
});

test('insufficient resources and invalid actions leave the economy unchanged', () => {
  const game = new ShopGame({ storage: null });
  load(game, { coins: 0 });
  const noCoins = game.exportSave();

  assert.equal(game.craft('cake').ok, false);
  assert.equal(game.craft('unknown').ok, false);
  assert.equal(game.craft('cake', 'unknown').ok, false);
  assert.equal(game.buyClay().ok, false);
  assert.equal(game.upgrade().ok, false);
  assert.equal(game.buyDecoration('rug').ok, false);
  assert.equal(game.buyDecoration('unknown').ok, false);
  assert.equal(game.exportSave(), noCoins);

  load(game, { coins: 100, clay: 0 });
  const noClay = game.exportSave();
  assert.equal(game.craft('cake').ok, false);
  assert.equal(game.exportSave(), noClay);
  assert.equal(game.buyClay().ok, true);
  assert.equal(game.state.clay, CLAY_BUNDLE.quantity);
  assert.equal(game.state.coins, 100 - CLAY_BUNDLE.cost);
});

test('stocking conserves units, respects shelf capacity and records the displayed palette', () => {
  const game = new ShopGame({ storage: null });
  const startingItems = counts(game);
  assert.equal(game.stock('cake', 99).ok, true);
  assert.equal(game.state.shelves.cake, 3);
  assert.equal(game.state.inventory.cake, 0);
  assert.equal(game.stock('cake').ok, false);
  assert.equal(game.stock('mushroom', -1).ok, false);
  assert.equal(game.stock('mushroom', 1, 'rose').ok, false);
  assert.equal(game.stockAll().ok, true);
  assert.equal(counts(game), startingItems);
  finishCraft(game, 'cake', 'rose');
  assert.equal(game.stock('cake').ok, false);
  assert.equal(game.upgrade().ok, true);
  assert.equal(game.state.coins, 500 - UPGRADE_BASE_COST - PRODUCTS[0].cost);
  assert.equal(game.stock('cake', 2).ok, true);
  assert.equal(game.state.shelves.cake, 4);
  assert.equal(game.state.shelfPalettes.cake, 'rose');
  assert.equal(counts(game), startingItems + 1);
});

test('opening is quiet, staggered visitors overlap, and ordinary sales continue around one optional request', () => {
  const events = [];
  const game = new ShopGame({ storage: null, onEvent: (event) => events.push(event) });
  const startItems = counts(game);
  assert.equal(game.state.preparing, true);
  assert.equal(game.state.minute, 540);
  assert.equal(game.setOpen(true).ok, true);
  assert.equal(game.state.arrivalRemaining, 10);
  game.tick(9);
  assert.deepEqual(game.state.visitors, []);
  assert.equal(game.state.arrivalRemaining, 1);
  game.tick(1);
  assert.deepEqual(game.state.visitors.map(({ name, stage, special }) => [name, stage, special]), [['Maya', 'entering', false]]);
  assert.match(game.state.notice, /cable car/);
  advance(game, 10);
  assert.deepEqual(game.state.visitors.map(({ stage }) => stage), ['browsing', 'entering']);
  assert.equal(game.state.sales, 0);
  advance(game, 11);
  assert.deepEqual(game.state.visitors.map(({ stage }) => stage), ['leaving', 'browsing', 'entering']);
  assert.equal(new Set(game.state.visitors.map(({ browseSlot }) => browseSlot)).size, 3);
  assert.deepEqual(events.filter(({ type }) => type === 'sale').map(({ productId }) => productId), ['cake']);
  advance(game, 16);
  const request = game.state.visit;
  assert.equal(request.stage, 'waiting');
  assert.equal(request.paletteId, 'rose');
  assert.match(request.request, /Rose/);
  assert.equal(game.state.sales, 2);
  assert.ok(game.state.visitors.some(({ kind, previousGift }) => kind === 'returning' && previousGift === 'cake'));
  advance(game, 37);
  assert.equal(game.state.visit.id, request.id);
  assert.equal(game.state.visit.stage, 'waiting');
  assert.equal(game.state.visit.accepted, false);
  assert.ok(game.state.sales > 2);
  assert.equal(counts(game) + game.state.sales, startItems);
  assert.deepEqual(events.filter(({ type }) => type === 'request').map(({ visitId }) => visitId), [request.id]);
  assert.deepEqual(events.filter(({ type }) => type === 'goal').map(({ amount }) => amount), [50]);
});

test('a neighborhood choice changes the day and persists as one memory', () => {
  const storage = memoryStorage();
  const game = new ShopGame({ storage });
  assert.equal(game.setOpen(true).ok, true);
  advance(game, 21);
  const moment = game.currentMoment();
  assert.equal(moment.type, 'street');
  assert.equal(moment.visitId, 2);
  assert.doesNotMatch(moment.title, /rain/i);
  const before = game.state.coins;
  assert.equal(game.respondMoment(2, 'welcome').ok, true);
  assert.equal(game.state.coins, before - 3);
  assert.ok(game.state.arrivalRemaining <= 4);
  assert.equal(game.state.memories.length, 1);
  assert.equal(game.respondMoment(2, 'welcome').ok, false);
  assert.equal(game.state.coins, before - 3);

  const reloaded = new ShopGame({ storage });
  assert.deepEqual(reloaded.state.memories, game.state.memories);
  assert.equal(reloaded.currentMoment()?.visitId, undefined);

  const oldSave = JSON.parse(reloaded.exportSave());
  delete oldSave.memories;
  assert.equal(reloaded.importSave(JSON.stringify(oldSave)).ok, true);
  assert.deepEqual(reloaded.state.memories, []);
});

test('rain event appears only when the weather is rainy', () => {
  const game = new ShopGame({ storage: null });
  assert.equal(game.setSetting('weather', 'rain').ok, true);
  assert.equal(game.setOpen(true).ok, true);
  advance(game, 21);
  assert.match(game.currentMoment().title, /rain/i);
});

test('a street story remains available after its visitor leaves during a busy shift', () => {
  const game = new ShopGame({ storage: null });
  assert.equal(game.setOpen(true).ok, true);
  advance(game, 100);
  assert.ok(game.state.visitors.every(({ id }) => id !== 2));
  assert.equal(game.currentMoment()?.visitId, 2);
  assert.equal(game.respondMoment(2, 'wave').ok, true);
  assert.equal(game.currentMoment()?.visitId, undefined);
});

test('a returning guest offers a distinct story, while forged memories fail closed', () => {
  const game = new ShopGame({ storage: null });
  assert.equal(game.setOpen(true).ok, true);
  advance(game, 47);
  const moment = game.currentMoment();
  assert.equal(moment.type, 'returning');
  assert.equal(moment.visitId, 4);
  const balance = game.state.coins;
  assert.equal(game.respondMoment(4, 'listen').ok, true);
  assert.equal(game.state.coins, balance);
  assert.equal(game.state.memories[0].type, 'returning');

  const valid = game.exportSave();
  const invalid = JSON.parse(valid);
  invalid.memories[0].text = '<img onerror=alert(1)>';
  assert.equal(game.importSave(JSON.stringify(invalid)).ok, false);
  assert.equal(game.exportSave(), valid);
});

test('the host restocks from storage after a timer without creating stock or spending funds', () => {
  const events = [];
  const storage = memoryStorage();
  const options = { storage, onEvent: (event) => events.push(event) };
  let game = new ShopGame(options);
  game.setOpen(true);
  advance(game, 28.25);
  assert.equal(game.state.sales, 1);
  assert.equal(game.state.shelves.cake, 0);
  assert.equal(game.state.inventory.cake, 2);
  assert.equal(game.state.restockProductId, 'cake');
  assert.ok(game.state.restockRemaining > 3);
  assert.equal(game.state.shelfPalettes.cake, null);
  const balance = game.state.coins;
  const totalPieces = counts(game);
  game.save();
  game = new ShopGame(options);
  game.tick(2);
  assert.equal(game.state.shelves.cake, 0);
  game.tick(1.2);
  assert.equal(game.state.shelves.cake, 1);
  assert.equal(game.state.shelfPalettes.cake, 'classic');
  assert.equal(game.state.inventory.cake, 1);
  assert.equal(game.state.coins, balance);
  assert.equal(counts(game), totalPieces);
  assert.equal(game.state.stockProductId, 'cake');
  assert.equal(game.state.staff.host, 'restocking');
  assert.deepEqual(events.filter(({ type, automatic }) => type === 'stocked' && automatic).map(({ productId, quantity }) => [productId, quantity]), [['cake', 1]]);
});

test('ordinary shoppers fall back to another category and leave politely when there is nothing to sell', () => {
  const game = new ShopGame({ storage: null });
  const inventory = quantities();
  const shelves = { ...quantities(), dresser: 1 };
  load(game, { inventory, shelves, inventoryPieces: pieceQuantities(inventory), shelfPieces: pieceQuantities(shelves), shelfPalettes: shelfColors(shelves) });
  game.setOpen(true);
  advance(game, 35);
  const shopper = game.state.visitors.find(({ id }) => id === 2);
  assert.equal(game.state.sales, 1);
  assert.equal(game.state.coins, 544);
  assert.equal(game.state.shelves.dresser, 0);
  assert.equal(shopper.stage, 'leaving');
  assert.match(shopper.message, /stop by again/);
  assert.equal(game.state.restockRemaining, null);
});

test('one cashier and shared reservations survive reload and early closing without duplicate payments', () => {
  const events = [];
  const storage = memoryStorage();
  const options = { storage, onEvent: (event) => events.push(event) };
  let game = new ShopGame(options);
  finishCraft(game, 'carousel', 'rose');
  assert.equal(game.stock('carousel', 1, 'rose').ok, true);
  const request = openForFirstRequest(game);
  advance(game, 3);
  const before = counts(game);
  assert.equal(game.recommend('carousel', request.id).ok, true);
  assert.equal(game.state.shelfPieces.carousel.rose, 1);
  assert.equal(game.availableOnShelf('carousel', 'rose'), 0);
  assert.equal(game.availableOnShelf('carousel'), 1);
  assert.equal(game.recommend('carousel', request.id).ok, false);
  assert.equal(game.declineCustomer(request.id).ok, false);
  advance(game, 8);
  assert.equal(game.state.checkoutVisitId, request.id);
  assert.equal(game.state.visitors.filter(({ stage }) => ['checkout', 'paying'].includes(stage)).length, 1);
  assert.ok(game.state.visitors.some(({ id, stage, queueIndex }) => id === 4 && stage === 'queued' && queueIndex === 0));
  assert.equal(game.state.visitors.find(({ id }) => id === request.id).paid, false);
  const current = JSON.parse(game.exportSave());
  const conflicting = { ...current, visitors: current.visitors.map((visit) => visit.id === 4 ? { ...visit, productId: 'carousel', offerPaletteId: 'rose' } : visit) };
  assert.equal(game.importSave(JSON.stringify(conflicting)).ok, false);
  const minute = game.state.minute;
  assert.equal(game.closeShift().ok, true);
  assert.equal(game.state.closing, true);
  assert.equal(game.state.daySummary, null);
  game = new ShopGame(options);
  assert.equal(game.state.closing, true);
  assert.equal(game.state.checkoutVisitId, request.id);
  game.tick(1.1);
  assert.equal(game.state.visitors.find(({ id }) => id === request.id).paid, true);
  const credited = game.state.coins;
  game = new ShopGame(options);
  assert.equal(game.state.coins, credited);
  assert.equal(game.state.visitors.find(({ id }) => id === request.id).paid, true);
  advance(game, 18);
  assert.equal(game.state.daySummary.sales, 4);
  assert.equal(game.state.visitors.length, 0);
  assert.equal(game.state.minute, minute);
  assert.equal(counts(game), before - 2);
  assert.equal(game.state.shelfPieces.carousel.rose, 0);
  assert.equal(game.state.shelfPalettes.carousel, 'classic');
  assert.deepEqual(events.filter(({ type, visitId }) => type === 'sale' && visitId >= request.id).map(({ visitId }) => visitId), [3, 4]);
  assert.ok(events.findIndex(({ type }) => type === 'shiftEnd') > events.findLastIndex(({ type }) => type === 'sale'));
  game = new ShopGame(options);
  assert.equal(game.state.daySummary.sales, 4);
  assert.equal(game.nextDay().ok, true);
  assert.equal(game.state.preparing, true);
  assert.equal(game.state.open, false);
  assert.equal(game.state.day, 2);
  assert.equal(game.state.minute, 540);
  assert.equal(game.state.shiftRemaining, 300);
  assert.equal(game.state.arrivalRemaining, 10);
  assert.equal(game.state.visitors.length, 0);
});

test('request crafting preserves customer and palette, even with a full display', () => {
  const events = [];
  const storage = memoryStorage();
  const options = { storage, onEvent: (event) => events.push(event) };
  let game = new ShopGame(options);
  finishCraft(game, 'carousel', 'classic');
  assert.equal(game.stock('carousel', 2).ok, true);
  const request = openForFirstRequest(game);
  const balance = game.state.coins;
  const clay = game.state.clay;
  assert.equal(game.state.shelves.carousel, 3);
  assert.equal(game.craftForRequest(request.id + 1, 'carousel').ok, false);
  assert.equal(game.recommend('carousel', request.id).ok, false);
  assert.match(game.state.visit.message, /Rose/);
  assert.equal(game.craftForRequest(request.id, 'carousel').ok, true);
  assert.equal(game.state.craft.paletteId, 'rose');
  assert.equal(game.state.craft.requestName, 'Jun');
  assert.equal(game.state.craft.requestId, request.id);
  assert.equal(game.state.visit.accepted, true);
  assert.equal(game.state.clay, clay - 1);
  assert.equal(game.state.coins, balance - 18);
  game = new ShopGame(options);
  assert.equal(game.state.craft.requestId, request.id);
  paintAll(game);
  game.tick(5);
  assert.deepEqual(events.filter(({ type }) => type === 'crafted').map(({ paletteId, requestId, queued }) => [paletteId, requestId, queued]), [['classic', null, false], ['rose', request.id, true]]);
  assert.equal(game.state.visitors.find(({ id }) => id === request.id).reservationSource, 'inventory');
  assert.equal(game.availableInStorage('carousel', 'rose'), 0);
  assert.equal(game.state.inventoryPieces.carousel.rose, 1);
  assert.equal(game.stock('carousel', 1, 'rose').ok, false);
  advance(game, 9);
  assert.ok(events.some(({ type, visitId, paletteId }) => type === 'sale' && visitId === request.id && paletteId === 'rose'));
  assert.equal(game.state.inventoryPieces.carousel.rose, 0);
  assert.equal(game.state.shelves.carousel, 3);
});

test('a completed piece stays in storage after the original requester declines', () => {
  const events = [];
  const game = new ShopGame({ storage: null, onEvent: (event) => events.push(event) });
  const request = openForFirstRequest(game);
  assert.equal(game.acceptRequest(request.id).ok, true);
  assert.equal(game.craftForRequest(request.id, 'cake').ok, true);
  assert.equal(game.declineCustomer(request.id).ok, true);
  advance(game, 9);
  assert.ok(!game.state.visitors.some(({ id }) => id === request.id));
  paintAll(game);
  game.tick(3);
  assert.equal(game.availableInStorage('cake', 'rose'), 1);
  const crafted = events.find(({ type }) => type === 'crafted');
  assert.equal(crafted.requestId, request.id);
  assert.equal(crafted.queued, false);
  assert.match(crafted.message, /Jun no longer needs this piece/);
  assert.ok(!events.some(({ type, visitId }) => type === 'sale' && visitId === request.id));
});

test('an existing matching storage piece can be offered directly without spending clay', () => {
  const game = new ShopGame({ storage: null });
  finishCraft(game, 'carousel', 'rose');
  const request = openForFirstRequest(game);
  const clay = game.state.clay;
  assert.equal(game.recommend('carousel', request.id, 'shelf').ok, false);
  assert.equal(game.recommend('carousel', request.id, 'inventory').ok, true);
  assert.equal(game.state.clay, clay);
  assert.equal(game.availableInStorage('carousel', 'rose'), 0);
  assert.equal(game.state.inventoryPieces.carousel.rose, 1);
  advance(game, 10);
  assert.equal(game.state.inventoryPieces.carousel.rose, 0);
  assert.equal(game.state.shelves.carousel, 1);
});

test('owned decorations save once and the rack unlocks a useful new palette', () => {
  const storage = memoryStorage();
  let game = new ShopGame({ storage });
  assert.equal(game.craft('cake', 'lavender').ok, false);
  for (const { id, cost } of DECORATIONS) {
    const previousBalance = game.state.coins;
    assert.equal(game.buyDecoration(id).ok, true);
    assert.equal(game.state.decorations[id], true);
    assert.equal(game.state.coins, previousBalance - cost);
    assert.equal(game.buyDecoration(id).ok, false);
    assert.equal(game.state.coins, previousBalance - cost);
  }
  game = new ShopGame({ storage });
  assert.ok(DECORATIONS.every(({ id }) => game.state.decorations[id]));
  assert.equal(PALETTES.find(({ id }) => id === 'lavender').decorationId, 'palette-rack');
  finishCraft(game, 'cake', 'lavender');
  assert.equal(game.stock('cake', 1, 'lavender').ok, true);
  assert.equal(game.state.shelfPalettes.cake, 'lavender');
});

test('v1 migration preserves balances, settings, stock and the paid craft', () => {
  const storage = memoryStorage();
  const v1 = legacyShop();
  storage.setItem(SHOP_STORAGE_KEY, JSON.stringify(v1));
  const game = new ShopGame({ storage });
  const state = game.state;
  assert.equal(state.schemaVersion, 3);
  for (const key of ['coins', 'clay', 'inventory', 'shelves', 'sales', 'totalEarned', 'level', 'day', 'open', 'settings', 'goalClaimed']) {
    assert.deepEqual(state[key], v1[key]);
  }
  assert.equal(state.minute, 540);
  assert.equal(state.shelfPalettes.bunny, 'classic');
  assert.equal(state.shelfPalettes.cake, null);
  assert.equal(state.inventoryPieces.mushroom.classic, 2);
  assert.equal(state.shelfPieces.bunny.classic, 2);
  assert.equal(state.craft.phase, 'finishing');
  assert.deepEqual(state.craft.paintedZones, [0, 1, 2]);
  assert.equal(state.craft.remaining, 8);
  assert.match(state.notice, /original shop save/);
  game.tick(8);
  assert.equal(game.state.visitors.length, 0);
  assert.equal(game.state.craft, null);
  assert.equal(game.state.inventoryPieces.carousel.classic, 1);
  assert.equal(game.state.coins, v1.coins);
  assert.equal(game.state.clay, v1.clay);
  assert.equal(JSON.parse(storage.getItem(SHOP_STORAGE_KEY)).schemaVersion, 3);
});

function v2Checkout(paid) {
  const inventory = { ...quantities(), bunny: 1 };
  const shelves = { ...quantities(), cake: paid ? 0 : 1 };
  return {
    ...legacyShop(), schemaVersion: 2, minute: 35, inventory, shelves,
    coins: paid ? 528 : 500, sales: paid ? 1 : 0, totalEarned: paid ? 28 : 0, goalClaimed: false,
    saleElapsed: 0, shiftRemaining: 30, visitCount: 1, daySummary: null,
    mayaGift: paid ? 'cake' : null, notice: '', stockActivity: 0,
    shift: { sales: paid ? 1 : 0, earned: paid ? 28 : 0, fulfilled: paid ? 1 : 0, missed: 0 },
    decorations: Object.fromEntries(DECORATIONS.map(({ id }) => [id, false])),
    inventoryPieces: pieceQuantities(inventory), shelfPieces: pieceQuantities(shelves), shelfPalettes: shelfColors(shelves),
    visit: { id: 1, kind: 'cable-car', paletteId: null, stage: 'paying', stageElapsed: paid ? 1.5 : 1, productId: 'cake', offerPaletteId: 'classic', paid, message: 'At the register.', previousGift: null },
    craft: { productId: 'bunny', paletteId: 'rose', phase: 'finishing', paintedZones: [0, 1, 2], duration: 3.5, remaining: 2 },
  };
}

test('v2 migration settles only unpaid work and keeps the previously charged paint job', () => {
  for (const wasPaid of [false, true]) {
    const events = [];
    const storage = memoryStorage();
    const previous = v2Checkout(wasPaid);
    storage.setItem(SHOP_STORAGE_KEY, JSON.stringify(previous));
    const options = { storage, onEvent: (event) => events.push(event) };
    let game = new ShopGame(options);
    assert.equal(game.state.schemaVersion, 3);
    assert.equal(game.state.shiftRemaining, 50);
    assert.equal(game.state.minute, 1140);
    assert.equal(game.state.coins, previous.coins);
    assert.equal(game.state.checkoutVisitId, 1);
    assert.equal(game.state.visitors[0].paid, wasPaid);
    assert.equal(game.state.craft.paletteId, 'rose');
    assert.equal(game.state.craft.requestId, null);
    game.tick(2);
    game.save();
    game = new ShopGame(options);
    game.tick(5.5);
    assert.equal(game.state.clay, previous.clay);
    assert.equal(game.state.inventoryPieces.bunny.rose + game.state.shelfPieces.bunny.rose, 1);
    assert.equal(game.state.coins, 528);
    assert.equal(game.state.sales, 1);
    assert.equal(game.state.shelves.cake, 0);
    assert.equal(game.state.visitors.length, 0);
    assert.equal(events.filter(({ type }) => type === 'sale').length, wasPaid ? 0 : 1);
    assert.equal(events.filter(({ type }) => type === 'crafted').length, 1);
  }
});

test('invalid saves cannot install inconsistent paint, stock, or payment state', () => {
  const game = new ShopGame({ storage: null });
  game.setOpen(true);
  advance(game, 27);
  const snapshot = game.exportSave();
  const state = JSON.parse(snapshot);
  const visitorChange = (overrides) => ({ visitors: [{ ...state.visitors[0], ...overrides }, ...state.visitors.slice(1)] });
  const corrupt = [
    { schemaVersion: 4 }, { coins: -1 }, { day: 0 }, { minute: 1440 },
    { shelves: { ...state.shelves, cake: 0 } }, { shelfPalettes: { ...state.shelfPalettes, cake: 'rose' } },
    { settings: { ...state.settings, weather: 'storm' } },
    { craft: { productId: 'cake', remaining: 3, duration: 3, paletteId: 'classic', phase: 'painting', paintedZones: [0, 0], requestId: null, requestName: null } },
    visitorChange({ stage: ['checkout'] }), visitorChange({ stageElapsed: 2, paid: false }), visitorChange({ stageElapsed: 0, paid: true }),
  ];
  for (const overrides of corrupt) {
    assert.equal(game.importSave(JSON.stringify({ ...state, ...overrides })).ok, false);
    assert.equal(game.exportSave(), snapshot);
  }
  assert.equal(game.importSave(JSON.stringify(legacyShop({ craft: { productId: 'cake', remaining: 9, duration: 8 } }))).ok, false);
  const originalProgress = game.state.visitors[0].progress;
  assert.equal(game.importSave(JSON.stringify({ ...state, ...visitorChange({ progress: 17 }), visit: null })).ok, true);
  assert.equal(game.state.visitors[0].progress, originalProgress);
  assert.equal(game.state.checkoutVisitId, 1);
});

test('unavailable storage still allows play and valid save import', () => {
  const blocked = new ShopGame({
    storage: {
      getItem() { throw new Error('unavailable'); },
      setItem() { throw new Error('unavailable'); },
    },
  });
  const snapshot = blocked.exportSave();
  assert.equal(blocked.craft('cake').ok, true);
  assert.equal(blocked.save().ok, false);
  assert.equal(blocked.importSave(snapshot).ok, true);
  assert.equal(blocked.reset().ok, true);
  assert.equal(blocked.state.coins, 500);
});

test('preparation, daytime pause, natural closing, and next day keep the clock within shop hours', () => {
  const game = new ShopGame({ storage: null });
  assert.deepEqual(game.environment, { phase: 'day', nightAmount: 0, weather: 'clear' });
  advance(game, 300);
  assert.equal(game.state.minute, 540);
  assert.equal(game.state.visitors.length, 0);
  game.setOpen(true);
  advance(game, 8);
  assert.equal(game.setOpen(false).ok, true);
  const minute = game.state.minute;
  const seconds = game.state.shiftRemaining;
  advance(game, 60);
  assert.equal(game.state.minute, minute);
  assert.equal(game.state.shiftRemaining, seconds);
  assert.equal(game.state.arrivalRemaining, 2);
  assert.equal(game.state.visitors.length, 0);
  assert.equal(game.state.daySummary, null);
  game.setOpen(true);
  game.tick(2);
  assert.equal(game.state.visit.stage, 'entering');
  advance(game, 240);
  assert.equal(game.state.minute, 1140);
  assert.deepEqual(game.environment, { phase: 'evening', nightAmount: 0.5, weather: 'clear' });
  advance(game, 50);
  assert.equal(game.state.minute, 1260);
  assert.equal(game.state.open, false);
  const lastVisitor = game.state.visitCount;
  advance(game, 20);
  assert.equal(game.state.visitCount, lastVisitor);
  assert.equal(game.state.minute, 1260);
  assert.equal(game.state.shiftRemaining, 0);
  assert.ok(game.state.daySummary);
  assert.deepEqual(game.getEnvironment(), { phase: 'night', nightAmount: 1, weather: 'clear' });
  assert.equal(game.nextDay().ok, true);
  assert.equal(game.state.minute, 540);
  assert.equal(game.state.preparing, true);
  assert.equal(game.setSetting('time', 'evening').ok, true);
  assert.equal(game.setSetting('weather', 'rain').ok, true);
  assert.equal(game.setSetting('weather', 'snow').ok, false);
  assert.deepEqual(game.environment, { phase: 'evening', nightAmount: 0.55, weather: 'rain' });
});

test('bounded ticks keep the first-arrival grace after an oversized frame', () => {
  const game = new ShopGame({ storage: null });
  game.setOpen(true);
  game.tick(86400);
  assert.equal(game.state.shiftRemaining, 291);
  assert.equal(game.state.arrivalRemaining, 1);
  assert.equal(game.state.visitors.length, 0);
  assert.equal(game.state.sales, 0);
});

test('independent frame sizes preserve the same deterministic arrival and sale sequence', () => {
  const run = (step) => {
    const events = [];
    const game = new ShopGame({ storage: null, onEvent: ({ type, visitId, productId }) => events.push([type, visitId, productId]) });
    game.setOpen(true);
    advance(game, 90, step);
    return { events, coins: game.state.coins, visitors: game.state.visitors.map(({ id, stage }) => [id, stage]) };
  };
  assert.deepEqual(run(0.25), run(9));
});
