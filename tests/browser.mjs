import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Reuse an installed Playwright via PLAYWRIGHT_MODULE, or resolve the local package.
const playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER_ENGINE || 'chromium';
assert.ok(['chromium', 'firefox', 'webkit'].includes(engine), `Unknown browser engine: ${engine}`);
const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL(`../qa/cross-engine/${engine}/`, import.meta.url);
await mkdir(output, { recursive: true });
let server;
let browser;
const report = [];
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4183';
const assets = '.node-card, .boundary-item, .display-card, .compact-asset, .power-card';
const visibleCount = page => page.locator(`${assets.split(', ').map(s=>`${s}:visible`).join(', ')}`).count();
const screenshot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(name, output)), fullPage: false });
async function ready(page) {
  await page.goto(baseURL);
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('23 of 23'));
}
async function assertLayout(page) {
  const layout = await page.evaluate(() => {
    const header = document.querySelector('.site-header').getBoundingClientRect();
    const filter = document.querySelector('#filter-console').getBoundingClientRect();
    return { headerBottom: header.bottom, filterTop: filter.top, filterBottom: filter.bottom,
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
  });
  assert.ok(layout.scrollWidth <= layout.width + 1, JSON.stringify(layout));
  assert.ok(layout.filterTop >= layout.headerBottom - 1, JSON.stringify(layout));
  return layout;
}
try {
  if (!process.env.BASE_URL) {
    server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: {...process.env, PORT:'4183'}, stdio:['ignore','pipe','pipe'] });
    await new Promise((resolve,reject) => {
      server.once('error',reject);
      server.once('exit',code=>reject(Error(`Preview exited: ${code}`)));
      server.stdout.once('data',resolve);
    });
  }
  browser = await playwright[engine].launch({
    ...(engine === 'chromium' && process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {}),
    headless:true
  });
  report.push({engine, version:browser.version()});
  for (const [width,height] of [[320,740],[390,844],[768,1024],[1440,1000],[640,450],[320,256]]) {
    const page = await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await ready(page);
    await page.keyboard.press('Tab');
    const firstTabTarget = await page.evaluate(()=>document.activeElement.id);
    const linksSkippedByDefault = engine === 'webkit' && firstTabTarget === 'languageToggle';
    if (linksSkippedByDefault) {
      // This Windows WebKit build skips links in its default Tab policy.
      // Verify the skip target separately without claiming full link traversal.
      assert.equal(firstTabTarget, 'languageToggle');
      await page.locator('#skip-link').focus();
    } else assert.equal(firstTabTarget,'skip-link');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#main-content');
    if (!linksSkippedByDefault) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'hero-btn-compute');
    }
    await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.locator(assets).count(),23);
    assert.equal(await visibleCount(page),23);
    await screenshot(page,`${width}x${height}-top.png`);
    await page.locator('#chip-power').click();
    assert.equal(await visibleCount(page),3);
    assert.equal(await page.locator('#chip-power').getAttribute('aria-pressed'),'true');
    await page.waitForTimeout(100);
    const enLayout=await assertLayout(page);
    await screenshot(page,`${width}x${height}-power.png`);
    await page.locator('#asset-search').fill('no-such-device-xyz');
    assert.equal(await visibleCount(page),0);
    assert.match(await page.locator('#search-status').innerText(),/No matching assets/);
    await page.locator('#reset-filters').click();
    assert.equal(await visibleCount(page),23);
    assert.equal(await page.locator('#asset-search').evaluate(e=>e===document.activeElement),true);
    await page.locator('#asset-search').fill('DDR5');
    assert.ok(await visibleCount(page)>0);
    await page.locator('#languageToggle').click();
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-Hant');
    assert.equal(await page.locator('#search-clear').getAttribute('aria-label'),'清除搜尋');
    assert.equal(await page.locator('#asset-search').inputValue(),'DDR5');
    await page.locator('#asset-search').press('Escape');
    assert.equal(await visibleCount(page),23);
    const zhLayout=await assertLayout(page);
    await screenshot(page,`${width}x${height}-zh-results.png`);
    // Native button keyboard operation, with a visible focus ring.
    await page.locator('#chip-all').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'chip-compute');
    await page.keyboard.press('Space');
    assert.equal(await visibleCount(page),3);
    assert.equal(await page.locator('#chip-compute').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'chip-boundaries');
    await page.keyboard.press('Enter');
    assert.equal(await visibleCount(page),3);
    // Navigation reveals a section hidden by category selection.
    await page.locator('#nav-compute').click();
    await page.waitForTimeout(100);
    assert.equal(await visibleCount(page),23);
    const titleTop=await page.locator('#compute-title').evaluate(e=>e.getBoundingClientRect().top);
    const stickyBottom=await page.evaluate(()=>Math.max(
      document.querySelector('.site-header').getBoundingClientRect().bottom,
      document.querySelector('#filter-console').getBoundingClientRect().bottom
    ));
    assert.ok(titleTop>=stickyBottom,`Title covered: ${titleTop}/${stickyBottom}`);
    await page.locator('#chip-compute').click();
    await page.locator('#asset-search').focus();
    await page.keyboard.press('Tab'); // reset filters
    await page.keyboard.press('Tab'); // first copy button
    await page.waitForTimeout(100);
    const focused = await page.evaluate(()=>({
      name:document.activeElement.className,
      top:document.activeElement.getBoundingClientRect().top,
      bottom:document.activeElement.getBoundingClientRect().bottom,
      stickyBottom:Math.max(document.querySelector('.site-header').getBoundingClientRect().bottom,document.querySelector('#filter-console').getBoundingClientRect().bottom),
      height:innerHeight
    }));
    assert.equal(focused.name,'copy-spec-btn');
    assert.ok(focused.top>=focused.stickyBottom && focused.bottom<=focused.height,JSON.stringify(focused));
    assert.deepEqual(errors,[]);
    report.push({viewport:{width,height},enLayout,zhLayout,assets:23,filterSearchKeyboard:'passed',navigationTitleTop:titleTop,firstTabTarget});
    await page.close();
  }
  const page = await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedSpecs=text;}}}));
  await ready(page);
  await page.locator('.copy-spec-btn').first().click();
  assert.match(await page.locator('.toast').last().innerText(),/Specifications copied/);
  assert.match(await page.evaluate(()=>window.copiedSpecs),/CPU:/);
  for (const [button,extension] of [['#export-json-btn','json'],['#export-md-btn','md']]) {
    const downloadPromise=page.waitForEvent('download');
    await page.locator(button).click();
    const download=await downloadPromise;
    const contents=await readFile(await download.path(),'utf8');
    assert.ok(download.suggestedFilename().endsWith(`.${extension}`));
    if(extension==='json') assert.deepEqual(JSON.parse(contents),JSON.parse(await readFile(new URL('../data.json',import.meta.url),'utf8')));
    else assert.match(contents,/## Power Layer/);
  }
  await page.close();
  const denied=await browser.newPage();
  await denied.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}}}));
  await ready(denied);
  await denied.locator('.copy-spec-btn').first().click();
  assert.match(await denied.locator('.toast').last().innerText(),/Copy failed/);
  await denied.close();
  const retry=await browser.newPage({viewport:{width:390,height:844}});
  let requests=0;
  await retry.route('**/data.json',route=>++requests===1?route.fulfill({status:503,body:'Unavailable'}):route.continue());
  await retry.goto(baseURL);
  await retry.locator('#retry-load').waitFor({state:'visible'});
  assert.equal(await retry.locator('#export-json-btn').isDisabled(),true);
  assert.equal(await retry.locator('#asset-search').isDisabled(),true);
  assert.equal(await retry.locator('.loading-state').count(),0);
  await retry.locator('#languageToggle').click();
  assert.match(await retry.locator('#search-status').innerText(),/暫時無法讀取/);
  await retry.locator('#retry-load').scrollIntoViewIfNeeded();
  await screenshot(retry,'mobile-load-error.png');
  await retry.locator('#retry-load').focus();
  await retry.keyboard.press('Enter');
  await retry.waitForFunction(()=>document.querySelector('#search-status').textContent.includes('23 / 23'));
  assert.equal(await visibleCount(retry),23);
  assert.equal(await retry.locator('#asset-search').evaluate(e=>e===document.activeElement),true);
  assert.equal(await retry.locator('#export-json-btn').isDisabled(),false);
  report.push({copySuccess:true,copyDeniedIsHonest:true,exports:['JSON data equal','Markdown complete'],loadFailureRetry:'passed',requests});
  await retry.close();
  await writeFile(new URL('results.json',output),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {
  await browser?.close();
  server?.kill();
}
