import { KnowledgeCategory } from './knowledge-category'

export interface KnowledgeResponse {
    id: number
    source_id: number
    title: string
    description: string
    translation_language: string
    source_language: string
    sub_categories: KnowledgeCategory[]
}
