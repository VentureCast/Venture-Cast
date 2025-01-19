// src/global.d.ts

// Check if the global URL is not already declared
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = require('url').URL;
  globalThis.URLSearchParams = require('url').URLSearchParams;
}
