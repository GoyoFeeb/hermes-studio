const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ env: { ...process.env } });
  const dir = 'newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/';
  const jobs = [
    { file: 'final-premium-v2.html', out: 'g8-light-600.png', width: 600, scheme: 'light' },
    { file: 'final-premium-v2.html', out: 'g8-dark-600.png', width: 600, scheme: 'dark' },
    { file: 'final-premium.html', out: 'g0-original-600.png', width: 600, scheme: 'light' },
  ];
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.width, height: 1200 }, colorScheme: j.scheme });
    await page.goto('file://' + process.cwd() + '/' + dir + j.file, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('nav warn:', e.message.slice(0,80)));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: dir + j.out, fullPage: true });
    console.log('ok', j.out);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
