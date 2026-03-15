export interface RecitationCategoryDetails {
  id: number;
  add_date: number;
  title: string;
  description: string;
  locales: [];
  recitations: {
    id: number;
    add_date: number;
    title: string;
    api_url: string;
  }[];
}
