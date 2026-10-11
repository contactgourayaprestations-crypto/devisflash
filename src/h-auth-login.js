// POST /.netlify/functions/auth-login  { email, password } -> { token, email }
exports.handler = async (event) => {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return bad('Méthode non supportée');
  if (!rateLimit(clientIp(event), 15, 10 * 60 * 1000)) return bad('Trop de tentatives, réessayez dans quelques minutes');
  const body = parseBody(event);
  if (!body) return bad('Corps JSON invalide');
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  if (!validEmail(email) || !password) return bad('Email ou mot de passe invalide');
  try {
    const ref = await bGet(event, 'users-by-email/' + sha256hex(email));
    if (!ref || !ref.userId) return unauthorized('Email ou mot de passe incorrect');
    const user = await bGet(event, 'users/' + ref.userId);
    if (!user || !verifyPassword(password, user.passwordHash)) return unauthorized('Email ou mot de passe incorrect');
    const token = newToken();
    await bSet(event, 'sessions/' + token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
    return ok({ token, email: user.email });
  } catch (e) { console.error('auth-login', e); return serverError(); }
};
