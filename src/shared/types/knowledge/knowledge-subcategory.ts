export interface KnowledgeSubcategory {
    id: number
    source_id?: number
    translation_language?: string
    source_language?: string
    items_count?: number
    has_children?: boolean
    category_items?: string
    description?: string
    title: string
    importance_level: string
    datatype: string
    slang: string
    apiurl: string
    sub_categories?: KnowledgeSubcategory[]
}
