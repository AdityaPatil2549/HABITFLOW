import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfill for structuredClone which Dexie uses
if (typeof structuredClone === 'undefined') {
  // @ts-expect-error - polyfilling global for jsdom
  global.structuredClone = function (val: unknown) {
    return JSON.parse(JSON.stringify(val));
  };
}
