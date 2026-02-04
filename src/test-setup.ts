// Test setup file to configure the test environment
import { afterEach, beforeEach, vi } from 'vitest';

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Suppress specific console errors that are expected in test environment
  console.error = vi.fn((...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress serialization errors from XMLHttpRequest in test environment
    if (
      message.includes('unserializable') ||
      message.includes('XMLHttpRequest') ||
      message.includes('currentTarget') ||
      message.includes('eventPhase')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = vi.fn((...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('unserializable')) {
      return;
    }
    originalWarn.call(console, ...args);
  });

  // Suppress unhandled rejection errors from serialization issues
  if (typeof globalThis !== 'undefined') {
    const originalUnhandledRejection = globalThis.onunhandledrejection;
    globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      if (reason.includes('unserializable') || reason.includes('XMLHttpRequest')) {
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(globalThis, event);
      }
    };
  }
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
