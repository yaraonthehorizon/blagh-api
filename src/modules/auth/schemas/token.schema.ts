import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenDocument extends Document {
  userId: string; // Reference to User _id
  token: string; // JWT token
  type: 'access' | 'refresh';
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: string; // Optional device/browser info
  ipAddress?: string; // Optional IP address
  createdAt: Date;
  lastUsedAt: Date;
}

const TokenSchema = new Schema<ITokenDocument>({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: ['access', 'refresh'], required: true },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  deviceInfo: { type: String },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now }
});

TokenSchema.index({ userId: 1, type: 1 });
TokenSchema.index({ token: 1 });
TokenSchema.index({ expiresAt: 1 });

export const TokenModel = mongoose.model<ITokenDocument>('Token', TokenSchema); 