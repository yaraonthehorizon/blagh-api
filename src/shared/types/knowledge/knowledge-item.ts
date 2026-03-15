export interface KnowledgeItem {
  id: number;
  source_id: number;
  title: string;
  type: string;
  add_date: number;
  update_date: number;
  description: string;
  full_description?: string;
  source_language: string;
  translated_language: string;
  importance_level: string;
  image?: string;
  api_url: string;

  attachments: {
    order: number;
    size: string;
    extension_type: string;
    description: string;
    url: string;
  }[];
}

// New type for the array that can also be an error
export type KnowledgeItemResponse = KnowledgeItem | { error: string };
