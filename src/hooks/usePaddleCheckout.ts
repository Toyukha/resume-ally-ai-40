import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

type OpenOptions = {
  priceId: string;
  customerEmail?: string;
  userId: string;
  planTier: "pro_1" | "pro_2";
  successUrl?: string;
};

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: OpenOptions) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: { userId: options.userId, planTier: options.planTier },
        settings: {
          displayMode: "overlay",
          successUrl:
            options.successUrl ??
            `${window.location.origin}/dashboard?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
