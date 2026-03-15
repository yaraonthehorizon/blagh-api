import { KnowledgeItem } from "./knowledge-item";
import { KnowledgePagination } from "./knowledge-pagination";

export type KnowledgeDataItems =
  | {
      data: KnowledgeItem[];
      links: KnowledgePagination;
    }
  | {
      error: string;
    };
