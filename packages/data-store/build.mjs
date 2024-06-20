import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['index.ts'],
  bundle: true,
  minifySyntax: true,
  minifyWhitespace: true,
  minifyIdentifiers: false,
  sourcemap: true,
  treeShaking: true,
  banner: {
    js: '// (c) 2024 Sandro Schleu, License MIT',
  },
  outdir: 'dist',
  format: 'esm',
  target: 'esnext',
  platform: 'browser',
});
