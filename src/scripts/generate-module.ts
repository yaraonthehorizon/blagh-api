#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

async function generateModule(moduleName: string): Promise<void> {
  // Validate module name
  if (!moduleName || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(moduleName)) {
    throw new Error('Invalid module name. Use only letters, numbers, hyphens, and underscores. Must start with a letter.');
  }

  const moduleNameCapitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  const currentDir = process.cwd();

  // Check for required API project structure
  const requiredDirs = ['src/modules'];
  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(currentDir, dir)));
  if (missingDirs.length > 0) {
    throw new Error(`This command should be run from a diagramers API project. Missing directories: ${missingDirs.join(', ')}`);
  }

  // Create module directory structure
  const modulePath = path.join(currentDir, 'src/modules', moduleName);
  if (!fs.existsSync(modulePath)) {
    fs.mkdirSync(modulePath, { recursive: true });
    fs.mkdirSync(path.join(modulePath, 'entities'), { recursive: true });
    fs.mkdirSync(path.join(modulePath, 'schemas'), { recursive: true });
    fs.mkdirSync(path.join(modulePath, 'services'), { recursive: true });
    fs.mkdirSync(path.join(modulePath, 'controllers'), { recursive: true });
    fs.mkdirSync(path.join(modulePath, 'routes'), { recursive: true });
  }

  console.log('📝 Creating entity...');
  const entityContent = generateEntityContent(moduleName, moduleNameCapitalized);
  fs.writeFileSync(path.join(modulePath, 'entities', `${moduleName}.entity.ts`), entityContent);

  console.log('📋 Creating schema...');
  const schemaContent = generateSchemaContent(moduleName, moduleNameCapitalized);
  fs.writeFileSync(path.join(modulePath, 'schemas', `${moduleName}.schema.ts`), schemaContent);

  console.log('🔧 Creating service...');
  const serviceContent = generateServiceContent(moduleName, moduleNameCapitalized);
  fs.writeFileSync(path.join(modulePath, 'services', `${moduleName}.service.ts`), serviceContent);

  console.log('🎮 Creating controller...');
  const controllerContent = generateControllerContent(moduleName, moduleNameCapitalized);
  fs.writeFileSync(path.join(modulePath, 'controllers', `${moduleName}.controller.ts`), controllerContent);

  console.log('🛣️ Creating routes...');
  const routesContent = generateRoutesContent(moduleName, moduleNameCapitalized);
  fs.writeFileSync(path.join(modulePath, 'routes', `${moduleName}.routes.ts`), routesContent);

  // Register routes in server manager
  console.log('🔗 Registering routes...');
  await registerModuleRoutes(currentDir, moduleName, moduleNameCapitalized);

  // Create database table/collection
  console.log('🗄️ Creating database table...');
  await createDatabaseTable(currentDir, moduleName, moduleNameCapitalized);

  console.log('✅ Module generation completed!');
  console.log(`📁 Module: src/modules/${moduleName}/`);
  console.log(`🔗 Routes: /api/${moduleName}s`);
  console.log(`🗄️ Database: ${moduleName} collection`);
}

function generateEntityContent(moduleName: string, moduleNameCapitalized: string): string {
  return `import { BaseEntity } from '../../shared/types/base-entity';

export interface ${moduleNameCapitalized} extends BaseEntity {
  _id?: string;
  name: string;
  description?: string;
}

export interface Create${moduleNameCapitalized}Data {
  name: string;
  description?: string;
}

export interface Update${moduleNameCapitalized}Data {
  name?: string;
  description?: string;
}
`;
}

function generateSchemaContent(moduleName: string, moduleNameCapitalized: string): string {
  return `import mongoose, { Document, Schema } from 'mongoose';
import { ${moduleNameCapitalized} } from '../entities/${moduleName}.entity';

export interface I${moduleNameCapitalized}Document extends Omit<${moduleNameCapitalized}, '_id'>, Document {}

const ${moduleNameCapitalized}Schema = new Schema<I${moduleNameCapitalized}Document>({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ${moduleNameCapitalized}Model = mongoose.model<I${moduleNameCapitalized}Document>('${moduleNameCapitalized}', ${moduleNameCapitalized}Schema);
`;
}

