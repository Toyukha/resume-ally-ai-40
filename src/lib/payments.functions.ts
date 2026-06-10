import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

const ResolveSchema = z.object({
  priceId: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
  environment: z.enum(["sandbox", "live"]),
});

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => ResolveSchema.parse(input))
  .handler(async ({ data }): Promise<string> => {
    const env: PaddleEnv = data.environment;
    const response = await gatewayFetch(
      env,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    if (!response.ok) throw new Error("Failed to look up price");
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0].id;
  });
