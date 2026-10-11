// GET /.netlify/functions/auth-me  -> { email } (Bearer requis)
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  try {
    const auth = await getUserFromRequest(event);
    if (!auth) return unauthorized();
    return ok({ email: auth.user.email });
  } catch (e) { console.error('auth-me', e); return serverError(); }
};
