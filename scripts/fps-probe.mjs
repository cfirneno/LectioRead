import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';

const url = process.argv[2];
const seconds = Number(process.argv[3] || 15);
const killBlur = !!process.env.KILL_BLUR;
const chromium = execSync('which chromium').toString().trim();

const browser = await puppeteer.launch({
  executablePath: chromium,
  headless: 'new',
  protocolTimeout: 120000,
  args: [
    '--no-sandbox', '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=angle', '--use-angle=swiftshader',
    '--mute-audio', '--hide-scrollbars', '--window-size=1920,1080',
  ],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  window.startRecording = () => Promise.resolve();
  window.stopRecording = () => {};
});
try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { console.log('goto', e.message); }
await new Promise((r) => setTimeout(r, 1500));
if (killBlur) {
  await page.addStyleTag({ content: '*{filter:none!important;backdrop-filter:none!important}' });
  console.log('blur killed');
}
const client = await page.target().createCDPSession();
let count = 0;
client.on('Page.screencastFrame', (f) => {
  count++;
  client.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await client.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1 });
const t0 = Date.now();
await new Promise((r) => setTimeout(r, seconds * 1000));
const dt = (Date.now() - t0) / 1000;
try { await client.send('Page.stopScreencast'); } catch {}
console.log(`PAINT: ${count} frames in ${dt.toFixed(1)}s = ${(count / dt).toFixed(1)} fps  (killBlur=${killBlur})`);
await browser.close();
process.exit(0);
