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
  outfile: 'dist/index.js',
  format: 'esm',
  target: 'esnext',
  platform: 'neutral',
});

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
  outfile: 'dist/index.umd.cjs',
  format: 'cjs',
  target: 'esnext',
  platform: 'neutral',
});
