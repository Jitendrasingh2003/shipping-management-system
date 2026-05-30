const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log('📧 Email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('📧 Email error:', err.message);
    return false;
  }
};

const emailTemplates = {
  shipmentCreated: (shipment) => ({
    subject: `📦 Shipment Created - ${shipment.trackingId}`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#0d0f14;color:#e2e8f0;padding:30px;border-radius:12px;">
        <h2 style="color:#4f8ef7;">ShipTrack Pro</h2>
        <h3>Shipment Created Successfully</h3>
        <p>Tracking ID: <strong style="color:#4f8ef7;">${shipment.trackingId}</strong></p>
        <p>From: ${shipment.senderName} → To: ${shipment.receiverName}</p>
        <p>Status: <span style="color:#22c55e;">Created</span></p>
        <p>Estimated Delivery: ${new Date(shipment.estimatedDelivery).toDateString()}</p>
      </div>
    `,
  }),
  statusUpdate: (shipment, newStatus) => ({
    subject: `🚚 Shipment ${shipment.trackingId} - Status Updated`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#0d0f14;color:#e2e8f0;padding:30px;border-radius:12px;">
        <h2 style="color:#4f8ef7;">ShipTrack Pro</h2>
        <h3>Shipment Status Updated</h3>
        <p>Tracking ID: <strong style="color:#4f8ef7;">${shipment.trackingId}</strong></p>
        <p>New Status: <strong style="color:#22c55e;">${newStatus.replace(/_/g, ' ').toUpperCase()}</strong></p>
        <p>Location: ${shipment.currentLocation || 'N/A'}</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
