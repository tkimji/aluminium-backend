import * as XLSX from 'xlsx';

/** Same workbook as GET /admin/products/import/template — keep in sync with import parser columns. */
export function buildProductsImportTemplateBuffer(): Buffer {
  const productsSheet = [
    [
      'sku',
      'name',
      'itemFormat',
      'productTypeCode',
      'unitCode',
      'brandCode',
      'warehouseCode',
      'priceManual',
      'priceSource',
      'formulaId',
      'status',
      'description',
      'imageUrl',
    ],
    [
      'SKU-IMPORT-001',
      'Example door panel',
      'MTO',
      'DR',
      'PCS',
      '',
      '',
      '1500',
      'MANUAL',
      '',
      'active',
      'First sample row',
      '',
    ],
    [
      'SKU-IMPORT-002',
      'Example preset product',
      'PRESET',
      'DR',
      'PCS',
      '',
      '',
      '',
      'MANUAL',
      '',
      'active',
      '',
      '',
    ],
  ];

  const instructionsSheet = [
    ['Column', 'Required', 'Notes'],
    ['sku', 'Yes', 'Unique product SKU'],
    ['name', 'Yes', 'Display name'],
    ['itemFormat', 'Yes', 'MTO, PRESET, or MATERIAL'],
    ['productTypeCode', 'Yes*', 'Code from ProductType (e.g. DR). Use productTypeId instead if you prefer UUID.'],
    ['unitCode', 'Yes*', 'Unit code (e.g. PCS). Use unitId for UUID.'],
    ['brandCode', 'No', 'Brand code when using codes'],
    ['warehouseCode', 'No', 'Warehouse code'],
    ['priceManual', 'No', 'Numeric price'],
    ['priceSource', 'No', 'MANUAL (default) or FORMULA'],
    ['formulaId', 'No', 'Formula UUID when priceSource is FORMULA'],
    ['status', 'No', 'active or inactive (default active)'],
    ['description', 'No', ''],
    ['imageUrl', 'No', ''],
    ['', '', '* Provide either Code column or matching Id column for product type and unit.'],
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(productsSheet);
  XLSX.utils.book_append_sheet(wb, ws1, 'Products');
  const ws2 = XLSX.utils.aoa_to_sheet(instructionsSheet);
  XLSX.utils.book_append_sheet(wb, ws2, 'Instructions');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
}
