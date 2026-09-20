import type { NextRequest } from "next/server";
import { isJsonRequest } from "@/lib/auth/csrf";
import { withAdmin } from "@/lib/auth/guard";
import { handleServiceError, jsonError, jsonOk } from "@/server/http";
import { toAdminProduct } from "@/server/products/product.dto";
import * as productService from "@/server/products/products.service";
import { revalidatePublicProduct } from "@/server/revalidate";

const MAX_BODY_LENGTH = 16 * 1024;
const VALID_ID = /^[A-Za-z0-9_-]{1,100}$/;

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withAdmin<ProductRouteContext>(
  async (_request, context): Promise<Response> => {
    try {
      const { id } = await context.params;
      if (!VALID_ID.test(id)) {
        return jsonError(404, "Not found");
      }
      return jsonOk(toAdminProduct(await productService.getAdminProduct(id)));
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
);

export const PUT = withAdmin<ProductRouteContext>(
  async (request: NextRequest, context): Promise<Response> => {
    if (!isJsonRequest(request)) {
      return jsonError(415, "Unsupported media type");
    }

    try {
      const rawBody = await request.text();
      if (rawBody.length > MAX_BODY_LENGTH) {
        return jsonError(413, "Payload too large");
      }

      let input: unknown;
      try {
        input = JSON.parse(rawBody) as unknown;
      } catch {
        return jsonError(400, "Validation failed", {
          _root: ["Malformed JSON"],
        });
      }

      const { id } = await context.params;
      if (!VALID_ID.test(id)) {
        return jsonError(404, "Not found");
      }
      const product = await productService.updateProduct(id, input);
      const data = toAdminProduct(product);
      revalidatePublicProduct(product.slug);
      return jsonOk(data);
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
);
