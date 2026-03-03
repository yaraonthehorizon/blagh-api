import { EmailProvider } from './base-email-provider';
const nodemailer = require('nodemailer');

export class SmtpProvider implements EmailProvider {
  constructor(private config: any) {}

  async send({ to, subject, body, from }: any) {
    const transporter = nodemailer.createTransport(this.config);
    await transporter.sendMail({ from, to, subject, html: body });
  }
} 