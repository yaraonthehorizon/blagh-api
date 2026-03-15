import { Result } from '../../../shared/types/result'
import { createApiClient } from '../../../core/http/api-client'
import {
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
            const flattenedSubCategories = normalizedCategories.flatMap(
                (cat) => cat.sub_categories
            )
            const apiSubCategories = response.data.sub_categories ?? []

            const mergedSubCategories = [
                ...apiSubCategories,
                ...flattenedSubCategories,
            ]

            const normalizedSubCategories = Array.from(
                new Map(mergedSubCategories.map((sc) => [sc.id, sc])).values()
            )

            const normalizedData = {
                ...response.data,
                categories: normalizedCategories,
                all_sub_categories: normalizedSubCategories,
            }

            return Result.success(normalizedData)
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
        translationLanguage: string
    ): Promise<Result<KnowledgeItem[]>> {
        try {
            const response = await this.apiClient.get<KnowledgeItem[]>(
                `/categories/viewitems/${subCategoryId}/showall/${sourceLanguage}/showall/json`
            )
            return Result.success(response.data)
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
            return Result.success(response.data)
        } catch (error: any) {
            return Result.error(`Failed to fetch item: ${error.message}`)
        }
    }
}
