// GET/POST /.netlify/functions/settings  — infos entreprise de l'artisan (Bearer requis)
// { nom, adresse, cp, ville, tel, email, siret, tvaIntra, formeJuridique }
function cleanSettings(b) {
  const s = (v, m) => { v = String(v == null ? '' : v); return v.length > m ? v.slice(0, m) : v; };
  return {
    nom: s(b.nom, 120), adresse: s(b.adresse, 200), cp: s(b.cp, 10), ville: s(b.ville, 80),
    tel: s(b.tel, 30), email: s(b.email, 120), siret: s(b.siret, 20),
    tvaIntra: s(b.tvaIntra, 20), formeJuridique: s(b.formeJuridique, 60),
  };
}
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  const auth = await getUserFromRequest(event).catch(() => null);
  if (!auth) return unauthorized();
  try {
    const key = 'settings/' + auth.user.id;
    if (event.httpMethod === 'GET') {
      const st = await bGet(event, key);
      return ok({ settings: st || {} });
    }
    if (event.httpMethod === 'POST') {
      const body = parseBody(event);
      if (!body) return bad('Corps JSON invalide');
      const st = cleanSettings(body);
      await bSet(event, key, st);
      return ok({ settings: st });
    }
    return bad('Méthode non supportée');
  } catch (e) { console.error('settings', e); return serverError(); }
};
