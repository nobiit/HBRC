import puppeteer, { Browser, launch } from 'puppeteer-core';
import { Puppeteer, PuppeteerWindowPage, PuppeteerWindowPageOptions } from '@shared/types';
import { randomString } from 'shared/utils/random';
import { getLatestUserAgent } from 'main/utils';

export class PuppeteerHeadless implements Puppeteer {
  private browser?: Browser;
  private windowPageMap = new Map<string, Omit<PuppeteerWindowPage, 'identifier' | 'window'>>();
  private _isReady = false;

  constructor() {
  }

  async beforeAppReady(): Promise<void> {
    if (!puppeteer) {
      throw new Error('The parameter \'puppeteer\' was not passed in.');
    }

    if (!this.browser) {
      this.browser = await launch({
        headless: true,
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

  async newWindowPage(url: string, identifier?: string, options?: PuppeteerWindowPageOptions) {
    // TODO: implement show option
    const { show } = options || {};
    if (!identifier) identifier = randomString(30);
    // TODO: implement userAgent option
    const userAgent = options?.userAgent || getLatestUserAgent('windows', 'chrome');
    const page = await this.browser.newPage();
    this.windowPageMap.set(identifier, { page });
    await page.evaluate(`window.hbrcWindowId = '${identifier}'`);
    return { page, identifier };
  }

  async closeWindow(identifier: string) {
    const { page } = this.windowPageMap.get(identifier) || {};
    if (page) {
      page.close();
    }
  }

  getWindowPage(identifier: string) {
    return this.windowPageMap.get(identifier) || undefined;
  }
}
