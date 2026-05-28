import { z } from 'zod';
import { serverSupabaseClient } from '#supabase/server';
import { logAudit } from '~~/server/utils/audit';
import { getClientIp } from '~~/server/utils/client-ip';
import { checkLockout, recordAttempt } from '~~/server/utils/login-lockout';
import { trackConnexion } from '~~/server/utils/connexion-tracker';

const loginSchema = z.object({
  email: z.string().email('Email invalide').trim().toLowerCase(),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse);
  const ip = getClientIp(event);
  const userAgent = getHeader(event, 'user-agent') ?? null;
  const pays = getHeader(event, 'cf-ipcountry') ?? null; // pose par Cloudflare

  // 1. Lockout progressif : si l'email a deja accumule trop d'echecs, refuser
  const lockout = await checkLockout(body.email);
  if (lockout) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: `Compte temporairement verrouille suite a trop de tentatives. Reessayez dans ${Math.ceil(lockout.retryAfterSeconds / 60)} minutes ou reinitialisez votre mot de passe.`,
      data: { lockedUntil: lockout.lockedUntil.toISOString() },
    });
  }

  // 2. Tentative d'authentification Supabase
  const supabase = await serverSupabaseClient(event);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !data?.user) {
    await recordAttempt(body.email, ip, false);
    await logAudit({
      event,
      action: 'auth.login_failed',
      userId: null,
      success: false,
      metadata: { email: body.email, reason: error?.message ?? 'unknown' },
    });
    unauthorized('Email ou mot de passe incorrect');
  }

  // 3. Succes — record + tracking
  await recordAttempt(body.email, ip, true);
  await logAudit({ event, action: 'auth.login', userId: data.user.id });

  const { isNewDevice } = await trackConnexion({
    userId: data.user.id,
    ip,
    userAgent,
    pays,
  });

  return {
    data: {
      user: data.user,
      session: data.session,
      // Le client peut afficher un toast "Nouvelle connexion detectee depuis…"
      isNewDevice,
    },
  };
});
