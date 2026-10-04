import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await mkdir('.cache/report-tests', { recursive: true });
await build({ entryPoints: ['tests/reports.test.tsx'], outfile: '.cache/report-tests/tests.mjs', bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', define: { 'import.meta.env': '{}' }, alias: { '@': './src' }, plugins: [{ name: 'exceljs-node-interop', setup(builder) {
  builder.onResolve({ filter: /^exceljs$/ }, args => args.namespace === 'exceljs-shim' ? { path: 'exceljs', external: true } : { path: 'exceljs', namespace: 'exceljs-shim' });
  builder.onLoad({ filter: /.*/, namespace: 'exceljs-shim' }, () => ({ contents: "import ExcelJS from 'exceljs'; export const Workbook = ExcelJS.Workbook;", loader: 'js' }));
} }] });
const result = spawnSync(process.execPath, ['.cache/report-tests/tests.mjs'], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
