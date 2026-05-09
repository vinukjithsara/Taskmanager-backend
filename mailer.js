const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "vinukjithsara278@gmail.com",
    pass: "bonlourcdrhqiquk"
  }
});

async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: "vinukjithsara278@gmail.com",
      to,
      subject,
      html
    });

    console.log("Email Sent:", info.response);
  } catch (err) {
    console.log(err);
  }
}

module.exports = sendEmail;