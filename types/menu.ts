export type Menu = {
  id: number;
  en_title: string;
  id_title: string;
  path?: string;
  newTab: boolean;
  submenu?: Menu[];
};
