export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mongodb';
  logging: boolean;
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  // MongoDB specific options
  mongodb?: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    retryWrites?: boolean;
    w?: string | number;
    readPreference?: string;
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
  };
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  defaultProvider: string;
  allowMultipleProviders: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  providers: {
    internal: InternalAuthConfig;
    firebase: FirebaseAuthConfig;
    oauth: OAuthConfig;
    sms: SMSAuthConfig;
    email: EmailAuthConfig;
    ldap?: LDAPAuthConfig;
    saml?: SAMLAuthConfig;
    oauth2?: OAuth2Config;
    openid?: OpenIDConfig;
    webauthn?: WebAuthnConfig;
    social?: SocialAuthConfig;
  };
}

export interface InternalAuthConfig {
  enabled: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  allowPasswordReset: boolean;
  bcryptRounds: number;
  database: {
    userTable: string;
    tokenTable: string;
    sessionTable: string;
  };
}

export interface FirebaseAuthConfig {
  enabled: boolean;
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
  authProviderX509CertUrl: string;
  clientX509CertUrl: string;
  adminSDK: {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
  };
}

export interface OAuthConfig {
  enabled: boolean;
  providers: {
    google: OAuthProviderConfig;
    github: OAuthProviderConfig;
    facebook: OAuthProviderConfig;
    twitter: OAuthProviderConfig;
    linkedin: OAuthProviderConfig;
    microsoft: OAuthProviderConfig;
    apple: OAuthProviderConfig;
    discord: OAuthProviderConfig;
    spotify: OAuthProviderConfig;
    twitch: OAuthProviderConfig;
  };
}

export interface OAuthProviderConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scope: string[];
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  additionalParams?: Record<string, string>;
}

export interface SMSAuthConfig {
  enabled: boolean;
  provider: 'twilio' | 'aws-sns' | 'vonage' | 'messagebird' | 'custom';
  codeLength: number;
  codeExpiration: number;
  maxAttempts: number;
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    serviceSid?: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    senderId?: string;
  };
  vonage?: {
    apiKey: string;
    apiSecret: string;
    from: string;
  };
  messagebird?: {
    accessKey: string;
    from: string;
  };
  custom?: {
    endpoint: string;
    apiKey: string;
    headers?: Record<string, string>;
  };
}

export interface EmailAuthConfig {
  enabled: boolean;
  provider: 'nodemailer' | 'sendgrid' | 'aws-ses' | 'mailgun' | 'postmark' | 'custom';
  codeLength: number;
  codeExpiration: number;
  maxAttempts: number;
  templates: {
    verification: string;
    passwordReset: string;
    loginCode: string;
  };
  nodemailer?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
    from: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    from: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
    from: string;
  };
  postmark?: {
    serverToken: string;
    from: string;
  };
  custom?: {
    endpoint: string;
    apiKey: string;
    headers?: Record<string, string>;
  };
}

export interface LDAPAuthConfig {
  enabled: boolean;
  server: {
    url: string;
    bindDN: string;
    bindCredentials: string;
    searchBase: string;
    searchFilter: string;
    searchAttributes: string[];
  };
  userMapping: {
    id: string;
    email: string;
    name: string;
    groups: string;
  };
  groupMapping: {
    admin: string[];
    user: string[];
  };
  tlsOptions?: {
    rejectUnauthorized: boolean;
    ca?: string;
  };
}

export interface SAMLAuthConfig {
  enabled: boolean;
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
  decryptionPvk?: string;
  signatureAlgorithm?: string;
  digestAlgorithm?: string;
  userMapping: {
    id: string;
    email: string;
    name: string;
    groups: string;
  };
  groupMapping: {
    admin: string[];
    user: string[];
  };
}

export interface OAuth2Config {
  enabled: boolean;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
  userMapping: {
    id: string;
    email: string;
    name: string;
  };
}

export interface OpenIDConfig {
  enabled: boolean;
  issuer: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
  userMapping: {
    id: string;
    email: string;
    name: string;
  };
}

export interface WebAuthnConfig {
  enabled: boolean;
  rpName: string;
  rpID: string;
  origin: string;
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
  userVerification: 'required' | 'preferred' | 'discouraged';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
}

export interface SocialAuthConfig {
  enabled: boolean;
  providers: {
    instagram: SocialProviderConfig;
    tiktok: SocialProviderConfig;
    snapchat: SocialProviderConfig;
    pinterest: SocialProviderConfig;
    reddit: SocialProviderConfig;
    slack: SocialProviderConfig;
    zoom: SocialProviderConfig;
    dropbox: SocialProviderConfig;
    bitbucket: SocialProviderConfig;
    gitlab: SocialProviderConfig;
  };
}

export interface SocialProviderConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scope: string[];
  userMapping: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

// Odoo Configuration Interfaces
export interface OdooConfig {
  enabled: boolean;
  server: {
    url: string;
    port: number;
    protocol: 'http' | 'https';
  };
  authentication: {
    username: string;
    password: string;
    database: string;
    company: number;
  };
  models: {
    users: OdooModelConfig;
    customers: OdooModelConfig;
    leads: OdooModelConfig;
    opportunities: OdooModelConfig;
    contacts: OdooModelConfig;
    companies: OdooModelConfig;
    products: OdooModelConfig;
    orders: OdooModelConfig;
    invoices: OdooModelConfig;
  };
  sync: {
    enabled: boolean;
    interval: number; // in minutes
    batchSize: number;
    retryAttempts: number;
    retryDelay: number; // in seconds
  };
  webhooks: {
    enabled: boolean;
    secret: string;
    events: string[];
  };
}

