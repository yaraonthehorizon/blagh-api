import { Result } from '../../../shared/types/result'
import { createApiClient } from '../../../core/http/api-client'
import {
    APIKnowledgeItem,
    KnowledgeCategory,
    KnowledgeItem,
    KnowledgeResponse,
    KnowledgeSubcategory,
} from '../../../shared/types/knowledge'
import {
    CacheConnection,
    CacheManager,
} from '../../../core/cache/cache-manager'
import { CacheKeys } from '../../../core/cache'

export class KnowledgeService {
    private get cache(): CacheConnection {
        return CacheManager.getInstance().getConnection(
            'main'
        ) as CacheConnection
    }

    private get apiClient() {
        return createApiClient(process.env.ISLAMHOUSE_API_BASE_URL)
    }

    async getCategoryTree(
        sourceLanguage: string
    ): Promise<Result<KnowledgeResponse>> {
        const cacheKey = CacheKeys.KNOWLEDGE.CATEGORY_TREE(sourceLanguage)
        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response =
                        await this.apiClient.get<KnowledgeResponse>(
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

                    return {
                        ...response.data,
                        sub_categories: normalizedCategories,
                    }
                },
                864000 // Cache for 10 days
            )
            return Result.success(data)
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
        const cacheKey = CacheKeys.KNOWLEDGE.CATEGORY_ITEMS(
            categoryId,
            translationLanguage,
            sourceLanguage,
            page,
            pageSize
        )

        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response = await this.apiClient.get<
                        KnowledgeCategory[]
                    >(
                        `/main/get-category-items/${categoryId}/showall/${translationLanguage}/${sourceLanguage}/${page}/${pageSize}/json`
                    )
                    return response.data
                },
                864000 // Cache for 10 days
            )
            return Result.success(data)
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
        const cacheKey = CacheKeys.KNOWLEDGE.SUBCATEGORY_ITEMS(
            subCategoryId,
            sourceLanguage,
            translationLanguage,
            page,
            pageSize
        )

        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response = await this.apiClient.get<
                        APIKnowledgeItem[]
                    >(
                        `/categories/viewitems/${subCategoryId}/showall/${sourceLanguage}/showall/json`
                    )

                    const items = response.data
                    const start = (page - 1) * pageSize
                    const end = start + pageSize

                    const paginatedItems = items.slice(start, end)
                    return {
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
                    }
                },
                864000 // Cache for 10 days
            )

            return Result.success(data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch subcategory items: ${error.message}`
            )
        }
    }

    async getItem(
        itemId: string,
        sourceLanguage: string
    ): Promise<Result<KnowledgeItem>> {
        const cacheKey = CacheKeys.KNOWLEDGE.ITEM(itemId, sourceLanguage)
        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response = await this.apiClient.get<KnowledgeItem>(
                        `/main/get-item/${itemId}/${sourceLanguage}/json`
                    )
                    return response.data
                },
                864000 // Cache for 10 days
            )
            return Result.success(data)
        } catch (error: any) {
            return Result.error(`Failed to fetch item: ${error.message}`)
        }
    }
}
