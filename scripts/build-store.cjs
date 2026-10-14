/* Optional artwork export. Requires ImageMagick (`magick`), not needed to
   install or package the extension. Source screenshots are kept unmodified. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { root, extension } = require('./project.cjs');

const store = path.join(root, 'docs', 'store');
const iconMaster = path.join(root, 'docs', 'brand', 'icon-master.png');
fs.mkdirSync(path.join(extension, 'icons'), { recursive: true });
fs.mkdirSync(store, { recursive: true });

// Find the solid artwork, ignoring near-transparent pixels from generation.
const artworkBounds = execFileSync('magick', [iconMaster, '-alpha', 'extract', '-threshold', '10%', '-format', '%@', 'info:'], { encoding: 'utf8' }).trim();
const normalizedIcon = execFileSync('magick', [iconMaster, '-crop', artworkBounds, '+repage', '-resize', '768x768', '-gravity', 'center', '-background', 'none', '-extent', '1024x1024', '-strip', 'PNG32:-']);

function render(svg, output) {
  execFileSync('magick', ['-background', 'none', 'svg:-', '-alpha', 'off', '-strip', `PNG24:${output}`], { input: svg });
}
for (const size of [16, 32, 48, 128]) {
  // Preserve the generated glass artwork and alpha. Give the visible mark
  // 75% of the canvas, including the Store's 16 px padding at 128 px.
  execFileSync('magick', ['png:-', '-resize', `${size}x${size}`, '-strip', `PNG32:${path.join(extension, 'icons', `icon-${size}.png`)}`], { input: normalizedIcon });
}

const iconData = normalizedIcon.toString('base64');
const iconAt = (x, y, size) => `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/png;base64,${iconData}"/>`;
const background = '#191714';
const promo = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
<rect width="440" height="280" fill="${background}"/>
<circle cx="440" cy="0" r="240" fill="#f4b952" fill-opacity=".08"/>
${iconAt(100, 20, 128 * 1.85)}
</svg>`;
render(promo, path.join(store, 'promo-440x280.png'));

const marquee = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
<rect width="1400" height="560" fill="${background}"/>
<circle cx="1360" cy="20" r="640" fill="#f4b952" fill-opacity=".07"/>
<circle cx="140" cy="560" r="450" fill="#f4b952" fill-opacity=".04"/>
${iconAt(110, 105, 128 * 2.7)}
<text x="510" y="245" font-family="Arial, sans-serif" font-size="76" font-weight="bold" fill="#fff4df">XGlow</text>
<text x="514" y="309" font-family="Arial, sans-serif" font-size="31" fill="#c8c1b7">Glass cards. Your colors. Your feed.</text>
${['#97a7ff', '#5bcce8', '#48d397', '#f45c6c', '#ef9dc6', '#f4b952', '#b0c1d5'].map((color, i) => `<circle cx="${529 + i * 44}" cy="374" r="11" fill="${color}"/>`).join('')}
</svg>`;
render(marquee, path.join(store, 'marquee-1400x560.png'));

function screenshot({ source, title, subtitle, detail, color, tone, footer, output }) {
  const png = fs.readFileSync(path.join(root, 'docs', 'screenshots', source));
  const scale = Math.min(775 / png.readUInt32BE(16), 736 / png.readUInt32BE(20));
  const width = png.readUInt32BE(16) * scale, height = png.readUInt32BE(20) * scale;
  const x = 473 + (775 - width) / 2, y = 32 + (736 - height) / 2;
  const data = png.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="800" viewBox="0 0 1280 800">
<rect width="1280" height="800" fill="${tone}"/>
<circle cx="1080" cy="140" r="560" fill="${color}" fill-opacity=".09"/>
${iconAt(34, 35, 128 * .7)}
<g font-family="Arial, sans-serif" fill="#f7f3eb">
<text x="50" y="174" font-size="28" font-weight="bold">XGlow</text>
<text x="50" y="267" font-size="48" font-weight="bold">${title}</text>
<text x="50" y="321" font-size="24" fill="#c8c1b7">${subtitle}</text>
<text x="50" y="378" font-size="21" fill="#c8c1b7">${detail}</text>
<text x="50" y="688" font-size="18" fill="${color}">Local settings · Open source</text>
<text x="50" y="738" font-size="15" fill="#a69f95">${footer}</text>
</g>
<image x="${x}" y="${y}" width="${width}" height="${height}" xlink:href="data:image/png;base64,${data}"/>
</svg>`;
  render(svg, path.join(store, output));
}
screenshot({ source: 'theme-aurora.png', title: 'Aurora theme', subtitle: 'Cool violet. Soft reflections.', detail: 'Same extension. Different color theme.', color: '#a6b3ff', tone: '#111420', footer: 'Custom settings. Review is a separate extension.', output: 'theme-aurora-1280x800.png' });
screenshot({ source: 'theme-amber.png', title: 'Amber theme', subtitle: 'Warm gold. Soft reflections.', detail: 'Same extension. Different color theme.', color: '#f4b952', tone: '#191714', footer: 'Custom Amber settings shown.', output: 'theme-amber-1280x800.png' });
screenshot({ source: 'theme-cyberpunk-neon.png', title: 'Neon theme', subtitle: 'Cyberpunk glow. Rose and green.', detail: 'Same extension. A different theme.', color: '#ef9dc6', tone: '#140f1a', footer: 'Rose color shown. Review is a separate extension.', output: 'theme-cyberpunk-neon-1280x800.png' });
console.log('Exported extension icons, opaque 440×280 and 1400×560 promo tiles and three 1280×800 listing images.');
