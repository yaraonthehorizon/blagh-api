import mongoose, { Schema, Document } from 'mongoose';
import { IPermission } from '../entities/permission.entity';

export interface IPermissionDocument extends Omit<IPermission, '_id'>, Document {}

const PermissionSchema = new Schema<IPermissionDocument>({
  name: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  module: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },
  requiresAuth: { type: Boolean, default: true },
  
  // ID-based relations
  allowedRoleIds: [{ type: String, ref: 'Role' }],
  allowedUserIds: [{ type: String, ref: 'User' }],
  deniedUserIds: [{ type: String, ref: 'User' }],
  
  // Conditions
  conditions: [{
    field: { type: String, required: true },
    operator: { 
      type: String, 
      required: true,
      enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'exists', 'regex']
    },
    value: Schema.Types.Mixed,
    resourceField: String
  }],
  
  // Metadata
  metadata: {
    type: { type: String },
    scope: { type: String },
    isWildcard: { type: Boolean, default: false },
    category: { type: String },
    priority: { type: Number, default: 0 }
  },
  
  // Audit fields
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true },
  lastUsedAt: { type: Date },
  usageCount: { type: Number, default: 0 },
  
  // Base entity fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
PermissionSchema.index({ module: 1, action: 1 });
PermissionSchema.index({ code: 1 });
PermissionSchema.index({ isActive: 1 });
PermissionSchema.index({ allowedRoleIds: 1 });
PermissionSchema.index({ allowedUserIds: 1 });

export const PermissionModel = mongoose.model<IPermissionDocument>('Permission', PermissionSchema);
