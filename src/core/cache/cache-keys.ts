export const CacheKeys = {
    LANGUAGES: {
        LOCALES: () => 'languages:locales',
    },
    QURAN: {
        RECITERS: (id: string, locale: string) =>
            `quran:reciters:${id}:${locale}`,
        RECITATION_CATEGORIES: (locale: string) => `quran:categories:${locale}`,
        RECITATION_CATEGORY: (id: string, locale: string) =>
            `quran:category:${id}:${locale}`,
        RECITATION: (id: string, locale: string) =>
            `quran:recitation:${id}:${locale}`,
    },
    KNOWLEDGE: {
        CATEGORY_TREE: (sourceLanguage: string) =>
            `knowledge:category-tree:${sourceLanguage}`,
        CATEGORY_ITEMS: (
            categoryId: string,
            translationLanguage: string,
            sourceLanguage: string,
            page: string | number,
            pageSize: string | number
        ) =>
            `knowledge:category-items:${categoryId}:${translationLanguage}:${sourceLanguage}:${page}:${pageSize}`,
        SUBCATEGORY_ITEMS: (
            subCategoryId: string,
            sourceLanguage: string,
            translationLanguage: string,
            page: number,
            pageSize: number
        ) =>
            `knowledge:subcategory-items:${subCategoryId}:${sourceLanguage}:${translationLanguage}:${page}:${pageSize}`,
        ITEM: (itemId: string, sourceLanguage: string) =>
            `knowledge:item:${itemId}:${sourceLanguage}`,
    },
}
