import { ASSETS, BRAND } from './config.js';
import { CLAY_BUNDLE, DECORATIONS, PALETTES, PRODUCTS, ShopGame, UPGRADE_BASE_COST } from './game-state.js';
import { ShopScene } from './scene.js';
import { drawProductArt, PRODUCT_PAINT_ZONES } from './product-art.js';

const $ = (id) => document.getElementById(id);
const dialog = $('shopDialog');
const body = $('dialogBody');
const feedback = $('dialogFeedback');
const toast = $('toast');
const fileInput = $('saveFile');
const sceneNotice = $('sceneNotice');
const counter = $('counterCard');
const welcomeKey = 'threepercent-little-shop.welcome.v1';
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const compactCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const productById = (id) => PRODUCTS.find((product) => product.id === id);
const paletteById = (id) => PALETTES.find((palette) => palette.id === id);
const paintRegions = ['Top', 'Middle', 'Base'];

let browserStorage = null;
let welcomeSeen = false;
try {
  browserStorage = window.localStorage;
  welcomeSeen = browserStorage.getItem(welcomeKey) === 'yes';
} catch {
  browserStorage = null;
}

function updateSaveIndicator(saved) {
  $('saveStatus').hidden = saved;
  $('saveStatus').toggleAttribute('data-unsaved', !saved);
  $('saveLabel').textContent = saved ? 'Saved to this browser' : 'Browser save unavailable';
}

const storage = browserStorage && {
  getItem: (key) => browserStorage.getItem(key),
  setItem(key, save) {
    try {
      browserStorage.setItem(key, save);
      updateSaveIndicator(true);
    } catch (error) {
      updateSaveIndicator(false);
      throw error;
    }
  },
};

let scene;
let sceneReady = false;
let panel;
let returnFocus;
let toastTimer;
let lastFrame;
let hudTime = -Infinity;
let selectedProduct;
let selectedPalette = 'classic';
let benchRequest;
let finishedPiece;
let counterKey;
let benchKey;
let lastAnnouncedVisit;
let lastAnnouncedMoment;
let neighborsKey;

function onGameEvent(event) {
  if (event.type === 'sale') scene?.celebrateSale(event.productId, event.amount);
  if (event.type === 'crafted') {
    finishedPiece = event;
    selectedProduct = undefined;
    selectedPalette = 'classic';
    benchRequest = undefined;
  }
  if (['sale', 'crafted', 'goal'].includes(event.type)) {
    refresh();
    if (!(dialog.open && panel === 'make') || event.type === 'goal') announce(event.message);
  }
}

const game = new ShopGame({ storage, onEvent: onGameEvent });

function applyBrand() {
  document.title = BRAND.displayName;
  $('game').setAttribute('aria-label', `${BRAND.displayName} game`);
  $('brandLocation').textContent = BRAND.location;
  if ($('brandName').textContent !== BRAND.displayName) $('brandName').textContent = BRAND.displayName;
  if (BRAND.logoUrl) {
    $('brandLogo').src = BRAND.logoUrl;
    $('brandLogo').hidden = false;
  }
  $('game').style.setProperty('--scene-background', `url("${new URL(ASSETS.background, import.meta.url).href}")`);
}

function announce(message, ok = true) {
  if (dialog.open) {
    feedback.toggleAttribute('data-error', !ok);
    feedback.textContent = message;
    return;
  }
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.toggleAttribute('data-error', !ok);
  toast.setAttribute('data-visible', '');
  toastTimer = window.setTimeout(() => {
    toast.removeAttribute('data-visible');
    toast.textContent = '';
  }, 4000);
}

function updateText(id, text) {
  const node = $(id);
  if (node && node.textContent !== String(text)) node.textContent = text;
}

