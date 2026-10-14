# Development

## Source layout

| Directory | Purpose |
| --- | --- |
| `extension/` | Directly loadable Chrome extension, also used for Safari: manifest, runtime, styles and settings popup |
| `tests/` | Node tests, synthetic DOM fixtures and browser regression suites |
| `scripts/` | Preview builder, local server, source checks and release packaging |
| `scripts/preview/` | Sample content, demo styles and a local Chrome storage adapter |
| `public/` | Generated demo and browser runners; ignored by Git |
| `dist/` | Generated release archives, the staged Safari extension and its Xcode project; ignored by Git |

The extension itself has no build step. The preview builder reads the manifest and uses the actual extension CSS and JavaScript, replacing Chrome storage with a local browser adapter. Demo preferences never affect the installed extension.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run check` | Check JavaScript syntax, manifest assets, matching versions and obvious private-data patterns |
| `npm test` | Run Node tests |
| `npm run test:themes` | Run source, Node and headless Chromium theme checks; save an HTML report and sample screenshots |
| `npm run build:preview` | Generate the demo, popup preview, layout fixture and browser runners |
| `npm run dev` | Build and serve previews on the provided `PORT` |
| `npm run package` | Validate sources and create an extension-only ZIP with its license |
| `npm run build:safari` | Stage the Safari edition in `dist/safari/XGlow/` and create its ZIP; add `-- --xcode` on macOS to create the Xcode project |

Use unlocalhost to launch and expose the project:

```sh
unlocalhost --yes setup . --slug xglow --features https,dev
unlocalhost up xglow
unlocalhost status xglow
unlocalhost url xglow
```

For an already registered project, inspect its saved process and endpoint before changing the configuration. The extension does not use this development server at runtime.

## Browser regression suites

After building and starting the demo, open the following paths on its local URL. Each page appends a `#test-result` JSON block with `passed` and either `checks` or `error`.

| Page | Coverage |
| --- | --- |
| `/layout.test.html` | Main layout, native surfaces, media, sidebar preferences and fixed background |
| `/centering.test.html` | Navigation/feed centering in real iframe viewports: 1920, 1000, 700 and 390 px |
| `/navigation-thread.test.html` | SPA navigation, connected posts and detail reply flow |
| `/conversation-frame.test.html` | Shared conversation frame, virtualized/recycled cells and resized media |
| `/search.test.html` | Search field, dropdown clipping, focus and theme restoration |
| `/chat.test.html` | Open shadow roots, chat layout, drafts and remounts using sample messages |
| `/compact-nav.test.html` | Compact dock dimensions, alignment and active routes |
| `/reply-composer.test.html` | Closed/expanded reply composer, draft preservation and native media backgrounds |
| `/post-spacing.test.html` | Initial author visibility and respect for user scrolling |

Run suites in separate tabs. The centering suite creates child fixtures and shares the demo storage key, so run it independently from interactive settings changes. Other runners use isolated storage keys.

The synthetic fixtures catch layout regressions without using real account content. Also inspect changed selectors on the corresponding X route because X may update its DOM independently of the fixtures.

## Automated theme checks

Install development dependencies with `npm ci`, then the browser once with `npx playwright install --only-shell chromium`. Run `npm run test:themes` from a checkout registered with unlocalhost. The runner discovers that checkout's registration and uses its loopback upstream; it starts the saved process if stopped, without changing the registration. An explicit `XGLOW_TEST_BASE_URL` can target an existing local synthetic fixture server. CI uses a temporary loopback fixture server instead of a developer registration.

The Playwright suite discovers theme IDs from the actual registry. It covers light/dark appearance at 1440, 700 and 390 px, all presets and extreme custom colors, rendered post/author/button contrast, effect limits, sidebar-hidden centering, search hit testing, notifications, connected replies, Chat shapes/drafts, disabled restoration and neutral popup behavior. The settings suite also runs with reduced motion. Existing browser runners execute in a separate regression project.

Reports are written to `artifacts/themes/report` (HTML) and `artifacts/themes/report.json`; failure screenshots and traces are retained under `artifacts/themes/results`. Representative screenshots use sample fixture content only. Open the report with `npx playwright show-report artifacts/themes/report`. For a focused rerun, pass Playwright arguments through the command, for example `npm run test:themes -- --project=settings`.

Contrast assertions use rendered text/control colors against the palette's opaque surface values. They catch numeric contrast regressions, but are not pixel-level analysis of every translucent gradient or proof of visual quality on real X. Report failures as failures, including pre-existing ones; do not turn them into skipped checks.

## Safari

Safari runs the files in `extension/` unchanged. Only the manifest differs: `scripts/safari.cjs` removes `minimum_chrome_version` and adds `browser_specific_settings.safari.strict_min_version`. Keep these rules so both browsers work:

