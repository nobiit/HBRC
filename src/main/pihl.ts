/**
 * Provide a way to control browsers by puppeteer
 */

import puppeteer, { Browser, launch, Page } from 'puppeteer';
import { randomString } from '@shared/utils/random';
import { getLatestUserAgent } from '@main/utils';
import { PuppeteerElectron } from './pie';

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
    if (!this.browser) {
      this.browser = await launch({
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
    const { dataCookies } = await PuppeteerElectron.getSessionData(identifier);
    await browserContext.setCookie(...dataCookies);
    const page = await this.getBrowser().newPage();
    await page.setUserAgent(userAgent);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.evaluate(`window.hbrcWindowId = '${identifier}'`);
    this.pageMap.set(identifier, { page });
    return { page, identifier };
  }

  async closePage(identifier: string) {
    const { page } = this.pageMap.get(identifier) || {};
    if (page) {
      page.close();
    }
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
