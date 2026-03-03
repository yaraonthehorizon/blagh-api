import mongoose, { Schema, Document } from 'mongoose';
import { Role, CreateRoleData } from '../entities/role.entity';

export interface IRoleDocument extends Omit<Role, '_id'>, Document {}

const RoleSchema = new Schema<IRoleDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isSystem: {
    type: Boolean,
    default: false,
    index: true
  },
  permissionIds: [{
    type: String,
    ref: 'Permission',
    index: true
  }],
  parentRoleId: {
    type: String,
    ref: 'Role'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  },
  lastUsedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'roles'
});

// Indexes
RoleSchema.index({ code: 1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ isSystem: 1 });
RoleSchema.index({ permissionIds: 1 });
RoleSchema.index({ parentRoleId: 1 });
RoleSchema.index({ 'metadata.type': 1 });
RoleSchema.index({ 'metadata.scope': 1 });

export const RoleModel = mongoose.model<IRoleDocument>('Role', RoleSchema);
