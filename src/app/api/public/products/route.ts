import type { NextRequest } from "next/server";
import { handleServiceError, jsonOk } from "@/server/http";
import * as productService from "@/server/products/products.service";

export async function GET(request?: NextRequest): Promise<Response> {
  void request;

  try {
    return jsonOk(await productService.listPublishedProducts());
  } catch (error: unknown) {
    return handleServiceError(error);
  }
}
