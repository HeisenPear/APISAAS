import type { H3Event } from 'h3';
import { getHeader } from 'h3';
import { auditLog } from '~~/server/database/schema';
import { getClientIp } from './client-ip';

export type AuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.password_reset_requested'
  | 'auth.password_changed'
  | 'auth.email_changed'
  | 'account.created'
  | 'account.deleted'
  | 'account.exported'
  | 'mfa.enrolled'
  | 'mfa.disabled'
  | 'mfa.verified'
  | 'mfa.verify_failed'
  | 'admin.user_listed'
  | 'admin.user_deleted'
  | 'billing.subscription_created'
  | 'billing.subscription_canceled'
  | 'billing.plan_changed'
  | 'security.suspicious_activity';

interface AuditOptions {
  event: H3Event;
  action: AuditAction;
  userId?: string | null;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

/**
 * Trace une action sensible dans le journal d'audit.
 *
 * Best-effort : ne fait JAMAIS echouer l'action principale si l'insert
 * audit echoue (on ne veut pas qu'un user ne puisse pas se logger parce
 * que la table audit est down). Les erreurs sont loggees pour Sentry.
 */
export async function logAudit(opts: AuditOptions): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: opts.userId ?? null,
      action: opts.action,
      resourceType: opts.resourceType ?? null,
      resourceId: opts.resourceId ?? null,
      ip: getClientIp(opts.event),
      userAgent: getHeader(opts.event, 'user-agent') ?? null,
      metadata: opts.metadata ?? null,
      success: opts.success ?? true,
    });
  } catch (err) {
    console.error('[audit] insert failed', { action: opts.action, error: err });
  }
}
