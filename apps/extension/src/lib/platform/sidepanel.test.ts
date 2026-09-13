import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBrowserSidePanel } from './sidepanel';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getBrowserSidePanel', () => {
  it('uses the Chromium sidePanel API when available', () => {
    const open = vi.fn();
    vi.stubGlobal('chrome', { sidePanel: { open } });
    vi.stubGlobal('browser', { sidebarAction: { open: vi.fn() } });

    const result = getBrowserSidePanel();

    expect(result).toEqual({ browser: 'chrome', api: { open } });
  });

  it('uses the Firefox sidebarAction API when Chromium sidePanel is absent', () => {
    const open = vi.fn();
    vi.stubGlobal('chrome', undefined);
    vi.stubGlobal('browser', { sidebarAction: { open } });

    const result = getBrowserSidePanel();

    expect(result).toEqual({ browser: 'firefox', api: { open } });
  });

  it('returns undefined outside a browser sidebar context', () => {
    vi.stubGlobal('chrome', undefined);
    vi.stubGlobal('browser', {});

    expect(getBrowserSidePanel()).toBeUndefined();
  });
});
