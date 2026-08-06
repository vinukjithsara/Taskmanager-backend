require("dotenv").config();
const sendEmail = require("./mailer");

(async () => {
  console.log("Attempting to send a diagnostic test email via the exact mailer.js path...");

  try {
    await sendEmail(
      "vinukjithsara278@gmail.com",
      "WorkTrack diagnostic test email",
      "<p>This is a one-off test to check whether SMTP send/auth is working.</p>"
    );
    console.log("sendEmail() call completed without throwing.");
  } catch (err) {
    console.error("sendEmail() threw:", err);
  }
})();
