export default async ({ req, res, log }) => {
  let body = req.body;
  try {
    if (typeof req.body === "string" && req.body.length) {
      body = JSON.parse(req.body);
    }
  } catch (e) {
    log?.("Failed to parse req.body as JSON:", String(e));
  }

  log("get-subscription invoked");
  log("body:", body);

  return res.json({
    ok: true,
    message: body?.testMessage,
    clientId: body?.clientId,
  });
};
