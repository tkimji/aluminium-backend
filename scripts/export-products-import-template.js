"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Writes the same example workbook as GET /admin/products/import/template
 * to templates/products-import-example.xlsx (for repo copy / offline use).
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const products_import_template_1 = require("../src/lib/products-import-template");
const outDir = path_1.default.join(__dirname, '..', 'templates');
const outFile = path_1.default.join(outDir, 'products-import-example.xlsx');
if (!fs_1.default.existsSync(outDir)) {
    fs_1.default.mkdirSync(outDir, { recursive: true });
}
fs_1.default.writeFileSync(outFile, (0, products_import_template_1.buildProductsImportTemplateBuffer)());
console.log(`Wrote ${outFile}`);
//# sourceMappingURL=export-products-import-template.js.map