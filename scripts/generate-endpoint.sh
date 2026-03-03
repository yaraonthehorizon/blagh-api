#!/bin/bash

# Diagrammers API Endpoint Generator
# Usage: ./scripts/generate-endpoint.sh <module-name> <endpoint-name> [method] [path] [description]

# Function to convert plural module names to singular for file names
plural_to_singular() {
    local word=$1
    if [[ $word =~ ies$ ]]; then
        echo "${word%ies}y"  # categories -> category
    elif [[ $word =~ es$ ]]; then
        echo "${word%es}"    # boxes -> box
    elif [[ $word =~ s$ ]]; then
        echo "${word%s}"     # users -> user, products -> product
    else
        echo "$word"         # already singular
    fi
}

MODULE_NAME=$1
ENDPOINT_NAME=$2
METHOD=${3:-GET}
CUSTOM_PATH=${4:-$ENDPOINT_NAME}
DESCRIPTION=${5:-"$ENDPOINT_NAME endpoint for $MODULE_NAME"}

# Convert to PascalCase: first letter uppercase, rest lowercase, then capitalize each word after dash/underscore
MODULE_NAME_CAPITALIZED=$(echo $MODULE_NAME | sed 's/[-_]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | sed 's/ //g')
ENDPOINT_NAME_CAPITALIZED=$(echo $ENDPOINT_NAME | sed 's/[-_]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1' | sed 's/ //g')
MODULE_DIR="src/modules/${MODULE_NAME}"
SINGULAR_NAME=$(plural_to_singular "$MODULE_NAME")

if [ -z "$MODULE_NAME" ] || [ -z "$ENDPOINT_NAME" ]; then
    echo "❌ Module name and endpoint name are required"
    echo "Usage: ./scripts/generate-endpoint.sh <module-name> <endpoint-name> [method] [path] [description]"
    echo "Example: ./scripts/generate-endpoint.sh product search GET search 'Search products'"
    exit 1
fi

# Validate module name
if [[ ! $MODULE_NAME =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
    echo "❌ Invalid module name. Use only letters, numbers, hyphens, and underscores. Must start with a letter."
    exit 1
fi

# Validate endpoint name
if [[ ! $ENDPOINT_NAME =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
    echo "❌ Invalid endpoint name. Use only letters, numbers, hyphens, and underscores. Must start with a letter."
    exit 1
fi

# Check if module exists
if [ ! -d "$MODULE_DIR" ]; then
    echo "❌ Module '$MODULE_NAME' does not exist. Please create the module first using './scripts/generate-module.sh $MODULE_NAME'"
    exit 1
fi

# Convert method to uppercase
METHOD=$(echo $METHOD | tr '[:lower:]' '[:upper:]')

echo "🔧 Adding endpoint '$ENDPOINT_NAME' to module '$MODULE_NAME'..."

# Add service method
echo "📝 Adding service method..."
SERVICE_FILE="$MODULE_DIR/services/${SINGULAR_NAME}.service.ts"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "❌ Service file not found: $SERVICE_FILE"
    exit 1
fi

# Generate service method based on HTTP method with Result pattern
case $METHOD in
    "GET")
        SERVICE_METHOD="    async ${ENDPOINT_NAME}(params?: any): Promise<Result<any>> {
        try {
            // TODO: Implement ${ENDPOINT_NAME} logic
            // Example: const items = await ${MODULE_NAME_CAPITALIZED}Model.find(params);
            const data = { message: '${ENDPOINT_NAME_CAPITALIZED} endpoint - implement your logic here', params };
            return Result.success(data);
        } catch (error: any) {
            return Result.error('Failed to ${ENDPOINT_NAME} ${MODULE_NAME}', error.message);
        }
    }"
        ;;
    "POST")
        SERVICE_METHOD="    async ${ENDPOINT_NAME}(data: any): Promise<Result<any>> {
        try {
            // TODO: Implement ${ENDPOINT_NAME} logic
            // Example: const item = await ${MODULE_NAME_CAPITALIZED}Model.create(data);
            const result = { message: '${ENDPOINT_NAME_CAPITALIZED} endpoint - implement your logic here', data };
            return Result.success(result);
        } catch (error: any) {
            return Result.error('Failed to ${ENDPOINT_NAME} ${MODULE_NAME}', error.message);
        }
    }"
        ;;
    "PUT")
        SERVICE_METHOD="    async ${ENDPOINT_NAME}(id: string, data: any): Promise<Result<any>> {
        try {
            // TODO: Implement ${ENDPOINT_NAME} logic
            // Example: const item = await ${MODULE_NAME_CAPITALIZED}Model.findByIdAndUpdate(id, data, { new: true });
            const result = { message: '${ENDPOINT_NAME_CAPITALIZED} endpoint - implement your logic here', id, data };
            return Result.success(result);
        } catch (error: any) {
            return Result.error('Failed to ${ENDPOINT_NAME} ${MODULE_NAME}', error.message);
        }
    }"
        ;;
    "DELETE")
        SERVICE_METHOD="    async ${ENDPOINT_NAME}(id: string): Promise<Result<boolean>> {
        try {
            // TODO: Implement ${ENDPOINT_NAME} logic
            // Example: await ${MODULE_NAME_CAPITALIZED}Model.findByIdAndUpdate(id, { status: 0 }, { new: true });
            return Result.success(true);
        } catch (error: any) {
            return Result.error('Failed to ${ENDPOINT_NAME} ${MODULE_NAME}', error.message);
        }
    }"
        ;;
    *)
        SERVICE_METHOD="    async ${ENDPOINT_NAME}(params?: any): Promise<Result<any>> {
        try {
            // TODO: Implement ${ENDPOINT_NAME} logic
            const data = { message: '${ENDPOINT_NAME_CAPITALIZED} endpoint - implement your logic here', params };
            return Result.success(data);
        } catch (error: any) {
            return Result.error('Failed to ${ENDPOINT_NAME} ${MODULE_NAME}', error.message);
        }
    }"
        ;;
