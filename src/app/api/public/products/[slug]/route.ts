import type { NextRequest } from "next/server";
import { handleServiceError, jsonError, jsonOk } from "@/server/http";
import * as productService from "@/server/products/products.service";

const VALID_SLUG = /^[a-z0-9-]{1,100}$/;

type ProductRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: NextRequest,
  context: ProductRouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    if (!VALID_SLUG.test(slug)) {
      return jsonError(404, "Not found");
    }

    const product = await productService.getPublishedProductBySlug(slug);
    return product ? jsonOk(product) : jsonError(404, "Not found");
  } catch (error: unknown) {
    return handleServiceError(error);
  }
}
