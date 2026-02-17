export default async ({ req, res, log }) => {
  try {
    return res.json({
      ok: true,
    });
  } catch (error) {
    log("Resend error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
