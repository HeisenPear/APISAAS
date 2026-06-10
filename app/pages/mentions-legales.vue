<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <main class="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <!-- Back link -->
      <NuxtLink
        to="/"
        class="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour à l'accueil
      </NuxtLink>

      <h1 class="text-3xl font-bold tracking-tight text-stone-900">Mentions légales</h1>
      <p class="mt-2 text-sm text-stone-400">Dernière mise à jour : mars 2026</p>

      <div class="mt-10 space-y-8 text-[15px] leading-[1.75] text-stone-700">
        <!-- Article 1 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 1 — Éditeur du site</h2>
          <p>Le présent site <strong>apigo.fr</strong> (ci-après « le Service ») est édité par :</p>
          <div class="mt-3 rounded-xl border border-stone-200/60 bg-white p-5 text-sm">
            <p><strong>Éditeur :</strong> Antoine Martin</p>
            <p><strong>Email :</strong> apigo360.apiculture@gmail.com</p>
          </div>
        </section>

        <!-- Article 2 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 2 — Responsable de publication
          </h2>
          <p>
            Le responsable de la publication est Antoine Martin, joignable à
            <a href="mailto:apigo360.apiculture@gmail.com" class="text-amber-600 hover:underline"
              >apigo360.apiculture@gmail.com</a
            >.
          </p>
        </section>

        <!-- Article 3 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 3 — Hébergement</h2>
          <p>Le Service est hébergé par :</p>
          <div class="mt-3 rounded-xl border border-stone-200/60 bg-white p-5 text-sm space-y-3">
            <div>
              <p class="font-semibold">Hébergeur applicatif</p>
              <p>Vercel Inc.</p>
              <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p>
                <a href="https://vercel.com" class="text-amber-600 hover:underline">vercel.com</a>
              </p>
            </div>
            <div class="border-t border-stone-100 pt-3">
              <p class="font-semibold">Base de données et authentification</p>
              <p>Supabase Inc. — Infrastructure hébergée en Allemagne (Francfort, UE)</p>
              <p>
                <a href="https://supabase.com" class="text-amber-600 hover:underline"
                  >supabase.com</a
                >
              </p>
            </div>
          </div>
        </section>

        <!-- Article 4 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 4 — Propriété intellectuelle
          </h2>
          <p>
            L'ensemble du contenu du Service (textes, graphismes, logiciels, images, sons, vidéos,
            logos) est la propriété exclusive de Antoine Martin et est protégé par les lois
            françaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p class="mt-3">
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou
            partie des éléments du Service, quel que soit le moyen ou le procédé utilisé, est
            interdite sans l'autorisation préalable et écrite de Antoine Martin.
          </p>
        </section>

        <!-- Article 5 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 5 — Limitation de responsabilité
          </h2>
          <p>
            Antoine Martin ne peut être tenue responsable des dommages directs ou indirects
            résultant de l'accès au Service ou de son utilisation. Antoine Martin se réserve le
            droit de modifier, de suspendre ou d'interrompre à tout moment le Service sans préavis.
          </p>
        </section>

        <!-- Article 6 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 6 — Contact</h2>
          <p>
            Pour toute question relative aux présentes mentions légales, vous pouvez contacter La
            Antoine Martin par email à
            <a
              href="mailto:apigo360.apiculture@gmail.com"
              class="font-medium text-amber-600 hover:underline"
            >
              apigo360.apiculture@gmail.com </a
            >.
          </p>
        </section>
      </div>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: 'Mentions légales — APIGO',
  meta: [{ name: 'robots', content: 'noindex' }],
});
</script>
