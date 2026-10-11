// GET /.netlify/functions/devis-get?id=xxx  -> { devis }  (Bearer requis)
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'GET') return bad('Méthode non supportée');
  const auth = await getUserFromRequest(event).catch(() => null);
  if (!auth) return unauthorized();
  const id = String((event.queryStringParameters || {}).id || '');
  if (!id) return bad('ID manquant');
  try {
    const d = await bGet(event, 'devis/' + auth.user.id + '/' + id);
    if (!d || d.userId !== auth.user.id) return notFound('Devis introuvable');
    return ok({ devis: d });
  } catch (e) { console.error('devis-get', e); return serverError(); }
};
