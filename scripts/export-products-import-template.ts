/**
 * Writes the same example workbook as GET /admin/products/import/template
 * to templates/products-import-example.xlsx (for repo copy / offline use).
 */
import fs from 'fs';
import path from 'path';

import { buildProductsImportTemplateBuffer } from '../src/lib/products-import-template';

const outDir = path.join(__dirname, '..', 'templates');
const outFile = path.join(outDir, 'products-import-example.xlsx');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outFile, buildProductsImportTemplateBuffer());
console.log(`Wrote ${outFile}`);
