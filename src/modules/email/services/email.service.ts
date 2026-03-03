import { SmtpProvider } from '../providers/smtp-provider';
// import other providers as needed
import mongoose from 'mongoose';
import { EmailConfigSchema } from '../schemas/email-config.schema';

const EmailConfigModel = mongoose.model('EmailConfig', EmailConfigSchema);

export class EmailService {
  async sendEmail(userId: string, code: string, to: string, subject: string, body: string) {
    // 1. Load config for user/code from DB
    const config = await EmailConfigModel.findOne({ userId, code });
    if (!config) throw new Error('No email config for this code');

    // 2. Instantiate provider
    let provider;
    if (config.provider === 'smtp') provider = new SmtpProvider(config.credentials);
    // else if (config.provider === 'sendgrid') provider = new SendgridProvider(config.credentials);
    // ...etc

    // 3. Send email
    await provider.send({ to, subject, body, from: config.fromEmail });
  }
} 