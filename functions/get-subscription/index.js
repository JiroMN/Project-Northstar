import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

export default async ({ req, res, log }) => {
  try {
    const subId = req.bodyJson.subscriptionId;
    log("Looking for: " + subId);
    const sub = await stripe.subscriptions.retrieve(subId);

    return res.json({
      ok: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        billingCycleAnchor: sub.billing_cycle_anchor,
        priceId: sub.items.data[0].price.id,
        productId: sub.items.data[0].price.product,
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
