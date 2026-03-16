import { Result } from '../../../shared/types/result'
import { createApiClient } from '../../../core/http/api-client'
import { QuranCategory } from '../../../shared/types/quran/quran-category'
import { RecitationCategoryDetails } from '../../../shared/types/quran/recitation-category-details'
import { RecitationInfo } from '../../../shared/types/quran/recitation-info'
import { ReciterInfo } from '../../../shared/types/quran/reciter-info'

export class QuranService {
    private get apiClient() {
        return createApiClient(process.env.ISLAMHOUSE_API_BASE_URL)
    }

    async getCategories(locale: string): Promise<Result<QuranCategory[]>> {
        try {
            const response = await this.apiClient.get<QuranCategory[]>(
                `/quran/get-categories/${locale}`
            )

            if (!response.data) {
                return Result.success([])
            }
            return Result.success(response.data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch Quran categories: ${error.message}`
            )
        }
    }

    async getCategory(
        id: string,
        locale: string
    ): Promise<Result<RecitationCategoryDetails>> {
        try {
            const response =
                await this.apiClient.get<RecitationCategoryDetails>(
                    `/quran/get-category/${id}/${locale}/json`
                )

            return Result.success(response.data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch Quran category: ${error.message}`
            )
        }
    }

    async getRecitersAndAssociatedRecitations(
        id: string,
        locale: string
    ): Promise<Result<ReciterInfo[]>> {
        try {
            const response =
                await this.apiClient.get<RecitationCategoryDetails>(
                    `/quran/get-category/${id}/${locale}/json`
                )

            const currentReciters = response.data.authors.slice(10, 20)
            // const validReciters = await Promise.all(
            //     currentReciters.map(async (reciter) => {
            //         for (const id of reciter.recitations_info.recitations_ids) {
            //             try {
            //                 const rec = await this.getRecitationInfo(
            //                     String(id),
            //                     locale
            //                 )

            //                 if (rec.data?.attachments?.length) {
            //                     return {
            //                         ...reciter,
            //                         validRecitation: rec.data,
            //                     }
            //                 }
            //             } catch {
            //                 // ignore failed recitation
            //             }
            //         }

            //         return null
            //     })
            // )

            // const filteredReciters = validReciters.filter(Boolean)

            return Result.success(currentReciters)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch Quran category details: ${error.message}`
            )
        }
    }

    async getRecitationInfo(
        id: string,
        locale: string
    ): Promise<Result<RecitationInfo>> {
        try {
            const response = await this.apiClient.get<RecitationInfo>(
                `/quran/get-recitation/${id}/${locale}/json`
            )

            // Handle cases where the API returns nothing or an empty object
            if (!response.data || Object.keys(response.data).length === 0) {
                return Result.error(
                    'Recitation not found or returned empty data'
                )
            }

            // Defensively ensure attachments is always an array, even if omitted
            const safeData = {
                ...response.data,
                attachments: response.data.attachments || [],
            }

            return Result.success(safeData)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch recitation info: ${error.message}`
            )
        }
    }
}
