// Safari Polyfills
import { Buffer } from 'buffer';

// Polyfill for global Buffer
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = { env: {} };
}

// Polyfill for crypto
if (typeof window !== 'undefined' && !window.crypto) {
  (window as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  };
}

// Polyfill for TextEncoder/TextDecoder
if (typeof window !== 'undefined') {
  if (!window.TextEncoder) {
    (window as any).TextEncoder = class TextEncoder {
      encode(str: string): Uint8Array {
        const encoder = new (require('text-encoding').TextEncoder)();
        return encoder.encode(str);
      }
    };
  }
  
  if (!window.TextDecoder) {
    (window as any).TextDecoder = class TextDecoder {
      decode(bytes: Uint8Array): string {
        const decoder = new (require('text-encoding').TextDecoder)();
        return decoder.decode(bytes);
      }
    };
  }
}

// Polyfill for BigInt
if (typeof BigInt === 'undefined') {
  (window as any).BigInt = function(value: any) {
    throw new Error('BigInt is not supported in this browser');
  };
}

// Polyfill for requestAnimationFrame
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  (window as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16);
  };
  
  (window as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Polyfill for performance.now()
if (typeof window !== 'undefined' && !window.performance) {
  (window as any).performance = {
    now: () => Date.now()
  };
}

// Polyfill for WebSocket
if (typeof window !== 'undefined' && !window.WebSocket) {
  console.warn('WebSocket not supported in this browser');
}

// Polyfill for fetch
if (typeof window !== 'undefined' && !window.fetch) {
  console.warn('Fetch not supported in this browser');
}

// Safari-specific fixes
if (typeof window !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
  // Fix for Safari's strict CSP
  const originalEval = window.eval;
  window.eval = function(code: string) {
    console.warn('eval() called, which may be blocked by Safari CSP');
    return originalEval.call(window, code);
  };
  
  // Fix for Safari's module loading
  if (!(window as any).__webpack_require__) {
    (window as any).__webpack_require__ = function() {
      console.warn('webpack require called in Safari');
    };
  }
}

export {}; 