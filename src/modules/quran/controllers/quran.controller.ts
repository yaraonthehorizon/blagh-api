import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Result } from '../../../shared/types/result'
import { ResponseCode } from '../../../shared/constants/enums'
import { handleResponse } from '../../../shared/utils/handle-response'
import { QuranService } from '../services/quran.service'

export class QuranController {
    private service: QuranService

    constructor() {
        this.service = new QuranService()
    }

    /**
     * @openapi
     * /api/quran/get-categories/{locale}:
     *   get:
     *     summary: Get Quran Categories
     *     tags:
     *       - Quran
     *     parameters:
     *       - in: path
     *         name: locale
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Categories retrieved successfully
     */
    async getCategories(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const result = await this.service.getCategories(req.params.locale)
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [{ message: 'Failed to fetch categories' }],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }

    /**
     * @openapi
     * /api/quran/recitation/get-category/{id}/{locale}:
     *   get:
     *     summary: Get Quran Category
     *     tags:
     *       - Quran
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: locale
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Categories retrieved successfully
     */

    async getCategory(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const result = await this.service.getCategory(
                req.params.id,
                req.params.locale
            )
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [{ message: 'Failed to fetch category' }],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }

    /**
     * @openapi
     * /api/quran/recitation/get-reciters-and-associated-recitations/{id}/{locale}:
     *   get:
     *     summary: Get specific Quran reciter details and recitation ids
     *     tags:
     *       - Quran
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: locale
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Category retrieved successfully
     */
    async getRecitersAndAssociatedRecitations(
        req: Request,
        res: Response
    ): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const { id, locale } = req.params
            const result =
                await this.service.getRecitersAndAssociatedRecitations(
                    id,
                    locale
                )

            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [{ message: 'Failed to fetch category details' }],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }

    /**
     * @openapi
     * /api/quran/recitation/get-recitation/{id}/{locale}:
     *   get:
     *     summary: Get Recitation Info
     *     tags:
     *       - Quran
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: locale
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Recitation info retrieved successfully
     */
    async getRecitationInfo(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4()
        try {
            const { id, locale } = req.params
            const result = await this.service.getRecitationInfo(id, locale)
            result.requestIdentifier = requestIdentifier as string
            handleResponse(res, result)
        } catch (error: any) {
            handleResponse(
                res,
                new Result(
                    null,
                    ResponseCode.Error,
                    [{ message: 'Failed to fetch recitation info' }],
                    null,
                    requestIdentifier as string
                )
            )
        }
    }
}
