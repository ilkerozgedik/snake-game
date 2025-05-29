import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['socket.io-client'],
  },
  build: {
    // CommonJS output can sometimes be more robust for older CJS deps,
    // but socket.io-client should be ESM friendly.
    // commonjsOptions: {
    //   include: [/socket.io-client/, /node_modules/],
    // },
  }
});
