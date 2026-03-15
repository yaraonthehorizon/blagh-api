import { KnowledgeSubcategory } from './knowledge-subcategory'

export interface KnowledgeCategory {
    id: number
    source_id: number
    title: string
    description: string
    translation_language: string
    source_language: string
    items_count: number
    has_children: true
    category_items: string
    sub_categories?: KnowledgeSubcategory[]
}
