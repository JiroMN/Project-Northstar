import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(
  "sk_test_51SfN5tPBSqJNxSUnlzGtL9MHkmcEVibXdTENSt8g4DJhSTZlOMLKqthU8M72DhaVQ6nYU68XIA8YpevSZBiDD0X800pDqpNqun",
);

export default async ({ req, res, log }) => {
  try {
    const subs = await stripe.subscriptions.list({ limit: 100 });

    return res.json({
      ok: true,
      subscriptions: subs.data,
    });
  } catch (error) {
    log("Stripe error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
