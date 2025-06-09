export type Blog = {
  _id: number;
  mainImage: string;
  title: string;
  metadata: string;
  slug?: string;
  author?: string;
  publishDate?: string;
  content?: string;
};
