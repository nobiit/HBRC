import { launch } from 'puppeteer';

// const b = await launch({ headless: true });
await Promise.all(new Array(10).fill(0).map(async (_, i) => {
  console.log(`Starting ${i}`);
  const b = await launch({ headless: true });
  const c = await b.createBrowserContext();
  const p = await c.newPage();
  await p.goto('https://doopage.com');
  console.log(`Done ${i}`);
}));
