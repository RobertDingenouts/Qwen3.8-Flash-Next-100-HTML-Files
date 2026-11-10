const puppeteer = require('./node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome-stable', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,100)));
  await p.setViewport({width:1380,height:900});
  await p.goto('http://localhost:8178/index.html'); await new Promise(r=>setTimeout(r,1200));
  const res = await p.evaluate(()=>{
    document.querySelectorAll('details').forEach(d=>d.open=true);
    const t=document.body.innerText;
    return {quot:(t.match(/&quot;/g)||[]).length, entiteiten:(t.match(/&#\w+/g)||[]).length, dubbelamp:(t.match(/&amp;/g)||[]).length, promptLabel:(t.match(/Prompt: /g)||[]).length};
  });
  console.log('entiteiten in beeld (moet 0,0,0 zijn):', JSON.stringify(res));
  console.log('pageerrors:', errs.length?errs:'geen');
  await b.close();
})();
