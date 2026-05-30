const Shipment = require('../models/mongodb/Shipment');
const Invoice = require('../models/mongodb/Invoice');
const PDFDocument = require('pdfkit');
const { createObjectCsvStringifier } = require('csv-writer');
const { logAudit } = require('../middleware/auth');

// @desc  Generate shipment report (PDF or CSV)
// @route GET /api/reports/shipments
// @access Admin, Manager
const generateShipmentReport = async (req, res, next) => {
  try {
    const { format = 'pdf', status, dateFrom, dateTo } = req.query;
    const query = { isArchived: false };
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59');
    }

    const shipments = await Shipment.find(query).sort({ createdAt: -1 }).limit(1000);

    await logAudit({
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      action: 'REPORT_GENERATED', resource: 'shipment',
      description: `Shipment report generated (${format.toUpperCase()}, ${shipments.length} records)`, req,
    });

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'trackingId', title: 'Tracking ID' },
          { id: 'senderName', title: 'Sender' },
          { id: 'receiverName', title: 'Receiver' },
          { id: 'receiverCity', title: 'Destination' },
          { id: 'status', title: 'Status' },
          { id: 'serviceType', title: 'Service' },
          { id: 'weight', title: 'Weight (kg)' },
          { id: 'shippingCost', title: 'Cost (INR)' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'estimatedDelivery', title: 'Est. Delivery' },
        ],
      });

      const records = shipments.map(s => ({
        trackingId: s.trackingId,
        senderName: s.senderName,
        receiverName: s.receiverName,
        receiverCity: s.receiverCity,
        status: s.status.replace(/_/g, ' ').toUpperCase(),
        serviceType: s.serviceType.toUpperCase(),
        weight: s.weight,
        shippingCost: s.shippingCost,
        createdAt: new Date(s.createdAt).toLocaleDateString('en-IN'),
        estimatedDelivery: s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString('en-IN') : 'N/A',
      }));

      const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=shipments_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    // PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipments_report_${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#0d0f14');
    doc.fillColor('#4f8ef7').fontSize(22).font('Helvetica-Bold').text('ShipTrack Pro', 40, 20);
    doc.fillColor('#94a3b8').fontSize(11).font('Helvetica').text('Shipment Report', 40, 48);
    doc.fillColor('#64748b').text(`Generated: ${new Date().toLocaleString('en-IN')} | Total Records: ${shipments.length}`, 40, 60);

    doc.moveDown(3);

    // Table header
    const colX = [40, 140, 250, 340, 420, 490];
    const headers = ['Tracking ID', 'Sender', 'Receiver', 'Status', 'Service', 'Cost (₹)'];
    doc.rect(40, doc.y, 530, 22).fill('#1e293b');
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y - 17, { width: 100 }));
    doc.moveDown(0.5);

    // Rows
    shipments.slice(0, 50).forEach((s, idx) => {
      const y = doc.y;
      if (idx % 2 === 0) doc.rect(40, y, 530, 20).fill('#0f172a');
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica');
      doc.text(s.trackingId, colX[0], y + 5, { width: 95 });
      doc.text(s.senderName.substring(0, 15), colX[1], y + 5, { width: 105 });
      doc.text(s.receiverName.substring(0, 15), colX[2], y + 5, { width: 85 });
      doc.text(s.status.replace(/_/g, ' ').toUpperCase(), colX[3], y + 5, { width: 75 });
      doc.text(s.serviceType.toUpperCase(), colX[4], y + 5, { width: 65 });
      doc.text(`₹${s.shippingCost}`, colX[5], y + 5, { width: 60 });
      doc.moveDown(1);
    });

    if (shipments.length > 50) {
      doc.fillColor('#64748b').fontSize(9).text(`... and ${shipments.length - 50} more records. Download CSV for full data.`, 40, doc.y + 10);
    }

    // Footer
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#0d0f14');
    doc.fillColor('#64748b').fontSize(8).text('ShipTrack Pro — Codec Technologies', 40, doc.page.height - 25);
    doc.end();
  } catch (err) {
    next(err);
  }
};

// @desc  Revenue report
// @route GET /api/reports/revenue
const generateRevenueReport = async (req, res, next) => {
  try {
    const { format = 'pdf' } = req.query;

    const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(1000);

    if (format === 'csv') {
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'invoiceNumber', title: 'Invoice #' },
          { id: 'trackingId', title: 'Tracking ID' },
          { id: 'senderName', title: 'Sender' },
          { id: 'receiverName', title: 'Receiver' },
          { id: 'amount', title: 'Amount (INR)' },
          { id: 'tax', title: 'Tax (INR)' },
          { id: 'totalAmount', title: 'Total (INR)' },
          { id: 'status', title: 'Status' },
          { id: 'createdAt', title: 'Date' },
        ],
      });

      const records = invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        trackingId: inv.trackingId,
        senderName: inv.senderName,
        receiverName: inv.receiverName,
        amount: inv.amount,
        tax: inv.tax,
        totalAmount: inv.totalAmount,
        status: inv.status.toUpperCase(),
        createdAt: new Date(inv.createdAt).toLocaleDateString('en-IN'),
      }));

      const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${Date.now()}.pdf`);
    doc.pipe(res);

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.totalAmount), 0);
    const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.totalAmount), 0);

    doc.rect(0, 0, doc.page.width, 80).fill('#0d0f14');
    doc.fillColor('#4f8ef7').fontSize(22).font('Helvetica-Bold').text('ShipTrack Pro', 40, 20);
    doc.fillColor('#94a3b8').fontSize(11).text('Revenue Report', 40, 48);
    doc.fillColor('#64748b').fontSize(9).text(`Total Revenue: ₹${totalRevenue.toFixed(2)} | Pending: ₹${pendingRevenue.toFixed(2)}`, 40, 62);
    doc.moveDown(3);

    invoices.slice(0, 50).forEach((inv, idx) => {
      const y = doc.y;
      if (idx % 2 === 0) doc.rect(40, y, 530, 20).fill('#0f172a');
      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica');
      doc.text(inv.invoiceNumber, 40, y + 5, { width: 110 });
      doc.text(inv.trackingId, 155, y + 5, { width: 100 });
      doc.text(inv.senderName.substring(0, 15), 260, y + 5, { width: 110 });
      doc.text(`₹${Number(inv.totalAmount).toFixed(2)}`, 375, y + 5, { width: 80 });
      doc.text(inv.status.toUpperCase(), 460, y + 5, { width: 80 });
      doc.moveDown(1);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { generateShipmentReport, generateRevenueReport };
