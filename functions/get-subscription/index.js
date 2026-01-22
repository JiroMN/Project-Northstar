export default async ({ req, res }) => {
  return res.json({
    ok: true,
    message: "Hello from Appwrite Function 👋",
  });
};
