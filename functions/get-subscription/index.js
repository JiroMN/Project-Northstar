import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async ({ req, res, log }) => {
  log("Stripe key exists", !!process.env.STRIPE_SECRET_KEY);

  const subs = await stripe.subscriptions.list({ limit: 999 });

  return res.json({
    ok: true,
    subscriptions: subs.data,
  });
};