export interface OdooModelConfig {
  enabled: boolean;
  model: string;
  fields: string[];
  filters?: Record<string, any>;
  mapping: Record<string, string>;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  createOnSync: boolean;
  updateOnSync: boolean;
}

export interface OdooConnectionConfig {
  url: string;
  port: number;
  protocol: 'http' | 'https';
  database: string;
  username: string;
  password: string;
  company: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface OdooUser {
  id: number;
  name: string;
  email: string;
  login: string;
  active: boolean;
  company_id: number;
  partner_id: number;
  groups_id: number[];
  signature: string;
  create_date: string;
  write_date: string;
  last_login: string;
  share: boolean;
  notification_type: string;
  sale_team_id: number;
  target_sales_won: number;
  target_sales_done: number;
  custom_reference_id:number;
}

export interface OdooCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  street: string;
  street2: string;
  city: string;
  state_id: number;
  zip: string;
  country_id: number;
  is_company: boolean;
  parent_id: number;
  type: string;
  customer_rank: number;
  supplier_rank: number;
  active: boolean;
  create_date: string;
  write_date: string;
}

export interface OdooLead {
  id: number;
  name: string;
  partner_name: string;
  contact_name: string;
  email_from: string;
  phone: string;
  mobile: string;
  description: string;
  street: string;
  street2: string;
  city: string;
  state_id: number;
  zip: string;
  country_id: number;
  type: string;
  priority: string;
  stage_id: number;
  user_id: number;
  team_id: number;
  company_id: number;
  active: boolean;
  create_date: string;
  write_date: string;
  date_deadline: string;
  date_closed: string;
  probability: number;
  expected_revenue: number;
  planned_revenue: number;
}

export interface OdooOpportunity {
  id: number;
  name: string;
  partner_id: number;
  contact_name: string;
  email_from: string;
  phone: string;
  mobile: string;
  description: string;
  street: string;
  street2: string;
  city: string;
  state_id: number;
  zip: string;
  country_id: number;
  type: string;
  priority: string;
  stage_id: number;
  user_id: number;
  team_id: number;
  company_id: number;
  active: boolean;
  create_date: string;
  write_date: string;
  date_deadline: string;
  date_closed: string;
  probability: number;
  expected_revenue: number;
  planned_revenue: number;
  expected_revenue_currency: number;
  planned_revenue_currency: number;
}

export interface OdooProduct {
  id: number;
  name: string;
  description: string;
  description_sale: string;
  description_purchase: string;
  type: string;
  categ_id: number;
  list_price: number;
  standard_price: number;
  cost_currency_id: number;
  currency_id: number;
  active: boolean;
  create_date: string;
  write_date: string;
  default_code: string;
  barcode: string;
  weight: number;
  volume: number;
  sale_ok: boolean;
  purchase_ok: boolean;
  can_be_expensed: boolean;
  invoice_policy: string;
  expense_policy: string;
  tracking: string;
  warranty: number;
  sale_delay: number;
  purchase_delay: number;
  route_ids: number[];
  taxes_id: number[];
  supplier_taxes_id: number[];
}

export interface OdooOrder {
  id: number;
  name: string;
  partner_id: number;
  partner_invoice_id: number;
  partner_shipping_id: number;
  date_order: string;
  date_approve: string;
  date_planned: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  currency_id: number;
  state: string;
  payment_term_id: number;
  fiscal_position_id: number;
  user_id: number;
  team_id: number;
  company_id: number;
  active: boolean;
  create_date: string;
  write_date: string;
  order_line: number[];
  invoice_status: string;
  invoice_count: number;
  invoice_ids: number[];
}

export interface OdooInvoice {
  id: number;
  name: string;
  partner_id: number;
  partner_shipping_id: number;
  invoice_date: string;
  invoice_due_date: string;
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  amount_residual: number;
  currency_id: number;
  state: string;
  payment_state: string;
  move_type: string;
  journal_id: number;
  company_id: number;
  user_id: number;
  team_id: number;
  active: boolean;
  create_date: string;
  write_date: string;
  invoice_line_ids: number[];
  tax_totals: any;
}

export interface OdooTicket {
  id: number;
  name: string; // Subject
  description: string;
  partner_id: number; // Customer (Many2one)
  partner_name?: string;
  partner_email?: string;
  priority?: string; // 0, 1, 2, 3 or low/medium/high depending on Odoo
  stage_id?: number; // Stage (Many2one)
  team_id?: number; // Helpdesk team (Many2one)
  user_id?: number; // Assigned user (Many2one)
  company_id?: number; // Company (Many2one)
  active?: boolean;
  create_date?: string;
  write_date?: string;
  tag_ids?: number[]; // Many2many
}

export interface NotificationConfig {
  email: EmailConfig;
  sms: SMSConfig;
  push: PushConfig;
}

export interface EmailConfig {
  enabled: boolean;
  provider: 'nodemailer' | 'sendgrid' | 'aws-ses';
  templates: {
    path: string;
    engine: 'handlebars' | 'ejs' | 'pug';
  };
  defaults: {
    from: string;
    replyTo: string;
  };
}

export interface SMSConfig {
  enabled: boolean;
  provider: 'twilio' | 'aws-sns' | 'custom';
  defaults: {
    from: string;
  };
}

export interface PushConfig {
  enabled: boolean;
  provider: 'firebase' | 'aws-sns' | 'custom';
}

export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production' | 'uat';
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  database: DatabaseConfig;
  auth: AuthConfig;
  odoo: OdooConfig;
  notifications: NotificationConfig;
  plugins: PluginConfig[];
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string;
  };
  security: {
    rateLimit: {
      windowMs: number;
      max: number;
    };
    helmet: boolean;
    compression: boolean;
  };
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} 