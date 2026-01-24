import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

export default async ({ req, res, log }) => {
  try {
    const product = await stripe.subscriptions.retrieve(subId);

    log(product);

    return res.json({
      ok: true,
    });
  } catch (error) {
    log("Stripe error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
