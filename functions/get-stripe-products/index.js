import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

export default async ({ req, res, log }) => {
  try {
    const products = await stripe.products.list({
      limit: 10,
      expand: ["data.default_price"],
    });

    log(products);

    return res.json({
      ok: true,
      products: products.data,
    });
  } catch (error) {
    log("Stripe error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};

// const obj = {
//   object: "list",
//   data: [
//     {
//       id: "prod_Tq5ZCevEBTzBLE",
//       object: "product",
//       active: true,
//       attributes: [],
//       created: 1769094106,
//       default_price: "price_1SsPOIPBSqJNxSUnCj90lwjO",
//       description:
//         "Voor bedrijven die elke ervaring van hun klanten willen ontwerpen alsof het hun eerste indruk is.",
//       images: [
//         "https://files.stripe.com/links/MDB8YWNjdF8xU2ZONXRQQlNxSk54U1VufGZsX3Rlc3RfaTBUZFBUSGpQTWVkekdxVGFEYUtVNFNZ00LQhBjf3R",
//       ],
//       livemode: false,
//       marketing_features: [],
//       metadata: {},
//       name: "Continuity Plus",
//       package_dimensions: null,
//       shippable: null,
//       statement_descriptor: null,
//       tax_code: "txcd_10000000",
//       type: "service",
//       unit_label: null,
//       updated: 1769094196,
//       url: null,
//     },
//     {
//       id: "prod_Tq5Y8XAlLPBPyP",
//       object: "product",
//       active: true,
//       attributes: [],
//       created: 1769094059,
//       default_price: "price_1SsPNYPBSqJNxSUnEB0qFVcg",
//       description:
//         "Strategische merksturing met structurele uitvoering. Dit is het model waar je het meeste uithaalt.",
//       images: [
//         "https://files.stripe.com/links/MDB8YWNjdF8xU2ZONXRQQlNxSk54U1VufGZsX3Rlc3RfaXFrdnAxRU5lQ1JVUkRIMVc4SFdKVWM400uYpAb03t",
//       ],
//       livemode: false,
//       marketing_features: [],
//       metadata: {},
//       name: "Continuity Core",
//       package_dimensions: null,
//       shippable: null,
//       statement_descriptor: null,
//       tax_code: "txcd_10000000",
//       type: "service",
//       unit_label: null,
//       updated: 1769094178,
//       url: null,
//     },
//     {
//       id: "prod_Tq5WSr2r5r2zbn",
//       object: "product",
//       active: true,
//       attributes: [],
//       created: 1769093946,
//       default_price: "price_1SsPLiPBSqJNxSUnFwD5XB2b",
//       description:
//         "Gericht op richting, scherpte en merkbewaking. Voor klanten die continuïteit willen zonder veel executie. Klein beetje designsupport, maar vooral adviserend.",
//       images: [
//         "https://files.stripe.com/links/MDB8YWNjdF8xU2ZONXRQQlNxSk54U1VufGZsX3Rlc3RfVFhrY3UxRHFRWUJLZXhFTnh2MnRUdzJ000i526p8PT",
//       ],
//       livemode: false,
//       marketing_features: [],
//       metadata: {},
//       name: "Continuity Essential",
//       package_dimensions: null,
//       shippable: null,
//       statement_descriptor: null,
//       tax_code: "txcd_10000000",
//       type: "service",
//       unit_label: null,
//       updated: 1769094152,
//       url: null,
//     },
//   ],
//   has_more: false,
//   url: "/v1/products",
// };
