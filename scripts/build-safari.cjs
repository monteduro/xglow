/* Builds the Safari edition of the extension.

   Always: stages extension/ with a Safari manifest in dist/safari/XGlow/ and
   zips it as dist/xglow-safari-<version>.zip. Recent macOS Safari versions can
   load either one through Settings > Developer > Add Temporary Extension.

   With --xcode (macOS with Xcode only): also wraps the staged folder in an
   Xcode project at dist/safari/xcode/ with Apple's converter. The project
   references the staged folder instead of copying it, so running this script
   again and building in Xcode picks up source changes without regenerating
   the project and losing its signing settings. Pass --force to regenerate,
   --ios to add an iOS app target, and set XGLOW_BUNDLE_ID to choose the bundle
   identifier of a new project. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { root, extension, extensionFiles } = require('./project.cjs');
const { safariManifest } = require('./safari.cjs');

const args = new Set(process.argv.slice(2));
for (const arg of args) {
  if (!['--xcode', '--force', '--ios'].includes(arg)) throw new Error(`Unknown option: ${arg}`);
}

execFileSync(process.execPath, [path.join(__dirname, 'check.cjs')], { stdio: 'inherit' });
const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'manifest.json'), 'utf8'));
const output = path.join(root, 'dist', 'safari');
const stage = path.join(output, manifest.name);
const archive = path.join(root, 'dist', `xglow-safari-${manifest.version}.zip`);

fs.rmSync(stage, { recursive: true, force: true });
const files = extensionFiles();
for (const name of files) {
  const target = path.join(stage, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (name === 'manifest.json') fs.writeFileSync(target, `${JSON.stringify(safariManifest(manifest), null, 2)}\n`);
  else fs.copyFileSync(path.join(extension, name), target);
}
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(stage, 'LICENSE'));
fs.rmSync(archive, { force: true });
execFileSync('zip', ['-X', '-q', archive, ...files, 'LICENSE'], { cwd: stage, stdio: 'inherit' });
console.log(`Staged ${path.relative(root, stage)} and created ${path.relative(root, archive)}.`);

if (args.has('--xcode')) {
  if (process.platform !== 'darwin') throw new Error('--xcode needs macOS with Xcode installed.');
  const project = path.join(output, 'xcode');
  if (fs.existsSync(project) && !args.has('--force')) {
    console.log(`Kept ${path.relative(root, project)}; build it in Xcode to pick up the new files.`);
  } else {
    const converter = [
      'safari-web-extension-converter', stage,
      '--project-location', project,
      '--app-name', manifest.name,
      '--swift', '--no-open', '--no-prompt', '--force'
    ];
    if (!args.has('--ios')) converter.push('--macos-only');
    if (process.env.XGLOW_BUNDLE_ID) converter.push('--bundle-identifier', process.env.XGLOW_BUNDLE_ID);
    execFileSync('xcrun', converter, { stdio: 'inherit' });
    console.log(`Created the Xcode project in ${path.relative(root, project)}.`);
  }
}
