import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

function stripeTimestampToISO(timestamp) {
  if (!timestamp || typeof timestamp !== "number") return null;
  return new Date(timestamp * 1000).toISOString();
}

export default async ({ req, res, log }) => {
  try {
    const cusId = req.bodyJson.customerId;
    const returnUrl = req.bodyJson.returnUrl;

    const session = await stripe.billingPortal.sessions.create({
      customer: cusId,
      return_url: returnUrl,
    });

    return res.json({
      ok: true,
      session,
    });
  } catch (error) {
    log("Stripe error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
