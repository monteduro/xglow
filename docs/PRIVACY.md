# Privacy policy — XGlow

Last updated: October 13, 2026.

XGlow changes the appearance of X (formerly Twitter) in Chrome. It is an independent, open-source extension and is not affiliated with X Corp.

## Data on your device

The Safari edition uses the same code and behaves the same way. In Safari, preferences are stored in Safari's local extension storage (`browser.storage.local`), and references to Chrome below apply to Safari accordingly.

The extension saves appearance preferences in `chrome.storage.local`: whether the theme is enabled, the chosen color and tint, blur, opacity, card styling, lightweight mode and sidebar visibility. These settings remain in your Chrome profile. The extension does not sync them to a developer-operated service.

To apply its theme, XGlow processes website content locally: the structure, attributes, colors and geometry of X pages and Chat components, plus short interface labels used to identify controls. It does not extract post text, private-message contents, account details, credentials or payment information for collection or analysis.

XGlow also reads the current X page path to apply the appropriate layout. This is limited to the page on which its content script is running; it does not use Chrome's browsing-history API or build a record of visited pages.

For layout behavior, XGlow detects wheel, touch, pointer and navigation-key events to stop automatic post-position adjustments after the user interacts. It does not log keystrokes, typed text, pointer positions or interaction histories.

For Chrome Web Store disclosure purposes, these operations are local processing of **Website content**, **Web history** (the current X route only) and **User activity** (the interaction signals above). Page data and interaction signals are not persisted or transmitted. The only persistent data is the appearance preferences described above. Nothing is sent to the developer or another service.

## Limited use

XGlow uses locally processed page and interaction data only for its disclosed purpose: applying the visual theme and preserving the layout and scrolling behavior of X. Its use of this information adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is not sold, transferred, used for advertising or unrelated purposes, used for creditworthiness or lending decisions, or made available for people working on the project to read.

## No tracking or external services

The extension includes no analytics, advertising, telemetry or remotely executed code. It makes no network requests of its own. X and Chrome continue to operate under their own privacy policies; the extension does not change their data practices.

## Permissions

The `storage` permission is used only to save and restore appearance preferences. Content scripts run only on `x.com` and `twitter.com`, including their `www` subdomains, to style those pages. The extension does not request access to unrelated websites.

## Your controls

You can change or reset appearance settings in the extension popup, disable the theme or remove the extension in Chrome. Reset restores the default appearance. Uninstalling removes the extension's local storage from that Chrome profile.

## Contact and changes

For questions, open an issue at [the project repository](https://github.com/monteduro/xglow/issues). Issues are public, so do not include private messages, credentials or other sensitive information.

Changes to this policy will be published in this file with an updated date.
