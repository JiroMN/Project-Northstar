export default async ({ req, res, log }) => {
  try {
    const session = req.bodyJson.session;
    const teamName = req.bodyJson.teamName;

    log(session, teamName);

    return res.json({
      ok: true,
    });
  } catch (error) {
    log("Appwrite error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
