import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['index.ts'],
  bundle: true,
  minify: true,
  banner: {
    js: '// (c) 2024 Sandro Schleu, License MIT',
  },
  outdir: 'dist',
  platform: 'browser',
});
