#!/usr/bin/env node
// capture.js — 1280x800 screenshots van elke pagina naar thumbs/ (één klik + wachten eerst)
const fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');
(async () => {
  const dir = process.argv[2] || 'out', thumbs = process.argv[3] || 'thumbs';
  fs.mkdirSync(thumbs, { recursive: true });
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--use-gl=swiftshader'] });
  let n = 0;
  for (const f of files) {
    const out = path.join(thumbs, f.replace(/\.html$/, '.jpg'));
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    try {
      await page.goto('file://' + path.resolve(dir, f), { waitUntil: 'load', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1600));
      try { await page.mouse.click(640, 400); } catch {}
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: out, type: 'jpeg', quality: 72 });
    } catch (e) { console.log('FAIL', f, e.message.slice(0, 120)); }
    await page.close();
    if (++n % 20 === 0) console.log('…', n, '/', files.length);
  }
  await browser.close();
  console.log('screenshots klaar:', n);
})().catch(e => { console.error('CAPTURE CRASH:', e.message); process.exit(2); });
