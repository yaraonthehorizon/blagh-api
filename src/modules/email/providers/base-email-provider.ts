export interface EmailProvider {
  send(options: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    [key: string]: any;
  }): Promise<void>;
} 