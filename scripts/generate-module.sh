#!/bin/bash

# Diagrammers API Module Generator (Refactored)
# Usage: ./scripts/generate-module.sh <module-name>

MODULE_NAME=$1
# Convert to PascalCase: first letter uppercase, rest lowercase, then capitalize each word after dash/underscore
MODULE_NAME_CAPITALIZED=$(echo $MODULE_NAME | sed 's/[-_]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | sed 's/ //g')
# Convert to camelCase for file names
MODULE_NAME_CAMELCASE=$(echo $MODULE_NAME | perl -pe 's/-([a-z])/\U$1/g; s/_([a-z])/\U$1/g')
MODULE_DIR="src/modules/${MODULE_NAME}"

if [ -z "$MODULE_NAME" ]; then
    echo "❌ Module name is required"
    echo "Usage: ./scripts/generate-module.sh <module-name>"
    echo "Example: ./scripts/generate-module.sh product"
    exit 1
fi

# Validate module name (only letters, numbers, hyphens, underscores)
if [[ ! $MODULE_NAME =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
    echo "❌ Invalid module name. Use only letters, numbers, hyphens, and underscores. Must start with a letter."
    exit 1
fi

# Create module directory structure
mkdir -p "$MODULE_DIR/controllers" "$MODULE_DIR/entities" "$MODULE_DIR/routes" "$MODULE_DIR/schemas" "$MODULE_DIR/services"

# Create entity
cat > "$MODULE_DIR/entities/${MODULE_NAME_CAMELCASE}.entity.ts" << EOF
import { BaseEntity } from '../../../shared/types/base-entity';

export interface ${MODULE_NAME_CAPITALIZED} extends BaseEntity {
  _id?: string;
  name: string;
  description?: string;
}

export interface Create${MODULE_NAME_CAPITALIZED}Data {
  name: string;
  description?: string;
}

export interface Update${MODULE_NAME_CAPITALIZED}Data {
  name?: string;
  description?: string;
}
EOF

# Create schema
cat > "$MODULE_DIR/schemas/${MODULE_NAME_CAMELCASE}.schema.ts" << EOF
import mongoose, { Document, Schema } from 'mongoose';
import { ${MODULE_NAME_CAPITALIZED} } from '../entities/${MODULE_NAME_CAMELCASE}.entity';

export interface I${MODULE_NAME_CAPITALIZED}Document extends Omit<${MODULE_NAME_CAPITALIZED}, '_id'>, Document {}

const ${MODULE_NAME_CAPITALIZED}Schema = new Schema<I${MODULE_NAME_CAPITALIZED}Document>({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ${MODULE_NAME_CAPITALIZED}Model = mongoose.model<I${MODULE_NAME_CAPITALIZED}Document>('${MODULE_NAME_CAPITALIZED}', ${MODULE_NAME_CAPITALIZED}Schema);
EOF

# Create service
cat > "$MODULE_DIR/services/${MODULE_NAME_CAMELCASE}.service.ts" << EOF
import { Result } from '../../../shared/types/result';
import { ${MODULE_NAME_CAPITALIZED}Model, I${MODULE_NAME_CAPITALIZED}Document } from '../schemas/${MODULE_NAME_CAMELCASE}.schema';
import { ${MODULE_NAME_CAPITALIZED}, Create${MODULE_NAME_CAPITALIZED}Data, Update${MODULE_NAME_CAPITALIZED}Data } from '../entities/${MODULE_NAME_CAMELCASE}.entity';

export class ${MODULE_NAME_CAPITALIZED}Service {
    async getAll(): Promise<Result<${MODULE_NAME_CAPITALIZED}[]>> {
        try {
            const items = await ${MODULE_NAME_CAPITALIZED}Model.find({ status: 1 }).lean();
            const transformedItems = items.map(item => ({
                ...item,
                _id: item._id.toString()
            })) as ${MODULE_NAME_CAPITALIZED}[];
            return Result.success(transformedItems);
        } catch (error: any) {
            return Result.error('Failed to fetch ${MODULE_NAME}s', error.message);
        }
    }

    async getById(id: string): Promise<Result<${MODULE_NAME_CAPITALIZED} | null>> {
        try {
            const item = await ${MODULE_NAME_CAPITALIZED}Model.findOne({ _id: id, status: 1 });
            if (!item) {
                return Result.error('${MODULE_NAME_CAPITALIZED} not found', '${MODULE_NAME_CAPITALIZED} with the specified ID does not exist');
            }
            const itemObj = item.toObject();
            itemObj._id = itemObj._id.toString();
            return Result.success(itemObj as ${MODULE_NAME_CAPITALIZED});
        } catch (error: any) {
            return Result.error('Failed to fetch ${MODULE_NAME}', error.message);
        }
    }

    async create(data: Create${MODULE_NAME_CAPITALIZED}Data): Promise<Result<${MODULE_NAME_CAPITALIZED}>> {
        try {
            const entity = new ${MODULE_NAME_CAPITALIZED}Model({ ...data, status: 1 });
            const savedItem = await entity.save();
            const itemObj = savedItem.toObject();
            itemObj._id = itemObj._id.toString();
            return Result.success(itemObj as ${MODULE_NAME_CAPITALIZED});
        } catch (error: any) {
            return Result.error('Failed to create ${MODULE_NAME}', error.message);
        }
    }

    async update(id: string, data: Update${MODULE_NAME_CAPITALIZED}Data): Promise<Result<${MODULE_NAME_CAPITALIZED} | null>> {
        try {
            const updatedItem = await ${MODULE_NAME_CAPITALIZED}Model.findByIdAndUpdate(id, { ...data }, { new: true });
            if (!updatedItem) {
                return Result.error('${MODULE_NAME_CAPITALIZED} not found', '${MODULE_NAME_CAPITALIZED} with the specified ID does not exist');
            }
            const itemObj = updatedItem.toObject();
            itemObj._id = itemObj._id.toString();
            return Result.success(itemObj as ${MODULE_NAME_CAPITALIZED});
        } catch (error: any) {
            return Result.error('Failed to update ${MODULE_NAME}', error.message);
        }
    }

    async delete(id: string): Promise<Result<boolean>> {
        try {
            const deletedItem = await ${MODULE_NAME_CAPITALIZED}Model.findByIdAndUpdate(id, { status: 0 }, { new: true });
            if (!deletedItem) {
                return Result.error('${MODULE_NAME_CAPITALIZED} not found', '${MODULE_NAME_CAPITALIZED} with the specified ID does not exist');
            }
            return Result.success(true);
        } catch (error: any) {
            return Result.error('Failed to delete ${MODULE_NAME}', error.message);
        }
    }
}
EOF

# Create controller
cat > "$MODULE_DIR/controllers/${MODULE_NAME}.controller.ts" << EOF
import { Request, Response } from 'express';
import { Result } from '../../../shared/types/result';
import { ResponseCode } from '../../../shared/constants/enums';
import { handleResponse } from '../../../shared/utils/handle-response';
import { ${MODULE_NAME_CAPITALIZED}Service } from '../services/${MODULE_NAME_CAMELCASE}.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * @openapi
 * components:
 *   schemas:
 *     ${MODULE_NAME_CAPITALIZED}:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ${MODULE_NAME_CAPITALIZED} ID
 *         name:
 *           type: string
 *           description: Name of the ${MODULE_NAME}
 *         description:
 *           type: string
 *           description: Description of the ${MODULE_NAME}
 *         status:
 *           type: integer
 *           description: Status of the ${MODULE_NAME} (1 - active, 0 - deleted)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - _id
 *         - name
 *         - status
 *         - createdAt
 *         - updatedAt
 */

export class ${MODULE_NAME_CAPITALIZED}Controller {
    private service: ${MODULE_NAME_CAPITALIZED}Service;

    constructor() {
        this.service = new ${MODULE_NAME_CAPITALIZED}Service();
    }

    /**
     * @openapi
     * /api/${MODULE_NAME}:
     *   get:
     *     summary: Get all ${MODULE_NAME}s
     *     description: Retrieve a list of all active ${MODULE_NAME}s
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     responses:
     *       200:
     *         description: List of ${MODULE_NAME}s retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: array
     *                   items:
     *                     \$ref: '#/components/schemas/${MODULE_NAME_CAPITALIZED}'
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       400:
     *         description: Bad request
     */
    async getAll(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.service.getAll();
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to fetch ${MODULE_NAME}s' }], null, requestIdentifier as string));
        }
    }

    /**
     * @openapi
     * /api/${MODULE_NAME}/{id}:
     *   get:
     *     summary: Get ${MODULE_NAME} by ID
     *     description: Retrieve a specific ${MODULE_NAME} by its ID
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ${MODULE_NAME_CAPITALIZED} ID
     *     responses:
     *       200:
     *         description: ${MODULE_NAME_CAPITALIZED} retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   \$ref: '#/components/schemas/${MODULE_NAME_CAPITALIZED}'
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       404:
     *         description: ${MODULE_NAME_CAPITALIZED} not found
     */
    async getById(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.service.getById(req.params.id);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to fetch ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }

    /**
     * @openapi
     * /api/${MODULE_NAME}:
     *   post:
     *     summary: Create new ${MODULE_NAME}
     *     description: Create a new ${MODULE_NAME} record
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name of the ${MODULE_NAME}
     *               description:
     *                 type: string
     *                 description: Description of the ${MODULE_NAME}
     *               status:
     *                 type: integer
     *                 default: 1
     *                 description: Status of the ${MODULE_NAME}
     *     responses:
     *       201:
     *         description: ${MODULE_NAME_CAPITALIZED} created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   \$ref: '#/components/schemas/${MODULE_NAME_CAPITALIZED}'
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       400:
     *         description: Bad request or missing required fields
     */
    async create(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.service.create(req.body);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to create ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }

    /**
     * @openapi
     * /api/${MODULE_NAME}/{id}:
     *   put:
     *     summary: Update ${MODULE_NAME}
     *     description: Update an existing ${MODULE_NAME} record
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ${MODULE_NAME_CAPITALIZED} ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name of the ${MODULE_NAME}
     *               description:
     *                 type: string
     *                 description: Description of the ${MODULE_NAME}
     *               status:
     *                 type: integer
     *                 description: Status of the ${MODULE_NAME}
     *     responses:
     *       200:
     *         description: ${MODULE_NAME_CAPITALIZED} updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   \$ref: '#/components/schemas/${MODULE_NAME_CAPITALIZED}'
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       404:
     *         description: ${MODULE_NAME_CAPITALIZED} not found
     */
    async update(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.service.update(req.params.id, req.body);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to update ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }

    /**
     * @openapi
     * /api/${MODULE_NAME}/{id}:
     *   delete:
     *     summary: Delete ${MODULE_NAME}
     *     description: Soft delete a ${MODULE_NAME} (sets status to 0)
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ${MODULE_NAME_CAPITALIZED} ID
     *     responses:
     *       200:
     *         description: ${MODULE_NAME_CAPITALIZED} deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: boolean
     *                   example: true
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       404:
     *         description: ${MODULE_NAME_CAPITALIZED} not found
     */
    async delete(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.service.delete(req.params.id);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to delete ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }
}
EOF

# Create routes
cat > "$MODULE_DIR/routes/${MODULE_NAME_CAMELCASE}.routes.ts" << EOF
import { Router } from 'express';
import { ${MODULE_NAME_CAPITALIZED}Controller } from '../controllers/${MODULE_NAME_CAMELCASE}.controller';

const router = Router();
const controller = new ${MODULE_NAME_CAPITALIZED}Controller();

router.get('/', (req, res) => res.send('${MODULE_NAME_CAPITALIZED} API is up.'));
router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export default router;
EOF

# Update routes index
ROUTES_INDEX="src/routes/index.ts"
IMPORT_LINE="import ${MODULE_NAME_CAMELCASE}Routes from '../modules/${MODULE_NAME}/routes/${MODULE_NAME_CAMELCASE}.routes';"
USE_LINE="router.use('/${MODULE_NAME}', ${MODULE_NAME_CAMELCASE}Routes);"

if ! grep -q "${IMPORT_LINE}" "$ROUTES_INDEX"; then
  # Add import after userRoutes import with proper newline
  sed -i '' "/import userRoutes from '\.\.\/modules\/user\/routes\/user\.routes';/a\\
$IMPORT_LINE
" "$ROUTES_INDEX"
fi
if ! grep -q "${USE_LINE}" "$ROUTES_INDEX"; then
  # Add router.use after users router.use with proper newline
  sed -i '' "/router\.use('\/users', userRoutes);/a\\
$USE_LINE
" "$ROUTES_INDEX"
fi

# Update seeder
SEEDER_FILE="src/core/database/seeder.ts"
SEED_IMPORT="import { ${MODULE_NAME_CAPITALIZED}Model } from '../../modules/${MODULE_NAME}/schemas/${MODULE_NAME_CAMELCASE}.schema';"
SEED_FUNC="  private async seed${MODULE_NAME_CAPITALIZED}s(data: any[]): Promise<void> {
    if (data.length === 0) return;
    
    logger.info(\`[DatabaseSeeder] Seeding \${data.length} ${MODULE_NAME}s...\`);
    
    for (const ${MODULE_NAME}Data of data) {
      try {
        const existing = await ${MODULE_NAME_CAPITALIZED}Model.findOne({ name: ${MODULE_NAME}Data.name });
        if (!existing) {
          const ${MODULE_NAME} = new ${MODULE_NAME_CAPITALIZED}Model({
            ...${MODULE_NAME}Data,
            status: 1
          });
          await ${MODULE_NAME}.save();
          logger.info(\`[DatabaseSeeder] Created ${MODULE_NAME}: \${${MODULE_NAME}Data.name}\`);
        } else {
          logger.info(\`[DatabaseSeeder] ${MODULE_NAME_CAPITALIZED} \${${MODULE_NAME}Data.name} already exists, skipping\`);
        }
      } catch (error) {
        logger.error(\`[DatabaseSeeder] Failed to create ${MODULE_NAME} \${${MODULE_NAME}Data.name}:\`, error);
      }
    }
  }"
SEED_CALL="      await this.seed${MODULE_NAME_CAPITALIZED}s(seedData.${MODULE_NAME}s || []);"
SEED_DATA_LINE="      ${MODULE_NAME}s: [ { name: '${MODULE_NAME_CAPITALIZED} Example', description: 'Example ${MODULE_NAME}', status: 1 } ],"

echo "📊 Updating database seeder..."

# Add import for the model
if ! grep -q "${SEED_IMPORT}" "$SEEDER_FILE"; then
  # Add import after the existing imports
  sed -i '' "/import { UserModel } from/a\\
$SEED_IMPORT" "$SEEDER_FILE"
  echo "   ✅ Added import for ${MODULE_NAME_CAPITALIZED}Model"
fi

# Add seeder function
if ! grep -q "seed${MODULE_NAME_CAPITALIZED}s" "$SEEDER_FILE"; then
  # Create a temporary file with the seeder function
  cat > /tmp/seeder_func.tmp << EOF
  private async seed${MODULE_NAME_CAPITALIZED}s(data: any[]): Promise<void> {
    if (data.length === 0) return;
    
    logger.info(\`[DatabaseSeeder] Seeding \${data.length} ${MODULE_NAME}s...\`);
    
    for (const ${MODULE_NAME}Data of data) {
      try {
        const existing = await ${MODULE_NAME_CAPITALIZED}Model.findOne({ name: ${MODULE_NAME}Data.name });
        if (!existing) {
          const ${MODULE_NAME} = new ${MODULE_NAME_CAPITALIZED}Model({
            ...${MODULE_NAME}Data,
            status: 1
          });
          await ${MODULE_NAME}.save();
          logger.info(\`[DatabaseSeeder] Created ${MODULE_NAME}: \${${MODULE_NAME}Data.name}\`);
        } else {
          logger.info(\`[DatabaseSeeder] ${MODULE_NAME_CAPITALIZED} \${${MODULE_NAME}Data.name} already exists, skipping\`);
        }
      } catch (error) {
        logger.error(\`[DatabaseSeeder] Failed to create ${MODULE_NAME} \${${MODULE_NAME}Data.name}:\`, error);
      }
    }
  }
EOF
  
  # Insert the function before the closing brace
  sed -i '' "/TEMPLATE: Add new seeder functions here/r /tmp/seeder_func.tmp" "$SEEDER_FILE"
  rm /tmp/seeder_func.tmp
  echo "   ✅ Added seed${MODULE_NAME_CAPITALIZED}s function"
fi

# Add seeder call
if ! grep -q "${SEED_CALL}" "$SEEDER_FILE"; then
  sed -i '' "/TEMPLATE: Call new seeders here/a\\
$SEED_CALL" "$SEEDER_FILE"
  echo "   ✅ Added seeder call for ${MODULE_NAME}s"
fi

# Add default seed data
if ! grep -q "${SEED_DATA_LINE}" "$SEEDER_FILE"; then
  sed -i '' "/const defaultData: SeedData = {/a\\
$SEED_DATA_LINE" "$SEEDER_FILE"
  echo "   ✅ Added default seed data for ${MODULE_NAME}s"
fi

echo "✅ Module '$MODULE_NAME' generated successfully!"
echo ""
echo "📁 Generated files:"
echo "   $MODULE_DIR/entities/${MODULE_NAME_CAMELCASE}.entity.ts"
echo "   $MODULE_DIR/schemas/${MODULE_NAME_CAMELCASE}.schema.ts"
echo "   $MODULE_DIR/services/${MODULE_NAME_CAMELCASE}.service.ts"
echo "   $MODULE_DIR/controllers/${MODULE_NAME_CAMELCASE}.controller.ts"
echo "   $MODULE_DIR/routes/${MODULE_NAME_CAMELCASE}.routes.ts"
echo ""
echo "🔗 API endpoints available at:"
echo "   GET    /${MODULE_NAME}/"
echo "   GET    /${MODULE_NAME}/:id"
echo "   POST   /${MODULE_NAME}/"
echo "   PUT    /${MODULE_NAME}/:id"
echo "   DELETE /${MODULE_NAME}/:id"
echo ""
echo "🚀 Next steps:"
echo "   1. Build and run: npm run build:dev && npm start"
echo "   2. Check /api/${MODULE_NAME}/ and Swagger UI for your new module!" 