/**
 * Ava test setup - runs before all tests
 * Polyfills CustomEvent for Node.js WebSocket support
 */

// Polyfill CustomEvent for Node.js environment (required by @solana/rpc-subscriptions WebSocket)
// Node.js doesn't have CustomEvent in the global scope, but it's needed by the ws library
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
}
