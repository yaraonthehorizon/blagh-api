export interface RecitationInfo {
  id: number;
  title: string;
  type: string;
  add_date: number;
  orginal_item: string; //api typo
  translation_language: string;
  source_language: string;
  category_info: {
    id: number;
    title: string;
    description?: string | null;
  };
  prepared_by: {
    id: number;
    source_id: number;
    title: string;
    type: string;
    kind: string;
  }[];
  attachments?: {
    id: number;
    order: number;
    title: string;
    duration: string;
    size: string;
    extension_type: string;
    description: string;
    url: string;
    api_url: string;
  }[];
}

export interface RecitationInfoCondensed {
  id: number;
  title: string;
  type: string;
  add_date: number;
  api_url: string;
  prepared_by: {
    id: number;
    source_id: number;
    title: string;
    type: string;
    kind: string;
  }[];
}
