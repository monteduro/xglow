/* Extension popup. Preferences are stored in the extension's local storage;
   open X tabs pick up every change live through storage.onChanged. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const FIELDS = ['enabled', 'tint', 'blur', 'opacity', 'lite', 'sidebar'];
  const UNITS = { tint: '%', blur: ' px', opacity: '%' };
  const MESSAGES = {
    saving: 'Saving…',
    saved: 'Saved on this device',
    saveFailed: 'Could not save. Please try again.',
    loadFailed: 'Could not load your preferences.',
    invalidHex: 'Enter a HEX color, e.g. #22c55e.'
  };

  const extensionApi = XGlow.api();
  const status = $('status');
  const hexInput = $('customHex');
  const swatches = [...document.querySelectorAll('[data-accent]')];
  const themes = Object.entries(XGlow.themeDefinitions).map(([id, theme]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.theme = id;
    button.setAttribute('aria-pressed', 'false');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', theme.icon);
    icon.append(path);
    const label = document.createElement('strong');
    label.textContent = theme.label;
    button.append(icon, label);
    $('themeOptions').append(button);
    return button;
  });
  const tabs = [...document.querySelectorAll('[data-settings-tab]')];
  const controls = [...document.querySelectorAll('input, button, select')];
  let settings = XGlow.normalize();
  let queue = Promise.resolve();

  const setDisabled = disabled => controls.forEach(control => { control.disabled = disabled; });

  function renderField(id) {
    const input = $(id);
    if (input.type === 'checkbox') input.checked = settings[id];
    else input.value = settings[id];
    if (input.type === 'range') {
      const min = Number(input.min), max = Number(input.max);
      input.style.setProperty('--progress', `${(settings[id] - min) / (max - min) * 100}%`);
    }
  }

  function render() {
    FIELDS.forEach(renderField);
    for (const [id, unit] of Object.entries(UNITS)) $(`${id}Value`).value = `${settings[id]}${unit}`;
    const supportsAccent = XGlow.themeDefinitions[settings.theme].supportsAccent;
    const colorOptions = $('colorOptions');
    colorOptions.classList.toggle('is-collapsed', !supportsAccent);
    colorOptions.inert = !supportsAccent;
    colorOptions.setAttribute('aria-hidden', String(!supportsAccent));
    $('customControls').hidden = settings.accent !== 'custom';
    $('customColor').value = settings.customColor;
    hexInput.value = settings.customColor;
    hexInput.removeAttribute('aria-invalid');
    for (const button of themes) button.setAttribute('aria-pressed', String(button.dataset.theme === settings.theme));
    for (const button of swatches) {
      button.setAttribute('aria-pressed', String(button.dataset.accent === settings.accent));
      button.style.setProperty('--swatch', XGlow.palette({ ...settings, theme: 'glass', accent: button.dataset.accent }).hex);
    }
  }

  // Writes are chained so a slower earlier write cannot overwrite a newer one.
  function save(patch) {
    settings = XGlow.normalize({ ...settings, ...patch });
    render();
    const snapshot = { ...settings };
    status.textContent = MESSAGES.saving;
    queue = queue.catch(() => {})
      .then(() => extensionApi.storage.local.set({ [XGlow.storageKey]: snapshot }))
      .then(() => { status.textContent = MESSAGES.saved; })
      .catch(() => { status.textContent = MESSAGES.saveFailed; });
  }

  function saveHex() {
    const color = XGlow.colorHex(hexInput.value);
    if (color) {
      save({ accent: 'custom', customColor: color });
      return;
    }
    hexInput.setAttribute('aria-invalid', 'true');
    status.textContent = MESSAGES.invalidHex;
  }

  setDisabled(true);

  function selectTab(selected) {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      $(tab.dataset.settingsTab).hidden = !active;
    }
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(tabs.indexOf(tab) + 1) % tabs.length];
      selectTab(next);
      next.focus();
    });
  }

  for (const id of FIELDS) {
    $(id).addEventListener('input', event => {
      const { type, checked, value } = event.target;
      save({ [id]: type === 'checkbox' ? checked : Number(value) });
    });
  }
  for (const button of themes) button.addEventListener('click', () => save({ theme: button.dataset.theme }));
  for (const button of swatches) button.addEventListener('click', () => save({ accent: button.dataset.accent }));
  $('customColor').addEventListener('input', event => save({ accent: 'custom', customColor: event.target.value }));
  hexInput.addEventListener('change', saveHex);
  hexInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    saveHex();
  });
  $('reset').addEventListener('click', () => save(XGlow.defaults));

  const version = extensionApi?.runtime?.getManifest?.().version;
  if (version) $('version').textContent = version;

  extensionApi.storage.local.get(XGlow.storageKey).then(stored => {
    settings = XGlow.normalize(stored[XGlow.storageKey]);
    render();
    setDisabled(false);
    requestAnimationFrame(() => document.body.classList.add('ready'));
  }).catch(() => {
    render();
    status.textContent = MESSAGES.loadFailed;
  });
})();
