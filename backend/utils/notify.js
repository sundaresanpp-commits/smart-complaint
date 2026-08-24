const Notification = require('../models/Notification');

/**
 * Creates an in-app notification. Email sending is stubbed via sendEmail()
 * below - fill in SMTP settings in .env to enable it, otherwise it's a no-op.
 */
async function createNotification({ userId, complaintId = null, message, type = 'general' }) {
  try {
    await Notification.create({ user: userId, complaint: complaintId, message, type });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

async function sendEmail({ to, subject, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('SMTP is not configured');
  }
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Failed to send email:', err.message);
    throw err;
  }
}

module.exports = { createNotification, sendEmail };


