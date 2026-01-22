export default async ({ req, res, log }) => {
  // Appwrite Functions pass `req.body` as a string for executions.
  // Safely parse JSON if possible, otherwise keep the raw value.
  let body = req.body;
  try {
    if (typeof req.body === "string" && req.body.length) {
      body = JSON.parse(req.body);
    }
  } catch (e) {
    // If body isn't valid JSON, keep it as-is.
    log?.("Failed to parse req.body as JSON:", String(e));
  }

  log("get-subscription invoked");
  log("body:", body);

  return res.json({
    ok: true,
    message: body?.testMessage ?? null,
  });
};