esac

# Add service method before the closing brace
# Create a temporary file with the service method
cat > /tmp/service_method.tmp << EOF

${SERVICE_METHOD}
EOF

# Insert the method before the closing brace
sed -i '' '$d' "$SERVICE_FILE"  # Remove the last line (closing brace)
cat /tmp/service_method.tmp >> "$SERVICE_FILE"  # Add the method
echo "}" >> "$SERVICE_FILE"  # Add the closing brace back
rm /tmp/service_method.tmp

# Add controller method
echo "🎮 Adding controller method..."
CONTROLLER_FILE="$MODULE_DIR/controllers/${SINGULAR_NAME}.controller.ts"

if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Controller file not found: $CONTROLLER_FILE"
    exit 1
fi

# Generate Swagger documentation and controller method based on HTTP method
case $METHOD in
    "GET")
        SWAGGER_DOC="    /**
     * @openapi
     * /api/${MODULE_NAME}/${CUSTOM_PATH}:
     *   get:
     *     summary: ${ENDPOINT_NAME_CAPITALIZED} ${MODULE_NAME}
     *     description: ${DESCRIPTION}
     *     tags: [${MODULE_NAME_CAPITALIZED}]
     *     responses:
     *       200:
     *         description: ${ENDPOINT_NAME_CAPITALIZED} retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: object
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       400:
     *         description: Bad request
     */"
        CONTROLLER_METHOD="    async ${ENDPOINT_NAME}(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.${SINGULAR_NAME}Service.${ENDPOINT_NAME}(req.query);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to ${ENDPOINT_NAME} ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }"
        ;;
    "POST")
        SWAGGER_DOC="    /**
     * @openapi
     * /api/${MODULE_NAME}/${CUSTOM_PATH}:
     *   post:
     *     summary: ${ENDPOINT_NAME_CAPITALIZED} ${MODULE_NAME}
     *     description: ${DESCRIPTION}
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               # Add your request body properties here
     *     responses:
     *       201:
     *         description: ${ENDPOINT_NAME_CAPITALIZED} created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: object
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       400:
     *         description: Bad request
     */"
        CONTROLLER_METHOD="    async ${ENDPOINT_NAME}(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.${SINGULAR_NAME}Service.${ENDPOINT_NAME}(req.body);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to ${ENDPOINT_NAME} ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }"
        ;;
    "PUT")
        SWAGGER_DOC="    /**
     * @openapi
     * /api/${MODULE_NAME}/${CUSTOM_PATH}/{id}:
     *   put:
     *     summary: ${ENDPOINT_NAME_CAPITALIZED} ${MODULE_NAME}
     *     description: ${DESCRIPTION}
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
     *               # Add your request body properties here
     *     responses:
     *       200:
     *         description: ${ENDPOINT_NAME_CAPITALIZED} updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: object
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       404:
     *         description: ${MODULE_NAME_CAPITALIZED} not found
     */"
        CONTROLLER_METHOD="    async ${ENDPOINT_NAME}(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.${SINGULAR_NAME}Service.${ENDPOINT_NAME}(req.params.id, req.body);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to ${ENDPOINT_NAME} ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }"
        ;;
    "DELETE")
        SWAGGER_DOC="    /**
     * @openapi
     * /api/${MODULE_NAME}/${CUSTOM_PATH}/{id}:
     *   delete:
     *     summary: ${ENDPOINT_NAME_CAPITALIZED} ${MODULE_NAME}
     *     description: ${DESCRIPTION}
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
     *         description: ${ENDPOINT_NAME_CAPITALIZED} successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: object
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     *       404:
     *         description: ${MODULE_NAME_CAPITALIZED} not found
     */"
        CONTROLLER_METHOD="    async ${ENDPOINT_NAME}(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.${SINGULAR_NAME}Service.${ENDPOINT_NAME}(req.params.id);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to ${ENDPOINT_NAME} ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }"
        ;;
    *)
        SWAGGER_DOC="    /**
     * @openapi
     * /api/${MODULE_NAME}/${CUSTOM_PATH}:
     *   ${METHOD,,}:
     *     summary: ${ENDPOINT_NAME_CAPITALIZED} ${MODULE_NAME}
     *     description: ${DESCRIPTION}
     *     tags: [${MODULE_NAME_CAPITALIZED}s]
     *     responses:
     *       200:
     *         description: ${ENDPOINT_NAME_CAPITALIZED} successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 Data:
     *                   type: object
     *                 StatusCode:
     *                   type: integer
     *                   example: 1000
     */"
        CONTROLLER_METHOD="    async ${ENDPOINT_NAME}(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
            const result = await this.${SINGULAR_NAME}Service.${ENDPOINT_NAME}(req.query);
            result.requestIdentifier = requestIdentifier as string;
            handleResponse(res, result);
        } catch (error: any) {
            handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to ${ENDPOINT_NAME} ${MODULE_NAME}' }], null, requestIdentifier as string));
        }
    }"
        ;;
