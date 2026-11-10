#!/usr/bin/env node
// smoke.js — laadt elke pagina headless, vangt console-fouten en meet of het canvas pixels tekent
const fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = '/usr/bin/google-chrome-stable';
(async () => {
  const dir = process.argv[2] || '.';
  const out = process.argv[3] || 'smoke.json';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--use-gl=swiftshader'] });
  const results = [];
  for (const f of files) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0,200)));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0,200)); });
    try {
      await page.goto('file://' + path.resolve(dir, f), { waitUntil: 'load', timeout: 15000 });
      await new Promise(r => setTimeout(r, 1200));
      // tekenen beide canvassen en body-achtergrond?
      const probe = await page.evaluate(() => {
        const cs = [...document.querySelectorAll('canvas')];
        let painted = false, nonBlank = false;
        for (const c of cs) {
          if (c.width > 0 && c.height > 0) {
            painted = true;
            try {
              const cv = document.createElement('canvas'); cv.width = Math.min(220, c.width); cv.height = Math.min(160, c.height);
              const ctx = cv.getContext('2d');
              ctx.drawImage(c, 0, 0, cv.width, cv.height);
              const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
              let min = 255, max = 0;
              for (let i = 0; i < d.length; i += 40) { const v = (d[i]+d[i+1]+d[i+2])/3; if (v<min) min=v; if (v>max) max=v; }
              if (max - min > 12) nonBlank = true;
            } catch(e) { nonBlank = true; } // getImageData op WebGL canvassen gooit — getekend canvas telt dan
          }
        }
        const bodyInk = document.body.scrollHeight > 200 || document.querySelectorAll('svg, img, [style*="background"]').length > 0;
        return { canvasCount: cs.length, painted, nonBlank, bodyInk };
      });
      results.push({ f, ok: errors.length === 0 && (probe.nonBlank || (probe.canvasCount === 0 && probe.bodyInk)), errors, probe });
    } catch (e) {
      results.push({ f, ok: false, errors: ['goto: ' + e.message.slice(0,150)] });
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify(results, null, 1));
  const bad = results.filter(r => !r.ok);
  console.log(`ok: ${results.length - bad.length}/${results.length}`);
  bad.slice(0,20).forEach(r => console.log('FOUT', r.f, JSON.stringify(r.errors.slice(0,2)), JSON.stringify(r.probe||{}).slice(0,120)));
})().catch(e => { console.error('SMOKE CRASH:', e.message); process.exit(2); });
