import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

export default async ({ req, res, log }) => {
  try {
    const allowedProductTypes = Array.isArray(req.bodyJson?.allowedProductTypes)
      ? req.bodyJson.allowedProductTypes
      : [];

    const products = await stripe.products.list({
      limit: 10,
      expand: ["data.default_price"],
    });

    const filteredProducts =
      allowedProductTypes.length > 0
        ? products.data.filter((product) =>
            allowedProductTypes.includes(
              product.metadata?.brandbook_product_type,
            ),
          )
        : products.data;

    return res.json({
      ok: true,
      products: filteredProducts,
    });
  } catch (error) {
    log("Stripe error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
