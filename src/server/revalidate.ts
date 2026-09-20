import "server-only";
import { revalidatePath } from "next/cache";

export function revalidatePublicProduct(slug: string): void {
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
}
