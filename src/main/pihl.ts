/**
 * Provide a way to control browsers by puppeteer
 */

import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import SessionPlugin, { StorageProviderName } from 'puppeteer-extra-plugin-session';
import { randomString } from '@shared/utils/random';
import { getLatestUserAgent } from '@main/utils';
import * as fs from 'node:fs';

export class PuppeteerHeadless {
  private pageMap = new Map<string, { page: Page }>();
  private _isReady = false;
  private browser?: Browser;

  constructor() {
  }

  async beforeAppReady(): Promise<void> {
    if (!puppeteer) {
      throw new Error('The parameter \'puppeteer\' was not passed in.');
    }
    puppeteer.use(SessionPlugin());
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        executablePath: puppeteer.executablePath(),
        headless: false,
      });
    }
  }

  isReady() {
    return this._isReady;
  }

  async afterAppReady(): Promise<void> {
    this._isReady = true;
  }

  getBrowser() {
    if (!this.browser) {
      throw new Error('Please call connect before calling getBrowser.');
    }
    return this.browser;
  }

  async newPage(
    url: string,
    identifier?: string,
    options?: {
      userAgent?: string;
    },
  ) {
    const userAgent = options?.userAgent || getLatestUserAgent('windows', 'chrome');
    if (!identifier) identifier = randomString(30);
    const browserContext = await this.getBrowser().createBrowserContext();
    // const { dataCookies } = await PuppeteerElectron.getSessionData(identifier);
    // await browserContext.setCookie(...dataCookies);
    const page = await this.getBrowser().newPage();
    await page.setUserAgent(userAgent);
    page.on('framenavigated', (ev) => {
      ev.url()
    });
    try {
      const r = JSON.parse(fs.readFileSync(`./data/${identifier}.json`).toString());
      await page.goto(`view-source:${url}`);
      await page.session.restore(r);
    } catch (e) {
      console.error(e);
    }
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.evaluate(`window.hbrcWindowId = '${identifier}'`);
    this.pageMap.set(identifier, { page });
    return { page, identifier };
  }

  async closePage(identifier: string) {
    const { page } = this.pageMap.get(identifier) || {};
    if (page) {
      const b = await page.session.dump({ storageProviders: [StorageProviderName.Cookie, StorageProviderName.LocalStorage] });
      fs.writeFileSync(`./data/${identifier}.json`, JSON.stringify(b));
      page.close();
    }
    this.pageMap.delete(identifier);
  }

  private async getPage(identifier: string) {
    const browser = this.getBrowser();
    const pages = await browser.pages();
    for (const page of pages) {
      if ((await page.evaluate('window.hbrcWindowId')) === identifier) return page;
    }
    return null;
  }
}
