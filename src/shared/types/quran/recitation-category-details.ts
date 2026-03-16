import { ReciterInfo } from './reciter-info'

export interface RecitationCategoryDetails {
    id: number
    add_date: number
    title: string
    description: string
    locales: []
    authors: ReciterInfo[]
    recitations: {
        id: number
        add_date: number
        title: string
        api_url: string
    }[]
}
