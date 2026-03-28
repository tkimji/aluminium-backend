import swaggerJSDoc from 'swagger-jsdoc';

const port = Number(process.env.PORT ?? 3000);

const paths = {
  '/': {
    get: {
      tags: ['System'],
      summary: 'Root status',
      responses: { '200': { description: 'OK' } },
    },
  },
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      responses: { '200': { description: 'OK' } },
    },
  },
  '/locations/provinces': {
    get: {
      tags: ['Locations'],
      summary: 'List provinces',
      parameters: [{ name: 'search', in: 'query', required: false, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/locations/districts': {
    get: {
      tags: ['Locations'],
      summary: 'List districts by province',
      parameters: [
        { name: 'provinceId', in: 'query', required: true, schema: { type: 'integer' } },
        { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' }, '400': { description: 'provinceId is required' } },
    },
  },
  '/locations/sub-districts': {
    get: {
      tags: ['Locations'],
      summary: 'List sub-districts by district',
      parameters: [
        { name: 'districtId', in: 'query', required: true, schema: { type: 'integer' } },
        { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' }, '400': { description: 'districtId is required' } },
    },
  },
  '/locations/postal-codes': {
    get: {
      tags: ['Locations'],
      summary: 'Get postal code by sub-district',
      parameters: [{ name: 'subDistrictId', in: 'query', required: true, schema: { type: 'integer' } }],
      responses: {
        '200': { description: 'OK' },
        '400': { description: 'subDistrictId is required' },
        '404': { description: 'Sub-district not found' },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register user',
      requestBody: { 
        required: true, 
        content: { 
          'application/json': { 
            schema: { 
              type: 'object',
              required: ['email', 'password', 'firstName', 'lastName'],
              properties: {
                email: { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
                role: { type: 'string', enum: ['admin', 'tech', 'user'], example: 'user' },
                phone: { type: 'string', example: '0812345678' },
                prefix: { type: 'string', example: 'นาย' },
                firstName: { type: 'string', example: 'สมชาย' },
                lastName: { type: 'string', example: 'ใจดี' },
                houseNo: { type: 'string', example: '123' },
                province: { type: 'string', example: 'กรุงเทพมหานคร' },
              }
            } 
          } 
        } 
      },
      responses: { '201': { description: 'Created' }, '400': { description: 'Bad request' } },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      requestBody: { 
        required: true, 
        content: { 
          'application/json': { 
            schema: { 
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', example: 'admin@example.com' },
                password: { type: 'string', example: 'password123' }
              }
            },
            example: {
              email: 'admin@example.com',
              password: 'password123'
            }
          } 
        } 
      },
      responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' }, '401': { description: 'Unauthorized' } },
    },
  },
  '/admin/approvals': {
    get: {
      tags: ['Admin'],
      summary: 'List approvals',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/approvals/{id}/approve': {
    post: {
      tags: ['Admin'],
      summary: 'Approve tech',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
  },
  '/admin/approvals/{id}/reject': {
    post: {
      tags: ['Admin'],
      summary: 'Reject tech',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
  },
  '/admin/subscription-payments': {
    get: {
      tags: ['Admin'],
      summary: 'List subscription payments',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/subscription-payments/{id}/approve': {
    post: {
      tags: ['Admin'],
      summary: 'Approve subscription payment',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/subscription-payments/{id}/reject': {
    post: {
      tags: ['Admin'],
      summary: 'Reject subscription payment',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/payments': {
    get: {
      tags: ['Admin'],
      summary: 'List order payments',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/payments/{id}/approve': {
    post: {
      tags: ['Admin'],
      summary: 'Approve order payment',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/payments/{id}/reject': {
    post: {
      tags: ['Admin'],
      summary: 'Reject order payment',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/product-types': {
    get: {
      tags: ['Admin Masters'],
      summary: 'List product types',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Admin Masters'],
      summary: 'Create product type',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/product-types/{id}': {
    patch: {
      tags: ['Admin Masters'],
      summary: 'Update product type',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/units': {
    get: {
      tags: ['Admin Masters'],
      summary: 'List units',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Admin Masters'],
      summary: 'Create unit',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/units/{id}': {
    patch: {
      tags: ['Admin Masters'],
      summary: 'Update unit',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/colors': {
    get: {
      tags: ['Admin Masters'],
      summary: 'List colors',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Admin Masters'],
      summary: 'Create color',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/colors/{id}': {
    patch: {
      tags: ['Admin Masters'],
      summary: 'Update color',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/glass-types': {
    get: {
      tags: ['Admin Masters'],
      summary: 'List glass types',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Admin Masters'],
      summary: 'Create glass type',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/glass-types/{id}': {
    patch: {
      tags: ['Admin Masters'],
      summary: 'Update glass type',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/glass-thickness': {
    get: {
      tags: ['Admin Masters'],
      summary: 'List glass thickness',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Admin Masters'],
      summary: 'Create glass thickness',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/glass-thickness/{id}': {
    patch: {
      tags: ['Admin Masters'],
      summary: 'Update glass thickness',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/brands': {
    get: {
      tags: ['Admin Masters'],
      summary: 'List brands',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Admin Masters'],
      summary: 'Create brand',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/brands/{id}': {
    patch: {
      tags: ['Admin Masters'],
      summary: 'Update brand',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/products': {
    get: {
      tags: ['Products'],
      summary: 'List products (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'itemFormat', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Products'],
      summary: 'Create product (admin)',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/products/{id}': {
    patch: {
      tags: ['Products'],
      summary: 'Update product (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/formulas': {
    get: {
      tags: ['Formulas'],
      summary: 'List formulas',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Formulas'],
      summary: 'Create formula',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/formulas/{id}': {
    get: {
      tags: ['Formulas'],
      summary: 'Get formula detail',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
    patch: {
      tags: ['Formulas'],
      summary: 'Update formula',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/formulas/{id}/items': {
    post: {
      tags: ['Formulas'],
      summary: 'Add formula item',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/formulas/{id}/items/{itemId}': {
    patch: {
      tags: ['Formulas'],
      summary: 'Update formula item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
    delete: {
      tags: ['Formulas'],
      summary: 'Delete formula item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/warehouses': {
    get: {
      tags: ['Warehouse'],
      summary: 'List warehouses',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Warehouse'],
      summary: 'Create warehouse',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/admin/warehouses/{id}': {
    patch: {
      tags: ['Warehouse'],
      summary: 'Update warehouse',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/inventory': {
    get: {
      tags: ['Warehouse'],
      summary: 'List inventory',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'warehouseId', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/inventory/adjust': {
    post: {
      tags: ['Warehouse'],
      summary: 'Adjust inventory',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/admin/inventory/low-stock': {
    get: {
      tags: ['Warehouse'],
      summary: 'List low stock items',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/products': {
    get: {
      tags: ['Products'],
      summary: 'List products (catalog)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'itemFormat', in: 'query', required: false, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/projects': {
    get: {
      tags: ['Projects'],
      summary: 'List projects',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Projects'],
      summary: 'Create project',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/projects/{id}': {
    get: {
      tags: ['Projects'],
      summary: 'Get project detail',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
    patch: {
      tags: ['Projects'],
      summary: 'Update project',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/projects/{id}/items': {
    post: {
      tags: ['Projects'],
      summary: 'Add project item',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/projects/{id}/items/{itemId}': {
    patch: {
      tags: ['Projects'],
      summary: 'Update project item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
    delete: {
      tags: ['Projects'],
      summary: 'Delete project item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/quotations': {
    post: {
      tags: ['Quotations'],
      summary: 'Create quotation',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/quotations/{id}': {
    get: {
      tags: ['Quotations'],
      summary: 'Get quotation detail',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
    patch: {
      tags: ['Quotations'],
      summary: 'Update quotation',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/quotations/{id}/items': {
    post: {
      tags: ['Quotations'],
      summary: 'Add quotation item',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/quotations/{id}/items/{itemId}': {
    patch: {
      tags: ['Quotations'],
      summary: 'Update quotation item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
    delete: {
      tags: ['Quotations'],
      summary: 'Delete quotation item',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/orders': {
    get: {
      tags: ['Orders'],
      summary: 'List orders',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'status', in: 'query', required: false, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Orders'],
      summary: 'Create order',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Get order detail',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
  },
  '/orders/{id}/payments': {
    post: {
      tags: ['Orders'],
      summary: 'Upload order payment slip',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/subscriptions/{id}/payments': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Upload subscription payment slip',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/uploads': {
    post: {
      tags: ['Uploads'],
      summary: 'Upload file',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: { file: { type: 'string', format: 'binary' } },
              required: ['file'],
            },
          },
        },
      },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List my notifications',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'status', in: 'query', required: false, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' } },
    },
    post: {
      tags: ['Notifications'],
      summary: 'Create notification (admin only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'message', 'tone'],
              properties: {
                userId: { type: 'string' },
                message: { type: 'string' },
                tone: { type: 'string', enum: ['green', 'orange', 'yellow'] },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Created' }, '403': { description: 'Forbidden' } },
    },
  },
  '/notifications/read-all': {
    post: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/notifications/{id}/read': {
    post: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
  },
  '/etax': {
    post: {
      tags: ['e-Tax'],
      summary: 'Create e-Tax',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '201': { description: 'Created' } },
    },
  },
  '/etax/{orderId}': {
    get: {
      tags: ['e-Tax'],
      summary: 'Get e-Tax by order',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
    patch: {
      tags: ['e-Tax'],
      summary: 'Update e-Tax',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
      responses: { '200': { description: 'OK' } },
    },
  },
  '/receipts/{orderId}': {
    get: {
      tags: ['Receipts'],
      summary: 'Get receipt payload',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'OK' }, '404': { description: 'Not found' } },
    },
  },
  '/reports/dashboard': {
    get: {
      tags: ['Reports'],
      summary: 'Dashboard metrics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } },
    },
  },
  '/reports/sales/summary': {
    get: {
      tags: ['Reports'],
      summary: 'Monthly sales summary',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'months', in: 'query', required: false, schema: { type: 'integer' } }],
      responses: { '200': { description: 'OK' } },
    },
  },
} as const;

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aluminium2026 API',
      version: '0.1.0',
      description: 'Demo backend API documentation',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    tags: [
      { name: 'System', description: 'Health and system endpoints' },
      { name: 'Reports', description: 'Admin dashboard metrics' },
      { name: 'Locations', description: 'Address dropdown data' },
      { name: 'Auth', description: 'Authentication and user session' },
      { name: 'Admin', description: 'Admin approvals and payments' },
      { name: 'Admin Masters', description: 'Master data management' },
      { name: 'Products', description: 'Products and catalog' },
      { name: 'Formulas', description: 'Production formulas' },
      { name: 'Warehouse', description: 'Warehouse and inventory' },
      { name: 'Projects', description: 'Tech projects' },
      { name: 'Quotations', description: 'Project quotations' },
      { name: 'Orders', description: 'Orders and payments' },
      { name: 'Receipts', description: 'Receipt/Invoice payload' },
      { name: 'e-Tax', description: 'Electronic tax invoice requests' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Uploads', description: 'File uploads' },
      { name: 'Subscriptions', description: 'Tech subscription payments' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths,
  },
  apis: [],
});
