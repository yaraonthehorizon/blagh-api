export interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
  status: number; // 1: active, 0: deleted, -1: suspended
} 