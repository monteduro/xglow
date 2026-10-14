# XGlow

<img src="extension/icons/icon-128.png" width="96" height="96" alt="XGlow icon">

A liquid glass makeover for X. Same feed, a more personal look.

- **Glass throughout X.** Translucent cards, soft reflections and rounded surfaces across the feed, notifications, profile covers and Chat.
- **Your colors, your atmosphere.** Seven presets or any HEX color, with adjustable tint, blur and opacity. Changes apply instantly.
- **Pick a theme, then a color.** Liquid Glass and Cyberpunk Neon support all seven color presets and custom HEX colors. Neon derives a second accent from your selection; Cyberpunk HUD uses a fixed red and cyan palette. The settings panel always stays neutral.
- **A focused, centered feed.** Hide the right sidebar and give your timeline room to breathe. Bring it back with one toggle.
- **Threads stay connected.** Related posts share a glass frame; post-detail replies keep X’s familiar flow and connection lines.
- **Light or dark.** Follows X’s appearance, with a lightweight mode and reduced-motion support.
- **Local and private.** No analytics, external services, API keys or account actions. Settings stay on your device.
- **Open source, easy to install.** Load the extension directly in Chrome, with no build step or dependencies. Safari on macOS can be installed manually.

**[Download the latest release](https://github.com/monteduro/xglow/releases/latest)** · **[Installation instructions](#install)**

## Theme examples

Two color themes for the same extension. You can switch presets or choose your own HEX color in Appearance.

### Aurora theme

![X Home with the Aurora liquid glass theme](docs/screenshots/theme-aurora.png)

### Amber theme

![X notifications with the Amber liquid glass theme](docs/screenshots/theme-amber.png)

Screenshots show customized settings. The “Review” button in the Home image belongs to another extension.

Default appearance: **Amber**, **50% tint**, **10 px blur**, **0% glass opacity**. Reset restores these values; saved preferences take priority over defaults.

## Install

### Chrome

1. Open the [latest release](https://github.com/monteduro/xglow/releases/latest) and download the **`xglow-<version>.zip`** asset.
2. Extract the ZIP into a folder you will keep on your computer.
3. Open **`chrome://extensions`** in Chrome and enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the extracted folder containing **`manifest.json`**.
5. Reload your X tabs after saving any drafts.
6. Open **XGlow** from Chrome’s extensions menu to change colors, effects and sidebar visibility. Pin it to the toolbar for quick access.

**Installing from source instead?** Use **Code → Download ZIP** on this repository, extract it, and select its **`extension/`** folder in step 4.

No build step, account, API key or server is needed to use the extension. Chrome 111 or newer is required by the manifest.

Chrome Web Store publication is being prepared; there is no Store listing yet. Installation currently uses the GitHub release above.

### Safari (macOS)

Safari 16.4 or newer runs the same extension. There is no signed XGlow app and no App Store listing: Safari loads extensions permanently only from apps signed through the paid Apple Developer Program. Until then, Safari installs are manual and use Safari's developer settings.

**Temporary extension** (no Xcode needed):

1. Download **`xglow-safari-<version>.zip`** from the [latest release](https://github.com/monteduro/xglow/releases/latest), or build it from source with `npm run build:safari`, which creates `dist/xglow-safari-<version>.zip` and the folder `dist/safari/XGlow/`.
2. In Safari, open **Settings → Advanced** and select **Show features for web developers**.
3. Open **Settings → Developer** and select **Allow unsigned extensions**.
4. On the same tab, click **Add Temporary Extension…** and select the ZIP or the folder.
5. Open **Settings → Extensions**, select **XGlow** and allow it on `x.com`. Reload your X tabs.

Safari removes temporary extensions after 24 hours or when you quit Safari, and resets **Allow unsigned extensions** when it quits.

**Local app** (needs a source checkout, Node.js 20 or newer and Xcode):

1. Run `npm run build:safari -- --xcode`. This wraps the extension in an Xcode project in `dist/safari/xcode/`. Set `XGLOW_BUNDLE_ID` to choose the bundle identifier, and add `--ios` to also create an iPhone and iPad app.
2. Open the project in Xcode, select the macOS scheme and choose **Product → Run**.
3. Enable **XGlow** in **Safari → Settings → Extensions** and allow it on `x.com`. Without a development certificate, select **Allow unsigned extensions** first, as above, and again each time Safari restarts. The app stays installed.

To update, run `npm run build:safari` again, then build in Xcode (or reload the temporary extension). The Xcode project keeps its signing settings; add `--force` to recreate it.

### Privacy and Store

Read the [privacy policy](docs/PRIVACY.md). Store listing materials and submission notes are in [docs/store](docs/store/LISTING.md).

To update a local installation, replace its files, click **Reload** on the extension’s card, then reload X.

## Privacy

The extension requests only `storage` and runs only on the X/Twitter domains listed in its manifest. Preferences are stored with the extension's local storage (`chrome.storage.local`, or `browser.storage.local` in Safari).

The runtime processes page structure, interface colors, the current X route and limited interaction signals locally to apply CSS and preserve layout behavior. It does not persist page content or interaction histories, send analytics, make network requests, or perform account actions. X Chat styling is applied inside its open shadow roots. The [privacy policy](docs/PRIVACY.md) describes this local processing and the corresponding Store disclosures.

## Development

Development tools require Node.js 20 or newer. The extension runtime has no dependencies; browser tests use Playwright as a development dependency.

```sh
npm ci
npm run check
npm test
npm run build:preview
```

Launch the generated local demo through the **[unlocalhost CLI](https://github.com/monteduro/unlocalhost)**:

```sh
unlocalhost --yes setup . --slug xglow --features https,dev
unlocalhost up xglow
unlocalhost url xglow
```

The saved development command is `npm run dev`. It serves generated files from `public/` and uses the port provided by unlocalhost. `public/` is generated and excluded from Git.

See [Development](docs/DEVELOPMENT.md) for browser regression suites and DOM integration constraints, and [Contributing](CONTRIBUTING.md) for change guidelines.

## Create a theme

Themes use one shared registry, palette interface and neutral settings panel. Liquid Glass and Cyberpunk Neon support the common color picker; HUD uses a fixed palette and hides color controls. Adding a theme generates its card automatically; its stylesheet must also be listed in the manifest.

Follow the [theme contribution contract](docs/THEMES.md) for registration, palette tokens, CSS scope and required validation. Coding agents must read [AGENTS.md](AGENTS.md) before theme work. New themes preserve the shared layout, connected replies, Chat behavior and saved preferences.

To add a theme:

1. Register a stable theme ID and palette function in `extension/settings.js`. Declare whether it supports the shared color picker with `supportsAccent`.
2. Add a local stylesheet scoped to that theme ID and list it in `extension/manifest.json`, after `glass.css`.
3. Keep the settings panel neutral and preserve the shared layout, native media, connected replies and Chat behavior.
4. Validate the theme using the checks below and the [live review matrix](docs/THEMES.md#validation-and-pr-evidence).

Before opening a theme PR, install the test browser once and run the complete check from your registered unlocalhost checkout:

```sh
npx playwright install --only-shell chromium
npm run test:themes
```

The command runs source checks, Node tests, every registered theme in light/dark at three viewport sizes, settings behavior and the existing layout regressions. A failed check exits with an error. Screenshots, traces and an HTML report go to `artifacts/themes/` and stay out of Git. View the report with `npx playwright show-report artifacts/themes/report`. GitHub Actions runs the same checks and attaches the report to the workflow run.

## Open a pull request

1. Fork this repository, clone your fork and create a branch from the latest `main`, for example `feat/paper-theme`.
2. Run `npm ci`, follow [Contributing](CONTRIBUTING.md) and make a focused change. For themes, follow the contract above.
3. Run the required checks and inspect the report. Resolve failures; if an existing failure must remain unchanged, explain it explicitly. Never skip checks or weaken assertions to obtain a pass.
4. Commit source, tests and documentation, then push your branch to your fork. Keep generated reports, local files and private screenshots out of Git.
5. On GitHub, open a PR from your branch to **`monteduro/xglow:main`**. Include the change's purpose, theme ID, color support, checks actually run, sample-content screenshots in light/dark, and whether real X and Chat were verified.

Adding a theme does not require changing the version or creating a release.

## Package a release

```sh
npm run package
```

This requires the `zip` command and creates `dist/xglow-<version>.zip`. The archive contains extension files and the license, with `manifest.json` at its root. Tests, demos, screenshots and local notes are excluded.

`npm run build:safari` creates the Safari edition the same way, as `dist/xglow-safari-<version>.zip`. Its manifest replaces `minimum_chrome_version` with a Safari minimum version; all other files are identical.

## Compatibility

X changes its page structure regularly. Report layout problems with the affected route, viewport size and appearance settings; use sample content when possible. The effect uses CSS translucency and backdrop filters rather than physical glass refraction.

## License

[MIT](LICENSE). Independent project; not affiliated with X.
