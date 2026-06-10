/**
 * Aperçu local du template de bienvenue — capture le HTML que Resend
 * enverrait (sans rien envoyer) et l'écrit dans /tmp/welcome-email.html.
 *
 * Usage : NUXT_RESEND_API_KEY=preview npx tsx scripts/preview-welcome-email.ts
 */
import { writeFileSync } from 'node:fs';

// Stub des auto-imports Nitro utilisés par server/utils/email.ts
(globalThis as Record<string, unknown>).useRuntimeConfig = () => ({ resendApiKey: 'preview' });

// Intercepte l'appel HTTP du SDK Resend pour capturer le payload
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
  if (String(url).includes('resend.com')) {
    const body = JSON.parse(String(init?.body ?? '{}'));
    writeFileSync('/tmp/welcome-email.html', body.html ?? '');
    console.log(`✓ HTML capturé (${(body.html ?? '').length} chars) → /tmp/welcome-email.html`);
    console.log(`  Sujet : ${body.subject}`);
    console.log(`  From  : ${body.from} · Reply-To : ${body.reply_to ?? body.replyTo}`);
    return new Response(JSON.stringify({ id: 'preview' }), { status: 200 });
  }
  return realFetch(url, init);
}) as typeof fetch;

const { sendWelcomeEmail } = await import('../server/utils/email');
await sendWelcomeEmail('preview@example.com', 'Antoine');
