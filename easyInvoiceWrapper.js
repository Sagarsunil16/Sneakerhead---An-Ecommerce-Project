// easyinvoiceWrapper.js
const path = require('path');

async function createInvoice(data) {
    const easyInvoice = await import('easyinvoice');
    return easyInvoice.default.createInvoice(data);
}

module.exports = { createInvoice };
