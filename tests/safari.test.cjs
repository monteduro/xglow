const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { root, extension, extensionFiles } = require('../scripts/project.cjs');
const { SAFARI_MIN_VERSION, safariManifest } = require('../scripts/safari.cjs');

const extensionFile = name => fs.readFileSync(path.join(extension, name), 'utf8');
const manifest = JSON.parse(extensionFile('manifest.json'));

test('the Safari manifest swaps only the browser version keys', () => {
  const original = structuredClone(manifest);
  const safari = safariManifest(manifest);
  assert.deepEqual(manifest, original, 'The Chrome manifest must not change');
  assert.equal('minimum_chrome_version' in safari, false);
  assert.deepEqual(safari.browser_specific_settings, { safari: { strict_min_version: SAFARI_MIN_VERSION } });
  const { browser_specific_settings: _safari, ...rest } = safari;
  const { minimum_chrome_version: _chrome, ...expected } = manifest;
  assert.deepEqual(rest, expected);
});

test('preferences use the `browser` API in Safari and `chrome` in Chrome', () => {
  const load = globals => {
    const context = vm.createContext({ ...globals });
    vm.runInContext(extensionFile('settings.js'), context);
    return context.XGlow.api();
  };
  const safari = { storage: { local: {} } };
  const chrome = { storage: { local: {} } };
  assert.equal(load({ browser: safari, chrome }), safari);
  assert.equal(load({ chrome }), chrome);
  // Some pages define an unrelated global `browser`; only an extension API counts.
  assert.equal(load({ browser: {}, chrome }), chrome);
});

test('runtime scripts reach extension APIs only through XGlow.api()', () => {
  for (const name of extensionFiles().filter(file => file.endsWith('.js') && file !== 'settings.js')) {
    assert.doesNotMatch(extensionFile(name), /\bchrome\s*[.?]/, `${name} must call XGlow.api()`);
  }
});

test('every backdrop filter also sets the -webkit- property that older Safari reads', () => {
  const stylesheets = manifest.content_scripts.flatMap(entry => entry.css || []);
  const sources = [...stylesheets, 'popup.css', 'content.js'].map(extensionFile).join('\n');
  const rules = sources.match(/\{[^{}]*backdrop-filter[^{}]*\}/g);
  assert.ok(rules.length > 0);
  for (const rule of rules) {
    const standard = [...rule.matchAll(/(?<!-webkit-)backdrop-filter:\s*([^;]+);/g)].map(match => match[1].trim());
    const prefixed = [...rule.matchAll(/-webkit-backdrop-filter:\s*([^;]+);/g)].map(match => match[1].trim());
    assert.deepEqual(prefixed, standard, rule);
  }
});

test('the Safari build stages exactly the runtime files with the Safari manifest', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-safari.cjs')], { stdio: 'pipe' });
  const stage = path.join(root, 'dist', 'safari', manifest.name);
  const archive = path.join(root, 'dist', `xglow-safari-${manifest.version}.zip`);
  const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
  assert.deepEqual(entries.sort(), [...extensionFiles(), 'LICENSE'].sort());
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(stage, 'manifest.json'), 'utf8')), safariManifest(manifest));
  for (const name of extensionFiles().filter(file => file !== 'manifest.json')) {
    assert.ok(fs.readFileSync(path.join(stage, name)).equals(fs.readFileSync(path.join(extension, name))), name);
  }
});
