/* Safari reads the same Manifest V3 extension as Chrome. Only the browser
   version keys differ: Safari ignores `minimum_chrome_version` and uses
   `browser_specific_settings.safari` instead. */

// Oldest Safari with every web feature the runtime relies on: :has() (15.4),
// container queries and overflow: clip (16.0), and stable MV3 popups (16.4).
const SAFARI_MIN_VERSION = '16.4';

function safariManifest(manifest) {
  const { minimum_chrome_version: _chrome, ...rest } = manifest;
  return {
    ...rest,
    browser_specific_settings: {
      ...rest.browser_specific_settings,
      safari: { strict_min_version: SAFARI_MIN_VERSION }
    }
  };
}

module.exports = { SAFARI_MIN_VERSION, safariManifest };
