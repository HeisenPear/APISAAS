<template>
  <section id="conformite" class="py-16 sm:py-24 md:py-32 bg-white">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="overflow-hidden rounded-[20px] border" style="border-color:var(--border-default)">
        <div class="grid grid-cols-1 lg:grid-cols-2">

          <!-- Left: text -->
          <div class="p-8 sm:p-12">
            <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]" style="color:var(--honey-deep)">Conformité</p>
            <h2 class="mb-4 text-[26px] font-bold tracking-[-0.025em] sm:text-[32px]" style="color:var(--text-primary)">
              Conforme à toutes vos obligations légales
            </h2>
            <p class="mb-8 text-[14px] leading-relaxed" style="color:var(--text-secondary)">
              L'apiculture est réglementée. APIGO a été conçu en intégrant chaque exigence légale française et européenne — dès le plan Découverte.
            </p>

            <ul class="space-y-4">
              <li v-for="item in items" :key="item.text" class="flex items-start gap-3">
                <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style="background:var(--honey-soft)">
                  <UIcon :name="item.icon" class="h-3.5 w-3.5" style="color:var(--honey-deep)" />
                </div>
                <div>
                  <p class="text-[13.5px] font-semibold" style="color:var(--text-primary)">{{ item.text }}</p>
                  <p class="text-[11.5px]" style="color:var(--text-tertiary)">{{ item.ref }}</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Right: highlights -->
          <div class="border-t p-8 sm:p-12 lg:border-l lg:border-t-0" style="border-color:var(--border-default);background:var(--surface-primary)">
            <div class="space-y-4">
              <div
                v-for="highlight in highlights"
                :key="highlight.title"
                class="rounded-[14px] border p-5"
                style="border-color:var(--border-default);background:white"
              >
                <div class="mb-2 flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-[10px]" :style="`background:${highlight.bgColor}`">
                    <UIcon :name="highlight.icon" class="h-4 w-4" :style="`color:${highlight.iconColor}`" />
                  </div>
                  <h3 class="text-[13.5px] font-semibold" style="color:var(--text-primary)">{{ highlight.title }}</h3>
                </div>
                <p class="text-[12.5px] leading-relaxed" style="color:var(--text-secondary)">{{ highlight.description }}</p>
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
  { icon: 'i-lucide-book-open', text: 'Registre d\'élevage conforme', ref: 'Arrêté du 5 juin 2000' },
  { icon: 'i-lucide-file-text', text: 'Facturation — toutes mentions légales obligatoires', ref: 'Art. L441-9 Code de commerce' },
  { icon: 'i-lucide-file-check', text: 'Factur-X (XML CII) — prêt pour septembre 2026', ref: 'Décret n° 2022-1299 · Norme EN 16931' },
  { icon: 'i-lucide-percent', text: 'TVA apicole multi-taux + TVA intracommunautaire', ref: 'CGI — 5,5% / 10% / 20% / 0%' },
  { icon: 'i-lucide-package', text: 'Traçabilité des lots de miel', ref: 'Règlement CE 178/2002' },
  { icon: 'i-lucide-shield', text: 'RGPD — données hébergées en Europe', ref: 'Supabase EU · Francfort' },
];

const highlights = [
  {
    icon: 'i-lucide-file-check',
    title: 'Factur-X prêt pour 2026',
    description: 'Générez le fichier XML CII (profil BASIC) directement depuis chaque facture. Déposez-le sur Qonto, Pennylane ou Chorus Pro en un clic.',
    bgColor: 'var(--honey-soft)',
    iconColor: 'var(--honey-deep)',
  },
  {
    icon: 'i-lucide-lock',
    title: 'Chiffrement & sécurité',
    description: 'Transit TLS, mots de passe hashés bcrypt, RLS PostgreSQL par utilisateur — chacun ne voit que ses propres données.',
    bgColor: 'var(--sage-soft)',
    iconColor: 'var(--sage-deep)',
  },
  {
    icon: 'i-lucide-download',
    title: 'Portabilité totale',
    description: 'Export de toutes vos données en XLSX, PDF ou FEC à tout moment — même si vous quittez le service. Vos données vous appartiennent.',
    bgColor: 'var(--clay-soft)',
    iconColor: 'var(--clay-deep)',
  },
];
</script>
