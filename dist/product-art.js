export const PRODUCT_PAINT_ZONES = Object.freeze([0, 1, 2]);

const CLAY_FILTER = 'grayscale(1) sepia(0.42) brightness(1.13) contrast(0.9)';

// Draw on a transparent destination so painted colors follow only the trinket's silhouette.
export function drawProductArt(context, image, frame, {
  x, y, width, height, palette,
  paintedZones = PRODUCT_PAINT_ZONES,
  ceramic = Boolean(palette && palette.id !== 'classic'),
}) {
  const classic = palette?.id === 'classic';
  const zoneHeight = height / PRODUCT_PAINT_ZONES.length;
  if (!ceramic || (classic && paintedZones.length === PRODUCT_PAINT_ZONES.length)) {
    context.drawImage(image, frame.x, frame.y, frame.w, frame.h, x, y, width, height);
    return;
  }

  context.save();
  context.filter = CLAY_FILTER;
  context.drawImage(image, frame.x, frame.y, frame.w, frame.h, x, y, width, height);
  context.restore();

  if (!palette || !paintedZones.length) return;

  context.save();
  context.globalCompositeOperation = 'source-atop';
  if (classic) {
    context.beginPath();
    for (const zone of paintedZones) context.rect(x, y + zone * zoneHeight, width, zoneHeight);
    context.clip();
    context.drawImage(image, frame.x, frame.y, frame.w, frame.h, x, y, width, height);
  } else {
    context.globalAlpha = .62;
    for (const zone of paintedZones) {
      context.fillStyle = palette.colors[zone];
      context.fillRect(x, y + zone * zoneHeight, width, zoneHeight);
    }
  }
  context.restore();
}
