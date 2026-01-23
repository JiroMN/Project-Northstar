import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

function stripeTimestampToISO(timestamp) {
  if (!timestamp || typeof timestamp !== "number") return null;
  return new Date(timestamp * 1000).toISOString();
}

export default async ({ req, res, log }) => {
  try {
    const subId = req.bodyJson.subscriptionId;
    log("Looking for: " + subId);
    const sub = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price.product"],
    });

    return res.json({
      ok: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodStart: stripeTimestampToISO(sub.current_period_start),
        currentPeriodEnd: stripeTimestampToISO(sub.current_period_end),
        billingCycleAnchor: stripeTimestampToISO(sub.billing_cycle_anchor),
        priceId: sub.items.data[0].price.id,
        product: {
          id: sub.items.data[0].price.product,
          name: sub.items.data[0].price.product.name,
          images: sub.items.data[0].price.product.images,
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
