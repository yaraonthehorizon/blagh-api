export type ReciterInfo = {
  id: number;
  title: string;
  add_date: number;
  recitations_info: {
    count: number;
    recitations_ids: number[];
  };
};
