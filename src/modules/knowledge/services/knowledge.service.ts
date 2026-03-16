import { Result } from '../../../shared/types/result'
import { createApiClient } from '../../../core/http/api-client'
import {
    APIKnowledgeItem,
    KnowledgeCategory,
    KnowledgeItem,
    KnowledgeResponse,
    KnowledgeSubcategory,
} from '../../../shared/types/knowledge'

export class KnowledgeService {
    private get apiClient() {
        return createApiClient(process.env.ISLAMHOUSE_API_BASE_URL)
    }

    async getCategoryTree(
        sourceLanguage: string
    ): Promise<Result<KnowledgeResponse>> {
        try {
            const response = await this.apiClient.get<KnowledgeResponse>(
                `/main/get-object-category-tree/${sourceLanguage}/json`
            )

            const categories = response.data.sub_categories ?? []

            const normalizedCategories = categories.map((cat) => ({
                ...cat,
                sub_categories: cat.sub_categories ?? [
                    {
                        id: cat.id,
                        source_id: cat.source_id,
                        title: cat.title,
                        description: cat.description,
                        translation_language: cat.translation_language,
                        source_language: cat.source_language,
                        items_count: cat.items_count,
                        has_children: cat.has_children,
                        category_items: cat.category_items,
                        importance_level: null,
                        datatype: null,
                        slang: null,
                        apiurl: '',
                    } satisfies KnowledgeSubcategory,
                ],
            }))

            const normalizedResponse: KnowledgeResponse = {
                ...response.data,
                sub_categories: normalizedCategories,
            }
            return Result.success(normalizedResponse)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch object category tree: ${error.message}`
            )
        }
    }

    async getCategoryItems(
        categoryId: string,
        translationLanguage: string,
        sourceLanguage: string,
        page: string,
        pageSize: string
    ): Promise<Result<KnowledgeCategory[]>> {
        try {
            const response = await this.apiClient.get<KnowledgeCategory[]>(
                `/main/get-category-items/${categoryId}/showall/${translationLanguage}/${sourceLanguage}/${page}/${pageSize}/json`
            )
            return Result.success(response.data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch category items: ${error.message}`
            )
        }
    }

    async getSubcategoryItems(
        subCategoryId: string,
        sourceLanguage: string,
        translationLanguage: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<
        Result<{
            data: KnowledgeItem[]
            page: number
            pageSize: number
            total: number
            totalPages: number
        }>
    > {
        try {
            const response = await this.apiClient.get<APIKnowledgeItem[]>(
                `/categories/viewitems/${subCategoryId}/showall/${sourceLanguage}/showall/json`
            )

            const items = response.data
            const start = (page - 1) * pageSize
            const end = start + pageSize

            const paginatedItems = items.slice(start, end)
            return Result.success({
                data: [
                    ...paginatedItems.map((item) => ({
                        ...item,
                        type: item.datatype,
                        mediaType: item.datatype,
                    })),
                ],
                page,
                pageSize,
                total: items.length,
                totalPages: Math.ceil(items.length / pageSize),
            })
        } catch (error: any) {
            return Result.error(
                `Failed to fetch subcategory items: ${error.message}`
            )
        }
    }

    async getItem(
        itemId: string,
        sourceLanguage: string,
        translationLanguage: string
    ): Promise<Result<KnowledgeItem>> {
        try {
            const response = await this.apiClient.get<KnowledgeItem>(
                `/main/get-item/${itemId}/${sourceLanguage}/json`
            )

            const item = {
                ...response.data,
                type: response.data.type,
            }
            return Result.success(item)
        } catch (error: any) {
            return Result.error(`Failed to fetch item: ${error.message}`)
        }
    }
}
