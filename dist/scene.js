import { PALETTES, PRODUCTS } from './game-state.js';
import { drawProductArt } from './product-art.js';

const WIDTH = 1536;
const HEIGHT = 1024;
const ASSET_NAMES = ['background', 'trinkets', 'cableCar', 'painter'];
const DEFAULT_ASSETS = {
  background: 'assets/shop-background.png',
  trinkets: 'assets/trinkets.png',
  cableCar: 'assets/cable-car.png',
  people: 'assets/people.png',
  visitors: 'assets/visitors-v3.png',
  painter: 'assets/painter.png',
  founders: 'assets/founders.png',
};
const DEFAULT_ANCHORS = {
  cake: { x: 615, y: 592, w: 94, h: 109, depth: 664 },
  mushroom: { x: 755, y: 627, w: 104, h: 117, depth: 701 },
  dresser: { x: 904, y: 692, w: 112, h: 110, depth: 763 },
  carousel: { x: 927, y: 569, w: 114, h: 139, depth: 644 },
  bunny: { x: 1076, y: 626, w: 111, h: 120, depth: 692 },
};
const DEFAULT_INTERIOR = [
  [549, 350], [961, 149], [1164, 245], [1161, 644],
  [844, 782], [539, 692], [540, 454],
];
const DEFAULT_RAIN_AREAS = [
  [[0, 602], [200, 698], [409, 772], [845, 897], [1251, 730], [1536, 652], [1536, HEIGHT], [0, HEIGHT]],
  [[1030, 0], [1536, 0], [1536, 219], [1257, 129]],
];
const DEFAULT_HOTSPOTS = {
  make: [[1007, 345], [1161, 322], [1163, 529], [1040, 551], [1000, 503]],
  stock: [[561, 506], [826, 523], [943, 461], [1018, 534], [1138, 572], [1131, 665], [848, 765], [563, 661]],
};
const DEFAULT_PEDESTRIANS = [
  { row: 0, path: [[-60, 690], [254, 783], [518, 873], [687, 922], [792, 946]], h: 123, w: 80, duration: 15500, period: 23000, offset: 5400 },
  { row: 1, path: [[1600, 725], [1515, 748], [1439, 774], [1318, 824], [1180, 874], [1122, 890], [1076, 884], [1022, 893], [957, 924], [850, 962]], h: 122, w: 86, duration: 14800, period: 21900, offset: 7100 },
];
const DEFAULT_CAR = { from: [-350, 645], to: [1000, 1150], w: 345, h: 232, delay: 3100, duration: 11000, period: 28000 };
const DEFAULT_PAINTER = { x: 1072, y: 534, w: 100, h: 133 };
const CASHIER = { x: 764, y: 474, w: 106, h: 140, shadow: false };
const PAYMENT_LABEL = { x: 857, y: 379 };
const HOST = { x: 943, y: 502, w: 96, h: 135 };
const HOST_PACK = { x: 926, y: 492 };
const HOST_STOCK = [[943, 502], [978, 490], [997, 517], [990, 540]];
const DEFAULT_DECALS = {
  awning: { x: 388, y: 388, w: 130, h: 75, rotation: 0.27, fontSize: 63, color: '#ffebbf' },
  hanging: { x: 259, y: 500, w: 43, h: 34, rotation: -0.26, fontSize: 26, color: '#f5ce8a' },
};
const DEFAULT_CUSTOMER = {
  approach: [[352, 776], [403, 765]],
  entryDoor: [[440, 736], [445, 710], [447, 679], [450, 651]],
  exitDoor: [[469, 652], [467, 681], [465, 709], [462, 737]],
  doorway: [[494, 622], [532, 588], [574, 567]],
  departure: [[457, 772], [498, 798], [582, 825]],
  browse: [
    { path: [[627, 551]], queueVia: [[656, 544]], flip: true },
    { path: [[598, 538], [624, 526], [656, 535], [706, 551], [777, 555], [826, 561], [841, 589], [833, 649]], queueVia: [[841, 589]], flip: true },
    { path: [[598, 538], [624, 526], [656, 535], [706, 551], [777, 555], [838, 544], [900, 511], [966, 526], [1001, 575]], queueVia: [[966, 526], [900, 511], [843, 548]], flip: false },
  ],
  queue: [[842, 579], [758, 574], [683, 580]],
  checkout: [[838, 554], [823, 537], [806, 524]],
  registerExit: [[775, 532], [725, 542], [663, 534], [624, 526], [598, 538]],
  w: 82,
  h: 135,
};
const QUEUE_APPROACH_FROM_LEFT = [[[703, 545]], [[691, 552]], [[685, 560]]];
const QUEUE_APPROACH_FROM_RIGHT = [[], [[816, 580]], [[816, 580], [723, 584]]];
const WALK_FRAME_DISTANCE = 21;
const BAG_POSE = 5;
const DOOR_OCCLUDERS = [
  { area: [[377, 523], [439, 504], [441, 708], [377, 730]], depth: 730 },
  { area: [[457, 495], [494, 477], [518, 478], [516, 688], [492, 690], [492, 723], [469, 732], [470, 505]], depth: 734 },
];
const SHOP_OCCLUDERS = [
  ...DOOR_OCCLUDERS,
  { area: [[515, 494], [548, 512], [548, 531], [514, 512]] },
  { area: [[514, 546], [550, 560], [550, 566], [514, 552]] },
  { area: [[545, 421], [561, 416], [560, 707], [546, 705]] },
  { area: [[1156, 402], [1175, 394], [1176, 648], [1160, 665]] },
  { area: [[1156, 404], [1243, 373], [1283, 362], [1283, 394], [1176, 421]] },
  { area: [[467, 676], [563, 701], [839, 773], [1159, 643], [1287, 591], [1318, 604], [1321, 674], [858, 864], [511, 776], [469, 744]] },
  { area: [[308, 294], [418, 350], [551, 414], [554, 468], [498, 507], [482, 511], [249, 406], [251, 384]] },
  { area: [[686, 422], [860, 372], [885, 381], [883, 476], [724, 530], [689, 510]], depth: 511 },
  { area: [[772, 397], [775, 384], [780, 366], [819, 355], [821, 375], [829, 388], [827, 399], [796, 408], [772, 404]], depth: 504 },
  { area: [[815, 330], [831, 325], [849, 338], [846, 360], [845, 380], [834, 386], [822, 379], [821, 359]], depth: 500 },
  { area: [[555, 585], [621, 553], [680, 578], [679, 638], [608, 666], [555, 639]], depth: 664 },
  { area: [[695, 615], [758, 588], [819, 615], [819, 673], [752, 701], [695, 675]], depth: 701 },
  { area: [[858, 552], [930, 525], [990, 554], [990, 613], [916, 645], [858, 615]], depth: 644 },
  { area: [[832, 672], [901, 642], [975, 673], [974, 726], [900, 762], [831, 737]], depth: 763 },
  { area: [[1012, 612], [1080, 582], [1139, 610], [1139, 658], [1068, 693], [1012, 670]], depth: 692 },
];
const STREET_OCCLUDERS = [
  ...DOOR_OCCLUDERS,
  { area: [[1054, 841], [1056, 829], [1062, 823], [1069, 819], [1070, 815], [1079, 813], [1086, 817], [1087, 821], [1096, 824], [1099, 834], [1097, 849], [1104, 851], [1109, 862], [1106, 873], [1099, 877], [1098, 897], [1104, 902], [1103, 917], [1097, 926], [1083, 931], [1065, 929], [1054, 924], [1052, 912], [1052, 905], [1058, 896], [1059, 879], [1051, 875], [1048, 862], [1053, 853], [1057, 849]], depth: 925 },
  { area: [[1461, 641], [1474, 645], [1484, 660], [1491, 682], [1498, 698], [1505, 671], [1504, 644], [1512, 632], [1516, 651], [1526, 640], [1536, 622], [1536, 645], [1526, 659], [1519, 671], [1512, 705], [1519, 745], [1528, 798], [1515, 806], [1505, 790], [1496, 737], [1487, 708], [1479, 692], [1472, 674]], depth: 805 },
];
const RAIN_COUNT = 140;
const RAIN_DROPS = Array.from({ length: RAIN_COUNT }, (_, index) => ({
  x: ((index * 859) % 1543) / 1543,
  y: ((index * 227) % 1049) / 1049,
  speed: 0.49 + ((index * 13) % 17) * 0.021,
  length: 12 + ((index * 7) % 15),
}));

