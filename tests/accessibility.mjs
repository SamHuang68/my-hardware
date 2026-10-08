import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER_ENGINE || 'chromium';
assert.ok(['chromium', 'firefox', 'webkit'].includes(engine));
const output = new URL(`../qa/cross-engine/${engine}/accessibility/`, import.meta.url);
await mkdir(output, { recursive: true });
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4184';
let server;
let browser;
const report = [];
try {
  if (!process.env.BASE_URL) {
    server = spawn(process.execPath, ['scripts/serve.mjs'], {
      cwd:fileURLToPath(new URL('../',import.meta.url)),
      env:{...process.env,PORT:'4184'},stdio:['ignore','pipe','pipe']
    });
    await new Promise((resolve,reject)=>{
      server.once('error',reject);
      server.once('exit',code=>reject(Error(`Preview exited: ${code}`)));
      server.stdout.once('data',resolve);
    });
  }
  browser = await playwright[engine].launch({headless:true});
  const deviceName = engine === 'webkit' ? 'iPhone 13' : 'Pixel 7';
  const { defaultBrowserType, ...device } = playwright.devices[deviceName];
  const cases = [
    {name:engine==='firefox'?'phone-viewport':'mobile-touch',options:engine==='firefox'?{viewport:{width:390,height:844}}:device},
    {name:'text-spacing',options:{viewport:{width:320,height:740}}},
    {name:'reflow-400-equivalent',options:{viewport:{width:320,height:256}}}
  ];
  for(const item of cases) {
    const context=await browser.newContext({...item.options,reducedMotion:'no-preference'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(baseURL);
    await page.waitForFunction(()=>document.querySelector('#search-status').textContent.includes('23 of 23'));
    await page.evaluate(()=>{
      window.auditTouches=0;
      document.addEventListener('touchstart',()=>window.auditTouches++,{passive:true});
    });
    if(item.name==='text-spacing') await page.addStyleTag({content:'* { line-height:1.5!important; letter-spacing:.12em!important; word-spacing:.16em!important; } p { margin-bottom:2em!important; }'});
    if(item.name==='mobile-touch') await page.getByRole('button',{name:'Compute Nodes 3',exact:true}).tap();
    else await page.getByRole('button',{name:'Compute Nodes 3',exact:true}).click();
    assert.equal(await page.getByRole('article').count(),3);
    assert.equal(await page.getByRole('button',{name:'Compute Nodes 3',exact:true}).getAttribute('aria-pressed'),'true');
    assert.match(await page.getByRole('status').first().innerText(),/3 of 23/);
    const enSnapshot=await page.locator('body').ariaSnapshot();
    assert.match(enSnapshot,/- main:/);
    assert.match(enSnapshot,/- searchbox "Search hardware assets"/);
    assert.match(enSnapshot,/- heading .*\[level=1\]/);
    assert.match(enSnapshot,/- group "Asset category filters"/);
    await writeFile(new URL(`${item.name}-en.aria.txt`,output),enSnapshot);
    await page.getByRole('button',{name:'Switch to Traditional Chinese (切換至繁體中文)',exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hant');
    assert.equal(await page.getByRole('article').count(),3);
    assert.match(await page.getByRole('status').first().innerText(),/顯示 3 \/ 23/);
    const zhSnapshot=await page.locator('body').ariaSnapshot();
    assert.match(zhSnapshot,/- searchbox "搜尋硬體資產"/);
    assert.match(zhSnapshot,/- group "資產分類篩選"/);
    await writeFile(new URL(`${item.name}-zh.aria.txt`,output),zhSnapshot);
    const semantics=await page.evaluate(()=>({
      ids:[...document.querySelectorAll('[id]')].map(e=>e.id),
      invalidReferences:[...document.querySelectorAll('[aria-labelledby], [aria-describedby]')].flatMap(e=>
        [e.getAttribute('aria-labelledby'),e.getAttribute('aria-describedby')].filter(Boolean).join(' ').split(/\s+/).filter(id=>!document.getElementById(id))),
      liveRegions:[...document.querySelectorAll('[aria-live]')].map(e=>e.id),
      unnamedButtons:[...document.querySelectorAll('button')].filter(e=>!e.getAttribute('aria-label')&&!e.textContent.trim()).length,
      touchEvents:window.auditTouches
    }));
    assert.equal(new Set(semantics.ids).size,semantics.ids.length);
    assert.deepEqual(semantics.invalidReferences,[]);
    assert.deepEqual(semantics.liveRegions,['search-status','toast-hub']);
    assert.equal(semantics.unnamedButtons,0);
    if(item.name==='mobile-touch') assert.ok(semantics.touchEvents>0,'Synthetic touchstart must be observed');
    // Change the preference during the running session, not only at page creation.
    const motionBefore=await page.locator('.status-dot').evaluate(e=>getComputedStyle(e).animationDuration);
    await page.emulateMedia({reducedMotion:'reduce'});
    const motionAfter=await page.locator('.status-dot').evaluate(e=>getComputedStyle(e).animationDuration);
    assert.ok(parseFloat(motionBefore)>1);
    assert.ok(parseFloat(motionAfter)<0.001);
    await page.getByRole('searchbox',{name:'搜尋硬體資產'}).focus();
    await page.waitForFunction(()=>{
      const rect=document.querySelector('#asset-search').getBoundingClientRect();
      return rect.top>=document.querySelector('.site-header').getBoundingClientRect().bottom && rect.bottom<=innerHeight;
    },null,{timeout:2000});
    const searchGeometry=await page.getByRole('searchbox',{name:'搜尋硬體資產'}).evaluate(e=>({
      top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,
      headerBottom:document.querySelector('.site-header').getBoundingClientRect().bottom,height:innerHeight
    }));
    assert.ok(searchGeometry.top>=searchGeometry.headerBottom && searchGeometry.bottom<=searchGeometry.height,JSON.stringify(searchGeometry));
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    const geometry=await page.evaluate(()=>{
      const focus=document.activeElement.getBoundingClientRect();
      const header=document.querySelector('.site-header').getBoundingClientRect();
      const filter=document.querySelector('#filter-console').getBoundingClientRect();
      return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
        focusClass:document.activeElement.className,focusTop:focus.top,focusBottom:focus.bottom,
        obstructionBottom:Math.max(header.bottom,filter.bottom),filterPosition:getComputedStyle(document.querySelector('#filter-console')).position};
    });
    assert.equal(geometry.focusClass,'copy-spec-btn');
    assert.ok(geometry.scrollWidth<=geometry.width+1,JSON.stringify(geometry));
    assert.ok(geometry.focusTop>=geometry.obstructionBottom && geometry.focusBottom<=geometry.height,JSON.stringify(geometry));
    await page.screenshot({path:fileURLToPath(new URL(`${item.name}-focus.png`,output))});
    assert.deepEqual(errors,[]);
    report.push({engine,version:browser.version(),case:item.name,...(item.name==='mobile-touch'?{emulatedDevice:deviceName}:{}),geometry,searchGeometry,
      semantics:{liveRegions:semantics.liveRegions,duplicateIds:0,invalidReferences:0,unnamedButtons:0,touchEvents:semantics.touchEvents},motion:{before:motionBefore,after:motionAfter},pageErrors:errors});
    await context.close();
  }
  await writeFile(new URL('results.json',output),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {
  await browser?.close();
  server?.kill();
}
