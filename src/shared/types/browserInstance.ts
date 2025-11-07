import type { BrowserWindow } from 'electron';
import type { Page } from 'puppeteer-core';

export type BrowserInstanceInstruction = {
  command: 'browserEval' | 'page';
  pageCommand?: string;
  args: any[];
};

export type BrowserInstanceStatus = 'Running' | 'Stopped' | 'Starting' | 'Stopping';

export type BrowserInstanceMessage = {
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
};

export enum InstanceType {
  PuppeteerElectron = 'PUPPETEER_ELECTRON',
  PuppeteerExternal = 'PUPPETEER_EXTERNAL',
}

export type BrowserInstance = {
  sessionId: string;
  name: string;
  url: string;
  type: InstanceType,
  status?: BrowserInstanceStatus;
  initInstructions?: BrowserInstanceInstruction[];
  userAgent?: string;
  attributes?: Record<string, string>;
  [key: string]: any;
};

export type PuppeteerWindowPageOptions = {
  show?: boolean;
  hideOnClose?: boolean;
  userAgent?: string;
};

export type PuppeteerWindowPage = {
  window?: BrowserWindow;
  page: Page;
  identifier: string;
}

export interface Puppeteer {
  beforeAppReady(): Promise<void>;

  afterAppReady(): Promise<void>;

  newWindowPage(url: string, identifier?: string, options?: PuppeteerWindowPageOptions): Promise<PuppeteerWindowPage>;

  closeWindow(sessionId: string): Promise<void>;

  getWindowPage(sessionId: string): Omit<PuppeteerWindowPage, 'identifier'> | undefined;
}
