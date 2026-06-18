<template>
  <section class="py-16 sm:py-24 md:py-32" style="background: var(--surface-primary)">
    <div class="mx-auto max-w-5xl px-4 sm:px-6">
      <!-- Header -->
      <div class="mx-auto mb-12 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Comparaison
        </p>
        <h2
          class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]"
          style="color: var(--text-primary)"
        >
          Ce qu'APIGO fait,<br class="hidden sm:block" />
          et pas les autres.
        </h2>
        <p class="mt-4 text-[15px] leading-relaxed" style="color: var(--text-secondary)">
          Face aux applis de suivi génériques et aux tableurs, un seul outil qui couvre vraiment le
          terrain, la conformité et la vente.
        </p>
      </div>

      <!-- MOBILE : checklist APIGO -->
      <div
        class="sm:hidden rounded-[18px] border overflow-hidden"
        style="border-color: var(--border-default); background: white"
      >
        <div
          class="flex items-center gap-3 border-b p-4"
          style="border-color: var(--border-default); background: var(--honey-soft)"
        >
          <img
            src="/logo_apigo.webp"
            alt="APIGO"
            class="h-9 w-9 rounded-xl object-cover shadow-sm flex-shrink-0"
          />
          <div>
            <p class="text-[14px] font-bold" style="color: var(--honey-deep)">APIGO fait tout ça</p>
            <p class="text-[11px]" style="color: var(--text-secondary)">
              Ce que les autres applis & Excel ne font pas
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-px" style="background: var(--border-default)">
          <div
            v-for="row in rows"
            :key="row.label"
            class="flex items-center gap-2.5 p-3.5"
            style="background: white"
          >
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style="background: var(--honey-soft)"
            >
              <UIcon name="i-lucide-check" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
            </div>
            <span
              class="text-[11.5px] font-medium leading-tight"
              style="color: var(--text-primary)"
              >{{ row.label }}</span
            >
          </div>
        </div>
      </div>

      <!-- DESKTOP : tableau comparatif complet -->
      <div
        class="hidden sm:block overflow-hidden rounded-[18px] border"
        style="border-color: var(--border-default); background: white"
      >
        <!-- Column headers -->
        <div class="grid grid-cols-4 border-b" style="border-color: var(--border-default)">
          <div class="p-4 sm:p-5" />
          <div
            class="flex flex-col items-center justify-center border-l p-4 sm:p-5"
            style="border-color: var(--border-default)"
          >
            <div class="mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[16px]">
              📱
            </div>
            <span class="text-[11px] font-semibold" style="color: var(--text-secondary)"
              >Appli de suivi</span
            >
          </div>
          <div
            class="flex flex-col items-center justify-center border-l p-4 sm:p-5"
            style="border-color: var(--border-default)"
          >
            <div class="mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[16px]">
              📊
            </div>
            <span class="text-[11px] font-semibold" style="color: var(--text-secondary)"
              >Tableur / Excel</span
            >
          </div>
          <div
            class="flex flex-col items-center justify-center border-l p-4 sm:p-5"
            style="
              border-color: color-mix(in srgb, var(--honey) 25%, transparent);
              background: var(--honey-soft);
            "
          >
            <img
              src="/logo_apigo.webp"
              alt="APIGO"
              class="mb-1 h-8 w-8 rounded-lg object-cover shadow-sm"
            />
            <span class="text-[11px] font-bold" style="color: var(--honey-deep)">APIGO</span>
          </div>
        </div>
        <!-- Rows -->
        <div
          v-for="(row, i) in rows"
          :key="row.label"
          class="grid grid-cols-4"
          :class="i < rows.length - 1 ? 'border-b' : ''"
          :style="`border-color:var(--border-default)`"
        >
          <div class="flex items-center p-4 sm:p-5">
            <span
              class="text-[12.5px] font-medium sm:text-[13px]"
              style="color: var(--text-primary)"
              >{{ row.label }}</span
            >
          </div>
          <div
            class="flex items-center justify-center border-l p-4 sm:p-5"
            style="border-color: var(--border-default)"
          >
            <span v-if="row.paper === true" class="text-[18px]">❌</span>
            <span
              v-else-if="row.paper === 'partial'"
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style="background: var(--surface-muted); color: var(--text-secondary)"
              >Limité</span
            >
            <span v-else class="text-[18px]">✅</span>
          </div>
          <div
            class="flex items-center justify-center border-l p-4 sm:p-5"
            style="border-color: var(--border-default)"
          >
            <span v-if="row.excel === true" class="text-[18px]">❌</span>
            <span
              v-else-if="row.excel === 'partial'"
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style="background: var(--surface-muted); color: var(--text-secondary)"
              >Limité</span
            >
            <span v-else class="text-[18px]">✅</span>
          </div>
          <div
            class="flex items-center justify-center border-l p-4 sm:p-5"
            style="
              border-color: color-mix(in srgb, var(--honey) 25%, transparent);
              background: var(--honey-soft);
            "
          >
            <div class="flex items-center gap-1.5">
              <UIcon
                name="i-lucide-check"
                class="h-4 w-4 flex-shrink-0"
                style="color: var(--honey-deep)"
              />
              <span class="text-[11px] font-semibold" style="color: var(--honey-deep)">{{
                row.apigo
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA under table -->
      <div class="mt-8 text-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center gap-2 rounded-[12px] px-7 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5"
          style="
            background: var(--honey);
            box-shadow: 0 4px 16px color-mix(in srgb, var(--honey) 30%, transparent);
          "
        >
          <UiBeeIcon class="h-4 w-4" />
          Passer à APIGO gratuitement
        </NuxtLink>
        <p class="mt-3 text-[12px]" style="color: var(--text-tertiary)">
          Vos données restent les vôtres. Export à tout moment.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// `paper` = colonne « Appli de suivi » · `excel` = colonne « Tableur / Excel »
// true → ❌ (absent) · 'partial' → badge « Limité » · false → ✅
const rows = [
  { label: 'Saisie terrain en 30 secondes', paper: 'partial', excel: true, apigo: '30 secondes' },
  { label: 'Mode hors-ligne natif', paper: 'partial', excel: true, apigo: 'Natif' },
  { label: 'QR code par ruche', paper: true, excel: true, apigo: 'Scan 1 s' },
  { label: 'Score de santé prédictif (IA)', paper: true, excel: true, apigo: 'Inclus' },
  { label: 'Facturation Factur-X 2026', paper: true, excel: 'partial', apigo: 'Conforme' },
  { label: "Registre d'élevage + NAPI", paper: 'partial', excel: 'partial', apigo: 'Auto-généré' },
  {
    label: 'Comptabilité & rentabilité / ruche',
    paper: true,
    excel: 'partial',
    apigo: 'Par ruche',
  },
  { label: 'Traçabilité des lots de miel', paper: 'partial', excel: true, apigo: 'CE 178/2002' },
  { label: 'Du terrain à la vente, en un outil', paper: true, excel: true, apigo: 'Tout-en-un' },
  { label: 'Données hébergées en Europe', paper: 'partial', excel: 'partial', apigo: 'RGPD · EU' },
];
</script>
