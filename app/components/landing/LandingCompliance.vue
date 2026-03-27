<template>
  <section id="conformite" class="bg-[#FAFAF8] py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-sm">
        <div class="grid grid-cols-1 lg:grid-cols-2">
          <!-- Left: text -->
          <div class="p-8 sm:p-12">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">
              Conformité
            </p>
            <h2 class="mb-4 text-3xl font-bold tracking-tight text-stone-900">
              Conforme à toutes vos obligations
            </h2>
            <p class="mb-8 text-stone-500 leading-relaxed">
              L'apiculture est une activité réglementée. Notre logiciel a été conçu en intégrant
              chaque exigence légale française et européenne.
            </p>

            <ul class="space-y-4">
              <li v-for="item in items" :key="item.text" class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50"
                >
                  <UIcon :name="item.icon" class="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-stone-800">{{ item.text }}</p>
                  <p class="text-xs text-stone-400">{{ item.ref }}</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Right: highlights -->
          <div class="border-t border-stone-100 bg-[#FAFAF8] p-8 sm:p-12 lg:border-t-0 lg:border-l">
            <div class="space-y-6">
              <div
                v-for="highlight in highlights"
                :key="highlight.title"
                class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
              >
                <div class="flex items-center gap-3 mb-2">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                    :class="highlight.bgClass"
                  >
                    <UIcon :name="highlight.icon" class="h-4 w-4" :class="highlight.iconClass" />
                  </div>
                  <h3 class="text-sm font-semibold text-stone-900">{{ highlight.title }}</h3>
                </div>
                <p class="text-xs leading-relaxed text-stone-500">{{ highlight.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const items = [
  {
    icon: 'i-lucide-book-open',
    text: "Registre d'élevage conforme",
    ref: 'Arrêté du 5 juin 2000',
  },
  {
    icon: 'i-lucide-file-text',
    text: 'Facturation conforme — toutes mentions légales',
    ref: 'Art. L441-9 Code de commerce',
  },
  {
    icon: 'i-lucide-file-check',
    text: 'Factur-X (XML CII) — prêt pour sept. 2026',
    ref: 'Décret n° 2022-1299 — Norme EN 16931',
  },
  {
    icon: 'i-lucide-percent',
    text: 'TVA apicole multi-taux + TVA intracommunautaire',
    ref: 'CGI — 5,5% / 10% / 20% / 0%',
  },
  {
    icon: 'i-lucide-package',
    text: 'Traçabilité des lots de miel',
    ref: 'Règlement CE 178/2002',
  },
  {
    icon: 'i-lucide-shield',
    text: 'RGPD — données hébergées en Europe',
    ref: 'Supabase EU — Francfort',
  },
];

const highlights = [
  {
    icon: 'i-lucide-file-check',
    title: 'Factur-X prêt pour 2026',
    description:
      'Générez le fichier XML CII (norme EN 16931, profil BASIC) directement depuis chaque facture. Déposez-le sur votre plateforme agréée (Qonto, Pennylane…) en un clic.',
    bgClass: 'bg-amber-50',
    iconClass: 'text-amber-600',
  },
  {
    icon: 'i-lucide-lock',
    title: 'Chiffrement bout en bout',
    description:
      'Transit TLS, mots de passe hashés bcrypt, RLS PostgreSQL — chaque utilisateur ne voit que ses propres données.',
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
  },
  {
    icon: 'i-lucide-download',
    title: 'Portabilité de vos données',
    description:
      'Export de toutes vos données en XLSX, PDF ou FEC à tout moment — même si vous quittez le service.',
    bgClass: 'bg-violet-50',
    iconClass: 'text-violet-600',
  },
];
</script>
