const puppeteer = require('/home/suffie/html-lab/qwen38-flashnext-100-htmls/scripts/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome-stable', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
  await p.setViewport({width:1400,height:900});
  await p.goto('http://localhost:8178/index.html'); await new Promise(r=>setTimeout(r,1200));
  await p.click('a[data-open="001"]'); await new Promise(r=>setTimeout(r,1500));
  const st1 = await p.evaluate(()=>({on:document.getElementById('viewer').classList.contains('on'), src:document.getElementById('vframe').src, num:document.getElementById('vnum').textContent}));
  await p.click('#vnext'); await new Promise(r=>setTimeout(r,1200));
  const st2 = await p.evaluate(()=>({num:document.getElementById('vnum').textContent, src:document.getElementById('vframe').src}));
  await p.keyboard.press('Escape'); await new Promise(r=>setTimeout(r,300));
  const st3 = await p.evaluate(()=>document.getElementById('viewer').classList.contains('on'));
  console.log('open:', JSON.stringify(st1)); console.log('next:', JSON.stringify(st2)); console.log('esc gesloten:', st3===false); console.log('pageerrors:', errs.length?errs:'geen');
  await b.close();
})();
