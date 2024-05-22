const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      pool: true,
      host: process.env.HOST,
      requireTLS: true,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      html: message,
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  } catch (err) {
    throw err;
  }
};

module.exports = {
  sendEmail: sendEmail,
};
