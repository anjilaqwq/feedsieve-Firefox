export interface ChromeSidePanelApi {
  open?: (options: { windowId: number }) => Promise<void>;
  close?: (options: { windowId: number }) => Promise<void>;
  setPanelBehavior?: (options: { openPanelOnActionClick: boolean }) => Promise<void>;
  setOptions?: (options: { enabled?: boolean; path?: string; windowId?: number }) => Promise<void>;
}

export interface FirefoxSidebarActionApi {
  open?: () => Promise<void>;
}

export type BrowserSidePanel =
  | { browser: 'chrome'; api: ChromeSidePanelApi }
  | { browser: 'firefox'; api: FirefoxSidebarActionApi };

/**
 * Safe accessor for chrome.sidePanel API without DOM or React dependencies.
 */
export function getChromeSidePanel(): ChromeSidePanelApi | undefined {
  if (typeof globalThis !== 'undefined') {
    const glob = globalThis as unknown as {
      chrome?: {
        sidePanel?: ChromeSidePanelApi;
      };
    };
    return glob.chrome?.sidePanel;
  }
  return undefined;
}

/** Return the browser-specific sidebar API behind one small discriminated union. */
export function getBrowserSidePanel(): BrowserSidePanel | undefined {
  const chromeApi = getChromeSidePanel();
  if (chromeApi?.open) return { browser: 'chrome', api: chromeApi };

  if (typeof globalThis !== 'undefined') {
    const glob = globalThis as unknown as {
      browser?: { sidebarAction?: FirefoxSidebarActionApi };
    };
    const firefoxApi = glob.browser?.sidebarAction;
    if (firefoxApi?.open) return { browser: 'firefox', api: firefoxApi };
  }
  return undefined;
}
