export interface IEmailConfig {
  _id: string;
  provider: string;
  credentials: any;
  code: string; // unique code for this config
  fromName?: string;
  fromEmail?: string;
} 