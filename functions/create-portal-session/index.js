import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

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
