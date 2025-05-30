export interface ClientStat {
  id: number;
  value: string;
  label: string;
}

export interface ClientsData {
  title: string;
  description: string;
  stats: ClientStat[];
}
