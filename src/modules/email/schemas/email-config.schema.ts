import * as mongoose from 'mongoose';

export const EmailConfigSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  provider: { type: String, required: true },
  credentials: { type: Object, required: true },
  code: { type: String, required: true }, // unique code for this config
  fromName: String,
  fromEmail: String,
  default: { type: Boolean, default: false }
});

// Ensure only one default config per user
EmailConfigSchema.index({ userId: 1, default: 1 }, { unique: true, partialFilterExpression: { default: true } });

export const EmailConfigModel = mongoose.model('EmailConfig', EmailConfigSchema); 