function generateServiceContent(moduleName: string, moduleNameCapitalized: string): string {
  return `import { Result } from '../../shared/types/result';
import { ${moduleNameCapitalized}Model, I${moduleNameCapitalized}Document } from '../schemas/${moduleName}.schema';
import { ${moduleNameCapitalized}, Create${moduleNameCapitalized}Data, Update${moduleNameCapitalized}Data } from '../entities/${moduleName}.entity';

export class ${moduleNameCapitalized}Service {
  async getAll(): Promise<Result<${moduleNameCapitalized}[]>> {
    try {
      const items = await ${moduleNameCapitalized}Model.find({ status: 1 }).lean();
      const transformedItems = items.map(item => ({
        ...item,
        _id: item._id.toString()
      })) as ${moduleNameCapitalized}[];
      return Result.success(transformedItems);
    } catch (error: any) {
      return Result.error('Failed to get ${moduleName}s');
    }
  }

  async getById(id: string): Promise<Result<${moduleNameCapitalized} | null>> {
    try {
      const item = await ${moduleNameCapitalized}Model.findById(id);
      if (!item) {
        return Result.notFound('${moduleNameCapitalized} not found');
      }
      const itemObj = item.toObject();
      itemObj._id = itemObj._id.toString();
      return Result.success(itemObj as ${moduleNameCapitalized});
    } catch (error: any) {
      return Result.error('Failed to get ${moduleNameCapitalized}');
    }
  }

  async create(data: Create${moduleNameCapitalized}Data): Promise<Result<${moduleNameCapitalized}>> {
    try {
      const entity = new ${moduleNameCapitalized}Model({ ...data, status: 1 });
      const savedItem = await entity.save();
      const itemObj = savedItem.toObject();
      itemObj._id = itemObj._id.toString();
      return Result.success(itemObj as ${moduleNameCapitalized});
    } catch (error: any) {
      return Result.error('Failed to create ${moduleNameCapitalized}');
    }
  }

  async update(id: string, data: Update${moduleNameCapitalized}Data): Promise<Result<${moduleNameCapitalized} | null>> {
    try {
      const item = await ${moduleNameCapitalized}Model.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!item) {
        return Result.notFound('${moduleNameCapitalized} not found');
      }
      
      const itemObj = item.toObject();
      itemObj._id = itemObj._id.toString();
      return Result.success(itemObj as ${moduleNameCapitalized});
    } catch (error: any) {
      return Result.error('Failed to update ${moduleNameCapitalized}');
    }
  }

  async delete(id: string): Promise<Result<${moduleNameCapitalized} | null>> {
    try {
      const item = await ${moduleNameCapitalized}Model.findByIdAndUpdate(
        id,
        { status: 0, updatedAt: new Date() },
        { new: true }
      );
      
      if (!item) {
        return Result.notFound('${moduleNameCapitalized} not found');
      }
      
      const itemObj = item.toObject();
      itemObj._id = itemObj._id.toString();
      return Result.success(itemObj as ${moduleNameCapitalized});
    } catch (error: any) {
      return Result.error('Failed to delete ${moduleNameCapitalized}');
    }
  }
}
`;
}

function generateControllerContent(moduleName: string, moduleNameCapitalized: string): string {
  return `import { Request, Response } from 'express';
import { ${moduleNameCapitalized}Service } from '../services/${moduleName}.service';

export class ${moduleNameCapitalized}Controller {
  private ${moduleName}Service: ${moduleNameCapitalized}Service;

  constructor() {
    this.${moduleName}Service = new ${moduleNameCapitalized}Service();
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.${moduleName}Service.getAll();
      res.status(result.code).json(result);
    } catch (error) {
      console.error('Get all ${moduleName}s controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.${moduleName}Service.getById(id);
      res.status(result.code).json(result);
    } catch (error) {
      console.error('Get ${moduleName} by ID controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.${moduleName}Service.create(req.body);
      res.status(result.code).json(result);
    } catch (error) {
      console.error('Create ${moduleName} controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.${moduleName}Service.update(id, req.body);
      if (!result) {
        return res.status(404).json({ success: false, message: '${moduleNameCapitalized} not found' });
      }
      res.status(result.code).json(result);
    } catch (error) {
      console.error('Update ${moduleName} controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.${moduleName}Service.delete(id);
      res.status(result.code).json(result);
    } catch (error) {
      console.error('Delete ${moduleName} controller error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
`;
}

function generateRoutesContent(moduleName: string, moduleNameCapitalized: string): string {
  return `import { Router } from 'express';
import { ${moduleNameCapitalized}Controller } from '../controllers/${moduleName}.controller';

const router = Router();
const ${moduleName}Controller = new ${moduleNameCapitalized}Controller();

// ${moduleNameCapitalized} routes
router.get('/${moduleName}s', ${moduleName}Controller.getAll.bind(${moduleName}Controller));
router.get('/${moduleName}s/:id', ${moduleName}Controller.getById.bind(${moduleName}Controller));
router.post('/${moduleName}s', ${moduleName}Controller.create.bind(${moduleName}Controller));
router.put('/${moduleName}s/:id', ${moduleName}Controller.update.bind(${moduleName}Controller));
router.delete('/${moduleName}s/:id', ${moduleName}Controller.delete.bind(${moduleName}Controller));

export default router;
`;
}

