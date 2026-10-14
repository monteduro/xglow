/* Preferences and palette, shared by the content script and the popup. */
globalThis.XGlow = (() => {
  const storageKey = 'xGlass';

  /* Safari and Firefox expose the promise-based WebExtension API as
     `browser`; Chrome exposes it as `chrome`. Resolved on each call so the
     preview's storage adapter can install itself first. */
  const api = () => globalThis.browser?.storage ? globalThis.browser : globalThis.chrome;

  const themeDefinitions = Object.freeze({
    glass: Object.freeze({
      label: 'Liquid Glass', stylesheet: 'glass.css',
      icon: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM7 7h10',
      marker: null, chatShape: 'rounded', supportsAccent: true, palette: glassPalette
    }),
    cyberpunk: Object.freeze({
      label: 'Cyberpunk Neon', stylesheet: 'cyberpunk.css',
      icon: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8z',
      marker: 'data-xlg-cyber', chatShape: 'square', supportsAccent: true, palette: cyberPalette
    }),
    hud: Object.freeze({
      label: 'Cyberpunk HUD', stylesheet: 'hud.css',
      icon: 'M7 3h14v14l-4 4H3V7zM7 9h10M7 13h7',
      marker: 'data-xlg-hud', chatShape: 'cut', supportsAccent: false, palette: hudPalette
    })
  });
  const themes = Object.freeze(Object.keys(themeDefinitions));

  const defaults = Object.freeze({
    enabled: true,
    accent: 'amber',
    customColor: '#97a7ff',
    tint: 50,
    blur: 10,
    opacity: 0,
    lite: false,
    sidebar: false,
    theme: 'glass'
  });

  const accents = Object.freeze({
    aurora: '151, 167, 255',
    ocean: '91, 204, 232',
    forest: '72, 211, 151',
    ruby: '244, 92, 108',
    rose: '239, 157, 198',
    amber: '244, 185, 82',
    silver: '176, 193, 213'
  });

  const WHITE = [255, 255, 255];
  const BLACK = [0, 0, 0];

  /* Returns a lowercase #rrggbb color, or null for anything else. */
  function colorHex(value) {
    if (typeof value !== 'string') return null;
    const hex = value.trim().toLowerCase();
    if (/^#[\da-f]{6}$/.test(hex)) return hex;
    if (/^#[\da-f]{3}$/.test(hex)) return '#' + [...hex.slice(1)].map(char => char + char).join('');
    return null;
  }

  const clamp = (number, min, max, fallback) =>
    Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;

  const boolean = (value, fallback) => typeof value === 'boolean' ? value : fallback;

  /* Stored values may come from older versions or be corrupted: every field
     is validated independently, and missing fields take their default. */
  function normalize(value = {}) {
    if (!value || typeof value !== 'object') value = {};
    return {
      enabled: boolean(value.enabled, defaults.enabled),
      accent: value.accent === 'custom' || Object.hasOwn(accents, value.accent) ? value.accent : defaults.accent,
      customColor: colorHex(value.customColor) || defaults.customColor,
      tint: clamp(value.tint, 0, 100, defaults.tint),
      blur: clamp(value.blur, 0, 40, defaults.blur),
      opacity: clamp(value.opacity, 0, 90, defaults.opacity),
      lite: boolean(value.lite, defaults.lite),
      sidebar: boolean(value.sidebar, defaults.sidebar),
      // `cyberpunk: true` was the toggle that preceded the theme choice.
      theme: themes.includes(value.theme) ? value.theme : value.cyberpunk === true ? 'cyberpunk' : defaults.theme
    };
  }

  /* Linear blend from `from` towards `to`; amount 1 returns `to`. */
  const mix = (from, to, amount) => from.map((channel, i) => Math.round(channel * (1 - amount) + to[i] * amount));

  /* WCAG relative luminance of an sRGB triplet. */
  const luminance = channels => channels.map(channel => {
    const value = channel / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  }).reduce((total, channel, i) => total + channel * [.2126, .7152, .0722][i], 0);

  const toHex = channels => '#' + channels.map(channel => channel.toString(16).padStart(2, '0')).join('');

  const accentChannels = settings => settings.accent === 'custom'
    ? settings.customColor.slice(1).match(/../g).map(channel => parseInt(channel, 16))
    : accents[settings.accent].split(',').map(Number);

  /* Fades the accent towards `target` until `isReadable` holds, so very dark
     or very light custom colors still produce legible controls. */
  function readableVariant(rgb, target, isReadable) {
    let color = rgb, weight = 1;
    while (!isReadable(luminance(color)) && weight > 0) {
      weight -= .05;
      color = mix(target, rgb, Math.max(0, weight));
    }
    return color;
  }

  /* The neon counterpart of the accent, 150° round the hue wheel: Amber pairs
     with cyan, cyan with magenta. Greys, which have no hue, pair with magenta. */
  function neonPartner(rgb) {
    const [r, g, b] = rgb.map(channel => channel / 255);
    const max = Math.max(r, g, b), spread = max - Math.min(r, g, b);
    let hue = 180;
    if (spread >= .1) {
      hue = max === r ? (g - b) / spread + (g < b ? 6 : 0) : max === g ? (b - r) / spread + 2 : (r - g) / spread + 4;
      hue *= 60;
    }
    hue = (hue + 150) % 360;
    const lightness = .58, amplitude = Math.min(lightness, 1 - lightness);
    const channel = offset => {
      const step = (offset + hue / 30) % 12;
      return Math.round((lightness - amplitude * Math.max(-1, Math.min(step - 3, 9 - step, 1))) * 255);
    };
    return [channel(0), channel(8), channel(4)];
  }

  /* Cyberpunk keeps the same keys as the glass palette. Surfaces are deep
     violet-black (or cold white on X's light themes); glows and borders are
     neon, with the partner color as the second light source. */
  function cyberPalette(settings, tone, rgb, controlEnd) {
    const strength = settings.tint / 100;
    const light = tone === 'light';
    const interfaceAccent = light ? readableVariant(rgb, BLACK, value => value <= .3) : controlEnd;
    const partner = neonPartner(rgb);
    const interfacePartner = light ? readableVariant(partner, BLACK, value => value <= .3) : partner;
    const base = mix(light ? [246, 244, 255] : [12, 9, 22], rgb, strength * (light ? .06 : .1));
    const background = mix(light ? [233, 230, 247] : [6, 4, 14], rgb, strength * (light ? .08 : .05));
    return {
      accent: rgb.join(', '),
      hex: toHex(rgb),
      interfaceAccent: interfaceAccent.join(', '),
      interfaceHex: toHex(interfaceAccent),
      secondary: interfacePartner.join(', '),
      controlEnd: controlEnd.join(', '),
      controlStart: controlEnd.join(', '),
      base: base.join(', '),
      background: `rgb(${background.join(', ')})`,
      glowSecondary: partner.join(', '),
      glowTertiary: partner.join(', '),
      glowOpacity: String(strength * (light ? .16 : .3)),
      glowSecondaryOpacity: String(strength * (light ? .12 : .24)),
      glowTertiaryOpacity: '0',
      border: `rgba(${interfaceAccent.join(', ')}, ${light ? .65 : .5})`
    };
  }

  const HUD_RED = [255, 92, 82], HUD_CYAN = [94, 242, 255];
  const HUD_RED_LIGHT = [196, 28, 40], HUD_TEAL_LIGHT = [0, 119, 138];

  /* The HUD theme ignores the accent: it is a fixed palette of alarm red for
     the interface and cyan for whatever is active, over dark maroon with an
     indigo glow. X's light themes get deep red and teal on blush white. */
  function hudPalette(settings, tone) {
    const strength = settings.tint / 100;
    const light = tone === 'light';
    const red = light ? HUD_RED_LIGHT : HUD_RED;
    const cyan = light ? HUD_TEAL_LIGHT : HUD_CYAN;
    const base = mix(light ? [255, 246, 246] : [26, 9, 14], red, strength * (light ? .04 : .07));
    const background = mix(light ? [244, 232, 234] : [13, 6, 10], red, strength * (light ? .06 : .05));
    const indigo = light ? [120, 112, 210] : [66, 58, 180];
    return {
      accent: red.join(', '),
      hex: toHex(red),
      interfaceAccent: red.join(', '),
      interfaceHex: toHex(red),
      secondary: cyan.join(', '),
      controlEnd: cyan.join(', '),
      controlStart: cyan.join(', '),
      base: base.join(', '),
      background: `rgb(${background.join(', ')})`,
      glowSecondary: indigo.join(', '),
      glowTertiary: indigo.join(', '),
      glowOpacity: String(strength * (light ? .16 : .55)),
      glowSecondaryOpacity: String(strength * (light ? .12 : .42)),
      glowTertiaryOpacity: '0',
      border: `rgba(${red.join(', ')}, ${light ? .6 : .62})`
    };
  }

  function glassPalette(settings, tone, rgb, controlEnd) {
    const strength = settings.tint / 100;
    const light = tone === 'light';
    const base = mix(light ? WHITE : [18, 20, 24], rgb, strength * (light ? .08 : .24));
    const background = mix(light ? [238, 242, 246] : [8, 10, 14], rgb, strength * (light ? .16 : .09));
    // Accents used as text or outlines must contrast with the page.
    const interfaceAccent = light ? readableVariant(rgb, BLACK, value => value <= .3) : controlEnd;
    return {
      accent: rgb.join(', '),
      hex: toHex(rgb),
      interfaceAccent: interfaceAccent.join(', '),
      interfaceHex: toHex(interfaceAccent),
      secondary: neonPartner(rgb).join(', '),
      controlEnd: controlEnd.join(', '),
      controlStart: controlEnd.map(channel => Math.round(channel * .55 + 255 * .45)).join(', '),
      base: base.join(', '),
      background: `rgb(${background.join(', ')})`,
      glowSecondary: mix(WHITE, rgb, .88).join(', '),
      glowTertiary: mix(WHITE, rgb, .96).join(', '),
      glowOpacity: String(strength * .4),
      glowSecondaryOpacity: String(strength * .27),
      glowTertiaryOpacity: String(strength * .24),
      border: `rgba(${mix([235, 235, 235], rgb, .15).join(', ')}, ${light ? .72 : .16})`
    };
  }

  /* Every registered theme receives the same validated color and controls. */
  function palette(value, tone = 'dark') {
    const settings = normalize(value);
    const rgb = accentChannels(settings);
    const controlEnd = readableVariant(rgb, WHITE, value => value >= .25);
    return themeDefinitions[settings.theme].palette(settings, tone, rgb, controlEnd);
  }

  return { api, storageKey, defaults, accents, themes, themeDefinitions, normalize, colorHex, palette };
})();
