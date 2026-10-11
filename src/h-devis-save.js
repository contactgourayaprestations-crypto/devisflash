// Devis : validation + calculs serveur (les totaux ne sont jamais trustés depuis le client)
const STATUTS = ['brouillon', 'envoye', 'accepte', 'refuse', 'facture'];
const TVA_OK = [0, 5.5, 10, 20];

function s(v, max) { v = String(v == null ? '' : v); return v.length > max ? v.slice(0, max) : v; }
function num(v, def) { const n = parseFloat(v); return isFinite(n) && n >= 0 ? n : def; }

function validateDevis(d) {
  if (!d || typeof d !== 'object') return 'Devis invalide';
  const out = {};
  out.statut = STATUTS.includes(d.statut) ? d.statut : 'brouillon';
  const c = d.client || {};
  out.client = {
    nom: s(c.nom, 120), adresse: s(c.adresse, 200), cp: s(c.cp, 10),
    ville: s(c.ville, 80), tel: s(c.tel, 30), email: s(c.email, 120),
  };
  if (!out.client.nom) return 'Nom du client requis';
  const lignes = Array.isArray(d.lignes) ? d.lignes : [];
  if (!lignes.length) return 'Au moins une ligne de travaux requise';
  if (lignes.length > 100) return 'Trop de lignes (max 100)';
  out.lignes = lignes.map((l) => ({
    description: s(l.description, 300),
    quantite: num(l.quantite, 1),
    unite: s(l.unite, 12),
    prixHT: Math.round(num(l.prixHT, 0) * 100) / 100,
  })).filter((l) => l.description);
  if (!out.lignes.length) return 'Au moins une ligne de travaux requise';
  out.tvaTaux = TVA_OK.includes(Number(d.tvaTaux)) ? Number(d.tvaTaux) : 20;
  out.acomptePct = Math.min(100, Math.max(0, num(d.acomptePct, 30)));
  out.notes = s(d.notes, 1000);
  // Totaux calculés côté serveur
  out.totalHT = Math.round(out.lignes.reduce((t, l) => t + l.quantite * l.prixHT, 0) * 100) / 100;
  out.totalTVA = Math.round(out.totalHT * out.tvaTaux / 100 * 100) / 100;
  out.totalTTC = Math.round((out.totalHT + out.totalTVA) * 100) / 100;
  out.acompteMontant = Math.round(out.totalTTC * out.acomptePct / 100 * 100) / 100;
  return out;
}

async function nextNumero(event, userId, prefix) {
  const key = 'counters/' + userId + '/' + prefix;
  const cur = await bGet(event, key);
  const n = (cur && cur.n ? cur.n : 0) + 1;
  await bSet(event, key, { n });
  const year = new Date().getFullYear();
  return prefix + '-' + year + '-' + String(n).padStart(4, '0');
}

// POST /.netlify/functions/devis-save  { devis } -> { id, numero }  (Bearer requis)
// Si devis.id fourni et appartenant à l'utilisateur : mise à jour, sinon création.
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return bad('Méthode non supportée');
  const auth = await getUserFromRequest(event).catch(() => null);
  if (!auth) return unauthorized();
  const body = parseBody(event);
  if (!body || !body.devis) return bad('Devis manquant');
  const v = validateDevis(body.devis);
  if (typeof v === 'string') return bad(v);
  try {
    const uid = auth.user.id;
    let id = body.devis.id, numero = null, created = false;
    if (id) {
      const existing = await bGet(event, 'devis/' + uid + '/' + String(id));
      if (!existing || existing.userId !== uid) return notFound('Devis introuvable');
      numero = existing.numero;
      v.dateValidite = existing.dateValidite;
    } else {
      id = newId();
      numero = await nextNumero(event, uid, 'DEV');
      created = true;
      const now = new Date();
      v.dateCreation = now.toISOString();
      v.dateValidite = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString();
    }
    const doc = { ...v, id, numero, userId: uid, updatedAt: new Date().toISOString() };
    if (!doc.dateCreation) doc.dateCreation = new Date().toISOString();
    await bSet(event, 'devis/' + uid + '/' + id, doc);
    return created ? json(201, { id, numero }) : ok({ id, numero });
  } catch (e) { console.error('devis-save', e); return serverError(); }
};
