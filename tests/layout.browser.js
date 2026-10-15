/* Runs in the layout fixture: geometry, surfaces, media and separators. */
(async () => {
  const checks = [];
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
    checks.push(message);
  };
  const settle = () => new Promise(resolve => setTimeout(resolve, 250));
  const root = document.documentElement;
  const nav = document.querySelector('.fixed-nav');
  const link = nav.querySelector('a');
  const content = document.querySelector('[data-testid="primaryColumn"] > div');
  const narrow = matchMedia('(max-width: 700px)').matches;
  const bounds = element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };

  await chrome.storage.local.set({ xGlass: { enabled: false } });
  await settle();
  const nativeNav = bounds(nav), nativeLink = bounds(link);
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
  const nativeDialogs = dialogs.map(bounds);
  await chrome.storage.local.set({ xGlass: {} });
  await settle();
  check(bounds(nav).width === nativeNav.width && bounds(nav).height === nativeNav.height, 'Navigation keeps its native width and height');
  check(bounds(link).height === nativeLink.height, 'Navigation links keep their height');
  link.focus();
  check(link.matches(':focus-visible') && getComputedStyle(link).outlineStyle === 'none' && getComputedStyle(link.firstElementChild).outlineStyle === 'solid', 'Keyboard focus rings the navigation pill, not the whole rail row');
  link.blur();
  const navInset = Number.parseFloat(getComputedStyle(nav, '::before').left);
  check(bounds(link).x - bounds(nav).x - navInset >= 8, 'Menu items have room inside the glass edge');
  check(JSON.stringify(dialogs.map(bounds)) === JSON.stringify(nativeDialogs), 'Dialogs keep native sizes and containing blocks');
  check(dialogs.every(dialog => getComputedStyle(dialog).backdropFilter === 'none'), 'Blur does not collapse the media viewer');
  check(nav.getBoundingClientRect().right <= document.querySelector('[data-testid="primaryColumn"]').getBoundingClientRect().left, 'Navigation does not cover the feed');
  check(getComputedStyle(document.querySelector('[data-xlg-composer]')).padding === '0px', 'The composer adds no padding to the native padding');
  const expectedSurface = `rgba(${XGlow.palette().base}, ${XGlow.defaults.opacity / 100})`;
  check(getComputedStyle(document.querySelector('[data-xlg-composer]')).backgroundColor === expectedSurface, 'A more specific selector does not cancel the composer surface');
  check(getComputedStyle(document.querySelector('[data-xlg-toolbar]')).backgroundColor === expectedSurface, 'The header surface is not cancelled');
  for (const selector of ['.native-toolbar-inner', '.composer-inner', '.composer-actions', '.suggestions', '.search-shell']) {
    check(getComputedStyle(document.querySelector(selector)).backgroundColor === 'rgba(0, 0, 0, 0)', `Opaque background removed: ${selector}`);
  }
  check(getComputedStyle(document.querySelector('.avatar')).backgroundColor === 'rgb(0, 0, 0)', 'The avatar background is preserved');
  check(getComputedStyle(document.querySelector('.photo')).backgroundColor === 'rgb(0, 0, 0)', 'The media background is preserved');
  check(getComputedStyle(document.querySelector('.cell-shell')).borderBottomColor === 'rgba(0, 0, 0, 0)', 'Cards show no second outer separator');
  check(!document.getElementById('footer-shell').hasAttribute('data-xlg-panel'), 'The footer is not mistaken for a panel');

  const sidebar = document.querySelector('[data-testid="sidebarColumn"]');
  check(getComputedStyle(sidebar).display === 'none', 'The right sidebar is hidden by default');
  const primary = document.querySelector('[data-testid="primaryColumn"]');
  check(Math.abs((nav.getBoundingClientRect().left + primary.getBoundingClientRect().right) / 2 - document.documentElement.clientWidth / 2) < 1, 'Menu and feed are centered together while the sidebar is hidden');
  check(primary.getBoundingClientRect().width === 600, 'The feed keeps its 600px width without the sidebar');
  check(getComputedStyle(nav).display !== 'none', 'Hiding the sidebar keeps the navigation menu');
  await chrome.storage.local.set({ xGlass: { sidebar: true } }); await settle();
  check(getComputedStyle(sidebar).display !== 'none' && sidebar.getBoundingClientRect().width > 0, 'The toggle restores the sidebar on open pages');
  check(JSON.stringify(bounds(nav)) === JSON.stringify(nativeNav), 'Showing the sidebar restores the native navigation position');
  await chrome.storage.local.set({ xGlass: { sidebar: false } }); await settle();
  check(getComputedStyle(sidebar).display === 'none', 'The toggle can hide the sidebar again');
  // Subscription keeps its account links in the sidebar column.
  const path = location.pathname, trigger = document.createElement('div');
  history.replaceState(null, '', '/i/premium'); content.append(trigger); await settle();
  check(getComputedStyle(sidebar).display !== 'none' && JSON.stringify(bounds(nav)) === JSON.stringify(nativeNav), 'Subscription pages show the sidebar with the native layout');
  history.replaceState(null, '', path); trigger.remove(); await settle();
  check(getComputedStyle(sidebar).display === 'none', 'Leaving Subscription hides the sidebar again');
  // Analytics, Grok or Settings render no sidebar and use its width themselves.
  const columns = primary.parentElement;
  sidebar.remove(); await settle();
  check(!root.hasAttribute('data-xlg-hide-sidebar') && JSON.stringify(bounds(nav)) === JSON.stringify(nativeNav), 'Pages without a sidebar keep the native layout');
  // Settings and Articles have neither column, only section regions.
  const regions = document.createElement('section');
  columns.append(sidebar); await settle();
  primary.replaceWith(regions); sidebar.remove(); await settle();
  check(!root.hasAttribute('data-xlg-hide-sidebar'), 'Section pages without columns keep the native layout');
  regions.replaceWith(primary);
  const spinner = document.createElement('div'); spinner.setAttribute('role', 'progressbar'); spinner.textContent = 'Loading…';
  columns.append(sidebar); await settle();
  primary.replaceWith(spinner); sidebar.remove(); await settle();
  check(root.hasAttribute('data-xlg-hide-sidebar'), 'A route spinner keeps the previous layout');
  spinner.replaceWith(primary); columns.append(sidebar); await settle();
  check(getComputedStyle(sidebar).display === 'none' && primary.getBoundingClientRect().width === 600, 'Pages with a sidebar hide it again');

  // Pages outside the timeline paint opaque backdrops and cards of their own.
  const page = document.createElement('div');
  page.innerHTML = '<div class="page-backdrop" style="background:rgb(0,0,0);min-height:200px"><div class="page-title" style="background:rgb(0,0,0);height:36px">Title</div><div class="page-card" style="background:rgb(20,20,20);border:1px solid rgb(47,51,54);border-radius:16px;height:80px"></div><div class="page-light" style="background:rgb(255,255,255);width:200px;height:60px"></div><div class="page-button" role="button" style="width:200px;height:60px"><div style="background:rgb(0,0,0);height:60px"></div></div><button class="page-metric" type="button" style="display:block;width:200px;padding:0;background:transparent"><div style="background:rgb(20,20,20);border:1px solid rgb(47,51,54);border-radius:20px;height:80px"></div></button><div class="page-recycled" style="height:60px"></div><div data-testid="cellInnerDiv"><div class="page-list-cell" role="link" style="height:72px;background:rgb(0,0,0)">List</div></div><div class="page-sticky" style="position:sticky;top:0;height:48px;background:rgb(0,0,0)"></div><a class="page-row" href="#row" style="display:block;height:48px">Row</a><button class="page-pill" type="button" style="display:block;width:200px;height:48px;background:rgb(255,255,255)">Upgrade</button></div>';
  content.append(page); await settle();
  const pageStyle = selector => getComputedStyle(page.querySelector(selector));
  check(pageStyle('.page-backdrop').backgroundColor === 'rgba(0, 0, 0, 0)' && pageStyle('.page-title').backgroundColor === 'rgba(0, 0, 0, 0)', 'Opaque page backdrops and title rows are cleared');
  check(pageStyle('.page-card').backgroundColor !== 'rgb(20, 20, 20)' && pageStyle('.page-card').borderTopColor !== 'rgb(47, 51, 54)' && pageStyle('.page-card').borderRadius === '16px' && pageStyle('.page-card').backdropFilter === 'none', 'Page cards become surfaces with their native shape and no blur');
  check(pageStyle('.page-light').backgroundColor === 'rgb(255, 255, 255)' && pageStyle('.page-button > div').backgroundColor === 'rgb(0, 0, 0)', 'Opposite-tone backdrops and flat control states keep their colors');
  check(page.querySelector('.page-sticky').hasAttribute('data-xlg-sticky') && pageStyle('.page-sticky').backdropFilter.includes('blur'), 'Sticky page headers blur the rows scrolling beneath them');
  check(page.querySelector('.page-list-cell').hasAttribute('data-xlg-row') && pageStyle('.page-list-cell').backgroundColor === 'rgba(0, 0, 0, 0)', 'Opaque list cells rest on the glass');
  check(page.querySelector('.page-row').hasAttribute('data-xlg-row') && !page.querySelector('.page-pill').hasAttribute('data-xlg-row'), 'List rows get the theme hover; opposite-tone pills keep their own');
  check(page.querySelector('.page-metric > div').hasAttribute('data-xlg-surface') && pageStyle('.page-metric > div').borderRadius === '20px', 'Clickable cards become surfaces with their native shape');
  // X swaps classes in place on route changes, together with other mutations.
  page.querySelector('.page-recycled').className = 'page-recycled suggestions'; page.append(document.createElement('div')); await settle();
  check(pageStyle('.page-recycled').backgroundColor === 'rgba(0, 0, 0, 0)', 'A recycled container that turns opaque is cleared');
  // Creator Studio styles arrive after its containers are rendered.
  const late = document.createElement('div'); late.className = 'late-surface'; late.style.height = '60px';
  page.append(late); await settle();
  const lateStyle = document.createElement('style'); lateStyle.textContent = '.late-surface { background: rgb(0, 0, 0); }';
  document.head.append(lateStyle); await settle();
  check(late.hasAttribute('data-xlg-clear'), 'Containers styled by a late stylesheet are judged again');
  lateStyle.remove();
  page.remove();
  // Creator Studio renders its own app root without a sticky header.
  const studio = document.createElement('div'); studio.className = 'jetfuel-style-root';
  content.append(studio); await settle();
  check(getComputedStyle(studio).paddingTop === '14px', 'Creator Studio titles get the header inset');
  studio.remove();
  const tokens = getComputedStyle(document.querySelector('main'));
  check(tokens.getPropertyValue('--x-bg-secondary').trim().startsWith('rgba(') && tokens.getPropertyValue('--x-bg-tertiary').trim() === getComputedStyle(root).getPropertyValue('--xlg-hover').trim(), 'Analytics design tokens map to the theme inside the page');
  await chrome.storage.local.set({ xGlass: { enabled: false } }); await settle();
  check(getComputedStyle(sidebar).display !== 'none', 'Disabling the extension restores native visibility');
  await chrome.storage.local.set({ xGlass: {} }); await settle();

  const toolbar = document.querySelector('[data-xlg-toolbar]');
  check(bounds(toolbar).y >= 12, 'The header has an initial top margin');

  // Inline "Show N posts" row: one action, aligned with the cards, native height.
  const newPostsCell = document.getElementById('new-posts-fixture');
  const newPosts = newPostsCell.querySelector('button');
  const card = document.querySelector('article[data-testid="tweet"]').getBoundingClientRect();
  const inset = narrow ? '6px' : '10px';
  check(newPosts.hasAttribute('data-xlg-new-posts') && getComputedStyle(newPosts).borderRadius === '16px' && getComputedStyle(newPosts).marginLeft === inset, 'The new-posts row gets an inset, rounded surface');
  check(Math.abs(newPosts.getBoundingClientRect().left - card.left) < 1 && Math.abs(newPosts.getBoundingClientRect().right - card.right) < 1 && newPosts.getBoundingClientRect().height === 48, 'The new-posts row aligns with the cards and keeps its native height');
  check(getComputedStyle(newPostsCell.firstElementChild).borderBottomColor === 'rgba(0, 0, 0, 0)', 'The new-posts row loses the native separator');
  // The visible pill keeps the gap between consecutive cards on both sides.
  const row = newPosts.getBoundingClientRect(), pillStyle = getComputedStyle(newPosts, '::before');
  const pill = { top: row.top + parseFloat(pillStyle.top), bottom: row.bottom - parseFloat(pillStyle.bottom) };
  const composerBox = document.querySelector('[data-xlg-composer]').getBoundingClientRect();
  const cardStyle = getComputedStyle(document.querySelector('article[data-testid="tweet"]'));
  const cardGap = parseFloat(cardStyle.marginTop) + parseFloat(cardStyle.marginBottom);
  check(pill.top - composerBox.bottom === cardGap && card.top - pill.bottom === cardGap, 'The new-posts pill is spaced like the cards above and below');
  const label = newPosts.firstElementChild ? newPosts.firstElementChild.getBoundingClientRect() : null;
  check(label && Math.abs((label.top + label.bottom) / 2 - (pill.top + pill.bottom) / 2) < 1, 'The new-posts label is centered in the pill');
  const recycled = document.createElement('a'); recycled.href = '#recycled'; newPostsCell.firstElementChild.append(recycled); await settle();
  check(!newPosts.hasAttribute('data-xlg-new-posts'), 'A recycled cell with other content loses the new-posts marker');
  recycled.remove(); await settle();
  check(newPosts.hasAttribute('data-xlg-new-posts'), 'The marker returns when the cell is a new-posts row again');

  // Mention suggestions open inside the composer, over the timeline.
  const mentions = document.createElement('div');
  mentions.setAttribute('role', 'listbox'); mentions.style.cssText = 'position:absolute;width:300px;height:120px;background:rgb(0,0,0);border-radius:4px';
  mentions.innerHTML = '<div role="option" aria-selected="true"><div class="mention-active" role="presentation" style="height:60px;background:rgb(22,24,28)"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></div></div>';
  document.querySelector('[data-xlg-composer]').append(mentions); await settle();
  check(mentions.hasAttribute('data-xlg-popup') && getComputedStyle(mentions).backgroundColor !== 'rgba(0, 0, 0, 0)' && getComputedStyle(mentions).backgroundColor !== 'rgb(0, 0, 0)', 'Mention suggestions get an opaque themed surface');
  const activeMention = getComputedStyle(mentions.querySelector('.mention-active')).backgroundColor;
  const mentionAccent = getComputedStyle(root).getPropertyValue('--xlg-ui-accent-rgb').split(',').map(channel => channel.trim()).join(', ');
  check(activeMention === `rgba(${mentionAccent}, 0.15)`, 'The selected suggestion is highlighted with the accent tint, not an opaque bar');
  mentions.remove();

  // Profile cover: aligned with the header and cards, only the link is clipped.
  const cover = document.createElement('a');
  cover.href = '/example/header_photo'; cover.style.cssText = 'display:block;position:relative;height:120px';
  content.insertBefore(cover, document.querySelector('.composer')); await settle();
  check(getComputedStyle(cover).marginLeft === inset && getComputedStyle(cover).borderRadius === (narrow ? '18px' : '22px') && getComputedStyle(cover).overflow === 'hidden', 'The profile cover follows the card grid and radius');
  check(getComputedStyle(cover, '::after').pointerEvents === 'none', 'The cover border does not intercept clicks');
  cover.remove();

  content.append(document.getElementById('notification-fixture').content.cloneNode(true));
  await settle();
  const notification = document.querySelector('article[data-testid="notification"]');
  const tweet = document.querySelector('article[data-testid="tweet"]');
  check(['backgroundColor', 'borderRadius', 'padding', 'margin', 'backdropFilter'].every(property => getComputedStyle(notification)[property] === getComputedStyle(tweet)[property]), 'Aggregated notifications and posts get the same glass card');
  check(getComputedStyle(document.querySelector('.notification-shell')).borderBottomColor === 'rgba(0, 0, 0, 0)', 'Aggregated notifications keep no outer separators');

  content.append(document.getElementById('unread-notification-fixture').content.cloneNode(true));
  await settle();
  const unread = document.querySelector('.unread-notification');
  const hovered = document.querySelector('.hovered-notification');
  const accent = getComputedStyle(root).getPropertyValue('--xlg-ui-accent-rgb').split(',').map(channel => channel.trim()).join(', ');
  const tinted = element => getComputedStyle(element).backgroundImage.startsWith(`linear-gradient(rgba(${accent}, 0.16)`);
  check(unread.hasAttribute('data-xlg-unread') && !hovered.hasAttribute('data-xlg-unread'), 'Only X\'s accent tint marks a notification as unread, not the gray hover overlay');
  check(tinted(unread) && !tinted(hovered) && !tinted(notification), 'Unread notifications keep an accent tint on the card surface');
  check(getComputedStyle(unread).borderTopColor !== getComputedStyle(hovered).borderTopColor, 'Unread notifications have an accent border');
  unread.classList.remove('r-1eltapf'); await settle();
  check(!unread.hasAttribute('data-xlg-unread') && !tinted(unread), 'A notification seen in place loses the unread tint');
  unread.classList.add('r-1eltapf'); await settle();

  // Centered modal: blurred, tinted page behind a themed panel with translucent sticky bars.
  document.body.append(document.getElementById('modal-fixture').content.cloneNode(true));
  await settle();
  const modalPanel = document.querySelector('.modal-panel'), mask = document.querySelector('[data-testid="mask"]');
  check(modalPanel.hasAttribute('data-xlg-modal') && getComputedStyle(modalPanel).borderRadius === '24px' && getComputedStyle(modalPanel).backgroundColor.endsWith('0.94)'), 'Centered modals get the themed surface');
  check(getComputedStyle(mask).backdropFilter.includes('blur') && getComputedStyle(mask).backgroundColor !== 'rgba(0, 0, 0, 0.5)', 'The page behind a modal is blurred and tinted');
  const modalHeader = getComputedStyle(document.querySelector('.modal-header'));
  check(document.querySelector('.modal-header').hasAttribute('data-xlg-modal-bar') && document.querySelector('.modal-toolbar').hasAttribute('data-xlg-modal-bar') && modalHeader.backgroundColor === 'rgba(0, 0, 0, 0)' && modalHeader.backdropFilter.includes('blur'), 'Sticky modal bars add no band and blur the content beneath them');
  check(getComputedStyle(document.querySelector('.modal-body')).backgroundColor === 'rgba(0, 0, 0, 0)' && getComputedStyle(document.querySelector('[data-testid="UserAvatar-Container-modal"]')).backgroundColor === 'rgb(0, 0, 0)', 'Opaque modal wrappers are cleared; avatar backdrops stay');
  document.querySelector('#layers').append(document.getElementById('viewer-fixture').content.cloneNode(true));
  await settle();
  check(!document.querySelector('.viewer-panel').hasAttribute('data-xlg-modal') && getComputedStyle(document.querySelector('.viewer-panel')).backgroundColor === 'rgba(0, 0, 0, 0.9)', 'Full-screen viewers keep their native look');
  await chrome.storage.local.set({ xGlass: { lite: true } }); await settle();
  const liteBar = getComputedStyle(document.querySelector('.modal-toolbar'));
  check(getComputedStyle(mask).backdropFilter === 'none' && liteBar.backdropFilter === 'none' && liteBar.backgroundColor === getComputedStyle(root).getPropertyValue('--xlg-base').replace(/^\s*(.*?)\s*$/, 'rgb($1)').replace(/,\s*/g, ', '), 'Lightweight mode drops modal blurs and paints the bars like the panel');
  await chrome.storage.local.set({ xGlass: { enabled: false } }); await settle();
  check(getComputedStyle(modalPanel).backgroundColor === 'rgb(20, 20, 20)' && getComputedStyle(mask).backgroundColor === 'rgba(0, 0, 0, 0.5)', 'Disabling the theme restores native modals');
  await chrome.storage.local.set({ xGlass: {} }); await settle();
  document.querySelector('#layers').remove();
  // Premium nests its rounded panel, Spaces opens a sheet dialog without
  // aria-modal and profile hover cards float over the page.
  const floating = document.createElement('div'); floating.id = 'layers';
  floating.innerHTML = '<div role="dialog" aria-modal="true" style="position:fixed;inset:0"><div><div class="nested-panel" role="dialog" style="width:400px;height:120px;border-radius:24px;background:rgb(20,20,20)"></div></div></div><div><div class="sheet-mask" data-testid="mask" style="position:fixed;inset:0;background:rgba(0,0,0,.5)"></div></div><div class="sheet-panel" data-testid="sheetDialog" style="width:400px;height:120px;border-radius:16px;background:rgb(0,0,0)"></div><div class="hover-card" data-testid="HoverCard" style="width:300px;height:120px;border-radius:16px;background:rgb(20,20,20)"></div>';
  document.body.append(floating); await settle();
  check(['.nested-panel', '.sheet-panel', '.hover-card'].every(selector => floating.querySelector(selector).hasAttribute('data-xlg-modal') && getComputedStyle(floating.querySelector(selector)).backgroundColor !== 'rgb(20, 20, 20)'), 'Nested, sheet and hover-card panels get the themed modal surface');
  check(getComputedStyle(floating.querySelector('.sheet-mask')).backdropFilter.includes('blur'), 'The mask of a sheet in another layer is blurred and tinted');
  floating.remove();

  const backgroundSize = getComputedStyle(root).backgroundSize;
  const spacer = document.createElement('div'); spacer.style.height = '5000px'; content.append(spacer);
  window.scrollTo(0, innerHeight + 800); await settle();
  check(bounds(toolbar).y === 12, 'The header keeps its top margin while scrolling');
  check(getComputedStyle(root).backgroundSize === backgroundSize && backgroundSize.split(',').every(size => size.trim() === `${innerWidth}px ${innerHeight}px`), 'The background stays viewport-sized as the list grows');
  check(getComputedStyle(root).backgroundAttachment.split(',').every(value => value.trim() === 'fixed'), 'Every background layer stays fixed while scrolling');
  check(document.body.getBoundingClientRect().bottom < 0 && getComputedStyle(document.body).backgroundImage === 'none' && getComputedStyle(root).backgroundImage.includes('radial-gradient'), 'Glows are painted on the page canvas and stay visible when body is off screen');
  window.scrollTo(0, 0); spacer.remove();

  await chrome.storage.local.set({ xGlass: { lite: true } });
  await settle();
  check(getComputedStyle(nav, '::before').backdropFilter === 'none', 'Lightweight mode also disables blur in the navigation');
  check(getComputedStyle(notification).backdropFilter === 'none', 'Lightweight mode also applies to aggregated notifications');
  check(tinted(unread) && !tinted(notification), 'Lightweight mode keeps the unread tint');
  await chrome.storage.local.set({ xGlass: { cards: false } }); await settle();
  check(getComputedStyle(notification).backdropFilter !== 'none' && getComputedStyle(notification).borderRadius === '22px', 'The retired cards preference cannot disable notification surfaces');
  await chrome.storage.local.set({ xGlass: {} });
  await settle();
  check(root.hasAttribute('data-xlg'), 'Theme restored after the checks');
  return checks;
})()
