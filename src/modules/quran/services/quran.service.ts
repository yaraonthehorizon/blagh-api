import { Result } from '../../../shared/types/result'
import { createApiClient } from '../../../core/http/api-client'
import {
    QuranCategory,
    RecitationCategoryDetails,
    RecitationInfo,
    ReciterInfo,
} from '../../../shared/types/quran'
import { CacheKeys, CacheManager } from '../../../core/cache'
import { CacheConnection } from '../../../core/cache/cache-manager'

export class QuranService {
    private get cache(): CacheConnection {
        return CacheManager.getInstance().getConnection(
            'main'
        ) as CacheConnection
    }

    private get apiClient() {
        return createApiClient(process.env.ISLAMHOUSE_API_BASE_URL)
    }

    async getCategories(locale: string): Promise<Result<QuranCategory[]>> {
        const cacheKey = CacheKeys.QURAN.RECITATION_CATEGORIES(locale)

        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response = await this.apiClient.get<QuranCategory[]>(
                        `/quran/get-categories/${locale}/json`
                    )
                    return response.data
                },
                172800
            )

            return Result.success(data)
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
        const cacheKey = CacheKeys.QURAN.RECITATION_CATEGORY(id, locale)

        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response =
                        await this.apiClient.get<RecitationCategoryDetails>(
                            `/quran/get-category/${id}/${locale}/json`
                        )
                    return response.data
                },
                172800
            )

            return Result.success(data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch Quran categories: ${error.message}`
            )
        }
    }

    async getRecitersAndAssociatedRecitations(
        id: string,
        locale: string
    ): Promise<Result<ReciterInfo[]>> {
        const cacheKey = CacheKeys.QURAN.RECITERS(id, locale)
        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response =
                        await this.apiClient.get<RecitationCategoryDetails>(
                            `/quran/get-category/${id}/${locale}/json`
                        )
                    const currentReciters = response.data.authors.slice(10, 15)
                    const validReciters = await Promise.all(
                        currentReciters.map(async (reciter) => {
                            for (const id of reciter.recitations_info
                                .recitations_ids) {
                                try {
                                    const rec = await this.getRecitationInfo(
                                        String(id),
                                        locale
                                    )

                                    if (rec.data?.attachments?.length) {
                                        return {
                                            ...reciter,
                                            validRecitation: rec.data,
                                        }
                                    }
                                } catch {
                                    // ignore recitation without attachments or any error fetching it
                                }
                            }

                            return null
                        })
                    )
                    const filteredReciters = validReciters.filter(Boolean)
                    return filteredReciters as ReciterInfo[]
                },
                864000 // 10 days, as reciter info doesn't change often and fetching it is costly
            )

            return Result.success(data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch Quran reciters and associated recitations: ${error.message}`
            )
        }
    }

    async getRecitationInfo(
        id: string,
        locale: string
    ): Promise<Result<RecitationInfo>> {
        const cacheKey = CacheKeys.QURAN.RECITATION(id, locale)

        try {
            const data = await this.cache.getOrSet(
                cacheKey,
                async () => {
                    const response = await this.apiClient.get<RecitationInfo>(
                        `/quran/get-recitation/${id}/${locale}/json`
                    )
                    return response.data
                },
                864000 // 10 days, as recitation info doesn't change often and fetching it is costly as well
            )

            return Result.success(data)
        } catch (error: any) {
            return Result.error(
                `Failed to fetch recitation info: ${error.message}`
            )
        }
    }
}
