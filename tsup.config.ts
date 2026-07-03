import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };
const outDir = 'dist';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir,
  clean: true,
  sourcemap: process.env.CI !== 'true',
  dts: true,
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    'process.env.POSTHOG_API_KEY': JSON.stringify(process.env.POSTHOG_API_KEY || ''),
    'process.env.CLI_VERSION': JSON.stringify(pkg.version),
  },
  esbuildPlugins: [
    {
      name: 'copy-forger-asset',
      setup(build) {
        build.onEnd(() => {
          const assetsDir = join(outDir, 'assets');
          mkdirSync(assetsDir, { recursive: true });
          copyFileSync('src/assets/forger.json', join(assetsDir, 'forger.json'));
        });
      },
    },
  ],
});
