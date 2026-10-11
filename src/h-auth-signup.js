// POST /.netlify/functions/auth-signup  { email, password } -> { token, email }
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return bad('Méthode non supportée');
  if (!rateLimit(clientIp(event), 10, 10 * 60 * 1000)) return bad('Trop de tentatives, réessayez dans quelques minutes');
  const body = parseBody(event);
  if (!body) return bad('Corps JSON invalide');
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (!validEmail(email)) return bad('Adresse email invalide');
  if (password.length < 8) return bad('Mot de passe : 8 caractères minimum');
  if (password.length > 128) return bad('Mot de passe trop long');
  try {
    const emailKey = 'users-by-email/' + sha256hex(email);
    if (await bGet(event, emailKey)) return bad('Un compte existe déjà avec cet email');
    const userId = newId();
    await bSet(event, 'users/' + userId, { id: userId, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
    await bSet(event, emailKey, { userId });
    const token = newToken();
    await bSet(event, 'sessions/' + token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
    return created({ token, email });
  } catch (e) { console.error('auth-signup', e); return serverError(); }
};
