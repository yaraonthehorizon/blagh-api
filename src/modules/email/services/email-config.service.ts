import mongoose from 'mongoose';
import { EmailConfigSchema } from '../schemas/email-config.schema';

const EmailConfigModel = mongoose.model('EmailConfig', EmailConfigSchema);

export class EmailConfigService {
  async list(userId?: string) {
    if (userId) {
      return EmailConfigModel.find({ userId });
    }
    return EmailConfigModel.find({});
  }

  async get(userId: string | undefined, id: string) {
    if (userId) {
      return EmailConfigModel.findOne({ _id: id, userId });
    }
    return EmailConfigModel.findById(id);
  }

  async create(userId: string, data: any) {
    return EmailConfigModel.create({ ...data, userId });
  }

  async update(userId: string, id: string, data: any) {
    return EmailConfigModel.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  }

  async delete(userId: string, id: string) {
    return EmailConfigModel.findOneAndDelete({ _id: id, userId });
  }
} 