function clockLabel(minute) {
  const hour = Math.floor(minute / 60);
  const minutes = String(Math.floor(minute % 60)).padStart(2, '0');
  return `${hour % 12 || 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
}

function shiftLabel(remaining) {
  const seconds = Math.ceil(remaining);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function paletteUnlocked(palette) {
  return palette && (!palette.decorationId || game.state.decorations[palette.decorationId]);
}

function waitingRequest(id) {
  return game.state.visitors.find((visit) => visit.special && visit.stage === 'waiting' && (id === undefined || visit.id === id));
}

function requestOptions(visit) {
  const matching = PRODUCTS.filter((product) => product.tags.includes(visit.tag));
  const offers = matching.filter(({ id }) => game.availableOnShelf(id, visit.paletteId) > 0);
  const stored = matching.filter(({ id }) => game.availableInStorage(id, visit.paletteId) > 0);
  return { offers, stored };
}

function actionButton(action, label, { product, visit, source, choice, tone = '' } = {}) {
  return `<button class="dialog-button ${tone}" type="button" data-action="${action}"${product ? ` data-product="${product}"` : ''}${visit !== undefined ? ` data-visit="${visit}"` : ''}${source ? ` data-source="${source}"` : ''}${choice ? ` data-choice="${choice}"` : ''}>${label}</button>`;
}

function waitingMarkup(visit, { offers, stored }) {
  const palette = paletteById(visit.paletteId);
  const inStorage = offers.length === 0;
  const pieces = inStorage ? stored : offers;
  if (pieces.length) {
    const source = inStorage ? 'inventory' : 'shelf';
    return `<div class="offer-list" aria-label="${inStorage ? 'Matching pieces in storage' : 'Matching pieces on the shelves'}">${pieces.map(({ id, name, price }) =>
      actionButton('recommend', `<span>Offer ${palette.name} ${name}${inStorage ? ' from storage' : ''}</span><small>${currency.format(price)}</small>`, { product: id, visit: visit.id, source, tone: 'offer-button primary' })
    ).join('')}</div>`;
  }

  if (!visit.accepted) {
    return actionButton('acceptRequest', 'Accept request', { visit: visit.id, tone: 'primary' });
  }

  if (!paletteUnlocked(palette)) {
    const decoration = DECORATIONS.find(({ id }) => id === palette.decorationId);
    return `<p class="counter-next">The ${decoration.name.toLowerCase()} unlocks ${palette.name}.</p>
      ${actionButton('openDecor', 'View decor', { tone: 'primary' })}`;
  }

  const job = game.state.craft;
  if (job) {
    return `<p class="counter-next">${job.requestId === visit.id ? 'This order is at the workbench.' : 'Finish your current piece to start this order.'}</p>
      ${actionButton('openWorkbench', 'View workbench', { tone: 'primary' })}`;
  }

  return actionButton('makeRequest', 'Make for this request', { visit: visit.id, tone: 'primary' });
}

function refreshCounter() {
  const { daySummary: summary, open, craft } = game.state;
  const visit = waitingRequest();
  const options = visit ? requestOptions(visit) : null;
  const key = summary ? `summary-${summary.day}` : JSON.stringify({
    visit: visit && [visit.id, visit.accepted, visit.paletteId],
    offers: options?.offers.map(({ id }) => id),
    stored: options?.stored.map(({ id }) => id),
    unlocked: visit && Boolean(paletteUnlocked(paletteById(visit.paletteId))),
    craft: visit && craft && [craft.productId, craft.paletteId, craft.requestId],
  });
  if (counterKey === key) return;

  const focused = counter.contains(document.activeElement) ? document.activeElement.dataset : null;
  counterKey = key;
  counter.hidden = !summary && !visit;
  counter.dataset.kind = summary ? 'summary' : 'custom';

  if (summary) {
    counter.innerHTML = `
      <p class="eyebrow">Day ${summary.day} closing</p><h2>Shutters down</h2>
      <dl class="shift-totals">
        <div><dt>Sales</dt><dd>${summary.sales}</dd></div>
        <div><dt>Earned</dt><dd>${currency.format(summary.earned)}</dd></div>
        <div><dt>Fulfilled</dt><dd>${summary.fulfilled}</dd></div>
        <div><dt>Missed</dt><dd>${summary.missed}</dd></div>
      </dl>
      <p class="counter-hint"></p>
      ${actionButton('nextDay', 'Prepare next day', { tone: 'primary' })}`;
    counter.querySelector('.counter-hint').textContent = summary.hint;
    updateText('counterAnnouncement', `Day ${summary.day} is complete. You can prepare the next day.`);
  } else if (visit) {
    const palette = paletteById(visit.paletteId);
    counter.innerHTML = `
      <p class="eyebrow">${visit.accepted ? 'Accepted request' : 'Optional request'}</p><h2 class="counter-name"></h2>
      <p class="counter-request"></p>
      ${waitingMarkup(visit, options)}
      ${actionButton('decline', 'Decline request', { visit: visit.id, tone: 'skip-button' })}`;
    counter.querySelector('.counter-name').textContent = `${visit.name} · ${palette.name}`;
    counter.querySelector('.counter-request').textContent = visit.request;
    if (lastAnnouncedVisit !== visit.id) {
      lastAnnouncedVisit = visit.id;
      updateText('counterAnnouncement', `${visit.name} has an optional request. ${visit.request}`);
    }
  } else {
    counter.innerHTML = '';
    updateText('counterAnnouncement', '');
  }

  if (focused && !dialog.open) {
    const replacement = [...counter.querySelectorAll('button')].find(({ dataset }) =>
      dataset.action === focused.action && dataset.product === focused.product && dataset.visit === focused.visit && dataset.source === focused.source);
    const nextFocus = replacement || counter.querySelector('.primary') ||
      (open ? document.querySelector('.dock [data-panel="make"]') : $('openButton'));
    nextFocus.focus({ preventScroll: true });
  }
}

function shopActivity(state) {
  if (state.daySummary) return '';
  const stages = { entering: 'arriving', browsing: 'browsing', queued: 'in line', leaving: 'leaving' };
  const activity = Object.entries(stages).flatMap(([stage, label]) => {
    const count = state.visitors.filter((visit) => visit.stage === stage).length;
    return count ? [`${count} ${label}`] : [];
  });
  if (state.checkoutVisitId) activity.push('Cashier helping');
  if (state.staff.host === 'packing') activity.push('Host packing');
  if (state.staff.host === 'restocking') activity.push('Host restocking');
  if (activity.length) return activity.join(' · ');
  if (state.closing) return 'Finishing the last visits.';
  if (state.preparing) return 'Make and stock pieces before opening.';
  if (!state.open) return 'The shop is paused.';
  if (waitingRequest()) return '';
  return 'The shop is open. Guests will arrive shortly.';
}

function refresh() {
  const state = game.state;
  const { weather } = game.getEnvironment();
  const weatherLabel = weather === 'rain' ? 'Light rain' : 'Clear';
  const weatherSymbol = weather === 'rain' ? '#i-rain' : '#i-sun';
  const weatherIcon = $('weatherIcon');
  if (weatherIcon.getAttribute('href') !== weatherSymbol) weatherIcon.setAttribute('href', weatherSymbol);
  updateText('clockText', `Day ${state.day} · ${clockLabel(state.minute)}`);
  const timeLabel = state.daySummary ? 'Closed for today' : state.closing ? 'Closing' : state.preparing ? 'Preparing' : state.open ? `${shiftLabel(state.shiftRemaining)} left` : 'Paused';
  updateText('weatherText', `${weatherLabel} · ${timeLabel}`);

  const balanceLabel = currency.format(state.coins);
  updateText('balance', state.coins >= 100000 ? compactCurrency.format(state.coins) : balanceLabel);
  $('balance').title = balanceLabel;
  $('openButton').toggleAttribute('data-open', state.open);
  $('openButton').disabled = Boolean(state.closing && !state.daySummary);
  const openLabel = state.daySummary ? 'Next day' : state.closing ? 'Closing' : state.open ? 'Close for today' : state.preparing ? 'Open shop' : 'Resume shop';
  updateText('openLabel', openLabel);
  $('openButton').setAttribute('aria-label', state.daySummary ? 'Prepare next day' : openLabel);

  const goalProgress = Math.min(3, state.sales);
  if ($('goalProgress').value !== goalProgress) $('goalProgress').value = goalProgress;
  updateText('goalCount', `${goalProgress}/3`);
  updateText('goalText', state.goalClaimed ? 'First 3 sales complete' : 'Sell 3 pieces');
  $('goalTitle').closest('.goal').hidden = state.goalClaimed;
  setCraftStatus(state.craft);

  const hint = shopActivity(state);
  $('shopHint').hidden = !hint;
  updateText('shopHint', hint);
  refreshCounter();
  const moment = game.currentMoment();
  $('neighborsButton').toggleAttribute('data-new', Boolean(moment));
  $('neighborsButton').setAttribute('aria-label', moment ? `Neighbors: ${moment.title} is ready` : 'Neighbors and memories');
  $('momentPrompt').hidden = !moment;
  $('momentPrompt').inert = !moment;
  if (moment) updateText('momentPrompt', `A neighbor has a story · ${moment.title}`);
  if (moment && lastAnnouncedMoment !== moment.visitId && !dialog.open) {
    lastAnnouncedMoment = moment.visitId;
    announce(`${moment.title}. Open Neighbors to choose what to do.`);
  }

  if (!dialog.open) return;
  if (panel === 'make') refreshBench();
  if (panel === 'stock') {
    for (const { id } of PRODUCTS) {
      const stored = game.availableInStorage(id);
      const forSale = game.availableOnShelf(id);
      const reserved = state.inventory[id] - stored + state.shelves[id] - forSale;
      const palettes = PALETTES.filter((palette) => game.availableOnShelf(id, palette.id) > 0);
      updateText(`inventory-${id}`, stored);
      updateText(`shelf-${id}`, `${forSale}/${state.level + 2}`);
      updateText(`reserved-${id}`, reserved ? `${reserved} reserved` : '');
      updateText(`shelfPalette-${id}`, palettes.map(({ name }) => name).join(' · '));
    }
    updateText('upgradeShop', `Upgrade shelves · ${currency.format(UPGRADE_BASE_COST * state.level)}`);
  }
  if (panel === 'decor') refreshDecor();
  if (panel === 'neighbors') refreshNeighbors();
  if (panel === 'environment') {
    for (const choice of body.querySelectorAll('[data-setting]')) {
      choice.setAttribute('aria-pressed', String(state.settings[choice.dataset.setting] === choice.dataset.value));
    }
  }
}

function setCraftStatus(craft) {
  $('craftStatus').hidden = !craft;
  if (!craft) return;
  const painting = craft.phase === 'painting';
  const piece = `${paletteById(craft.paletteId).name} ${productById(craft.productId).name}`;
  updateText('craftLabel', `${painting ? 'Paint' : 'Finishing'} ${piece}${craft.requestName ? ` for ${craft.requestName}` : ''}`);
  updateText('craftTime', painting ? `${craft.paintedZones.length}/3` : `${Math.ceil(craft.remaining)}s`);
  $('craftProgress').value = painting ? craft.paintedZones.length / 3 : 1 - craft.remaining / craft.duration;
}

function welcomeMarkup() {
  return `
    <p>Your little San Francisco shop is stocked. Make a few pieces before you open, then trade for about five minutes.</p>
    <ul class="welcome-steps">
      <li>${icon('shop')}<span><strong>Open</strong> and let guests browse and buy from the shelves.</span></li>
      <li>${icon('stock')}<span><strong>Stock</strong> pieces yourself or let the host refill empty displays.</span></li>
      <li>${icon('make')}<span><strong>Paint</strong> for the shelves or take on an optional color request.</span></li>
    </ul>
    <p class="welcome-note">Your shop saves in this browser.</p>
    <div class="button-row">${actionButton('welcome', 'Go to my shop', { tone: 'primary' })}</div>`;
}

function makeMarkup() {
  return '<div id="benchContents"></div>';
}

function canvasMarkup(product, name, size) {
  return `<canvas class="${name}" data-frame="${product.index}" width="${size}" height="${size}" aria-hidden="true"></canvas>`;
}

function recipesMarkup() {
  const palette = paletteById(benchRequest?.paletteId);
  const products = benchRequest ? PRODUCTS.filter((product) => product.tags.includes(benchRequest.tag)) : PRODUCTS;
  return `
    ${benchRequest ? '<p id="benchOrder" class="bench-order"></p>' : ''}
    <p>${benchRequest ? `Choose a piece to paint in ${palette.name}. Each one uses 1 clay.` : 'Choose a piece to paint for the shop. Each one uses 1 clay.'}</p>
    <div class="recipe-grid">${products.map((product) => `
      <button class="recipe-card" type="button" data-action="chooseRecipe" data-product="${product.id}">
        ${canvasMarkup(product, 'recipe-image', 144)}
        <span class="recipe-name">${product.name}</span>
        <span class="recipe-cost">${currency.format(product.cost)}</span>
        <span class="recipe-inventory" id="recipeStock-${product.id}"></span>
      </button>`).join('')}
    </div>
    <div class="supplies"><span>${game.state.clay} clay</span>${actionButton('buyClay', `Buy ${CLAY_BUNDLE.quantity} clay · ${currency.format(CLAY_BUNDLE.cost)}`)}${benchRequest ? actionButton('chooseAnother', 'Make for stock') : ''}</div>`;
}

function previewMarkup(product, zones = false) {
  return `<div class="piece-preview${zones ? ' piece-preview-painting' : ''}">
    ${canvasMarkup(product, 'piece-image', 360)}
    <p class="preview-unavailable">Preview unavailable</p>
    ${zones ? `<div class="paint-zones" aria-label="Paint regions">${paintRegions.map((region, index) => `
      <button type="button" class="paint-zone" data-action="paint" data-zone="${index}" aria-pressed="false">
        <span class="zone-dot">${index + 1}</span><span>${region}</span>
      </button>`).join('')}</div>` : ''}
    </div>`;
}

function paletteMarkup(product) {
  const palette = paletteById(benchRequest?.paletteId);
  const swatches = ({ colors }) => `<span class="swatches" aria-hidden="true">${colors.map((color) => `<i style="--swatch:${color}"></i>`).join('')}</span>`;
  return `
    <div class="bench-layout">
      ${previewMarkup(product)}
      <div class="bench-instructions">
        <p class="eyebrow">${benchRequest ? 'Custom request' : 'For shop stock'}</p>
        <h3>${product.name}</h3>
        ${benchRequest ? `<p id="benchOrder" class="bench-order"></p><p class="required-palette">${swatches(palette)} ${palette.name} palette</p>` : `
        <p>Pick a palette, then paint the top, middle, and base.</p>
        <div class="palette-choices" aria-label="Color palette">${PALETTES.filter(paletteUnlocked).map((palette) => `
          <button class="palette-choice" type="button" data-action="choosePalette" data-palette="${palette.id}" aria-pressed="${palette.id === selectedPalette}">
            ${swatches(palette)}
            ${palette.name}
          </button>`).join('')}</div>`}
        <div class="button-row">
          ${actionButton('startPainting', `Start painting · ${currency.format(product.cost)} + 1 clay`, { tone: 'primary' })}
          ${actionButton('changePiece', 'Change piece')}
          ${benchRequest ? actionButton('chooseAnother', 'Make for stock') : ''}
        </div>
        ${game.state.clay < 1 ? `<div class="button-row">${actionButton('buyClay', `Buy ${CLAY_BUNDLE.quantity} clay · ${currency.format(CLAY_BUNDLE.cost)}`)}</div>` : ''}
      </div>
    </div>`;
}

function jobMarkup(craft) {
  const product = productById(craft.productId);
  const palette = paletteById(craft.paletteId);
  return `
    <div class="bench-layout">
      ${previewMarkup(product, craft.phase === 'painting')}
      <div class="bench-instructions">
        <p id="benchOrder" class="eyebrow"></p>
        <h3>${palette.name} ${product.name}</h3>
        <p>${craft.phase === 'painting' ? 'Tap each region to apply its color.' : 'The paint is on. Give it a moment to finish.'}</p>
        <div class="bench-progress"><progress id="benchProgress" aria-label="Piece progress" max="1" value="0"></progress><span id="benchProgressLabel" role="status" tabindex="-1"></span></div>
      </div>
    </div>`;
}

function finishedMarkup() {
  const product = productById(finishedPiece.productId);
  const palette = paletteById(finishedPiece.paletteId);
  const inStorage = game.availableInStorage(product.id, palette.id) > 0;
  const message = finishedPiece.queued
    ? 'The finished piece went straight to checkout.'
    : finishedPiece.requestId
      ? 'This request could no longer be fulfilled. The piece became shop stock.'
      : inStorage ? 'Your piece is in storage. Put it on the shelf when you’re ready.' : 'This piece is ready for the shop.';
  return `
    <div class="bench-layout">
      ${previewMarkup(product)}
      <div class="bench-instructions">
        <p id="benchOrder" class="eyebrow"></p>
        <h3>${palette.name} ${product.name}</h3>
        <p>${message}</p>
        <div class="button-row">
          ${!finishedPiece.queued && inStorage ? actionButton('stockFinished', 'Stock this piece', { tone: 'primary' }) : ''}
          ${actionButton('chooseAnother', 'Make another', { tone: finishedPiece.queued || !inStorage ? 'primary' : '' })}
        </div>
      </div>
    </div>`;
}

function refreshBench() {
  const craft = game.state.craft;
  const product = productById(selectedProduct);
  const expired = benchRequest && !waitingRequest(benchRequest.id);
  const key = craft ? `${craft.productId}:${craft.paletteId}:${craft.phase}:${craft.requestId}` : finishedPiece
    ? `ready:${finishedPiece.productId}:${finishedPiece.paletteId}:${finishedPiece.requestId}:${game.availableInStorage(finishedPiece.productId, finishedPiece.paletteId)}`
    : JSON.stringify([selectedProduct, game.state.clay, benchRequest?.id, Boolean(expired)]);
  if (key !== benchKey) {
    const active = body.contains(document.activeElement);
    benchKey = key;
    $('benchContents').innerHTML = craft ? jobMarkup(craft) : finishedPiece ? finishedMarkup() : expired
      ? `<p>This request has ended. You can still make a piece for the shop.</p><div class="button-row">${actionButton('chooseAnother', 'Make for stock', { tone: 'primary' })}</div>`
      : product ? paletteMarkup(product) : recipesMarkup();
    if (active) focusPanelContent();
  }

  const orderName = craft?.requestName || finishedPiece?.requestName || benchRequest?.name;
  const orderPalette = paletteById(benchRequest?.paletteId);
  updateText('benchOrder', orderName ? `For ${orderName}${orderPalette ? ` · ${orderPalette.name}` : ''}` : 'For shop stock');
  if (!craft && !finishedPiece && !product && !expired) {
    for (const { id } of PRODUCTS) updateText(`recipeStock-${id}`, `${game.availableInStorage(id, benchRequest?.paletteId)} stored`);
  }

  if (craft) {
    const painting = craft.phase === 'painting';
    $('benchProgress').value = painting ? craft.paintedZones.length / 3 : 1 - craft.remaining / craft.duration;
    updateText('benchProgressLabel', painting ? `${craft.paintedZones.length} of 3 painted` : `${Math.ceil(craft.remaining)}s to finish`);
    for (const region of body.querySelectorAll('[data-zone]')) {
      const index = Number(region.dataset.zone);
      const painted = craft.paintedZones.includes(index);
      region.setAttribute('aria-pressed', String(painted));
      region.setAttribute('aria-disabled', String(painted));
      region.style.setProperty('--paint-color', paletteById(craft.paletteId).colors[index]);
      const dot = region.querySelector('.zone-dot');
      if (painted && !dot.querySelector('svg')) dot.innerHTML = icon('check');
    }
  }

  const choices = body.querySelectorAll('[data-action="choosePalette"]');
  for (const choice of choices) choice.setAttribute('aria-pressed', String(choice.dataset.palette === selectedPalette));
  drawRecipeImages();
}

function drawRecipeImages() {
  const image = scene?.images.trinkets;
  if (!image) return;
  for (const canvas of body.querySelectorAll('[data-frame]')) {
    const frame = scene.frames.trinkets?.[Number(canvas.dataset.frame)];
    const context = canvas.getContext('2d');
    if (!frame || !context) continue;
    const preview = canvas.classList.contains('piece-image');
    const job = preview && (game.state.craft || finishedPiece);
    const palette = paletteById(job?.paletteId || selectedPalette);
    const zones = job?.paintedZones ?? PRODUCT_PAINT_ZONES;
    const key = JSON.stringify([palette?.id, zones]);
    if (canvas.dataset.drawn === key) continue;
    canvas.dataset.drawn = key;
    const padding = canvas.width * .10;
    const scale = Math.min((canvas.width - padding * 2) / frame.w, (canvas.height - padding * 2) / frame.h);
    const width = frame.w * scale;
    const height = frame.h * scale;
    const x = (canvas.width - width) / 2;
    const y = (canvas.height - height) / 2;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawProductArt(context, image, frame, {
      x, y, width, height,
      palette: preview || benchRequest ? palette : undefined,
      paintedZones: zones,
      ceramic: (preview || benchRequest) && (job?.phase === 'painting' || palette?.id !== 'classic'),
    });
    const paintTargets = canvas.parentElement.querySelector('.paint-zones');
    if (paintTargets) {
      const band = height / PRODUCT_PAINT_ZONES.length;
      const firstRow = (y + band) / canvas.height * 100;
      const middleRow = band / canvas.height * 100;
      paintTargets.style.gridTemplateRows = `${firstRow}% ${middleRow}% 1fr`;
    }
    canvas.closest('.piece-preview')?.setAttribute('data-loaded', '');
  }
}

function stockMarkup() {
  return `
    <p>Guests buy from the shelves. The host refills empty displays from storage during the shift.</p>
    <ul class="stock-list">${PRODUCTS.map(({ id, name }) => `
      <li>
        <strong>${name}<small class="stock-palette" id="shelfPalette-${id}"></small><small class="stock-palette" id="reserved-${id}"></small></strong>
        <span class="stock-counts"><span><b id="inventory-${id}"></b> in storage</span><span><b id="shelf-${id}"></b> for sale</span></span>
        <button class="dialog-button stock-button" type="button" aria-label="Stock one ${name}" data-action="stock" data-product="${id}">+1</button>
      </li>`).join('')}
    </ul>
    <div class="button-row">${actionButton('stockAll', 'Stock all', { tone: 'primary' })}<button id="upgradeShop" class="dialog-button" type="button" data-action="upgrade"></button></div>`;
}

function decorMarkup() {
  return `
    <p>Add something to the shop. Each purchase appears in the scene.</p>
    <ul class="decor-list">${DECORATIONS.map((decoration) => `
      <li>
        <div class="decor-symbol" data-decor="${decoration.id}" aria-hidden="true">${icon(decoration.paletteId ? 'make' : decoration.id === 'rug' ? 'stock' : 'decor')}</div>
        <div><h3>${decoration.name}</h3><p>${decoration.description}</p></div>
        <button class="dialog-button" type="button" data-action="buyDecoration" data-decoration="${decoration.id}" aria-label="Buy ${decoration.name}"></button>
      </li>`).join('')}
    </ul>`;
}

function neighborsMarkup() {
  const moment = game.currentMoment();
  const memories = [...game.state.memories].reverse();
  return `<div class="neighbors-panel">
    <p>Little encounters make this street feel like home. Your choices become shop memories.</p>
    ${moment ? `<section class="neighbor-moment"><p class="eyebrow">Today's moment</p><h3>${moment.title}</h3><p>${moment.prompt}</p>
      <div class="button-row">${moment.options.map(({ id, label }) => actionButton('respondMoment', label, { visit: moment.visitId, choice: id, tone: id === 'welcome' || id === 'listen' ? 'primary' : '' })).join('')}</div></section>`
      : '<p class="counter-next">Watch the street while the shop is open. A neighbor may have a story.</p>'}
    <section class="memory-list"><h3>Shop memories · ${memories.length}</h3>
      ${memories.length ? `<ol>${memories.map(({ day, text }) => `<li><strong>Day ${day}</strong> ${text}</li>`).join('')}</ol>` : '<p>No memories yet. Your first one could arrive today.</p>'}</section>
  </div>`;
}

function refreshNeighbors() {
  const moment = game.currentMoment();
  const key = `${moment?.visitId ?? '-'}:${game.state.memories.length}`;
  if (neighborsKey === key) return;
  const hadFocus = body.contains(document.activeElement);
  neighborsKey = key;
  body.innerHTML = neighborsMarkup();
  if (hadFocus) (body.querySelector('[data-action="respondMoment"]') || $('closeDialog')).focus({ preventScroll: true });
}

function refreshDecor() {
  for (const decoration of DECORATIONS) {
    const button = body.querySelector(`[data-decoration="${decoration.id}"]`);
    const owned = Boolean(game.state.decorations[decoration.id]);
    button.setAttribute('aria-disabled', String(owned));
    button.setAttribute('aria-label', owned ? `${decoration.name} purchased` : `Buy ${decoration.name} for ${currency.format(decoration.cost)}`);
    const label = owned ? 'In the shop' : currency.format(decoration.cost);
    if (button.textContent !== label) button.textContent = label;
  }
}

function choicesMarkup(key, choices) {
  return Object.entries(choices).map(([value, label]) => `
    <button class="dialog-button setting-button" type="button" data-setting="${key}" data-value="${value}" aria-pressed="false">${label}</button>`).join('');
}

function environmentMarkup() {
  return `
    <fieldset class="settings-group">
      <legend>Time of day</legend>
      <div class="setting-choices">${choicesMarkup('time', { auto: 'Auto', day: 'Day', evening: 'Dusk', night: 'Night' })}</div>
    </fieldset>
    <fieldset class="settings-group">
      <legend>Weather</legend>
      <div class="setting-choices">${choicesMarkup('weather', { auto: 'Auto', clear: 'Clear', rain: 'Light rain' })}</div>
    </fieldset>
    <p class="settings-note">An open shift lasts about five minutes, from 9 AM to 9 PM on the shop clock. Time and weather previews change the street view.</p>`;
}

function helpMarkup() {
  return `
    <ul class="founder-roles">
      <li>${icon('make')}<span><strong>Maker</strong> Paint pieces for the shelves, or accept a custom request and open its workbench to use the guest’s palette.</span></li>
      <li>${icon('stock')}<span><strong>Host</strong> Refills empty displays from storage and packs each gift. You can add pieces yourself in Stock.</span></li>
      <li>${icon('shop')}<span><strong>Cashier</strong> Checks out guests one at a time after they’ve chosen a gift. All shop money is virtual.</span></li>
    </ul>
    <p class="help-day">Choose <strong>Close for today</strong> to finish the shift once the last sales are settled. <strong>Prepare next day</strong> starts a new morning with the shop closed so you can paint and stock before opening.</p>
    <section class="save-tools">
      <h3>Your save</h3>
      <p>The shop saves automatically to this browser. To move it to another device, export your save and import the JSON file there. Importing replaces the shop currently loaded.</p>
      <div class="button-row">
        ${actionButton('export', 'Export save JSON')}
        ${actionButton('import', 'Import save JSON')}
        ${actionButton('askReset', 'Reset shop')}
      </div>
    </section>`;
}

function resetMarkup() {
  return `
    <p>Starting over replaces your current shop progress in this browser.</p>
    <div class="button-row">
      ${actionButton('cancelReset', 'Cancel')}
      ${actionButton('reset', 'Reset my shop', { tone: 'danger' })}
    </div>`;
}

const panels = {
  welcome: ['Welcome to 3% little shop', 'Your first day', welcomeMarkup],
  make: ['Workbench', 'Make a little treasure', makeMarkup],
  stock: ['Your shop', 'Stock the shelves', stockMarkup],
  decor: ['Your shop', 'Make it your own', decorMarkup],
  neighbors: ['Your neighborhood', 'Stories from the street', neighborsMarkup],
  environment: ['San Francisco', 'Time and weather', environmentMarkup],
  help: ['Shopkeeper’s guide', 'Meet the founders', helpMarkup],
  reset: ['Shop save', 'Start a new shop?', resetMarkup],
};

function focusPanelContent() {
  const focusTarget = body.querySelector('[data-action="welcome"], [data-action="respondMoment"], [data-action="cancelReset"], [data-action="stockFinished"], [data-zone]:not([aria-disabled="true"]), #benchProgressLabel, [data-action="chooseRecipe"], [data-action="startPainting"], [data-action="chooseAnother"]') || $('closeDialog');
  focusTarget.focus({ preventScroll: true });
}

function showPanel(name, focusOrigin = document.activeElement) {
  if (!Object.hasOwn(panels, name)) return;
  if (!dialog.open) returnFocus = focusOrigin;
  panel = name;
  dialog.dataset.panel = name;
  const [kicker, title, markup] = panels[name];
  updateText('dialogKicker', kicker);
  updateText('dialogTitle', title);
  feedback.textContent = '';
  body.innerHTML = markup();
  benchKey = undefined;
  neighborsKey = undefined;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  refresh();
  focusPanelContent();
}

function markWelcomed() {
  welcomeSeen = true;
  try {
    browserStorage?.setItem(welcomeKey, 'yes');
  } catch {
    // Keep the welcome dismissed for the current session.
  }
}

function saveNow() {
  updateSaveIndicator(game.save().ok);
}

function exportShop() {
  const url = URL.createObjectURL(new Blob([game.exportSave()], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '3-percent-little-shop-save.json';
  dialog.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  announce('Shop save exported.');
}

function clearWorkbench() {
  selectedProduct = undefined;
  selectedPalette = 'classic';
  benchRequest = undefined;
  finishedPiece = undefined;
}

async function importShop() {
  const [file] = fileInput.files;
  fileInput.value = '';
  if (!file) return;
  if (file.size > 16384) {
    announce('This shop save is too large.', false);
    return;
  }
  try {
    const result = game.importSave(await file.text());
    if (result.ok) {
      markWelcomed();
      clearWorkbench();
      counterKey = undefined;
      lastAnnouncedVisit = undefined;
    }
    applyAction(result);
    if (result.ok && /original shop save/i.test(game.state.notice)) {
      announce(`${result.message} ${game.state.notice}`);
    }
  } catch {
    announce('The shop save file could not be read.', false);
  }
}

function applyAction(result, close = false, quiet = false) {
  if (result.ok && close) dialog.close();
  refresh();
  if (!quiet || !result.ok) announce(result.message, result.ok);
}

function chooseRecipe(id) {
  selectedProduct = id;
  finishedPiece = undefined;
  refreshBench();
  focusPanelContent();
}

const actions = {
  welcome: () => dialog.close(),
  chooseRecipe: ({ product }) => chooseRecipe(product),
  choosePalette: ({ palette }) => {
    selectedPalette = palette;
    refreshBench();
  },
  startPainting: () => applyAction(benchRequest ? game.craftForRequest(benchRequest.id, selectedProduct) : game.craft(selectedProduct, selectedPalette), false, true),
  paint: ({ zone }) => applyAction(game.paint(Number(zone)), false, true),
  changePiece() {
    selectedProduct = undefined;
    refreshBench();
    focusPanelContent();
  },
  chooseAnother() {
    clearWorkbench();
    refreshBench();
    focusPanelContent();
  },
  stockFinished() {
    const result = game.stock(finishedPiece.productId, 1, finishedPiece.paletteId);
    if (result.ok) clearWorkbench();
    applyAction(result, result.ok);
  },
  stock: ({ product }) => applyAction(game.stock(product)),
  stockAll: () => applyAction(game.stockAll()),
  buyClay: () => applyAction(game.buyClay()),
  upgrade: () => applyAction(game.upgrade()),
  buyDecoration: ({ decoration }) => applyAction(game.buyDecoration(decoration), true),
  respondMoment: ({ visit, choice }) => applyAction(game.respondMoment(Number(visit), choice)),
  acceptRequest: ({ visit }) => applyAction(game.acceptRequest(Number(visit)), false, true),
  recommend: ({ product, visit, source }) => applyAction(game.recommend(product, Number(visit), source)),
  decline: ({ visit }) => applyAction(game.declineCustomer(Number(visit))),
  openDecor: () => showPanel('decor'),
  openWorkbench: () => showPanel('make'),
  makeRequest({ visit }) {
    const order = waitingRequest(Number(visit));
    if (!order) return announce('This request has ended.', false);
    if (game.state.craft) return showPanel('make');
    clearWorkbench();
    const { id, name, paletteId, tag } = order;
    benchRequest = { id, name, paletteId, tag };
    selectedPalette = paletteId;
    showPanel('make');
  },
  nextDay: () => applyAction(game.nextDay()),
  export: exportShop,
  import: () => fileInput.click(),
  askReset: () => showPanel('reset'),
  cancelReset: () => showPanel('help'),
  reset() {
    clearWorkbench();
    counterKey = undefined;
    lastAnnouncedVisit = undefined;
    applyAction(game.reset(), true);
  },
};

document.querySelectorAll('button[data-panel]').forEach((button) => {
  button.addEventListener('click', () => showPanel(button.dataset.panel));
});
$('openButton').addEventListener('click', () => {
  if (game.state.daySummary) actions.nextDay();
  else applyAction(game.state.open ? game.closeShift() : game.setOpen(true));
});
$('closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (panel === 'welcome') {
    markWelcomed();
    $('openButton').focus();
  } else if (returnFocus instanceof HTMLElement && returnFocus.isConnected && !returnFocus.hidden && returnFocus !== document.body) {
    returnFocus.focus();
  } else {
    const fallback = counter.querySelector('.primary') || document.querySelector('.dock [data-panel="make"]');
    fallback.focus();
  }
});

function runButton(event) {
  const button = event.target.closest('button');
  if (!button || button.getAttribute('aria-disabled') === 'true') return;
  const { action, setting, value } = button.dataset;
  if (setting) applyAction(game.setSetting(setting, value));
  if (Object.hasOwn(actions, action)) actions[action](button.dataset);
}

body.addEventListener('click', runButton);
counter.addEventListener('click', runButton);
fileInput.addEventListener('change', importShop);
dialog.append(fileInput);

function ready({ missing }) {
  sceneReady = true;
  if (missing.length) {
    const missingBackground = missing.includes('background');
    sceneNotice.toggleAttribute('data-missing-background', missingBackground);
    sceneNotice.setAttribute('data-error', '');
    sceneNotice.textContent = missingBackground
      ? 'The street illustration couldn’t load. The shop controls still work.'
      : 'Some shop illustrations couldn’t load.';
  } else {
    sceneNotice.hidden = true;
  }
  drawRecipeImages();
  $('game').removeAttribute('aria-busy');
  $('game').querySelectorAll('[inert]').forEach((element) => { element.inert = false; });
  if (!welcomeSeen && !dialog.open) showPanel('welcome');
  else if (game.state.notice) announce(game.state.notice);
}

function frame(timestamp) {
  if (lastFrame !== undefined && sceneReady && !(dialog.open && ['welcome', 'neighbors'].includes(panel)) && !document.hidden) {
    game.tick(Math.min((timestamp - lastFrame) / 1000, 0.25));
  }
  lastFrame = timestamp;
  if (timestamp - hudTime >= 100) {
    refresh();
    hudTime = timestamp;
  }
  requestAnimationFrame(frame);
}

window.render_game_to_text = () => {
  const {
    day, minute, shiftRemaining, preparing, open, closing, arrivalRemaining, checkoutVisitId,
    stockActivity, stockProductId, stockPaletteId, restockRemaining, restockProductId,
    coins, clay, sales, inventory, inventoryPieces, shelves, shelfPieces, shelfPalettes,
    craft, visit, visitors, staff, decorations, daySummary, notice, memories,
  } = game.state;
  return JSON.stringify({
    day, minute: Math.round(minute), shiftRemaining: Math.ceil(shiftRemaining), preparing, open, closing, arrivalRemaining, checkoutVisitId,
    stockActivity, stockProductId, stockPaletteId, restockRemaining, restockProductId,
    coins, clay, sales, inventory, inventoryPieces, shelves, shelfPieces, shelfPalettes, craft, visit, visitors, staff, decorations, daySummary, notice, memories,
    currentMoment: game.currentMoment(),
    environment: game.getEnvironment(), panel: dialog.open ? panel : null,
  });
};

applyBrand();
saveNow();
refresh();
scene = new ShopScene($('sceneCanvas'), {
  assetConfig: { ...ASSETS, logoUrl: BRAND.logoUrl },
  getState: () => ({ ...game.state, environment: game.getEnvironment() }),
  onHotspot(name) {
    if (!sceneReady) return;
    if (name === 'customer') {
      counter.querySelector('.primary')?.focus();
      return;
    }
    if (['make', 'stock'].includes(name)) showPanel(name, document.querySelector(`.dock [data-panel="${name}"]`));
  },
  onReady: ready,
  onError(name) {
    if (name === 'canvas') ready({ missing: ['background'] });
  },
});
scene.start();
requestAnimationFrame(frame);
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => {
  lastFrame = undefined;
  if (document.hidden) saveNow();
});
