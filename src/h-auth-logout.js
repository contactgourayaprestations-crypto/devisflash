// POST /.netlify/functions/auth-logout  (Bearer requis)
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  try {
    const auth = await getUserFromRequest(event);
    if (auth && auth.token) await bDel(event, 'sessions/' + auth.token);
    return ok({ ok: true });
  } catch (e) { console.error('auth-logout', e); return serverError(); }
};
