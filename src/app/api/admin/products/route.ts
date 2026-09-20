import { withAdmin } from "@/lib/auth/guard";
import { handleServiceError, jsonOk } from "@/server/http";
import { toAdminProductListItem } from "@/server/products/product.dto";
import * as productService from "@/server/products/products.service";

export const GET = withAdmin(
  async (): Promise<Response> => {
    try {
      const products = await productService.listAdminProducts();
      return jsonOk(products.map(toAdminProductListItem));
    } catch (error: unknown) {
      return handleServiceError(error);
    }
  },
);
