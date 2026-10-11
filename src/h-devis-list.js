// GET /.netlify/functions/devis-list  -> { devis: [résumés] }  (Bearer requis)
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'GET') return bad('Méthode non supportée');
  const auth = await getUserFromRequest(event).catch(() => null);
  if (!auth) return unauthorized();
  try {
    const keys = await bList(event, 'devis/' + auth.user.id + '/');
    const items = [];
    for (const k of keys.slice(0, 500)) {
      const d = await bGet(event, k);
      if (d && d.id) items.push({
        id: d.id, numero: d.numero, statut: d.statut,
        clientNom: d.client ? d.client.nom : '',
        totalTTC: d.totalTTC, dateCreation: d.dateCreation, updatedAt: d.updatedAt,
      });
    }
    items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return ok({ devis: items });
  } catch (e) { console.error('devis-list', e); return serverError(); }
};
