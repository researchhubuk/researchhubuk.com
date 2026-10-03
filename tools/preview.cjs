const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://localhost/researchhubuk/',{waitUntil:'networkidle'});
 await page.screenshot({path:'artifacts/desktop-top.png'});
 await page.locator('#services').screenshot({path:'artifacts/services-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'artifacts/mobile-top.png'});
 await page.locator('#contact').screenshot({path:'artifacts/contact-mobile.png'});
 console.log(await page.locator('link[rel=canonical]').getAttribute('href'));
 console.log(await page.locator('meta[property="og:image"]').getAttribute('content'));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
