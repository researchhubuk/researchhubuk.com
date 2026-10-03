const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
async function main(){
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost/researchhubuk/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('h1').count(),1);
 assert.equal(await page.locator('main section').count(),11);
 const original=fs.readFileSync(path.join(root,'content/original.html'),'utf8');
 const preservation=await page.evaluate(html=>{
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('sup').forEach(e=>e.remove());
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  const visible=normalize(document.body.textContent);
  const blocks=[...doc.querySelectorAll('h1,h2,h3,h4,p,li')].map(e=>normalize(e.textContent));
  const keep=blocks.filter(t=>t&&!t.startsWith('Type:')&&!t.startsWith('Meta ')&&!t.startsWith('===')&&!t.startsWith('Button:')&&!t.includes('make it card design'));
  return {checked:keep.length,missing:keep.filter(t=>!visible.includes(t))};
 },original);
 assert.deepEqual(preservation.missing,[],`Missing original text: ${preservation.missing.join(' | ')}`);
 const anchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>!document.getElementById(h.slice(1))));
 assert.deepEqual(anchors,[]);
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844],['small-mobile',320,740]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForTimeout(350);
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} overflow`);
  assert.deepEqual(await page.evaluate(()=>[...document.images].filter(i=>i.offsetParent!==null&&(!i.complete||!i.naturalWidth)).map(i=>i.src)),[],`${name} images failed`);
  await page.screenshot({path:path.join(root,`artifacts/${name}.png`),fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.navbar-toggler').click();
 await page.locator('#navigation').waitFor({state:'visible'});
 await page.locator('#navigation a[href="#subjects"]').click();
 await page.waitForTimeout(900);
 assert.equal(await page.locator('#navigation').isVisible(),false);
 await page.locator('.faq-list summary').first().click();
 assert.equal(await page.locator('.faq-list details').first().getAttribute('open'),'');
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.locator('[aria-label="Next slide"]').click();
 await page.waitForTimeout(800);
 assert.equal(await page.locator('.carousel-item.active img').getAttribute('src'),'assets/img/library.webp');
 await page.locator('#name').fill('Test Student');await page.locator('#email').fill('student@example.com');await page.locator('#subject').fill('Business');await page.locator('#deadline-input').fill('2026-12-01');await page.locator('#brief').fill('Undergraduate assignment, 2000 words, Harvard referencing.');
 const download=page.waitForEvent('download');await page.locator('#brief-form button').click();
 assert.equal((await download).suggestedFilename(),'research-hub-requirements.txt');
 assert.match(await page.locator('#form-status').textContent(),/Nothing has been submitted/);
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log(`PASS: ${preservation.checked} original content blocks retained; four viewport widths; local images; anchors; mobile menu; FAQs; slider; brief download; reduced motion; no JavaScript errors.`);
}
main().catch(e=>{console.error(e);process.exit(1)});