async function registerModuleRoutes(currentDir: string, moduleName: string, moduleNameCapitalized: string): Promise<void> {
  const serverManagerPath = path.join(currentDir, 'src/core/server/manager.ts');
  
  if (!fs.existsSync(serverManagerPath)) {
    console.warn('⚠️ Server manager not found, routes will need to be registered manually');
    return;
  }

  let serverManagerContent = fs.readFileSync(serverManagerPath, 'utf8');
  
  // Add import for the new module routes
  const importStatement = `const ${moduleName}Routes = require('../../modules/${moduleName}/routes/${moduleName}.routes').default;`;
  
  // Find the registerPluginRoutes method
  const methodRegex = /private registerPluginRoutes\(\): void \{([^}]*)\}/s;
  const match = serverManagerContent.match(methodRegex);
  
  if (match) {
    const methodContent = match[1];
    
    // Add import if not already present
    if (!methodContent.includes(importStatement)) {
      const updatedMethodContent = methodContent + `\n    ${importStatement}`;
      serverManagerContent = serverManagerContent.replace(methodRegex, 
        `private registerPluginRoutes(): void {$1${updatedMethodContent}\n  }`);
    }
    
    // Add route registration
    const routeRegistration = `this.app.use('/api', ${moduleName}Routes);`;
    if (!methodContent.includes(routeRegistration)) {
      const updatedMethodContent = methodContent + `\n    ${routeRegistration}`;
      serverManagerContent = serverManagerContent.replace(methodRegex, 
        `private registerPluginRoutes(): void {$1${updatedMethodContent}\n  }`);
    }
    
    fs.writeFileSync(serverManagerPath, serverManagerContent);
    console.log('✅ Routes registered in server manager');
  } else {
    console.warn('⚠️ Could not find registerPluginRoutes method, routes will need to be registered manually');
  }
}

async function createDatabaseTable(currentDir: string, moduleName: string, moduleNameCapitalized: string): Promise<void> {
  // Create a database seeder script for the new module
  const seederScript = `import { ${moduleNameCapitalized}Model } from '../schemas/${moduleName}.schema';

export async function seed${moduleNameCapitalized}Table(): Promise<void> {
  try {
    // Create collection and indexes
    await ${moduleNameCapitalized}Model.createCollection();
    
    // Create indexes if needed
    await ${moduleNameCapitalized}Model.collection.createIndex({ name: 1 });
    await ${moduleNameCapitalized}Model.collection.createIndex({ createdAt: -1 });
    
    console.log(\`✅ ${moduleNameCapitalized} table/collection created successfully\`);
  } catch (error) {
    console.error(\`❌ Failed to create ${moduleNameCapitalized} table:\`, error);
    throw error;
  }
}

// Auto-run when imported
seed${moduleNameCapitalized}Table().catch(console.error);
`;

  const seederPath = path.join(currentDir, 'src/scripts', `seed-${moduleName}.ts`);
  fs.writeFileSync(seederPath, seederScript);
  
  // Add to main seeder
  const mainSeederPath = path.join(currentDir, 'src/core/database/seeder.ts');
  if (fs.existsSync(mainSeederPath)) {
    let seederContent = fs.readFileSync(mainSeederPath, 'utf8');
    
    // Add import
    const importStatement = `import { seed${moduleNameCapitalized}Table } from '../../scripts/seed-${moduleName}';`;
    if (!seederContent.includes(importStatement)) {
      seederContent = seederContent.replace(
        /import.*from.*['"];?\s*$/gm,
        `$&\n${importStatement}`
      );
    }
    
    // Add to seeding methods
    const seedMethodRegex = /async seedAll\(\): Promise<void> \{([^}]*)\}/s;
    const match = seederContent.match(seedMethodRegex);
    
    if (match) {
      const methodContent = match[1];
      const seedCall = `await seed${moduleNameCapitalized}Table();`;
      
      if (!methodContent.includes(seedCall)) {
        const updatedMethodContent = methodContent + `\n      ${seedCall}`;
        seederContent = seederContent.replace(seedMethodRegex, 
          `async seedAll(): Promise<void> {$1${updatedMethodContent}\n  }`);
      }
    }
    
    fs.writeFileSync(mainSeederPath, seederContent);
  }
  
  console.log('✅ Database table creation script added');
}

async function main() {
  const args = process.argv.slice(2);
  const moduleName = args[0];

  if (!moduleName) {
    console.error('❌ Module name is required');
    console.log('Usage: npm run generate:module <module-name>');
    console.log('Example: npm run generate:module product');
    process.exit(1);
  }

  try {
    await generateModule(moduleName);
    console.log('✅ Module generated successfully!');
    console.log('🚀 Next steps:');
    console.log('   1. Review the generated files');
    console.log('   2. Customize business logic');
    console.log('   3. Run: npm start');
  } catch (error: any) {
    console.error('❌ Failed to generate module:', error.message);
    process.exit(1);
  }
}

main(); 