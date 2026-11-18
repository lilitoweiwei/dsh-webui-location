/**
 * Two artifacts from one source tree.
 *
 * `lib/index.js` is the Host entry (ESM, no dependencies): the Loader imports it
 * so the package becomes a mountable row, and the browser half is discovered by
 * scanning rows that declare `dsh.client`.
 *
 * `lib/client.js` is the browser half: one CommonJS closure registered through
 * `window.__ModuleLoader__.load`, with the shell's platform modules left as
 * `require()` calls and everything else inlined. The platform list is fixed by
 * the running page (packages/client/web/src/platform.ts in the harness); a
 * specifier outside it must be bundled or the module table has no row for it.
 */
import { defineConfig } from 'tsdown'

const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  'zod',
  '@tanstack/react-virtual',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

const PACKAGE_ID = 'dsh-webui-location'

export default defineConfig([
  {
    name: PACKAGE_ID,
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    target: 'node22',
    dts: false,
    clean: false,
    sourcemap: true,
    outputOptions: { entryFileNames: 'index.js' },
  },
  {
    name: `${PACKAGE_ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    // A CJS bundle targets Node by default; the loader factory runs in the
    // browser, so the platform is stated on the input side instead.
    inputOptions: { platform: 'browser' },
    target: 'es2022',
    dts: false,
    clean: false,
    sourcemap: true,
    deps: { neverBundle: PLATFORM_MODULES },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
    },
  },
])
