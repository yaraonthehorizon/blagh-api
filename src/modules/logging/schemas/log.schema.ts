import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  timestamp: Date;
  level: string;
  message: string;
  meta?: any;
  trace?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  module?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LogSchema = new Schema<ILog>({
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  level: {
    type: String,
    required: true,
    enum: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE'],
    index: true
  },
  message: {
    type: String,
    required: true,
    index: true
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {}
  },
  trace: {
    type: String
  },
  userId: {
    type: String,
    index: true
  },
  requestId: {
    type: String,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  module: {
    type: String,
    index: true
  },
  action: {
    type: String,
    index: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  },
  url: {
    type: String
  },
  statusCode: {
    type: Number
  },
  responseTime: {
    type: Number
  },
  error: {
    name: String,
    message: String,
    stack: String,
    code: String
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
LogSchema.index({ timestamp: -1, level: 1 });
LogSchema.index({ requestId: 1, timestamp: -1 });
LogSchema.index({ userId: 1, timestamp: -1 });
LogSchema.index({ module: 1, action: 1, timestamp: -1 });
LogSchema.index({ level: 1, timestamp: -1 });
LogSchema.index({ createdAt: -1 });

// TTL index to automatically delete old logs (optional)
if (process.env.LOG_DATABASE_TTL_DAYS) {
  const ttlDays = parseInt(process.env.LOG_DATABASE_TTL_DAYS);
  LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlDays * 24 * 60 * 60 });
}

export const LogModel = mongoose.model<ILog>('Log', LogSchema);
