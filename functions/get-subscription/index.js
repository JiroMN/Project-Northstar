import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

function stripeTimestampToISO(timestamp) {
  if (!timestamp || typeof timestamp !== "number") return null;
  return new Date(timestamp * 1000).toISOString();
}

export default async ({ req, res, log }) => {
  try {
    const customerId = req.bodyJson.customerId;
    if (!customerId) {
      return res.json({
        ok: false,
        error: "Missing customerId.",
      });
    }

    log("Looking for customer subscriptions: " + customerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
      expand: ["data.items.data.price"],
    });

    if (!subscriptions?.data?.length) {
      return res.json({
        ok: true,
        subscription: null,
      });
    }

    const statusPriority = [
      "active",
      "trialing",
      "past_due",
      "unpaid",
      "incomplete",
      "paused",
      "canceled",
      "incomplete_expired",
    ];

    const sub = subscriptions.data.sort((a, b) => {
      const aPriority = statusPriority.indexOf(a.status);
      const bPriority = statusPriority.indexOf(b.status);
      const safeAPriority = aPriority === -1 ? 999 : aPriority;
      const safeBPriority = bPriority === -1 ? 999 : bPriority;

      if (safeAPriority !== safeBPriority) {
        return safeAPriority - safeBPriority;
      }

      return (b.created ?? 0) - (a.created ?? 0);
    })[0];

    if (!sub?.items?.data?.length) {
      return res.json({
        ok: false,
        error: "Subscription has no items.",
      });
    }

    const firstItem = sub.items.data[0];
    const productId = firstItem.price?.product;
    if (!productId || typeof productId !== "string") {
      return res.json({
        ok: false,
        error: "Subscription product id is missing.",
      });
    }
    const product = await stripe.products.retrieve(productId);

    return res.json({
      ok: true,
      subscription: {
        id: sub.id,
        customerId: customerId,
        status: sub.status,
        currentPeriodStart: stripeTimestampToISO(sub.current_period_start),
        currentPeriodEnd: stripeTimestampToISO(sub.current_period_end),
        billingCycleAnchor: stripeTimestampToISO(sub.billing_cycle_anchor),
        priceId: firstItem.price?.id ?? null,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images ?? [],
          metadata: product.metadata ?? {},
        },
      },
    });
  } catch (error) {
    log("Stripe error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
