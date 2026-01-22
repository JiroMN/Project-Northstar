export default async ({ req, res, context }) => {
  context.log(req.body?.testMessage);
  return res.json({
    ok: true,
    message: req.body,
  });
};
