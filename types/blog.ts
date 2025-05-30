export type Author = {
  name: string;
  image: string;
  bio?: string;
  _id?: number | string;
  _ref?: number | string;
};

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
