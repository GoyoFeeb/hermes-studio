const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const dir = 'newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/';
  for (const [out, scheme] of [['g8fix-light-600.png','light'], ['g8fix-dark-600.png','dark']]) {
    const page = await browser.newPage({ viewport: { width: 600, height: 1200 }, colorScheme: scheme });
    await page.goto('file://' + process.cwd() + '/' + dir + 'final-premium-v2.html', { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: dir + out, fullPage: true });
    console.log('ok', out);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
