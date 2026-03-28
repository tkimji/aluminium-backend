"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function cleanup() {
    console.log('Deleting FormulaItem data...');
    await prisma.formulaItem.deleteMany({});
    console.log('Done!');
    await prisma.$disconnect();
}
cleanup();
//# sourceMappingURL=cleanup-formula-items.js.map