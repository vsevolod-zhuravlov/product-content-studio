import "server-only";
import { cache } from "react";
import type { PublicProduct } from "@/lib/api-types";
import { isValidPublicProductSlug } from "@/lib/validation/public-slug";
import { getPublishedProductBySlug } from "./products.service";

export const getPublicProduct = cache(
  async (slug: string): Promise<PublicProduct | null> => {
    if (!isValidPublicProductSlug(slug)) {
      return null;
    }

    return getPublishedProductBySlug(slug);
  },
);
