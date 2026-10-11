// DELETE /.netlify/functions/devis-delete?id=xxx  (Bearer requis)
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'DELETE' && event.httpMethod !== 'POST') return bad('Méthode non supportée');
  const auth = await getUserFromRequest(event).catch(() => null);
  if (!auth) return unauthorized();
  const q = event.queryStringParameters || {};
  const body = parseBody(event) || {};
  const id = String(q.id || body.id || '');
  if (!id) return bad('ID manquant');
  try {
    const d = await bGet(event, 'devis/' + auth.user.id + '/' + id);
    if (!d || d.userId !== auth.user.id) return notFound('Devis introuvable');
    await bDel(event, 'devis/' + auth.user.id + '/' + id);
    return ok({ ok: true });
  } catch (e) { console.error('devis-delete', e); return serverError(); }
};