esac

# Add controller method before the closing brace
# Create a temporary file with the controller method
cat > /tmp/controller_method.tmp << EOF

${SWAGGER_DOC}
${CONTROLLER_METHOD}
EOF

# Insert the method before the class closing brace
sed -i '' '/^}$/d' "$CONTROLLER_FILE"  # Remove all standalone closing braces
cat /tmp/controller_method.tmp >> "$CONTROLLER_FILE"  # Add the method
echo "}" >> "$CONTROLLER_FILE"  # Add the class closing brace back
rm /tmp/controller_method.tmp

# Add route
echo "🛣️ Adding route..."
ROUTE_FILE="$MODULE_DIR/routes/${SINGULAR_NAME}.routes.ts"

if [ ! -f "$ROUTE_FILE" ]; then
    echo "❌ Route file not found: $ROUTE_FILE"
    exit 1
fi

# Generate route based on HTTP method
case $METHOD in
    "GET")
        ROUTE_LINE="router.get('/${CUSTOM_PATH}', ${SINGULAR_NAME}Controller.${ENDPOINT_NAME}.bind(${SINGULAR_NAME}Controller));"
        ;;
    "POST")
        ROUTE_LINE="router.post('/${CUSTOM_PATH}', ${SINGULAR_NAME}Controller.${ENDPOINT_NAME}.bind(${SINGULAR_NAME}Controller));"
        ;;
    "PUT")
        if [[ $CUSTOM_PATH == *"-"* ]]; then
            ROUTE_LINE="router.put('/${CUSTOM_PATH}', ${SINGULAR_NAME}Controller.${ENDPOINT_NAME}.bind(${SINGULAR_NAME}Controller));"
        else
            ROUTE_LINE="router.put('/${CUSTOM_PATH}/:id', ${SINGULAR_NAME}Controller.${ENDPOINT_NAME}.bind(${SINGULAR_NAME}Controller));"
        fi
        ;;
    "DELETE")
        ROUTE_LINE="router.delete('/${CUSTOM_PATH}/:id', ${SINGULAR_NAME}Controller.${ENDPOINT_NAME}.bind(${SINGULAR_NAME}Controller));"
        ;;
    *)
        ROUTE_LINE="router.${METHOD,,}('/${CUSTOM_PATH}', ${SINGULAR_NAME}Controller.${ENDPOINT_NAME}.bind(${SINGULAR_NAME}Controller));"
        ;;
esac

# Add route before the export statement
sed -i '' "/export default router;/i\\
${ROUTE_LINE}\\
" "$ROUTE_FILE"

echo "✅ Endpoint '$ENDPOINT_NAME' added to module '$MODULE_NAME' successfully!"
echo "🔗 New endpoint available at: $METHOD /api/${MODULE_NAME}/${CUSTOM_PATH}"
echo ""
echo "📁 Modified files:"
echo "   $SERVICE_FILE"
echo "   $CONTROLLER_FILE"
echo "   $ROUTE_FILE"
echo ""
echo "🚀 Next steps:"
echo "   1. Implement the business logic in the service method"
echo "   2. Build and run: npm run build:dev && npm start"
echo "   3. Test the endpoint: $METHOD /api/${MODULE_NAME}/${CUSTOM_PATH}" 