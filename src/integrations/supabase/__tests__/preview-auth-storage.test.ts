import { afterEach, describe, expect, it, vi } from 'vitest';
import { brokeredPreviewStorage } from '../previewAuthStorage';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('preview authentication storage', () => {
  it('initializes and clears the timer before handling an immediate editor response', async () => {
    vi.useFakeTimers();
    const events = new EventTarget();
    vi.stubGlobal('location', {
      hostname: 'id-preview--12345678-1234-4123-8123-123456789abc.lovableproject.com',
      ancestorOrigins: ['https://lovable.dev'],
    });
    vi.stubGlobal('window', {
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      parent: {
        postMessage: (message: { requestId: string }, origin: string) => {
          expect(origin).toBe('https://lovable.dev');
          events.dispatchEvent(new MessageEvent('message', {
            origin,
            data: { type: 'lovable-preview-auth:result', requestId: message.requestId, ok: true, value: 'test-value' },
          }));
        },
      },
    });

    const storage = brokeredPreviewStorage();
    await expect(storage?.getItem('test-key')).resolves.toBe('test-value');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the normal application on local storage without brokering its session', () => {
    vi.stubGlobal('location', { hostname: 'akuris.pt' });
    expect(brokeredPreviewStorage()).toBe(localStorage);
  });
});
