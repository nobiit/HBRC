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
