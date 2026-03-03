import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationCodeDocument extends Document {
  userId: string; // Reference to User _id
  code: string;
  type: 'email_verification' | 'password_reset' | 'sms_verification';
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCodeDocument>({
  userId: { type: String, required: true, index: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['email_verification', 'password_reset', 'sms_verification'], required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

VerificationCodeSchema.index({ userId: 1, type: 1, code: 1 });

export const VerificationCodeModel = mongoose.model<IVerificationCodeDocument>('VerificationCode', VerificationCodeSchema); 