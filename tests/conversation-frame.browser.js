/* Grouping, resizing and recycled cells in X's virtualized timeline. */
(async () => {
  const checks = [];
  const check = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
  // Resize work runs in the frame after a ResizeObserver callback, and frames
  // can take longer than the timeout in software-rendered WebKit.
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const wait = () => new Promise(resolve => setTimeout(resolve, 120)).then(nextFrame).then(nextFrame).then(nextFrame);
  const primary = document.querySelector('[data-testid="primaryColumn"] > div');
  const group = document.getElementById('reply-fixture').content.firstElementChild.cloneNode(true);
  primary.append(group);
  await chrome.storage.local.set({ xGlass: {} }); await wait();
  const cells = [...group.children];
  const surface = () => getComputedStyle(group.querySelector('[data-xlg-conversation]'), '::before');
  const surfaceHeight = () => Number.parseFloat(surface().height);
  check(group.querySelectorAll('[data-xlg-conversation]').length === 1 && surface().borderRadius === '22px', 'Two posts share one frame with rounded corners');
  check(surface().backdropFilter.includes('blur') && surface().pointerEvents === 'none', 'The glass surface does not intercept clicks');
  check(surfaceHeight() === group.getBoundingClientRect().height - 14, 'The frame covers both posts with top and bottom margins');

  const middle = cells[1].cloneNode(true);
  middle.querySelector('.avatar-rail').append(cells[0].querySelector('.reply-down').cloneNode(true));
  cells[1].before(middle); await wait();
  check(group.querySelectorAll('[data-xlg-conversation]').length === 1 && group.querySelectorAll('[data-xlg-connected]').length === 3, 'Three connected posts stay in a single frame');
  const oldHeight = surfaceHeight();
  middle.querySelector('article').style.minHeight = '340px'; await wait();
  check(surfaceHeight() > oldHeight + 100, 'The frame follows a post or media height change');

  cells[0].remove(); await wait();
  check(middle.getAttribute('data-xlg-conversation') === 'open-round' && surface().borderTopLeftRadius === '0px', 'Virtualization does not invent a conversation start');
  cells[1].remove(); await wait();
  check(middle.getAttribute('data-xlg-conversation') === 'open-open' && surface().borderBottomLeftRadius === '0px', 'A middle fragment keeps both edges open');
  middle.querySelectorAll('.r-m5arl1').forEach(line => line.remove()); await wait();
  check(!middle.hasAttribute('data-xlg-connected') && !middle.hasAttribute('data-xlg-conversation') && !middle.style.getPropertyValue('--xlg-conversation-height'), 'A recycled cell does not keep the old frame');

  group.replaceChildren(...cells); await wait();
  const secondGroup = document.getElementById('reply-fixture').content.firstElementChild.cloneNode(true);
  group.append(...secondGroup.children); await wait();
  check(group.querySelectorAll('[data-xlg-conversation]').length === 2, 'Two adjacent conversations get two separate frames');

  // Reproduce X's virtualization: absolute cells positioned with translateY.
  const mounted = [...group.children];
  const heights = mounted.map(cell => cell.getBoundingClientRect().height);
  group.style.position = 'relative';
  let offset = 0;
  mounted.forEach((cell, index) => {
    cell.style.cssText = `position:absolute;width:100%;transform:translateY(${offset}px)`;
    offset += heights[index];
  });
  group.style.height = `${offset}px`; await wait();
  const nativeTransform = cells[0].style.transform;
  check(cells[0].style.transform === nativeTransform && getComputedStyle(cells[0]).position === 'absolute' && surfaceHeight() === heights[0] + heights[1] - 14, 'The frame follows absolute cells without changing their transforms');
  cells[1].style.transform = `translateY(${heights[0] + 35}px)`; await wait();
  check(surfaceHeight() === heights[0] + heights[1] + 35 - 14, 'A translateY update from X realigns the frame');

  await chrome.storage.local.set({ xGlass: { lite: true } }); await wait();
  check(surface().backdropFilter === 'none' && surface().backgroundColor.includes('0.88'), 'Lightweight mode keeps the frame without blur');
  await chrome.storage.local.set({ xGlass: { cards: false } }); await wait();
  check(group.querySelector('[data-xlg-conversation]') && surface().backdropFilter !== 'none', 'The retired cards preference cannot disable conversation frames');
  await chrome.storage.local.set({ xGlass: { enabled: false } }); await wait();
  check(!group.querySelector('[data-xlg-conversation]') && getComputedStyle(cells[0].querySelector('article')).padding === '0px 16px', 'Disabling the extension restores native spacing');
  group.remove(); await chrome.storage.local.set({ xGlass: {} }); await wait();
  return checks;
})()