function imageSize(image) {
  return [image.naturalWidth || image.width, image.naturalHeight || image.height];
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing asset path'));
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${url}`));
    image.src = url;
  });
}

function atlasFrames(image, columns, rows) {
  const [width, height] = imageSize(image);
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const x = Math.floor(column * width / columns);
      const y = Math.floor(row * height / rows);
      return {
        x, y,
        w: Math.floor((column + 1) * width / columns) - x,
        h: Math.floor((row + 1) * height / rows) - y,
      };
    }),
  );
}

function alphaBounds(pixels, width, frame) {
  let left = frame.w;
  let top = frame.h;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < frame.h; y += 1) {
    let alpha = ((frame.y + y) * width + frame.x) * 4 + 3;
    for (let x = 0; x < frame.w; x += 1, alpha += 4) {
      if (pixels[alpha] > 35) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = y;
      }
    }
  }

  return right < 0 ? null : { left, top, right, bottom };
}

function groundCenter(pixels, width, frame, box) {
  let center = 0;
  let count = 0;
  const top = box.bottom - Math.round((box.bottom - box.top) * 0.10);
  for (let y = top; y <= box.bottom; y += 1) {
    let alpha = ((frame.y + y) * width + frame.x + box.left) * 4 + 3;
    for (let x = box.left; x <= box.right; x += 1, alpha += 4) {
      if (pixels[alpha] > 150) {
        center += x;
        count += 1;
      }
    }
  }
  return count ? center / count : (box.left + box.right) / 2;
}

function trimAtlas(image, columns, rows, alignment = false) {
  const frames = atlasFrames(image, columns, rows);
  const [width, height] = imageSize(image);

  try {
    const surface = document.createElement('canvas');
    surface.width = width;
    surface.height = height;
    const context = surface.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, width, height).data;

    return frames.map((row) => {
      const bounds = row.map((frame) => alphaBounds(pixels, width, frame));
      const occupied = bounds.filter(Boolean);
      const height = Math.max(0, ...occupied.map((box) => box.bottom - box.top + 3));
      const maxWidth = Math.max(0, ...occupied.map((box) => box.right - box.left + 3));
      const rowAnchor = alignment === 'row-feet' && bounds[0] ? groundCenter(pixels, width, row[0], bounds[0]) : null;
      const shared = alignment === true && occupied.length ? {
        left: Math.min(...occupied.map((entry) => entry.left)),
        top: Math.min(...occupied.map((entry) => entry.top)),
        right: Math.max(...occupied.map((entry) => entry.right)),
        bottom: Math.max(...occupied.map((entry) => entry.bottom)),
      } : null;

      return row.map((frame, index) => {
        const box = shared || bounds[index];
        if (!box) return frame;
        const left = Math.max(0, box.left - 1);
        const top = Math.max(0, box.top - 1);
        const right = Math.min(frame.w - 1, box.right + 1);
        const bottom = Math.min(frame.h - 1, box.bottom + 1);
        const crop = { x: frame.x + left, y: frame.y + top, w: right - left + 1, h: bottom - top + 1 };
        if (alignment === 'feet' || alignment === 'row-feet') {
          crop.anchorX = (rowAnchor ?? groundCenter(pixels, width, frame, box)) - left;
          crop.referenceWidth = maxWidth;
          crop.referenceHeight = height;
        }
        return crop;
      });
    });
  } catch {
    return frames;
  }
}

function tracePolygon(context, points) {
  if (!points.length) return;
  context.moveTo(...points[0]);
  for (const point of points.slice(1)) context.lineTo(...point);
  context.closePath();
}

function containsPoint(points, x, y) {
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [xi, yi] = points[index];
    const [xj, yj] = points[previous];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function mix(start, end, fraction) {
  return start + (end - start) * fraction;
}

function clamp01(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function compilePath(points) {
  const segments = points.slice(1).map((to, index) => {
    const from = points[index];
    return { from, to, length: Math.hypot(to[0] - from[0], to[1] - from[1]) };
  });
  return { segments, length: segments.reduce((total, segment) => total + segment.length, 0) };
}

function compileWalk(points) {
  const rounded = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index];
    const [previousX, previousY] = points[index - 1];
    const [nextX, nextY] = points[index + 1];
    const before = Math.min(0.4, 13 / Math.hypot(previousX - x, previousY - y));
    const after = Math.min(0.4, 13 / Math.hypot(nextX - x, nextY - y));
    const start = [mix(x, previousX, before), mix(y, previousY, before)];
    const end = [mix(x, nextX, after), mix(y, nextY, after)];
    rounded.push(start);
    for (const t of [0.25, 0.5, 0.75]) {
      rounded.push([mix(mix(start[0], x, t), mix(x, end[0], t), t), mix(mix(start[1], y, t), mix(y, end[1], t), t)]);
    }
    rounded.push(end);
  }
  rounded.push(points.at(-1));
  return compilePath(rounded);
}

function walkFraction(progress) {
  const ramp = 0.08;
  const straight = 1 - ramp;
  if (progress < ramp) return progress ** 2 / (2 * ramp * straight);
  if (progress > 1 - ramp) return 1 - (1 - progress) ** 2 / (2 * ramp * straight);
  return (progress - ramp / 2) / straight;
}

function walkPose(distance) {
  return 1 + Math.floor(distance / WALK_FRAME_DISTANCE) % 4;
}

function positionAlongPath({ segments, length: totalLength }, progress) {
  let remaining = clamp01(progress) * totalLength;
  for (const { from, to, length } of segments) {
    if (remaining <= length && length > 0) {
      return { x: mix(from[0], to[0], remaining / length), y: mix(from[1], to[1], remaining / length), flip: to[0] < from[0] };
    }
    remaining -= length;
  }
  const { from, to } = segments.at(-1);
  return { x: to[0], y: to[1], flip: to[0] < from[0] };
}

function spriteBox(frame, placement) {
  const { x, y, w, h, flip } = placement;
  const scale = Math.min(w / (frame.referenceWidth ?? frame.w), h / (frame.referenceHeight ?? frame.h));
  const width = frame.w * scale;
  const height = frame.h * scale;
  const anchor = (frame.anchorX ?? frame.w / 2) * scale;
  return { x: x - (flip ? width - anchor : anchor), y: y - height, w: width, h: height };
}

function spriteAt(context, image, frame, placement, box = frame && spriteBox(frame, placement)) {
  if (!image || !frame) return;
  if (placement.flip) {
    context.save();
    context.translate(box.x + box.w, box.y);
    context.scale(-1, 1);
  }
  context.drawImage(image, frame.x, frame.y, frame.w, frame.h, placement.flip ? 0 : box.x, placement.flip ? 0 : box.y, box.w, box.h);
  if (placement.flip) context.restore();
}

function buildOccluder({ area, depth = Infinity }) {
  const path = new Path2D();
  path.rect(0, 0, WIDTH, HEIGHT);
  tracePolygon(path, area);
  const xs = area.map(([x]) => x);
  const ys = area.map(([, y]) => y);
  return { path, depth, left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
}

function intersects(box, { left, top, right, bottom }) {
  return box.x < right && box.y < bottom && box.x + box.w > left && box.y + box.h > top;
}

export class ShopScene {
  constructor(canvas, { getState, onHotspot, onReady, onError, assetConfig = {}, debug = false } = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: true });
    this.getState = getState || (() => ({}));
    this.onHotspot = onHotspot;
    this.onReady = onReady;
    this.onError = onError;
    this.debug = debug;
    this.assetConfig = { ...DEFAULT_ASSETS, ...assetConfig };
    this.anchors = Object.fromEntries(PRODUCTS.map(({ id }) => [id, {
      ...DEFAULT_ANCHORS[id],
      ...assetConfig.anchors?.[id],
    }]));
    this.painter = { ...DEFAULT_PAINTER, ...assetConfig.painterPlacement };
    this.car = { ...DEFAULT_CAR, ...assetConfig.cableCarRoute };
    this.decals = Object.entries(DEFAULT_DECALS).map(([key, placement]) => ({
      ...placement,
      ...assetConfig.brandDecals?.[key],
    }));
    this.customer = { ...DEFAULT_CUSTOMER, ...assetConfig.customerRoute };
    const { approach, entryDoor, exitDoor, doorway, departure, browse, queue, checkout, registerExit } = this.customer;
    const out = [...doorway].reverse().concat(exitDoor, departure);
    this.customerRoutes = {
      entering: browse.map(({ path }) => compileWalk([...approach, ...entryDoor, ...doorway, ...path])),
      checkout: compileWalk([queue[0], ...checkout]),
      browseExit: browse.map(({ path }) => compileWalk([...path].reverse().concat(out))),
      registerExit: compileWalk([checkout.at(-1), ...registerExit, ...out]),
      toQueue: browse.map(({ path, queueVia }, slot) => queue.map((point, index) => {
        const approach = slot === 0 ? QUEUE_APPROACH_FROM_LEFT : QUEUE_APPROACH_FROM_RIGHT;
        return compileWalk([path.at(-1), ...queueVia, ...approach[index], point]);
      })),
      advanceQueue: queue.map((from, source) => queue.map((to, target) => source === target ? null : compileWalk([from, to]))),
    };
    this.hostStockRoute = compilePath(HOST_STOCK);
    this.interior = assetConfig.interior || DEFAULT_INTERIOR;
    this.rainAreas = assetConfig.rainAreas || DEFAULT_RAIN_AREAS;
    this.hotspots = { ...DEFAULT_HOTSPOTS, ...assetConfig.hotspots };
    this.pedestrians = (assetConfig.pedestrians || DEFAULT_PEDESTRIANS).map((pedestrian) => ({
      ...pedestrian,
      route: compilePath(pedestrian.path ?? [pedestrian.from, pedestrian.to]),
    }));
    this.shopOccluders = SHOP_OCCLUDERS.map(buildOccluder);
    this.streetOccluders = STREET_OCCLUDERS.map(buildOccluder);
    this.images = {};
    this.frames = {};
    this.productArt = new Map();
    this.particles = [];
    this.elapsed = 0;
    this.previousTime = null;
    this.nextFrame = null;
    this.running = false;
    this.reducedMotion = false;
    this.hoveredHotspot = null;
    this.motionQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionQuery?.matches || false;
    this.onMotionChange = (event) => this.setReducedMotion(event.matches);
    this.onResize = () => this.resize();
    this.onPointerMove = (event) => {
      if (event.pointerType === 'touch') return;
      this.hoveredHotspot = this.hotspotAt(event);
      this.canvas.style.cursor = this.hoveredHotspot ? 'pointer' : '';
    };
    this.onPointerLeave = () => {
      this.hoveredHotspot = null;
      this.canvas.style.cursor = '';
    };
    this.onClick = (event) => {
      const hotspot = this.hotspotAt(event);
      if (hotspot && this.onHotspot) this.onHotspot(hotspot);
    };
    this.tick = (time) => {
      if (!this.running) return;
      if (this.previousTime !== null) this.elapsed += Math.min(time - this.previousTime, 100);
      this.previousTime = time;
      this.render();
      this.nextFrame = requestAnimationFrame(this.tick);
    };
  }

  start() {
    if (this.running) return;
    if (!this.context) {
      this.onError?.('canvas', new Error('Canvas 2D is unavailable'));
      return;
    }

    this.running = true;
    this.previousTime = null;
    this.resize();
    this.resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(this.onResize) : null;
    this.resizeObserver?.observe(this.canvas);
    globalThis.addEventListener?.('resize', this.onResize);
    this.motionQuery?.addEventListener?.('change', this.onMotionChange);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('click', this.onClick);
    this.nextFrame = requestAnimationFrame(this.tick);
    this.assetLoad ??= this.loadAssets();
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.nextFrame);
    this.nextFrame = null;
    this.previousTime = null;
    this.resizeObserver?.disconnect();
    globalThis.removeEventListener?.('resize', this.onResize);
    this.motionQuery?.removeEventListener?.('change', this.onMotionChange);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('click', this.onClick);
    this.onPointerLeave();
  }

  async loadAssets() {
    const missing = [];
    const names = [...ASSET_NAMES];
    if (this.assetConfig.visitors) names.push('visitors');
    if (this.assetConfig.founders) names.push('founders');
    if (this.assetConfig.logoUrl) names.push('logoUrl');
    const load = async (name) => {
      try {
        const image = await loadImage(this.assetConfig[name]);
        this.images[name] = image;
        if (name === 'trinkets') this.frames.trinkets = trimAtlas(image, 5, 1)[0];
        if (name === 'painter') this.frames.painter = trimAtlas(image, 3, 1, true)[0];
        if (name === 'people') this.frames.people = trimAtlas(image, 4, 2, true);
        if (name === 'visitors') this.frames.visitors = trimAtlas(image, 6, 3, 'row-feet');
        if (name === 'founders') this.frames.founders = trimAtlas(image, 4, 3, 'feet');
        if (name === 'cableCar') this.frames.cableCar = trimAtlas(image, 1, 1)[0][0];
        if (name === 'logoUrl') this.frames.logoUrl = trimAtlas(image, 1, 1)[0][0];
      } catch (error) {
        if (name !== 'founders' && name !== 'visitors') missing.push(name);
        this.onError?.(name, error);
      }
    };
    await Promise.all(names.map(load));
    if (!this.frames.visitors) await load('people');
    if (this.running) this.render();
    this.onReady?.({ missing });
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(globalThis.devicePixelRatio || 1, 2));
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));

    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
    this.fitScale = Math.min(pixelWidth / WIDTH, pixelHeight / HEIGHT);
    this.fitX = (pixelWidth - WIDTH * this.fitScale) / 2;
    this.fitY = (pixelHeight - HEIGHT * this.fitScale) / 2;
    if (this.context) this.render();
  }

  setReducedMotion(reduced) {
    this.reducedMotion = Boolean(reduced);
    if (this.context && this.running) this.render();
  }

  celebrateSale(productId, amount) {
    if (!this.anchors[productId] || !Number.isFinite(amount) || amount <= 0) return;
    this.particles = this.particles.slice(-11);
    this.particles.push({ amount, start: this.elapsed });
  }

  hotspotAt(event) {
    if (!this.images.background || !this.fitScale) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((event.clientX - rect.left) * this.canvas.width / rect.width - this.fitX) / this.fitScale;
    const y = ((event.clientY - rect.top) * this.canvas.height / rect.height - this.fitY) / this.fitScale;
    const marker = this.customerHotspot();
    if (marker && (Math.hypot(x - marker.x, y - marker.y) <= 32 || containsPoint(marker.area, x, y))) return 'customer';
    return Object.entries(this.hotspots).find(([, area]) => containsPoint(area, x, y))?.[0] || null;
  }

  render() {
    if (!this.fitScale) return;
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.images.background) return;

    const state = this.getState() || {};
    context.save();
    context.setTransform(this.fitScale, 0, 0, this.fitScale, this.fitX, this.fitY);
    context.beginPath();
    context.rect(0, 0, WIDTH, HEIGHT);
    context.clip();
    context.imageSmoothingEnabled = true;
    context.drawImage(this.images.background, 0, 0, WIDTH, HEIGHT);
    this.drawBrandDecals();
    this.drawDecorations(state.decorations);
    if (state.memories?.some(({ text, choice }) => choice === 'welcome' && text === 'You gave the postcard a place in the window. Curious neighbors stopped to look.')) this.drawWindowPostcard();
    const customers = (state.visitors ?? []).map((visit) => ({ visit, placement: this.customerPlacement(visit) }));
    const checkout = customers.find(({ visit }) => visit.id === state.checkoutVisitId);
    const request = customers.find(({ visit }) => visit.stage === 'waiting');
    this.drawShop(state, customers, checkout);
    this.drawStreet(customers);
    this.drawCableCar();
    this.drawEnvironment(state.environment);
    this.drawHotspot(request?.visit, request?.placement);
    this.drawProgress(state.craft);
    this.drawSaleParticles();
    if (this.debug) this.drawDebug(customers);
    context.restore();
  }

  drawBrandDecals() {
    const context = this.context;
    for (const { x, y, w, h, rotation, fontSize, color } of this.decals) {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      const logo = this.frames.logoUrl;
      if (logo) {
        spriteAt(context, this.images.logoUrl, logo, { x: 0, y: logo.h * Math.min(w / logo.w, h / logo.h) / 2, w, h });
      } else {
        context.fillStyle = color;
        context.font = `italic 600 ${fontSize}px Georgia, serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('3%', 0, 0, w);
      }
      context.restore();
    }
  }

  drawDecorations(owned) {
    if (owned?.rug) this.drawRug();
    if (owned?.['window-plant']) this.drawWindowPlant();
    if (owned?.['palette-rack']) this.drawPaletteRack();
  }

  drawWindowPostcard() {
    const context = this.context;
    context.save();
    context.translate(1175, 552);
    context.rotate(-0.11);
    context.fillStyle = 'rgba(74, 44, 32, 0.25)';
    context.fillRect(3, 4, 42, 29);
    context.fillStyle = '#f3dfb6';
    context.fillRect(0, 0, 42, 29);
    context.strokeStyle = '#7f5548';
    context.lineWidth = 1.5;
    context.strokeRect(0, 0, 42, 29);
    context.fillStyle = '#9fb8ad';
    context.fillRect(4, 4, 34, 16);
    context.fillStyle = '#d4ad84';
    context.beginPath();
    context.moveTo(4, 20);
    context.lineTo(17, 11);
    context.lineTo(27, 18);
    context.lineTo(38, 12);
    context.lineTo(38, 20);
    context.fill();
    context.fillStyle = '#8b5d4a';
    context.fillRect(6, 23, 23, 1);
    context.restore();
  }

  drawRug() {
    const context = this.context;
    context.save();
    context.transform(0.69, 0.26, -0.74, 0.28, 773, 521);
    context.fillStyle = 'rgba(71, 36, 36, 0.30)';
    context.fillRect(-3, -2, 106, 113);
    context.strokeStyle = '#e0b781';
    context.lineWidth = 1.1;
    context.beginPath();
    for (let x = 2; x < 100; x += 3) {
      context.moveTo(x, -6);
      context.lineTo(x + 0.6, 5);
      context.moveTo(x, 95);
      context.lineTo(x + 0.4, 106);
    }
    context.stroke();
    const wool = context.createLinearGradient(0, 0, 100, 100);
    wool.addColorStop(0, '#a65243');
    wool.addColorStop(0.55, '#8c454a');
    wool.addColorStop(1, '#7d3f43');
    context.fillStyle = wool;
    context.fillRect(0, 0, 100, 100);
    context.strokeStyle = '#e0ae76';
    context.lineWidth = 2.4;
    context.strokeRect(5, 5, 90, 90);
    context.strokeStyle = '#df9782';
    context.lineWidth = 1.3;
    context.strokeRect(10, 10, 80, 80);
    for (const [x, y, radius] of [[50, 50, 23], [23, 23, 6], [77, 23, 6], [23, 77, 6], [77, 77, 6]]) {
      context.beginPath();
      tracePolygon(context, [[x, y - radius], [x + radius, y], [x, y + radius], [x - radius, y]]);
      context.fillStyle = '#d59c70';
      context.fill();
      context.strokeStyle = '#623841';
      context.stroke();
    }
    context.fillStyle = '#5f6458';
    context.beginPath();
    tracePolygon(context, [[50, 39], [61, 50], [50, 61], [39, 50]]);
    context.fill();
    context.restore();
  }

  drawWindowPlant() {
    const context = this.context;
    context.save();
    context.translate(1235, 584);
    context.fillStyle = 'rgba(89, 51, 31, 0.28)';
    context.beginPath();
    context.ellipse(2, 0, 19, 6, -0.22, 0, Math.PI * 2);
    context.fill();
    const glaze = context.createLinearGradient(-15, 0, 16, 0);
    glaze.addColorStop(0, '#5f7772');
    glaze.addColorStop(0.36, '#a6b3a0');
    glaze.addColorStop(1, '#657d72');
    context.beginPath();
    context.moveTo(-16, -22);
    context.lineTo(-11, -3);
    context.quadraticCurveTo(0, 2, 11, -3);
    context.lineTo(16, -22);
    context.closePath();
    context.fillStyle = glaze;
    context.fill();
    context.strokeStyle = '#586555';
    context.lineWidth = 1.2;
    context.stroke();
    context.beginPath();
    context.ellipse(0, -22, 16, 4.4, 0, 0, Math.PI * 2);
    context.fillStyle = '#746143';
    context.fill();
    context.strokeStyle = '#b4c2a9';
    context.stroke();
    const stems = [[-17, -49], [-8, -62], [2, -57], [12, -60], [20, -43]];
    context.lineWidth = 1.5;
    for (const [x, y] of stems) {
      context.beginPath();
      context.moveTo(x * 0.2, -21);
      context.quadraticCurveTo(x * 0.6, -42, x, y);
      context.strokeStyle = '#586b42';
      context.stroke();
      for (const side of [-1, 1]) {
        const left = x * 0.57;
        const top = y + 13;
        context.beginPath();
        context.moveTo(left, top + 7);
        context.quadraticCurveTo(left + side * 13, top + 8, left + side * 13, top - 4);
        context.quadraticCurveTo(left + side * 2, top - 4, left, top + 7);
        context.fillStyle = side < 0 ? '#6f874b' : '#4d6d46';
        context.fill();
      }
      for (const [dx, dy] of [[-3, 1], [2, 2], [0, -3]]) {
        context.beginPath();
        context.ellipse(x + dx, y + dy, 4.4, 3.5, 0.5, 0, Math.PI * 2);
        context.fillStyle = dx < 0 ? '#b76a58' : '#dd9a82';
        context.fill();
      }
      context.fillStyle = '#f3c891';
      context.fillRect(x, y, 2.4, 2.0);
    }
    context.restore();
  }

  drawPaletteRack() {
    const context = this.context;
    context.save();
    context.transform(1, 0.33, 0, 1, 1041, 349);
    context.fillStyle = 'rgba(93, 56, 33, 0.31)';
    context.fillRect(2, 3, 51, 29);
    context.fillStyle = '#8e592f';
    context.fillRect(0, 0, 51, 29);
    context.fillStyle = '#c6945d';
    context.fillRect(3, 3, 44, 21);
    let x = 5;
    for (const color of ['#eee0b9', '#d38679', '#899c75', '#b18ca9']) {
      context.fillStyle = color;
      context.fillRect(x, 6, 9, 15);
      context.fillStyle = '#f1d9b2';
      context.fillRect(x + 2, 8, 5, 2);
      x += 10;
    }
    context.fillStyle = '#b47c44';
    context.fillRect(-2, 23, 56, 5);
    context.restore();
  }

  drawShop(state, customers, checkout) {
    const visit = checkout?.visit;
    const host = this.hostPlacement(visit, state.stockActivity);
    const layers = [
      { depth: this.painter.y, draw: () => this.drawMaker(state.craft) },
      { depth: CASHIER.y, draw: () => this.drawCashier(visit) },
      { depth: host.y, draw: () => this.drawHost(host) },
    ];
    for (const { visit, placement } of customers) {
      if (placement.space === 'shop') layers.push({ depth: placement.y, draw: () => this.drawCustomer(visit, placement) });
    }
    for (const { id, index } of PRODUCTS) {
      if (!(state.shelves?.[id] > 0)) continue;
      layers.push({ depth: this.anchors[id].depth, draw: () => this.drawProduct(id, index, state.shelfPalettes?.[id]) });
    }
    layers.sort((a, b) => a.depth - b.depth);
    for (const layer of layers) layer.draw();
    this.drawCheckoutProps(visit, checkout?.placement);
  }

  drawProduct(id, index, paletteId) {
    const frame = this.frames.trinkets?.[index];
    const image = this.images.trinkets;
    if (!frame || !image) return;
    const palette = PALETTES.find(({ id }) => id === paletteId);
    if (!palette || palette.id === 'classic') {
      spriteAt(this.context, image, frame, this.anchors[id]);
      return;
    }

    const key = `${id}:${palette.id}`;
    if (!this.productArt.has(key)) {
      const surface = document.createElement('canvas');
      surface.width = frame.w;
      surface.height = frame.h;
      drawProductArt(surface.getContext('2d'), image, frame, { x: 0, y: 0, width: frame.w, height: frame.h, palette });
      this.productArt.set(key, surface);
    }
    const surface = this.productArt.get(key);
    spriteAt(this.context, surface, { x: 0, y: 0, w: frame.w, h: frame.h }, this.anchors[id]);
  }

  drawPerson(image, frame, placement) {
    if (!image || !frame) return;
    const context = this.context;
    const box = spriteBox(frame, placement);
    const { x, y, shadow, alpha = 1, space } = placement;
    const occluders = space === 'street' ? this.streetOccluders : this.shopOccluders;
    context.save();
    context.globalAlpha = alpha;
    for (const occluder of occluders) {
      if (y < occluder.depth && intersects(box, occluder)) context.clip(occluder.path, 'evenodd');
    }
    if (shadow !== false) {
      context.beginPath();
      context.ellipse(x, y - 2, Math.min(box.w * 0.49, 29), Math.min(box.w * 0.12, 7), -0.12, 0, Math.PI * 2);
      context.fillStyle = space === 'street' ? 'rgba(76, 53, 49, 0.22)' : 'rgba(69, 37, 23, 0.25)';
      context.fill();
    }
    spriteAt(context, image, frame, placement, box);
    context.restore();
  }

  drawFounder(row, pose, placement, fallback) {
    const frame = this.frames.founders?.[row]?.[pose];
    if (frame) {
      this.drawPerson(this.images.founders, frame, placement);
      return;
    }
    this.drawPerson(this.images[fallback.image], fallback.frame, placement);
  }

  visitorSprite(row, pose) {
    const frame = this.frames.visitors?.[row]?.[pose];
    if (frame) return { image: 'visitors', frame };
    const fallbackPose = pose === 2 || pose === 4 ? 3 : 0;
    return { image: 'people', frame: this.frames.people?.[row % 2]?.[fallbackPose] };
  }

  drawMaker(craft) {
    let pose = 0;
    if (craft?.phase === 'finishing') pose = 3;
    if (craft?.phase === 'painting') pose = this.reducedMotion ? 2 : 1 + Math.floor(this.elapsed / 250) % 2;
    const painterPose = pose === 3 ? 0 : pose;
    const fallback = pose === 0
      ? this.visitorSprite(0, 0)
      : { image: 'painter', frame: this.frames.painter?.[painterPose] };
    this.drawFounder(0, pose, this.painter, fallback);
  }

  drawCashier(visit) {
    const progress = clamp01(visit?.progress);
    let pose = visit?.stage === 'checkout' && progress > 0.7 ? 1 : 0;
    if (visit?.stage === 'paying' && progress < 0.30) pose = 1;
    if (visit?.stage === 'paying' && progress >= 0.30 && progress < 0.60) pose = 2;
    if (visit?.stage === 'paying' && progress >= 0.60 && progress < 0.79) pose = 3;
    this.drawFounder(1, pose, { ...CASHIER, flip: pose === 3 }, this.visitorSprite(1, 0));
  }

  hostPlacement(visit, stockActivity) {
    if (visit?.stage === 'checkout') {
      const progress = clamp01(visit.progress / 0.60);
      return { ...HOST, x: mix(HOST.x, HOST_PACK.x, progress), y: mix(HOST.y, HOST_PACK.y, progress), pose: visit.progress > 0.66 ? 3 : 2, flip: true };
    }
    if (visit?.stage === 'paying') {
      const progress = clamp01((visit.progress - 0.22) / 0.45);
      return { ...HOST, x: mix(HOST_PACK.x, HOST.x, progress), y: mix(HOST_PACK.y, HOST.y, progress), pose: progress >= 1 ? 0 : progress > 0 ? 1 : 3, flip: progress === 0 };
    }
    if (stockActivity > 0) {
      const progress = clamp01(1 - stockActivity / 2.8);
      const outbound = progress < 0.67;
      const travel = outbound ? clamp01(progress / 0.43) : clamp01((1 - progress) / 0.33);
      const spot = positionAlongPath(this.hostStockRoute, travel);
      return { ...HOST, ...spot, pose: travel === 1 ? 3 : outbound ? 2 : 1, flip: outbound ? spot.flip : !spot.flip };
    }
    return { ...HOST, pose: 0 };
  }

  drawHost(placement) {
    this.drawFounder(2, placement.pose, placement, this.visitorSprite(0, 0));
  }

  customerPlacement(visit) {
    if (!visit) return null;
    const slot = visit.browseSlot ?? 0;
    const { stage } = visit;
    const rank = visit.queueIndex ?? 0;
    const { entering, checkout, browseExit, registerExit, toQueue, advanceQueue } = this.customerRoutes;
    const browse = this.customer.browse[slot];
    const progress = clamp01(visit.progress);
    let travel = progress;
    let [x, y] = browse.path.at(-1);
    let { flip } = browse;
    let route;

    if (stage === 'entering') route = entering[slot];
    if (stage === 'queued') {
      [x, y] = this.customer.queue[rank];
      flip = rank === 0;
      const approaching = visit.queueFromIndex < 0;
      travel = clamp01(visit.queueProgress / (approaching ? 1 : 0.48));
      route = approaching ? toQueue[slot][rank] : advanceQueue[visit.queueFromIndex]?.[rank];
    }
    if (stage === 'checkout') {
      route = checkout;
      travel = clamp01(progress / 0.47);
    }
    if (stage === 'paying') {
      [x, y] = this.customer.checkout.at(-1);
      flip = true;
    }
    if (stage === 'leaving') route = visit.exitFrom === 'register' ? registerExit : browseExit[slot];

    const fraction = route ? walkFraction(travel) : 0;
    const distance = route ? route.length * fraction : 0;
    const moving = route && travel > 0 && travel < 1;
    if (route && (stage !== 'queued' || travel < 1)) ({ x, y, flip } = positionAlongPath(route, fraction));
    if (stage === 'entering' && progress >= 1) flip = browse.flip;
    const bag = visit.paid && (stage === 'leaving' || (stage === 'paying' && progress >= 0.94));
    let alpha = 1;
    if (stage === 'entering') alpha = clamp01(distance / 50);
    if (stage === 'leaving') alpha = clamp01((route.length - distance) / 55);
    const { w, h } = this.customer;
    return {
      x, y, flip, w, h, alpha, bag, row: this.customer.row ?? visit.spriteRow ?? 0,
      pose: moving && !this.reducedMotion ? walkPose(distance) : bag ? BAG_POSE : 0,
      space: y > 731 ? 'street' : 'shop',
    };
  }

  drawCustomer(visit, placement) {
    const { row, pose, x, y, flip, alpha, bag } = placement;
    const { image, frame } = this.visitorSprite(row, pose);
    this.drawPerson(this.images[image], frame, placement);
    if (visit.stage === 'leaving' && bag && !(image === 'visitors' && pose === BAG_POSE)) {
      const context = this.context;
      context.save();
      for (const occluder of placement.space === 'street' ? this.streetOccluders : this.shopOccluders) {
        if (y < occluder.depth && intersects({ x: x - 45, y: y - 80, w: 90, h: 60 }, occluder)) context.clip(occluder.path, 'evenodd');
      }
      context.globalAlpha = alpha;
      this.drawBag(x + (flip ? -23 : 23), y - 54);
      context.restore();
    }
  }

  drawBag(x, y) {
    const context = this.context;
    context.save();
    context.translate(x, y);
    context.strokeStyle = '#765131';
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(-5, -5);
    context.bezierCurveTo(-7, -19, 7, -20, 6, -5);
    context.stroke();
    const paper = context.createLinearGradient(-10, 0, 12, 8);
    paper.addColorStop(0, '#ab7b49');
    paper.addColorStop(0.30, '#edc795');
    paper.addColorStop(1, '#d39a64');
    context.beginPath();
    tracePolygon(context, [[-11, -8], [9, -10], [13, 13], [-9, 15]]);
    context.fillStyle = paper;
    context.fill();
    context.stroke();
    context.fillStyle = '#6d754c';
    context.font = 'italic bold 9px Georgia, serif';
    context.textAlign = 'center';
    context.fillText('3%', 1, 7);
    context.restore();
  }

  drawCheckoutProps(visit, customer) {
    if (visit?.stage !== 'paying' || !customer) return;
    const context = this.context;
    const progress = clamp01(visit.progress);
    if (progress >= 0.12 && progress < 0.56) {
      const transfer = this.reducedMotion ? 1 : clamp01((progress - 0.12) / 0.26);
      const x = mix(customer.x - 19, 783, transfer);
      const y = mix(customer.y - 77, 403, transfer) - Math.sin(transfer * Math.PI) * 12;
      context.save();
      context.fillStyle = '#efc779';
      context.strokeStyle = '#9c6a3c';
      context.lineWidth = 1.2;
      for (const [dx, dy] of [[-4, 2], [3, 0], [0, -3]]) {
        context.beginPath();
        context.ellipse(x + dx, y + dy, 3.4, 2.2, -0.33, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
      context.restore();
    }
    if (visit.paid && progress >= 0.60 && !(customer.pose === BAG_POSE && this.frames.visitors)) {
      const transfer = this.reducedMotion ? 1 : clamp01((progress - 0.76) / 0.18);
      const x = mix(mix(845, 854, transfer), mix(854, customer.x - 23, transfer), transfer);
      const y = mix(mix(399, 453, transfer), mix(453, customer.y - 54, transfer), transfer);
      this.drawBag(x, y);
    }
  }

  drawProgress(craft) {
    if (!craft || !(craft.duration > 0)) return;
    const progress = craft.phase === 'painting' ? (craft.paintedZones?.length ?? 0) / 3 : clamp01(1 - craft.remaining / craft.duration);
    const context = this.context;
    const x = this.painter.x - 20;
    const y = this.painter.y - this.painter.h - 13;
    context.fillStyle = 'rgba(56, 39, 31, 0.83)';
    context.fillRect(x - 3, y - 3, 46, 9);
    context.fillStyle = 'rgba(251, 222, 170, 0.3)';
    context.fillRect(x, y, 40, 3);
    context.fillStyle = '#f7d597';
    context.fillRect(x, y, progress * 40, 3);
  }

  drawStreet(customers) {
    const layers = customers.filter(({ placement }) => placement.space === 'street')
      .map(({ visit, placement }) => ({ y: placement.y, draw: () => this.drawCustomer(visit, placement) }));
    if (!this.reducedMotion) {
      for (const path of this.pedestrians) {
        const time = (this.elapsed + path.offset) % path.period;
        if (time >= path.duration) continue;
        const progress = time / path.duration;
        const spot = positionAlongPath(path.route, progress);
        const { image, frame } = this.visitorSprite(path.row, walkPose(progress * path.route.length));
        const placement = {
          ...spot, w: path.w, h: path.h, flip: path.flip ?? spot.flip, space: 'street',
          alpha: Math.min(1, time / 650, (path.duration - time) / 650),
        };
        layers.push({ y: spot.y, draw: () => this.drawPerson(this.images[image], frame, placement) });
      }
    }
    layers.sort((a, b) => a.y - b.y);
    for (const layer of layers) layer.draw();
  }

  drawCableCar() {
    if (!this.images.cableCar || this.reducedMotion || this.elapsed < this.car.delay) return;
    const time = (this.elapsed - this.car.delay) % this.car.period;
    if (time >= this.car.duration) return;
    const progress = time / this.car.duration;
    spriteAt(this.context, this.images.cableCar, this.frames.cableCar, {
      x: mix(this.car.from[0], this.car.to[0], progress) + this.car.w / 2,
      y: mix(this.car.from[1], this.car.to[1], progress) + this.car.h,
      w: this.car.w,
      h: this.car.h,
    });
  }

  drawEnvironment(environment) {
    const context = this.context;
    const night = clamp01(environment?.nightAmount);
    if (night) {
      context.save();
      context.beginPath();
      context.rect(0, 0, WIDTH, HEIGHT);
      tracePolygon(context, this.interior);
      context.fillStyle = `rgba(22, 40, 88, ${night * 0.62})`;
      context.fill('evenodd');
      context.restore();

      context.beginPath();
      tracePolygon(context, this.interior);
      context.fillStyle = `rgba(255, 181, 88, ${night * 0.10})`;
      context.fill();
    }

    if (environment?.weather !== 'rain' && environment?.weather !== 'rainy') return;
    context.save();
    context.beginPath();
    for (const polygon of this.rainAreas) tracePolygon(context, polygon);
    context.clip();
    const time = this.reducedMotion ? 0 : this.elapsed;
    context.lineWidth = 1.35;
    context.strokeStyle = `rgba(209, 231, 251, ${0.47 + night * 0.13})`;
    context.beginPath();
    for (const drop of RAIN_DROPS) {
      const x = (drop.x * (WIDTH + 35) + time * drop.speed * 0.23) % (WIDTH + 35) - 16;
      const y = (drop.y * (HEIGHT + 45) + time * drop.speed) % (HEIGHT + 45) - 25;
      context.moveTo(x, y);
      context.lineTo(x + drop.length * 0.23, y + drop.length);
    }
    context.stroke();
    context.restore();
  }

  customerHotspot(visit = this.getState()?.visitors?.find(({ stage }) => stage === 'waiting'), placement = this.customerPlacement(visit)) {
    if (visit?.stage !== 'waiting' || !placement) return null;
    const { x, y, h, w } = placement;
    return { x: x + 8, y: y - h - 14, area: [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]] };
  }

  drawHotspot(visit, customer) {
    const context = this.context;
    const area = this.hotspots[this.hoveredHotspot];
    if (area) {
      context.beginPath();
      tracePolygon(context, area);
      context.fillStyle = 'rgba(255, 232, 181, 0.09)';
      context.strokeStyle = 'rgba(255, 225, 177, 0.48)';
      context.lineWidth = 1.6;
      context.fill();
      context.stroke();
    }
    const marker = this.customerHotspot(visit, customer);
    if (!marker) return;
    context.save();
    context.translate(marker.x, marker.y);
    context.beginPath();
    context.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
    tracePolygon(context, [[-5, 8], [-8, 16], [3, 9]]);
    context.fillStyle = this.hoveredHotspot === 'customer' ? '#fff4d0' : '#f5dfb6';
    context.fill();
    context.fillStyle = '#7f593c';
    for (const x of [-6, 0, 6]) {
      context.beginPath();
      context.arc(x, 0, 1.5, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  drawDebug(customers) {
    const context = this.context;
    context.save();
    context.strokeStyle = '#233a70';
    context.fillStyle = '#233a70';
    context.lineWidth = 2;
    context.setLineDash([6, 4]);
    context.beginPath();
    for (const { segments } of [...this.customerRoutes.entering, this.customerRoutes.checkout, this.customerRoutes.registerExit]) {
      context.moveTo(...segments[0].from);
      for (const { to } of segments) context.lineTo(...to);
    }
    context.stroke();
    context.setLineDash([]);
    context.font = 'bold 19px system-ui';
    const spots = [
      ...this.customer.browse.map(({ path }, index) => [path.at(-1), `Browse ${index + 1}`]),
      ...this.customer.queue.map((point, index) => [point, `Queue ${index + 1}`]),
      [this.customer.checkout.at(-1), 'Register'],
    ];
    for (const [point, label] of spots) {
      context.beginPath();
      context.arc(...point, 6, 0, Math.PI * 2);
      context.fill();
      context.fillText(label, point[0] + 8, point[1] + 20);
    }
    for (const { placement } of customers) {
      context.beginPath();
      context.arc(placement.x, placement.y, 9, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  drawSaleParticles() {
    const context = this.context;
    const lifetime = this.reducedMotion ? 1000 : 1250;
    this.particles = this.particles.filter((particle) => this.elapsed - particle.start < lifetime);
    if (!this.particles.length) return;
    context.save();
    context.font = 'bold 24px Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 4;
    context.lineJoin = 'round';
    context.strokeStyle = '#563628';
    context.fillStyle = '#fff3bd';
    for (const { amount, start } of this.particles) {
      const progress = clamp01((this.elapsed - start) / lifetime);
      const y = PAYMENT_LABEL.y - (this.reducedMotion ? 0 : 39 * progress);
      const label = '+$' + amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
      context.globalAlpha = this.reducedMotion ? 1 : Math.min(1, (1 - progress) * 3);
      context.strokeText(label, PAYMENT_LABEL.x, y);
      context.fillText(label, PAYMENT_LABEL.x, y);
    }
    context.restore();
  }
}
