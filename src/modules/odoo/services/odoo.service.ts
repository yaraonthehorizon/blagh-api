import { Result } from '../../../shared/types/result';
import { OdooConnectionConfig, OdooUser, OdooCustomer, OdooLead, OdooOpportunity, OdooProduct, OdooOrder, OdooInvoice, OdooTicket } from '../../../core/config/interfaces';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class OdooService {
  private connection: OdooConnectionConfig;
  private uid: number | null = null;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private modelFieldsCache: Map<string, Set<string>> = new Map();

  constructor(config: OdooConnectionConfig) {
    this.connection = config;
  }

  async initialize(): Promise<Result<boolean>> {
    try {
      const requestId = uuidv4();
      console.log(`[OdooService] Initializing connection to ${this.connection.url}:${this.connection.port}`);
      const authResult = await this.authenticate();
      if (authResult.statusCode !== 1000) {
        return authResult;
      }
      this.isConnected = true;
      console.log(`[OdooService] Successfully connected to Odoo (UID: ${this.uid})`);
      return Result.success(true, requestId);
    } catch (error: any) {
      return Result.error('Failed to initialize Odoo connection', error.message);
    }
  }

  private async authenticate(): Promise<Result<boolean>> {
    try {
      console.log(`[OdooService] Attempting authentication with:`, {
        url: this.connection.url,
        port: this.connection.port,
        database: this.connection.database,
        username: this.connection.username,
        password: '***HIDDEN***'
      });

      const url = `${this.connection.protocol}://${this.connection.url}:${this.connection.port}/jsonrpc`;
      const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [
            this.connection.database,
            this.connection.username,
            this.connection.password,
            {}
          ]
        },
        id: Date.now()
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Diagramers-API/1.0'
        },
        timeout: this.connection.timeout || 30000,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status !== 200) {
        return Result.error('Authentication failed', `HTTP ${response.status}`);
      }
      const data = response.data;
      if (data && typeof data.result === 'number') {
        this.uid = data.result;
        this.sessionId = uuidv4();
        console.log(`[OdooService] Authentication successful, UID: ${this.uid}`);
        return Result.success(true);
      }
      if (data && data.error) {
        const err = data.error || {};
        const errMsg = err.message || err.data?.message || err.data?.debug || 'Unknown error';
        console.error('[OdooService] Auth error:', JSON.stringify(err, null, 2));
        return new Result(null, 0 as any, [{ message: `Authentication failed: ${errMsg}` }], null);
      }
      return Result.error('Authentication failed', 'No result');
    } catch (error: any) {
      console.log(`[OdooService] Authentication exception:`, error);
      return Result.error('Authentication error', error.message);
    }
  }

  private async executeRPC(model: string, method: string, params: any[]): Promise<Result<any>> {
    try {
      if (!this.isConnected || !this.uid) {
        return Result.error('Not connected to Odoo', 'Please initialize the connection first');
      }
      const url = `${this.connection.protocol}://${this.connection.url}:${this.connection.port}/jsonrpc`;

      // Map positional params to args/kwargs for JSON-RPC execute_kw
      let argsList: any[] = [];
      let kwargs: Record<string, any> = {};
      switch (method) {
        case 'search_read': {
          const domain = params[0] || [];
          const fields = params[1] || [];
          const offset = params[2] || 0;
          const limit = params[3] || 0;
          argsList = [domain];
          if (Array.isArray(fields) && fields.length) kwargs.fields = fields;
          if (typeof offset === 'number' && offset > 0) kwargs.offset = offset;
          if (typeof limit === 'number' && limit > 0) kwargs.limit = limit;
          break;
        }
        case 'read': {
          const ids = params[0] || [];
          const fields = params[1] || [];
          argsList = [ids];
          if (Array.isArray(fields) && fields.length) kwargs.fields = fields;
          break;
        }
        case 'search': {
          const domain = params[0] || [];
          const offset = params[1] || 0;
          const limit = params[2] || 0;
          argsList = [domain];
          if (typeof offset === 'number' && offset > 0) kwargs.offset = offset;
          if (typeof limit === 'number' && limit > 0) kwargs.limit = limit;
          break;
        }
        case 'create': {
          argsList = [params[0]];
          break;
        }
        case 'write': {
          // Expect [[ids], values], but accept [id, values] and normalize
          if (Array.isArray(params[0])) {
            argsList = params; // [[ids], values]
          } else {
            argsList = [[ [params[0]] ], params[1]];
          }
          break;
        }
        case 'fields_get': {
          argsList = [];
          break;
        }
        default: {
          argsList = params || [];
        }
      }

      const payload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            this.connection.database,
            this.uid,
            this.connection.password,
            model,
            method,
            argsList,
            kwargs
          ]
        },
        id: Date.now()
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Diagramers-API/1.0'
        },
        timeout: this.connection.timeout || 30000,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status !== 200) {
        return Result.error(`RPC call failed: ${method}`, `HTTP ${response.status}`);
      }

      const data = response.data;
      if (data && data.error) {
        const err = data.error || {};
        const errMsg = err.message || err.data?.message || err.data?.debug || 'Unknown error';
        console.error(`[OdooService] RPC error for ${model}.${method}:`, JSON.stringify(err, null, 2));
        const result = new Result(null, 0 as any, [{ message: `Odoo RPC error: ${errMsg}` }], null);
        result.additionalInfo = err.data || err;
        return result;
      }
      return Result.success(data?.result);
    } catch (error: any) {
      return Result.error('Odoo RPC request failed', error.message);
    }
  }

  private paramsToXml(params: any[]): string {
    let xml = '<array><data>';
    for (const param of params) {
      xml += '<value>' + this.valueToXml(param) + '</value>';
    }
    xml += '</data></array>';
    return xml;
  }

  private valueToXml(value: any): string {
    if (Array.isArray(value)) {
      let xml = '<array><data>';
      for (const item of value) {
        xml += '<value>' + this.valueToXml(item) + '</value>';
      }
      xml += '</data></array>';
      return xml;
    } else if (typeof value === 'object' && value !== null) {
      let xml = '<struct>';
      for (const [key, val] of Object.entries(value)) {
        xml += `<member><name>${key}</name><value>${this.valueToXml(val)}</value></member>`;
      }
      xml += '</struct>';
      return xml;
    } else if (typeof value === 'string') {
      return `<string>${value}</string>`;
    } else if (typeof value === 'number') {
      return `<int>${value}</int>`;
    } else if (typeof value === 'boolean') {
      return `<boolean>${value ? 1 : 0}</boolean>`;
    } else {
      return `<string>${String(value)}</string>`;
    }
  }

  private buildDomainFromFilters(filters: any): any[] {
    const domain: any[] = [];
    
    if (!filters || typeof filters !== 'object') {
      return domain;
    }

    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value !== null) {
          // Handle operators like { '>': 0 }
          for (const [operator, operatorValue] of Object.entries(value)) {
            domain.push([field, operator, operatorValue]);
          }
        } else {
          // Simple equality
          domain.push([field, '=', value]);
        }
      }
    }

    return domain;
  }

  private parseXmlResponse(xml: string): any {
    // Simple XML parsing for basic responses
    // This is a simplified parser - in production you'd want a proper XML parser
    
    console.log(`[OdooService] parseXmlResponse - Input XML:`, xml.substring(0, 200) + '...');
    
    // First, extract the content of the <param> tag to get the main response
    const paramMatch = xml.match(/<param>([\s\S]*?)<\/param>/);
    if (!paramMatch) {
      console.log(`[OdooService] parseXmlResponse - No param tag found`);
      return null;
    }
    
    const paramContent = paramMatch[1];
    console.log(`[OdooService] parseXmlResponse - Param content length:`, paramContent.length);
    
    // Now find the <value> tag within the param content
    // Use a more robust approach to find the outermost <value> tag
    // First, find the start of the first <value> tag
    const valueStart = paramContent.indexOf('<value>');
    if (valueStart === -1) {
      console.log(`[OdooService] parseXmlResponse - No value tag found in param content`);
      return null;
    }
    
    // Find the corresponding closing </value> tag by counting nested tags
    let depth = 0;
    let valueEnd = -1;
    let i = valueStart;
    
    while (i < paramContent.length) {
      if (paramContent.substring(i, i + 7) === '<value>') {
        depth++;
      } else if (paramContent.substring(i, i + 8) === '</value>') {
        depth--;
        if (depth === 0) {
          valueEnd = i + 8;
          break;
        }
      }
      i++;
    }
    
    if (valueEnd === -1) {
      console.log(`[OdooService] parseXmlResponse - Could not find matching closing value tag`);
      return null;
    }
    
    // Extract the content between the outermost <value> tags
    const valueContent = paramContent.substring(valueStart + 7, valueEnd - 8);
    
    console.log(`[OdooService] parseXmlResponse - Found value content length:`, valueContent.length);
    console.log(`[OdooService] parseXmlResponse - Value content start:`, valueContent.substring(0, 200) + '...');

    // Check for array
    if (valueContent.includes('<array>')) {
      console.log(`[OdooService] parseXmlResponse - Found array, calling parseXmlArray`);
      return this.parseXmlArray(valueContent);
    }

    // Check for struct
    if (valueContent.includes('<struct>')) {
      console.log(`[OdooService] parseXmlResponse - Found struct, calling parseXmlStruct`);
      return this.parseXmlStruct(valueContent);
    }

    // Check for string
    const stringMatch = valueContent.match(/<string>(.*?)<\/string>/);
    if (stringMatch) {
      console.log(`[OdooService] parseXmlResponse - Found string:`, stringMatch[1]);
      return stringMatch[1];
    }

    // Check for int
    const intMatch = valueContent.match(/<int>(\d+)<\/int>/);
    if (intMatch) {
      console.log(`[OdooService] parseXmlResponse - Found int:`, intMatch[1]);
      return parseInt(intMatch[1]);
    }

    // Check for boolean
    const booleanMatch = valueContent.match(/<boolean>(\d+)<\/boolean>/);
    if (booleanMatch) {
      console.log(`[OdooService] parseXmlResponse - Found boolean:`, booleanMatch[1]);
      return booleanMatch[1] === '1';
    }
    
    console.log(`[OdooService] parseXmlResponse - No matching type found`);

    return null;
  }

  private async getAllFieldNames(model: string): Promise<string[]> {
    try {
      // Call fields_get with empty args to retrieve all fields
      const params: any[] = [ [] ];
      const result = await this.executeRPC(model, 'fields_get', params);
      if (result.statusCode !== 1000) {
        return [];
      }
      const data = result.data as any;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.keys(data);
      }
      return [];
    } catch {
      return [];
    }
  }

  private getDefaultTicketFields(): string[] {
    return [
      'id', 'name', 'description', 'display_name', 'active',
      'priority', 'kanban_state', 'color',
      'stage_id', 'team_id', 'user_id', 'company_id',
      'partner_id',
      'ticket_type_id', 'category_id', 'create_date', 'write_date'
    ];
  }

  private async sanitizeTicketFields(model: string, requestedFields: string[] | undefined): Promise<string[]> {
    // default preferred fields
    const preferred = [
      'id', 'name', 'description', 'display_name', 'active',
      'priority', 'kanban_state', 'color',
      'stage_id', 'team_id', 'user_id', 'company_id',
      'partner_id', 'category_id', 'create_date', 'write_date'
    ];
    let available = this.modelFieldsCache.get(model);
    if (!available) {
      const names = await this.getAllFieldNames(model);
      available = new Set<string>(names);
      this.modelFieldsCache.set(model, available);
    }
    const requested = (requestedFields && requestedFields.length > 0) ? requestedFields : preferred;
    // Always include id and name if available
    const final: string[] = [];
    for (const f of requested) {
      if (available.has(f)) final.push(f);
    }
    if (final.length === 0) {
      // Fallback to minimal safe
      ['id', 'name'].forEach(f => { if (available!.has(f)) final.push(f); });
    }
    return Array.from(new Set(final));
  }

  private mapRawToRecords(rawData: any, fields: string[]): OdooTicket[] {
    const records: OdooTicket[] = [];
    if (!rawData) return records;
    if (Array.isArray(rawData) && rawData.length > 0 && typeof rawData[0] === 'object' && !Array.isArray(rawData[0])) {
      return rawData as OdooTicket[];
    }
    if (Array.isArray(rawData) && rawData.length > 0 && Array.isArray(rawData[0])) {
      for (const rec of rawData as any[]) {
        if (!Array.isArray(rec)) continue;
        const ticket: any = {};
        fields.forEach((field, index) => {
          if (rec[index] !== undefined) ticket[field] = rec[index];
        });
        records.push(ticket as OdooTicket);
      }
      return records;
    }
    if (Array.isArray(rawData) && rawData.length > 0) {
      const ticket: any = {};
      fields.forEach((field, index) => {
        if (rawData[index] !== undefined) ticket[field] = rawData[index];
      });
      records.push(ticket as OdooTicket);
      return records;
    }
    return records;
  }

  private parseXmlValue(xml: string): any {
    // Parse individual <value> content (without the <value> tags)
    console.log(`[OdooService] parseXmlValue - Input XML:`, xml.substring(0, 200) + '...');

    // Check for struct
    if (xml.includes('<struct>')) {
      console.log(`[OdooService] parseXmlValue - Found struct, calling parseXmlStruct`);
      return this.parseXmlStruct(xml);
    }

    // Check for string
    const stringMatch = xml.match(/<string>(.*?)<\/string>/);
    if (stringMatch) {
      console.log(`[OdooService] parseXmlValue - Found string:`, stringMatch[1]);
      return stringMatch[1];
    }

    // Check for int
    const intMatch = xml.match(/<int>(\d+)<\/int>/);
    if (intMatch) {
      console.log(`[OdooService] parseXmlValue - Found int:`, intMatch[1]);
      return parseInt(intMatch[1]);
    }

    // Check for boolean
    const booleanMatch = xml.match(/<boolean>(\d+)<\/boolean>/);
    if (booleanMatch) {
      console.log(`[OdooService] parseXmlValue - Found boolean:`, booleanMatch[1]);
      return booleanMatch[1] === '1';
    }

    // Check for array
    if (xml.includes('<array>')) {
      console.log(`[OdooService] parseXmlValue - Found array, calling parseXmlArray`);
      return this.parseXmlArray(xml);
    }
    
    console.log(`[OdooService] parseXmlValue - No matching type found`);
    return null;
  }

  private parseXmlArray(xml: string): any[] {
    const result: any[] = [];
    
    console.log(`[OdooService] parseXmlArray - Input XML length:`, xml.length);
    console.log(`[OdooService] parseXmlArray - Input XML start:`, xml.substring(0, 200));
    
    // Try multiple approaches to find the array data
    let valueMatches: string[] | null = null;
    
    // Approach 1: Look for <data> section with a more flexible regex
    const dataMatch = xml.match(/<data>([\s\S]*?)<\/data>/);
    if (dataMatch) {
      const dataContent = dataMatch[1];
      console.log(`[OdooService] parseXmlArray - Found data section, length:`, dataContent.length);
      
      // Use depth counter to find complete <value> elements
      const valueElements: string[] = [];
      let i = 0;
      while (i < dataContent.length) {
        const valueStart = dataContent.indexOf('<value>', i);
        if (valueStart === -1) break;
        
        // Find the corresponding closing value tag
        let depth = 0;
        let valueEnd = -1;
        let j = valueStart;
        
        while (j < dataContent.length) {
          if (dataContent.substring(j, j + 7) === '<value>') {
            depth++;
          } else if (dataContent.substring(j, j + 8) === '</value>') {
            depth--;
            if (depth === 0) {
              valueEnd = j + 8;
              break;
            }
          }
          j++;
        }
        
        if (valueEnd !== -1) {
          const valueElement = dataContent.substring(valueStart, valueEnd);
          valueElements.push(valueElement);
          i = valueEnd;
        } else {
          i = valueStart + 7;
        }
      }
      
      valueMatches = valueElements;
      console.log(`[OdooService] parseXmlArray - Found ${valueMatches?.length || 0} value matches in data section`);
    }
    
    // Approach 2: If no data section or no values found, try direct search
    if (!valueMatches || valueMatches.length === 0) {
      console.log(`[OdooService] parseXmlArray - Trying direct value search`);
      valueMatches = xml.match(/<value>([\s\S]*?)<\/value>/g);
      console.log(`[OdooService] parseXmlArray - Direct search found ${valueMatches?.length || 0} value matches`);
    }
    
    // Approach 3: Try a different regex pattern that might work better
    if (!valueMatches || valueMatches.length === 0) {
      console.log(`[OdooService] parseXmlArray - Trying alternative regex pattern`);
      // Look for <value> tags that contain <struct> (which indicates user data)
      valueMatches = xml.match(/<value>\s*<struct>[\s\S]*?<\/struct>\s*<\/value>/g);
      console.log(`[OdooService] parseXmlArray - Alternative pattern found ${valueMatches?.length || 0} value matches`);
    }
    
    // Process the found value matches
    if (valueMatches && valueMatches.length > 0) {
      for (const match of valueMatches) {
        console.log(`[OdooService] parseXmlArray - Processing match:`, match.substring(0, 100) + '...');
        // Use a more robust approach to extract the complete value content
        // Find the start of the value tag
        const valueStart = match.indexOf('<value>');
        if (valueStart === -1) {
          console.log(`[OdooService] parseXmlArray - No value tag found in match`);
          continue;
        }
        
        // Find the corresponding closing value tag by counting nested tags
        let depth = 0;
        let valueEnd = -1;
        let i = valueStart;
        
        console.log(`[OdooService] parseXmlArray - Starting depth search from position ${valueStart}`);
        
        while (i < match.length) {
          if (match.substring(i, i + 7) === '<value>') {
            depth++;
            console.log(`[OdooService] parseXmlArray - Found <value> at position ${i}, depth now ${depth}`);
          } else if (match.substring(i, i + 8) === '</value>') {
            depth--;
            console.log(`[OdooService] parseXmlArray - Found </value> at position ${i}, depth now ${depth}`);
            if (depth === 0) {
              valueEnd = i + 8;
              console.log(`[OdooService] parseXmlArray - Found matching closing tag at position ${valueEnd}`);
              break;
            }
          }
          i++;
        }
        
        if (valueEnd === -1) {
          console.log(`[OdooService] parseXmlArray - Could not find matching closing value tag. Final depth: ${depth}`);
          console.log(`[OdooService] parseXmlArray - Match preview:`, match.substring(0, 200));
          continue;
        }
        
        // Extract the content between the value tags
        const content = match.substring(valueStart + 7, valueEnd - 8);
        console.log(`[OdooService] parseXmlArray - Processing content, length:`, content.length);
        console.log(`[OdooService] parseXmlArray - Content start:`, content.substring(0, 200));
        const item = this.parseXmlValue(content);
        console.log(`[OdooService] parseXmlArray - Parsed item:`, item);
        if (item !== null) {
          result.push(item);
        }
      }
    } else {
      console.log(`[OdooService] parseXmlArray - No value matches found in any approach`);
      // Debug: Let's see what the XML actually contains
      console.log(`[OdooService] parseXmlArray - Full XML length:`, xml.length);
      console.log(`[OdooService] parseXmlArray - XML contains <value>:`, xml.includes('<value>'));
      console.log(`[OdooService] parseXmlArray - XML contains <struct>:`, xml.includes('<struct>'));
    }
    
    console.log(`[OdooService] parseXmlArray - Final result:`, result);
    return result;
  }

  private parseXmlStruct(xml: string): any {
    const result: any = {};
    console.log(`[OdooService] parseXmlStruct - Input XML:`, xml.substring(0, 200) + '...');
    console.log(`[OdooService] parseXmlStruct - Full XML length:`, xml.length);
    console.log(`[OdooService] parseXmlStruct - XML contains <member>:`, xml.includes('<member>'));
    console.log(`[OdooService] parseXmlStruct - XML contains <name>:`, xml.includes('<name>'));
    console.log(`[OdooService] parseXmlStruct - XML contains <value>:`, xml.includes('<value>'));
    
    // Use a more robust approach to find member tags
    // First try the exact pattern
    let memberMatches = xml.match(/<member><name>(.*?)<\/name><value>([\s\S]*?)<\/value><\/member>/g);
    
    // If no matches, try a more flexible approach
    if (!memberMatches || memberMatches.length === 0) {
      console.log(`[OdooService] parseXmlStruct - Trying flexible member matching`);
      memberMatches = xml.match(/<member>[\s\S]*?<\/member>/g);
    }
    console.log(`[OdooService] parseXmlStruct - Found ${memberMatches?.length || 0} member matches`);
    
    if (memberMatches) {
      for (const match of memberMatches) {
        console.log(`[OdooService] parseXmlStruct - Processing member:`, match.substring(0, 100) + '...');
        
        const nameMatch = match.match(/<name>(.*?)<\/name>/);
        const valueMatch = match.match(/<value>([\s\S]*?)<\/value>/);
        if (nameMatch && valueMatch) {
          const name = nameMatch[1];
          const value = this.parseXmlValue(valueMatch[1]);
          console.log(`[OdooService] parseXmlStruct - Parsed member: ${name} =`, value);
          result[name] = value;
        } else {
          console.log(`[OdooService] parseXmlStruct - Failed to parse member:`, match.substring(0, 100));
        }
      }
    }
    
    console.log(`[OdooService] parseXmlStruct - Final result:`, result);
    return result;
  }

  /**
   * Check if a given Odoo model is available for the current user/database
   */
  async isModelAvailable(modelName: string): Promise<Result<boolean>> {
    try {
      const requestId = uuidv4();
      const domain = [['model', '=', modelName]];
      const params = [domain, ['model'], 0, 1];
      const result = await this.executeRPC('ir.model', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }
      const rows = (result.data as any[]) || [];
      return Result.success(Array.isArray(rows) && rows.length > 0, requestId);
    } catch (error: any) {
      return Result.error('Failed to verify model availability', error.message);
    }
  }

  /**
   * Get Odoo tickets (helpdesk)
   */
  async getTickets(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooTicket[]>> {
    try {
      const requestId = uuidv4();
      // Do not force active=true; respect caller filters entirely
      const domain = this.buildDomainFromFilters(filters);
      // Dynamically sanitize fields against model metadata
      const fieldsToFetch = await this.sanitizeTicketFields('helpdesk.ticket', Array.isArray(fields) ? fields : []);

      console.log(`[OdooService] getTickets - Domain:`, JSON.stringify(domain));
      console.log(`[OdooService] getTickets - Fields:`, fieldsToFetch);
      console.log(`[OdooService] getTickets - Offset:`, offset, 'Limit:', limit);

      // Use search_read directly to avoid manual mapping issues
      const params = [domain, fieldsToFetch, offset, limit];
      const sr = await this.executeRPC('helpdesk.ticket', 'search_read', params);
      if (sr.statusCode !== 1000) {
        return sr as Result<OdooTicket[]>;
      }
      const rawData = sr.data as any;
      console.log(`[OdooService] getTickets - Raw data from search_read:`, rawData);
      const tickets = this.mapRawToRecords(rawData, fieldsToFetch);
      return Result.success(tickets, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo tickets', error.message);
    }
  }

  /**
   * Get Odoo ticket by ID
   */
  async getTicketById(id: number, fields: string[] = []): Promise<Result<OdooTicket | null>> {
    try {
      const requestId = uuidv4();
      // Dynamically sanitize fields against model metadata
      const fieldsToFetch = await this.sanitizeTicketFields('helpdesk.ticket', Array.isArray(fields) ? fields : []);

      const params = [[id], fieldsToFetch];
      const result = await this.executeRPC('helpdesk.ticket', 'read', params);
      if (result.statusCode !== 1000) {
        return result as Result<OdooTicket | null>;
      }
      const rawData = result.data as any[];
      if (Array.isArray(rawData) && rawData.length > 0) {
        if (typeof rawData[0] === 'object' && !Array.isArray(rawData[0])) {
          return Result.success(rawData[0] as OdooTicket, requestId);
        }
        if (Array.isArray(rawData[0])) {
          const rec = rawData[0] as any[];
          const ticket: any = {};
          fieldsToFetch.forEach((field, index) => {
            if (rec[index] !== undefined) {
              ticket[field] = rec[index];
            }
          });
          return Result.success(ticket as OdooTicket, requestId);
        }
        // Flat array of scalars as a single record
        if (typeof rawData[0] !== 'object') {
          const ticket: any = {};
          fieldsToFetch.forEach((field, index) => {
            if (rawData[index] !== undefined) {
              ticket[field] = rawData[index];
            }
          });
          return Result.success(ticket as OdooTicket, requestId);
        }
      }
      return Result.success(null, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo ticket', error.message);
    }
  }

  /**
   * Create Odoo ticket
   */
  async createTicket(data: Partial<OdooTicket>): Promise<Result<OdooTicket>> {
    try {
      const requestId = uuidv4();
      const params = [data];
      const result = await this.executeRPC('helpdesk.ticket', 'create', params);
      if (result.statusCode !== 1000) {
        return result;
      }
      const newId = result.data as number;
      const readParams = [[newId], [] as string[]];
      const readResult = await this.executeRPC('helpdesk.ticket', 'read', readParams);
      if (readResult.statusCode !== 1000) {
        return Result.success({ id: newId } as unknown as OdooTicket, requestId);
      }
      const rows = readResult.data as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        if (typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
          return Result.success(rows[0] as OdooTicket, requestId);
        }
      }
      return Result.success({ id: newId } as unknown as OdooTicket, requestId);
    } catch (error: any) {
      return Result.error('Failed to create Odoo ticket', error.message);
    }
  }

  /**
   * Update Odoo ticket
   */
  async updateTicket(id: number, data: Partial<OdooTicket>): Promise<Result<OdooTicket>> {
    try {
      const requestId = uuidv4();
      // Odoo write expects a list of ids
      const params = [[id], data];
      const result = await this.executeRPC('helpdesk.ticket', 'write', params);
      if (result.statusCode !== 1000) {
        return result;
      }
      const readParams = [[id], [] as string[]];
      const readResult = await this.executeRPC('helpdesk.ticket', 'read', readParams);
      if (readResult.statusCode !== 1000) {
        return Result.success({ id } as unknown as OdooTicket, requestId);
      }
      const rows = readResult.data as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        if (typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
          return Result.success(rows[0] as OdooTicket, requestId);
        }
      }
      return Result.success({ id } as unknown as OdooTicket, requestId);
    } catch (error: any) {
      return Result.error('Failed to update Odoo ticket', error.message);
    }
  }
  /**
   * Get Odoo users
   */
  async getUsers(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooUser[]>> {
    try {
      const requestId = uuidv4();
      // Use proper Odoo search_read format: domain, fields, offset, limit
      const domain = []; // No filters to get all users
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'login', 'email', 'active'];
      
      const params = [
        domain,           // Domain array
        fieldsToFetch,    // Fields array
        offset,           // Offset
        limit             // Limit
      ];

      console.log(`[OdooService] getUsers params:`, JSON.stringify(params, null, 2));
      console.log(`[OdooService] getUsers - PROPER DOMAIN FORMAT TEST`);
      const result = await this.executeRPC('res.users', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      // Transform the flat array of values into structured objects
      const users: OdooUser[] = [];
      const rawData = result.data as any[];
      
      console.log(`[OdooService] getUsers - Raw data:`, rawData);
      
      if (Array.isArray(rawData)) {
        // Check if we have a single record (array of values) or multiple records
        if (rawData.length > 0 && !Array.isArray(rawData[0])) {
          // Single record: rawData is [value1, value2, value3, ...]
          const user: any = {};
          fieldsToFetch.forEach((field, index) => {
            if (rawData[index] !== undefined) {
              user[field] = rawData[index];
            }
          });
          users.push(user as OdooUser);
        } else {
          // Multiple records: rawData is [[value1, value2, ...], [value1, value2, ...], ...]
          for (const record of rawData) {
            if (Array.isArray(record)) {
              const user: any = {};
              fieldsToFetch.forEach((field, index) => {
                if (record[index] !== undefined) {
                  user[field] = record[index];
                }
              });
              users.push(user as OdooUser);
            }
          }
        }
      }

      console.log(`[OdooService] getUsers - Transformed ${users.length} users:`, users);
      return Result.success(users, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo users', error.message);
    }
  }

  /**
   * Get Odoo user by ID
   */
  async getUserById(id: number, fields: string[] = []): Promise<Result<OdooUser | null>> {
    try {
      const requestId = uuidv4();
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'login', 'email', 'active'];
      
      const params = [
        [id],
        fieldsToFetch
      ];

      const result = await this.executeRPC('res.users', 'read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      if (result.data && result.data.length > 0) {
        return Result.success(result.data[0] as OdooUser, requestId);
      }

      return Result.success(null, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo user', error.message);
    }
  }

  /**
 * Get Odoo customers
 */
  async getCustomers(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooCustomer[]>> {
    try {
      const requestId = uuidv4();
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'display_name', 'email', 'phone', 'is_company'];
      // Try to get all customers by using a domain that includes all records
      // Build domain from filters
      const domain = this.buildDomainFromFilters(filters);
      const params = [
        domain, // Domain array to get all customers
        fieldsToFetch, // Fields array
        offset, // Separate the offset as a positional argument
        limit  // Separate the limit as a positional argument
      ];

      console.log(`[OdooService] getCustomers - Domain:`, domain);
      console.log(`[OdooService] getCustomers - Fields:`, fieldsToFetch);
      console.log(`[OdooService] getCustomers - Offset:`, offset);
      console.log(`[OdooService] getCustomers - Limit:`, limit);

      const result = await this.executeRPC('res.partner', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      // Transform the struct data into structured objects
      const customers: OdooCustomer[] = [];
      const rawData = result.data as any[];
      
      console.log(`[OdooService] getCustomers - Raw data:`, rawData);
      
      if (Array.isArray(rawData)) {
        // Each item in rawData is a struct (object) with field names as keys
        for (const record of rawData) {
          if (record && typeof record === 'object') {
            const customer: any = {};
            fieldsToFetch.forEach((field) => {
              if (record[field] !== undefined) {
                customer[field] = record[field];
              }
            });
            customers.push(customer as OdooCustomer);
          }
        }
      }

      console.log(`[OdooService] getCustomers - Transformed ${customers.length} customers:`, customers);
      return Result.success(customers, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo customers', error.message);
    }
  }


  /**
   * Get Odoo customer by ID
   */
  async getCustomerById(id: number, fields: string[] = []): Promise<Result<OdooCustomer | null>> {
    try {
      const requestId = uuidv4();
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'email', 'phone', 'is_company', 'display_name'];
      
      // Use search_read instead of read to be consistent with getCustomers
      const domain = [['id', '=', id]];
      const params = [
        domain,
        fieldsToFetch,
        0,  // offset
        1   // limit
      ];

      const result = await this.executeRPC('res.partner', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      // Transform the struct data into structured objects
      const rawData = result.data as any[];
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Each item in rawData is a struct (object) with field names as keys
        const record = rawData[0];
        if (record && typeof record === 'object') {
          const customer: any = {};
          fieldsToFetch.forEach((field) => {
            if (record[field] !== undefined) {
              customer[field] = record[field];
            }
          });
          return Result.success(customer as OdooCustomer, requestId);
        }
      }

      return Result.success(null, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo customer', error.message);
    }
  }

  /**
   * Create Odoo customer
   */
  async createCustomer(customerData: Partial<OdooCustomer>): Promise<Result<number>> {
    try {
      const requestId = uuidv4();
      const params = [customerData];

      const result = await this.executeRPC('res.partner', 'create', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as number, requestId);
    } catch (error: any) {
      return Result.error('Failed to create Odoo customer', error.message);
    }
  }

  /**
   * Update Odoo customer
   */
  async updateCustomer(id: number, customerData: Partial<OdooCustomer>): Promise<Result<boolean>> {
    try {
      const requestId = uuidv4();
      const params = [id, customerData];

      const result = await this.executeRPC('res.partner', 'write', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as boolean, requestId);
    } catch (error: any) {
      return Result.error('Failed to update Odoo customer', error.message);
    }
  }

  /**
   * Get Odoo leads
   */
  async getLeads(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooLead[]>> {
    try {
      const requestId = uuidv4();
      // Use proper Odoo search_read format: domain, fields, offset, limit
      const domain = [['active', '=', true]]; // Filter active leads
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'partner_name', 'email_from', 'phone', 'type'];
      
      const params = [
        domain,           // Domain array
        fieldsToFetch,    // Fields array
        offset,           // Offset
        limit             // Limit
      ];

      const result = await this.executeRPC('crm.lead', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as OdooLead[], requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo leads', error.message);
    }
  }

  /**
   * Get Odoo lead by ID
   */
  async getLeadById(id: number, fields: string[] = []): Promise<Result<OdooLead | null>> {
    try {
      const requestId = uuidv4();
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'partner_name', 'email_from', 'phone', 'type'];
      
      const params = [
        [id],
        fieldsToFetch
      ];

      const result = await this.executeRPC('crm.lead', 'read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      if (result.data && result.data.length > 0) {
        return Result.success(result.data[0] as OdooLead, requestId);
      }

      return Result.success(null, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo lead', error.message);
    }
  }

  /**
   * Create Odoo lead
   */
  async createLead(leadData: Partial<OdooLead>): Promise<Result<number>> {
    try {
      const requestId = uuidv4();
      const params = [leadData];

      const result = await this.executeRPC('crm.lead', 'create', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as number, requestId);
    } catch (error: any) {
      return Result.error('Failed to create Odoo lead', error.message);
    }
  }

  /**
   * Update Odoo lead
   */
  async updateLead(id: number, leadData: Partial<OdooLead>): Promise<Result<boolean>> {
    try {
      const requestId = uuidv4();
      const params = [id, leadData];

      const result = await this.executeRPC('crm.lead', 'write', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as boolean, requestId);
    } catch (error: any) {
      return Result.error('Failed to update Odoo lead', error.message);
    }
  }

  /**
   * Get Odoo opportunities
   */
  async getOpportunities(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooOpportunity[]>> {
    try {
      const requestId = uuidv4();
      // Use proper Odoo search_read format: domain, fields, offset, limit
      const domain = [['type', '=', 'opportunity'], ['active', '=', true]]; // Filter opportunities
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'partner_id', 'expected_revenue', 'probability'];
      
      const params = [
        domain,           // Domain array
        fieldsToFetch,    // Fields array
        offset,           // Offset
        limit             // Limit
      ];

      const result = await this.executeRPC('crm.lead', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as OdooOpportunity[], requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo opportunities', error.message);
    }
  }

  /**
   * Get Odoo products
   */
  async getProducts(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooProduct[]>> {
    try {
      const requestId = uuidv4();
      // Use proper Odoo search_read format: domain, fields, offset, limit
      const domain = [['active', '=', true]]; // Filter active products
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'default_code', 'list_price', 'type'];
      
      const params = [
        domain,           // Domain array
        fieldsToFetch,    // Fields array
        offset,           // Offset
        limit             // Limit
      ];

      const result = await this.executeRPC('product.template', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as OdooProduct[], requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo products', error.message);
    }
  }

  /**
   * Get Odoo orders
   */
  async getOrders(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooOrder[]>> {
    try {
      const requestId = uuidv4();
      // Use proper Odoo search_read format: domain, fields, offset, limit
      const domain = [['active', '=', true]]; // Filter active orders
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'partner_id', 'date_order', 'amount_total', 'state'];
      
      const params = [
        domain,           // Domain array
        fieldsToFetch,    // Fields array
        offset,           // Offset
        limit             // Limit
      ];

      const result = await this.executeRPC('sale.order', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      return Result.success(result.data as OdooOrder[], requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo orders', error.message);
    }
  }

  /**
   * Get Odoo contacts (individual partners)
   */
  async getContacts(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooCustomer[]>> {
    try {
      const requestId = uuidv4();
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'email', 'phone', 'is_company', 'display_name'];
      // Build domain from filters and add default contact filter
      const baseDomain = [['is_company', '=', false]]; // Default filter for contacts
      const filterDomain = this.buildDomainFromFilters(filters);
      const domain = [...baseDomain, ...filterDomain];
      const params = [
        domain, // Domain array to get contacts
        fieldsToFetch, // Fields array
        offset, // Separate the offset as a positional argument
        limit  // Separate the limit as a positional argument
      ];

      const result = await this.executeRPC('res.partner', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      // Transform the raw data into structured objects
      const contacts: OdooCustomer[] = [];
      const rawData = result.data as any[];
      
      if (Array.isArray(rawData)) {
        // Each item in rawData is a struct (object) with field names as keys
        for (const record of rawData) {
          if (record && typeof record === 'object') {
            const contact: any = {};
            fieldsToFetch.forEach((field) => {
              if (record[field] !== undefined) {
                contact[field] = record[field];
              }
            });
            contacts.push(contact as OdooCustomer);
          }
        }
      }

      return Result.success(contacts, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo contacts', error.message);
    }
  }

  /**
   * Get Odoo contact by ID
   */
  async getContactById(id: number, fields: string[] = []): Promise<Result<OdooCustomer | null>> {
    try {
      const requestId = uuidv4();
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'email', 'phone', 'is_company', 'display_name'];
      
      // Use search_read instead of read to be consistent with getContacts
      const domain = [['id', '=', id], ['is_company', '=', false]];
      const params = [
        domain,
        fieldsToFetch,
        0,  // offset
        1   // limit
      ];

      const result = await this.executeRPC('res.partner', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      // Transform the struct data into structured objects
      const rawData = result.data as any[];
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Each item in rawData is a struct (object) with field names as keys
        const record = rawData[0];
        if (record && typeof record === 'object') {
          const contact: any = {};
          fieldsToFetch.forEach((field) => {
            if (record[field] !== undefined) {
              contact[field] = record[field];
            }
          });
          return Result.success(contact as OdooCustomer, requestId);
        }
      }

      return Result.success(null, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo contact', error.message);
    }
  }

  /**
   * Get Odoo invoices
   */
  async getInvoices(filters: any = {}, fields: string[] = [], limit: number = 100, offset: number = 0): Promise<Result<OdooInvoice[]>> {
    try {
      const requestId = uuidv4();
      // Build domain from filters and add default invoice filter
      const baseDomain = [['move_type', 'in', ['out_invoice', 'in_invoice']], ['active', '=', true]]; // Default filter for invoices
      const filterDomain = this.buildDomainFromFilters(filters);
      const domain = [...baseDomain, ...filterDomain];
      const fieldsToFetch = fields.length > 0 ? fields : ['id', 'name', 'partner_id', 'date', 'amount_total', 'state'];
      
      const params = [
        domain,           // Domain array
        fieldsToFetch,    // Fields array
        offset,           // Offset
        limit             // Limit
      ];

      const result = await this.executeRPC('account.move', 'search_read', params);
      if (result.statusCode !== 1000) {
        return result;
      }

      // Transform the raw data into structured objects
      const invoices: OdooInvoice[] = [];
      const rawData = result.data as any[];
      
      if (Array.isArray(rawData)) {
        // Each item in rawData is a struct (object) with field names as keys
        for (const record of rawData) {
          if (record && typeof record === 'object') {
            const invoice: any = {};
            fieldsToFetch.forEach((field) => {
              if (record[field] !== undefined) {
                invoice[field] = record[field];
              }
            });
            invoices.push(invoice as OdooInvoice);
          }
        }
      }

      return Result.success(invoices, requestId);
    } catch (error: any) {
      return Result.error('Failed to fetch Odoo invoices', error.message);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; uid: number | null; sessionId: string | null } {
    return {
      isConnected: this.isConnected,
      uid: this.uid,
      sessionId: this.sessionId
    };
  }

  /**
   * Disconnect from Odoo
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.uid = null;
    this.sessionId = null;
  }
} 