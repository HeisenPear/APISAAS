<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into APIGO. The project already had significant instrumentation via the `@posthog/nuxt` module (`@posthog/nuxt@^1.4.35`), `server/utils/posthog.ts`, and events across auth, payments, and core features. This session audited all existing coverage, added three missing business-critical events, verified environment variables, and created a PostHog dashboard with five insights.

## Events

| Event                      | Description                                            | File                                     |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `user_signed_up`           | User completed registration and was identified         | `app/pages/register.vue`                 |
| `user_logged_in`           | User authenticated with email + password               | `app/composables/useAuth.ts`             |
| `user_logged_out`          | User signed out (PostHog session reset)                | `app/composables/useAuth.ts`             |
| `onboarding_completed`     | User finished the 7-step onboarding flow               | `app/pages/onboarding.vue`               |
| `trial_activation_started` | User clicked to start the 60-day Pro trial via Stripe  | `app/pages/activer-essai.vue`            |
| `trial_skipped` ✨         | User chose to stay on the free Découverte plan         | `app/pages/activer-essai.vue`            |
| `rucher_created`           | New apiary (rucher) created by the user                | `app/pages/ruchers/nouveau.vue`          |
| `checkout_session_created` | Stripe checkout session initiated for a paid plan      | `server/api/stripe/checkout.post.ts`     |
| `subscription_activated`   | Subscription successfully activated via Stripe webhook | `server/api/stripe/webhook.post.ts`      |
| `subscription_cancelled`   | Subscription cancelled via Stripe webhook              | `server/api/stripe/webhook.post.ts`      |
| `intervention_created`     | Beehive inspection/intervention recorded               | `server/api/interventions/index.post.ts` |
| `harvest_recorded`         | Honey harvest logged with quantity and type            | `server/api/production/recoltes.post.ts` |
| `sale_created` ✨          | Sale/invoice created with total amount and line items  | `server/api/finances/ventes.post.ts`     |
| `member_invited` ✨        | Team member invited to the account with a role         | `server/api/membres/inviter.post.ts`     |

✨ = added in this session

## Configuration

- **Module**: `@posthog/nuxt` in `nuxt.config.ts` with `capture_exceptions: true`, `enableExceptionAutocapture: true`, and `__add_tracing_headers` for client↔server session correlation
- **Env vars**: `NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NUXT_PUBLIC_POSTHOG_HOST` set in `.env`
- **Server utility**: `server/utils/posthog.ts` — singleton `useServerPostHog()` across all Nitro API routes
- **User identification**: `posthog.identify()` called on login and signup with user ID and email

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/193691/dashboard/724885)
- [New signups over time](https://eu.posthog.com/project/193691/insights/lK2EA1mO)
- [Onboarding funnel](https://eu.posthog.com/project/193691/insights/8fcPuopb)
- [Core feature engagement](https://eu.posthog.com/project/193691/insights/w1THEaPo)
- [Subscription activations vs cancellations](https://eu.posthog.com/project/193691/insights/6YIHEqbD)
- [Trial activation vs skip rate](https://eu.posthog.com/project/193691/insights/ns764XEQ)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
