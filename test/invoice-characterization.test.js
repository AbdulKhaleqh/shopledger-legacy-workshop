'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');

function orderFromItems(items, coupon) {
  const totals = pricing.computeTotals(items, coupon);
  return {
    id: 42,
    date: '22/11/2026',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items,
    coupon: coupon || '',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    ledgerTotals: totals
  };
}

test('Invoice GST follows the HSN rate used to bill the order', () => {
  const order = orderFromItems([
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ]);
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(order.tax, 5);
  assert.equal(order.total, 105);
  assert.equal(order.ledgerTotals.cgst, 2.5);
  assert.equal(order.ledgerTotals.sgst, 2.5);
  assert.equal(invoiceFigures.rows[0].gstPercent, 5);
  assert.equal(invoiceFigures.rows[0].lineTax, 5);
  assert.equal(invoiceFigures.tax, order.tax);
  assert.equal(invoiceFigures.cgst, order.ledgerTotals.cgst);
  assert.equal(invoiceFigures.sgst, order.ledgerTotals.sgst);
  assert.equal(invoiceFigures.total, order.total);
});

test('Invoice coupon, GST, and total follow the order billing calculation', () => {
  const order = orderFromItems([
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 2000, qty: 1 }
  ], 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.equal(order.discount, 150);
  assert.equal(order.tax, 92.5);
  assert.equal(order.total, 1942.5);
  assert.equal(invoiceFigures.tax, order.tax);
  assert.equal(invoiceFigures.discount, order.discount);
  assert.equal(invoiceFigures.cgst, order.ledgerTotals.cgst);
  assert.equal(invoiceFigures.sgst, order.ledgerTotals.sgst);
  assert.equal(invoiceFigures.total, order.total);
});

test('GST reconciliation reports matching figures for an HSN-rated order', () => {
  const order = orderFromItems([
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ]);
  const reconciliation = reports.getGstReconciliation({ orders: [order] });

  assert.equal(reconciliation.totalChecked, 1);
  assert.equal(reconciliation.mismatchCount, 0);
  assert.deepEqual(reconciliation.rows[0], {
    orderId: 42,
    date: '22/11/2026',
    customer: 'In-memory customer',
    coupon: '',
    ledgerSubtotal: 100,
    ledgerDiscount: 0,
    ledgerTax: 5,
    ledgerTotal: 105,
    invoiceDiscount: 0,
    invoiceTax: 5,
    invoiceTotal: 105,
    delta: 0,
    matched: true
  });
  assert.equal(reconciliation.totalDelta, 0);
});

test('rendered invoice displays the billed GST and total without a mismatch notice', () => {
  const order = orderFromItems([
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 100, qty: 1 }
  ]);
  const html = invoice.render(order);

  assert.match(html, /5%/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹105\.00/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
