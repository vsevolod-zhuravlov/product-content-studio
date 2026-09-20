import type { NextRequest } from "next/server";
import { isValidPublicProductSlug } from "@/lib/validation/public-slug";
import { handleServiceError, jsonError, jsonOk } from "@/server/http";
import * as productService from "@/server/products/products.service";

type ProductRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: NextRequest,
  context: ProductRouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    if (!isValidPublicProductSlug(slug)) {
      return jsonError(404, "Not found");
    }

    const product = await productService.getPublishedProductBySlug(slug);
    return product ? jsonOk(product) : jsonError(404, "Not found");
  } catch (error: unknown) {
    return handleServiceError(error);
  }
}
