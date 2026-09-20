type ProductSpec = {
  label: string;
  value: string;
};

export type ProductStatus = "DRAFT" | "PUBLISHED";

export type AdminProductListItem = {
  id: string;
  name: string;
  status: ProductStatus;
  updatedAt: string;
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  specs: ProductSpec[];
  description: string;
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
  updatedAt: string;
};

export type PublicProduct = {
  slug: string;
  name: string;
  specs: ProductSpec[];
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export type ApiError = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};
