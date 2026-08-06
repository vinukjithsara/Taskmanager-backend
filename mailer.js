const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "vinukjithsara278@gmail.com",
    pass: "bonlourcdrhqiquk"
  }
});

async function sendEmail(to, subject, html) {
  // Errors are intentionally left to propagate (not caught here) so callers
  // — the reminder cron in server.js — know a send actually failed and can
  // avoid marking it as sent, allowing a retry on the next tick.
  const info = await transporter.sendMail({
    from: "vinukjithsara278@gmail.com",
    to,
    subject,
    html
  });

  console.log("Email Sent:", info.response);
}

module.exports = sendEmail;