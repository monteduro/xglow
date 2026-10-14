# Chrome Web Store submission

This file contains ready-to-use English listing copy and permission explanations. It is not a record of an approved or published Chrome Web Store item.

## Listing

**Name:** XGlow

**Summary:** A liquid glass look for X. Local preferences, no external services.

**Language:** English

**Category:** Social Media & Networking. The extension customizes X, a social media platform. See [Google's category definitions](https://developer.chrome.com/docs/webstore/best-practices#choose_your_extensions_category_well).

**Homepage:** https://github.com/monteduro/xglow

**Support:** https://github.com/monteduro/xglow/issues

**Privacy policy:** https://github.com/monteduro/xglow/blob/main/docs/PRIVACY.md

### Detailed description

Give X a liquid glass look with translucent cards, soft reflections and rounded surfaces. Keep your familiar feed and make its appearance your own.

• Pick a theme: Liquid Glass, Cyberpunk Neon or Cyberpunk HUD.
• Choose from seven color presets or enter any HEX color. Cyberpunk HUD keeps its fixed red and cyan palette.
• Adjust tint, blur and glass opacity independently.
• Hide the right sidebar for a focused, centered timeline, or bring it back with one toggle.
• Enjoy themed styling across Home, notifications, Explore and search, profile covers, menus, dialogs and Chat, with unread notifications still easy to spot.
• Keep connected timeline posts together in one frame and preserve the familiar flow of post-detail replies.
• Follow X's light or dark appearance, with an optional lightweight mode.

The listing images show two example color themes, Aurora and Amber, for the same extension. Switch between presets in Appearance or create your own palette.

Changes apply instantly from the extension's Appearance panel. Defaults are Amber, 50% tint, 10 px blur and 0% glass opacity. Reset returns to those defaults.

Your preferences stay on your device. No analytics, ads, external services or separate account are required. The extension does not post, reply, follow accounts or send messages for you.

XGlow is free and open source under the MIT license. It is independently developed and is not affiliated with X Corp. X may change its website, which can occasionally require theme updates.

## Privacy practices

### Single purpose

Customize the visual appearance of X (formerly Twitter) with locally configured themes, including colors, glass effects and sidebar layout.

### Storage permission justification

The storage permission saves appearance preferences in chrome.storage.local and restores them when the popup or an X page opens. No page content or account data is stored.

### Site access justification

Content scripts must run on x.com and twitter.com, including their www subdomains, to apply CSS and identify the page elements that need styling. All processing happens locally. The extension does not request unrelated site access or transmit page content.

### Remote code

No remote code is used. All JavaScript and CSS are included in the extension package. The extension makes no network requests of its own.

### Data collection

XGlow locally processes website structure, interface labels, colors and geometry to apply its visual theme. It reads the current X page path to select the correct layout, and detects wheel, touch, pointer and navigation-key signals to stop automatic post-position adjustments after user interaction. Page data and interaction signals are not persisted or transmitted. Only appearance preferences are saved locally. No data is sent to the developer or third parties.

**Data usage categories:** Website content; Web history (current X route only, not browser-history access or a history log); User activity (local interaction signals only, no keystroke or interaction logging).

The other categories are not used for data collection. The three Limited Use certifications match the current implementation: no sale or transfer, no use for unrelated purposes, and no creditworthiness or lending use.

The publisher must review the dashboard's exact disclosure and certification wording before submitting. Local page access should be described consistently with this policy.

## Reviewer test instructions

1. Install the extension and open https://x.com using the reviewer's own X account, if X requires sign-in. The extension itself has no account, login or paid features.
2. Open the extension popup. Check the default Amber color, 50% tint, 10 px blur and 0% opacity.
3. Change a preset or choose Custom and enter a HEX color. Adjust effects; the page updates immediately.
4. Enable and disable Right sidebar. The timeline remains centered when that column is hidden.
5. Browse Home, notifications, a profile, a post with replies and Chat. The extension only changes presentation.
6. Click Reset to restore defaults. Switch XGlow off to restore X's native appearance.

No developer credentials or access to a personal account are required or provided.

## Upload files

- Extension ZIP: build with `npm run package`; upload the versioned archive in `dist/`.
- Store icon: `extension/icons/icon-128.png`.
- Small promotional tile: `docs/store/promo-440x280.png`.
- Marquee promotional tile: `docs/store/marquee-1400x560.png` (optional).
- Aurora theme screenshot: `docs/store/theme-aurora-1280x800.png`.
- Amber theme screenshot: `docs/store/theme-amber-1280x800.png`.
- Cyberpunk Neon theme screenshot: `docs/store/theme-cyberpunk-neon-1280x800.png`.

Promotional tiles and screenshots are exported as 24-bit RGB PNGs with no alpha channel. Extension icons retain transparent padding.

The screenshots show the same extension with two Liquid Glass colors, Aurora and Amber, and the Cyberpunk Neon theme in the Rose color. They use the owner-supplied images already published in the README with customized settings. The underlying captures are Home and notifications, but the listing presents the themes and palettes. The Review button in the Aurora and Cyberpunk Neon images belongs to another extension and is not a feature of XGlow.

To regenerate the committed artwork, install ImageMagick and run `npm run build:store`. This optional export is separate from extension packaging and does not add a runtime dependency.

## Submission state

The XGlow 0.3.0 package and these revised materials are prepared locally. They have not been uploaded or submitted by the project automation. There is no public Chrome Web Store listing yet. GitHub availability does not imply Store approval.

The current prepared package is XGlow 0.3.0, with the approved abstract glass-loop icon. If an earlier draft was uploaded, replace its package, name, description, URLs and Store images before submitting.

Official references: [publish](https://developer.chrome.com/docs/webstore/publish), [images](https://developer.chrome.com/docs/webstore/images), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
