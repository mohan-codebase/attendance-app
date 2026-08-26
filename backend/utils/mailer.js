const nodemailer = require('nodemailer');

// Generic SMTP, so this works with whichever provider you end up using —
// Gmail (with an app password), Brevo, Mailgun, SendGrid and Resend all speak
// it. Set these in backend/.env:
//
//   SMTP_HOST=smtp.example.com
//   SMTP_PORT=587
//   SMTP_USER=...
//   SMTP_PASS=...
//   SMTP_FROM="PresentSir <no-reply@yourdomain.com>"   # optional, defaults to SMTP_USER
//
// Until they are set the app still runs; see sendMail below.
const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Returns { delivered } rather than throwing when SMTP simply isn't set up yet,
// so a half-configured environment can't turn into a 500 for the caller.
const sendMail = async ({ to, subject, text, html }) => {
  if (!isMailConfigured()) {
    // A password reset link in a log file is a security problem, so this
    // fallback is for development only. In production a missing configuration
    // has to surface as a failure rather than quietly printing the link.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS');
    }

    console.log('\n─── email NOT sent: SMTP is not configured ───');
    console.log(`to:      ${to}`);
    console.log(`subject: ${subject}`);
    console.log(text);
    console.log('──────────────────────────────────────────────\n');
    return { delivered: false };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true };
};

module.exports = { sendMail, isMailConfigured };
