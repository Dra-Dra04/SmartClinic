import { build } from 'esbuild';
import { createRequire } from 'node:module';
const result = await build({
  entryPoints: ['tests/auth-flow.ts'], bundle: true, write: false, platform: 'node', format: 'cjs',
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://test.invalid/api') },
});
const testModule = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), testModule, testModule.exports);
