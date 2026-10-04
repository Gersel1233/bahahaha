import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
// the site's own folder is the film's public folder, so the picture is the same file
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('../ny') });
const opts = { serveUrl, browserExecutable: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', chromiumOptions: { gl: 'swiftshader' }, chromeMode: 'chrome-for-testing' };
const composition = await selectComposition({ ...opts, id: process.env.COMP || 'Phone' });
for (const f of process.argv.slice(2).map(Number)) {
  await renderStill({ ...opts, composition, frame: f, output: path.resolve('fr', 'still-' + f + '.png'), scale: 1 });
  console.log('still', f);
}
