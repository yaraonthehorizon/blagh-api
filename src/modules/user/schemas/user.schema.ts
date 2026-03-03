import mongoose, { Document, Schema } from 'mongoose';
import { User } from '../entities/user.entity';

export interface IUserDocument extends Omit<User, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, index: true },
  mobile: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  avatar: { type: String },
  timezone: { type: String },
  locale: { type: String },
  preferences: { type: Schema.Types.Mixed, default: {} },
  metadata: { type: Schema.Types.Mixed, default: {} },
  status: { type: Number, default: 1 },
  
  // Role Management (ID-based relations)
  roleIds: { type: [String], default: [], index: true },
  isAdmin: { type: Boolean, default: false, index: true },
  lastRoleUpdate: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ roleIds: 1 });
UserSchema.index({ isAdmin: 1 });
UserSchema.index({ 'roleIds': 1, 'isAdmin': 1 }); // Compound index for role checks

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema); 