import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Result } from '../../../shared/types/result'
import { ResponseCode } from '../../../shared/constants/enums'
import { handleResponse } from '../../../shared/utils/handle-response'
import { KnowledgeService } from '../services/knowledge.service'
import { loggingService } from '../../logging/services/logging.service'

export class KnowledgeController {
    private service: KnowledgeService

    constructor() {
        this.service = new KnowledgeService()
    }

    /**
     * @openapi
     * /api/knowledge/get-category-tree/{sourceLanguage}:
     *   get:
     *     summary: Get Object Category Tree
     *     tags:
     *       - Knowledge
     *     parameters:
     *       - in: path
     *         name: sourceLanguage
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Object Category Tree retrieved successfully
     */
    async getCategoryTree(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const result = await this.service.getCategoryTree(
                req.params.sourceLanguage
            )
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [{ message: error.message || 'Error fetching tree' }],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }

    /**
     * @openapi
     * /api/knowledge/get-category-items/{categoryId}/{translationLanguage}/{sourceLanguage}/{page}/{pageSize}:
     *   get:
     *     summary: Get Category Items Paginated
     *     tags:
     *       - Knowledge
     *     parameters:
     *       - in: path
     *         name: categoryId
     *         required: true
     *         schema:
     *           type: number
     *       - in: path
     *         name: translationLanguage
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: sourceLanguage
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: page
     *         required: true
     *         schema:
     *           type: number
     *       - in: path
     *         name: pageSize
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       '200':
     *         description: Category items retrieved successfully
     */
    async getCategoryItems(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const {
                categoryId,
                translationLanguage,
                sourceLanguage,
                page,
                pageSize,
            } = req.params
            const result = await this.service.getCategoryItems(
                categoryId,
                translationLanguage,
                sourceLanguage,
                page,
                pageSize
            )
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [
                        {
                            message:
                                error.message ||
                                'Error fetching category items',
                        },
                    ],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }

    /**
     * @openapi
     * /api/knowledge/get-subcategory-items/{subCategoryId}/{sourceLanguage}/{translationLanguage}:
     *   get:
     *     summary: Get Subcategory Items
     *     tags:
     *       - Knowledge
     *     parameters:
     *       - in: path
     *         name: subCategoryId
     *         required: true
     *         schema:
     *           type: number
     *       - in: path
     *         name: sourceLanguage
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: translationLanguage
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: page
     *         required: true
     *         schema:
     *           type: number
     *       - in: path
     *         name: pageSize
     *         required: true
     *         schema:
     *           type: number
     *     responses:
     *       '200':
     *         description: Subcategory items retrieved successfully
     */
    async getSubcategoryItems(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const {
                subCategoryId,
                sourceLanguage,
                translationLanguage,
                page,
                pageSize,
            } = req.params
            const result = await this.service.getSubcategoryItems(
                subCategoryId,
                sourceLanguage,
                translationLanguage,
                parseInt(page),
                parseInt(pageSize)
            )
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [
                        {
                            message:
                                error.message ||
                                'Error fetching subcategory items',
                        },
                    ],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }

    /**
     * @openapi
     * /api/knowledge/get-item/{itemId}/{sourceLanguage}:
     *   get:
     *     summary: Get Specific Item
     *     tags:
     *       - Knowledge
     *     parameters:
     *       - in: path
     *         name: itemId
     *         required: true
     *         schema:
     *           type: number
     *       - in: path
     *         name: sourceLanguage
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Item retrieved successfully
     */
    async getItem(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const { itemId, sourceLanguage, translationLanguage } = req.params
            const result = await this.service.getItem(
                itemId,
                sourceLanguage,
                translationLanguage
            )
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [{ message: error.message || 'Error fetching item' }],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }
}