- Call extension APIs through `XGlow.api()`. It returns `browser` in Safari and `chrome` in Chrome. A test fails when runtime code uses `chrome.` directly.
- Write every `backdrop-filter` declaration together with `-webkit-backdrop-filter`, including `none` resets. Safari before version 18 reads only the prefixed property, and the resets must also clear the prefixed property on native X surfaces. A test checks each rule.
- The minimum Safari version is 16.4 (`:has()`, container queries, `overflow: clip`). Raise `SAFARI_MIN_VERSION` in `scripts/safari.cjs` when a change needs a newer feature.

The browser regression suites also run in WebKit, for example with Playwright's WebKit build. Software-rendered WebKit can take more than 100 ms per frame, so suites wait for rendered frames, not only for timeouts.

## Integration constraints

- Theme overrides are gated by the root `data-xlg` attribute so disabling the extension restores native appearance.
- The settings namespace is `XGlow`. The storage key `xGlass` and DOM markers `data-xlg-*` remain stable across the rebrand so existing installations retain their preferences.
- The `theme` preference (`glass`, `cyberpunk` or `hud`) selects the look. `cyberpunk.css` and `hud.css` load after `glass.css` and are gated by `data-xlg-cyber` and `data-xlg-hud`; they reuse the glass markers and palette properties, and `settings.js` returns the matching palette. Rules that override `glass.css` repeat its selector with one more attribute. Chat's shadow-root styles follow the `data-xlg-chat-square` and `data-xlg-chat-hud` host attributes. Saved `cyberpunk: true` values migrate to `theme: 'cyberpunk'`.
- Theme and accent are independent preferences: selecting either preserves the other. The popup generates its theme cards from `XGlow.themeDefinitions` and shares one color picker across every theme. HUD uses a fixed red/cyan palette, with darker teal in light mode for text contrast, and declares `supportsAccent: false`; selecting it collapses the color controls while retaining the saved accent. Popup typography, surfaces and controls stay neutral.
- Card surfaces are part of every enabled theme. The retired `cards` preference is ignored during normalization; the internal `data-xlg-cards` marker follows the extension's enabled state. Post-detail replies still use their native connected flow.
- HUD panels are chamfered with `clip-path`, which hides the border on the cut: the diagonal is painted by the `--xlg-surface` background instead. Anything that can hold search suggestions (the search field, toolbars and panels containing it) keeps square corners and `--xlg-surface-flat`, because a clip would cut its dropdown.
- Virtualized cells keep their native position, transforms and heights. Conversation backgrounds span the relevant cells without inserting layout wrappers.
- Fixed navigation, fullscreen image viewers and dropdowns must retain their native containing blocks. Applying a backdrop filter to the wrong ancestor can change positioning.
- X paints the blue tint of unread notifications on the article itself, through a hashed atomic class that the card surface replaces. The runtime reads the class colors from X's own stylesheet rules, marks articles with a translucent non-gray background as `data-xlg-unread` (the hover overlay is gray), and removes the marker when X drops the class in place. Card backgrounds put `var(--xlg-card-tint)` above their surface; unread cards set it to an accent tint.
- Centered modals in `#layers` (compose, settings dialogs) are a rounded `aria-modal` panel next to a full-screen `mask`. The runtime marks only panels narrower than the viewport with rounded corners, so the media viewer and full-screen dialogs stay native. The mask gets the backdrop blur because it has no descendants; the panel itself has no backdrop filter. Sticky bars inside it are cleared to a transparent blur, since they are narrower than the panel.
- Post-detail replies keep native connection lines and flow. Glass surfaces apply to the composer and permission notices rather than each reply.
- Search suggestion surfaces must be identified before native background cleanup, and allowed to extend outside toolbar bounds.
- Column search headers (Explore, search results): X fixes the row and its single-child wrappers at 53px and offsets the field, settings and back buttons unevenly. The runtime marks that row and wrappers so the row can grow to an even 8px inset around the field, the buttons and the tabs. The tabs below the field use inset pills instead of full-height highlights; Cyberpunk Neon and HUD opt out and keep their own tab treatment. The opaque shell around the suggestions holds result avatars, so it is cleared explicitly rather than by the media-preserving cleanup.
- X Chat uses open shadow roots. Injected styling is local to each host, follows preferences and is restored if removed.
- Initial post-anchor correction stops after user interaction. Never reset scroll during ordinary browsing.
- Selectors should use semantic roles or stable test IDs where possible; keep necessary native class selectors documented.

## Adding a theme

Follow the canonical [theme contribution contract](THEMES.md). It covers registration, color capabilities, palette tokens, CSS scope, Chat shapes and the validation matrix. Repository instructions for coding agents are in [AGENTS.md](../AGENTS.md).

## Release preparation

Keep the version consistent across `extension/manifest.json`, `package.json` and the popup version label. Run source checks, Node tests and relevant browser suites before packaging.

Generated pages, release output, screenshots and private working notes are ignored. Packaging includes only the contents of `extension/` plus `LICENSE`; no account-specific fixture or local artifact belongs in the ZIP.

GitHub Actions runs source checks, Node tests, preview generation, packaging and the Safari staging build on Node 20 and 24. A separate Chromium job runs `npm run test:themes` and uploads its report even when tests fail. Creating the Xcode project needs macOS and is not part of CI. Real-X inspection remains a separate validation step.
