<!--
  LandingMockups — exemples VISUELS des fonctionnalités phares (Maya, balances,
  facturation, traçabilité/éco-score). Mini-UI fidèles en CSS pur (aucune image
  externe → CSP-safe), aux couleurs du produit. Alterne texte ↔ mockup.
-->
<template>
  <section class="py-16 sm:py-24 md:py-32" style="background: var(--surface-primary)">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <p
          class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          En images
        </p>
        <h2
          v-reveal
          class="text-[30px] font-bold leading-tight tracking-[-0.025em] sm:text-[38px] md:text-[44px]"
          style="color: var(--text-primary)"
        >
          Ce que ça donne, vraiment.
        </h2>
        <p
          class="mt-4 text-[15px] leading-relaxed sm:text-[17px]"
          style="color: var(--text-secondary)"
        >
          Pas de promesse en l'air — voici les écrans qui font gagner du temps chaque jour.
        </p>
      </div>

      <div class="space-y-14 sm:space-y-20">
        <div
          v-for="(bloc, i) in blocs"
          :key="bloc.id"
          class="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
        >
          <!-- Texte -->
          <div :class="i % 2 === 1 ? 'lg:order-2' : ''">
            <div
              class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[12px]"
              style="background: var(--honey-soft)"
            >
              <!-- Le bloc de Maya porte SON logo — l'alvéole —, pas une icône
                   générique : c'est le même signe que dans l'application, et
                   c'est à ça qu'on la reconnaît. -->
              <IaMayaMark v-if="bloc.id === 'maya'" :size="22" state="idle" />
              <UIcon v-else :name="bloc.icon" class="h-5 w-5" style="color: var(--honey-deep)" />
            </div>
            <h3
              class="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]"
              style="color: var(--text-primary)"
            >
              {{ bloc.titre }}
            </h3>
            <p class="mt-3 text-[14.5px] leading-relaxed" style="color: var(--text-secondary)">
              {{ bloc.texte }}
            </p>
            <ul class="mt-4 space-y-2">
              <li
                v-for="pt in bloc.points"
                :key="pt"
                class="flex items-start gap-2 text-[13.5px]"
                style="color: var(--text-primary)"
              >
                <UIcon
                  name="i-lucide-check"
                  class="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style="color: var(--honey)"
                />
                {{ pt }}
              </li>
            </ul>
          </div>

          <!-- Mockup -->
          <div :class="i % 2 === 1 ? 'lg:order-1' : ''">
            <!-- ═══ MAYA ═══ -->
            <div
              v-if="bloc.id === 'maya'"
              class="mx-auto max-w-[420px] overflow-hidden rounded-[20px] border shadow-[0_20px_60px_rgba(40,30,20,0.1)]"
              style="border-color: var(--border-default)"
            >
              <div
                class="flex items-center gap-2.5 px-4 py-3"
                style="background: linear-gradient(135deg, #2c2218, #1a1a1c)"
              >
                <span
                  class="flex h-7 w-7 items-center justify-center rounded-full"
                  style="background: rgba(245, 166, 35, 0.2)"
                >
                  <!-- L'alvéole VIVANTE remplace l'hexagone de substitution :
                       la maquette montre désormais exactement ce que
                       l'apiculteur verra dans l'application. -->
                  <IaMayaMark :size="17" state="idle" />
                </span>
                <span class="text-[13px] font-semibold text-white">Maya</span>
                <span class="text-[10px]" style="color: rgba(255, 255, 255, 0.5)">· en ligne</span>
              </div>
              <div
                class="space-y-2.5 p-4"
                style="background: linear-gradient(180deg, #fdf8ef, #fbf3e4)"
              >
                <div
                  class="ml-auto max-w-[80%] rounded-[14px] rounded-tr-[4px] px-3 py-2 text-[12.5px]"
                  style="background: var(--honey); color: #fff"
                >
                  Comment vont mes ruches&#63;
                </div>
                <div
                  class="max-w-[88%] rounded-[14px] rounded-tl-[4px] border bg-white px-3 py-2.5 text-[12.5px]"
                  style="border-color: var(--border-default); color: var(--text-primary)"
                >
                  104 colonies, dont <strong>104 saines</strong>. 3 ruches n'ont pas été visitées
                  depuis un moment — un petit tour leur ferait du bien&nbsp;🐝
                  <div class="mt-2 flex gap-1.5">
                    <span
                      class="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style="background: var(--honey-soft); color: var(--honey-deep)"
                      >Voir les 3 ruches</span
                    >
                    <span
                      class="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style="background: var(--surface-muted); color: var(--text-secondary)"
                      >Plus tard</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- ═══ BALANCES ═══ -->
            <div
              v-else-if="bloc.id === 'balances'"
              class="mx-auto max-w-[420px] rounded-[20px] border bg-white p-5 shadow-[0_20px_60px_rgba(40,30,20,0.08)]"
              style="border-color: var(--border-default)"
            >
              <div class="mb-3 flex items-center justify-between">
                <div>
                  <p class="text-[13px] font-semibold" style="color: var(--text-primary)">
                    Ruche 12 · Rucher du Bois
                  </p>
                  <p class="text-[11px]" style="color: var(--text-tertiary)">Poids en direct</p>
                </div>
                <div class="text-right">
                  <p class="text-[22px] font-bold tabular-nums" style="color: var(--honey-deep)">
                    38,2<span class="text-[13px] font-medium"> kg</span>
                  </p>
                  <p class="text-[11px] font-medium" style="color: var(--honey-deep)">
                    +1,4 kg / 24 h
                  </p>
                </div>
              </div>
              <svg viewBox="0 0 300 90" class="w-full" preserveAspectRatio="none">
                <polyline
                  :points="courbePoids"
                  fill="none"
                  stroke="var(--honey)"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <polygon :points="`0,90 ${courbePoids} 300,90`" fill="rgba(245,166,35,0.10)" />
              </svg>
              <div
                class="mt-2 flex justify-between text-[10px]"
                style="color: var(--text-tertiary)"
              >
                <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span
                ><span>Sam</span><span>Auj</span>
              </div>
            </div>

            <!-- ═══ FACTURATION ═══ -->
            <div
              v-else-if="bloc.id === 'facturation'"
              class="mx-auto max-w-[420px] rounded-[20px] border bg-white p-5 shadow-[0_20px_60px_rgba(40,30,20,0.08)]"
              style="border-color: var(--border-default)"
            >
              <div
                class="mb-4 flex items-start justify-between border-b pb-3"
                style="border-color: var(--border-default)"
              >
                <div>
                  <p class="text-[15px] font-bold" style="color: var(--text-primary)">FACTURE</p>
                  <p class="text-[11px]" style="color: var(--text-tertiary)">
                    N° 2026-0042 · 23/07/2026
                  </p>
                </div>
                <span
                  class="rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style="background: var(--honey-soft); color: var(--honey-deep)"
                  >Factur-X</span
                >
              </div>
              <div class="space-y-2">
                <div
                  v-for="l in lignesFacture"
                  :key="l.label"
                  class="flex justify-between text-[12.5px]"
                >
                  <span style="color: var(--text-secondary)">{{ l.label }}</span>
                  <span class="font-medium tabular-nums" style="color: var(--text-primary)">{{
                    l.montant
                  }}</span>
                </div>
              </div>
              <div
                class="mt-3 flex justify-between border-t pt-3 text-[14px] font-bold"
                style="border-color: var(--border-default); color: var(--text-primary)"
              >
                <span>Total TTC</span><span class="tabular-nums">142,50 €</span>
              </div>
              <div
                class="mt-2 flex items-center gap-1.5 text-[10.5px]"
                style="color: var(--text-tertiary)"
              >
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="h-3.5 w-3.5"
                  style="color: var(--honey)"
                />
                Conforme réforme 2026 · PDF + XML
              </div>
            </div>

            <!-- ═══ TRAÇABILITÉ / ÉCO-SCORE ═══ -->
            <div
              v-else
              class="mx-auto max-w-[380px] rounded-[20px] border p-6 shadow-[0_20px_60px_rgba(40,30,20,0.08)]"
              style="
                border-color: var(--honey);
                background: linear-gradient(180deg, #fdf8ef, #fbf3e4);
              "
            >
              <div
                class="rounded-[14px] border bg-white p-4"
                style="border-color: var(--border-default)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[15px] font-bold" style="color: var(--text-primary)">
                      Miel de printemps
                    </p>
                    <p class="text-[11px]" style="color: var(--text-tertiary)">
                      Lot 2026-04 · Rucher du Bois
                    </p>
                  </div>
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white"
                    style="background: #f5a623"
                  >
                    A
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-1.5">
                  <span
                    v-for="f in fleurs"
                    :key="f"
                    class="rounded-full px-2 py-0.5 text-[10.5px]"
                    style="background: var(--honey-soft); color: var(--honey-deep)"
                    >{{ f }}</span
                  >
                </div>
                <div
                  class="mt-3 border-t pt-2 text-[10.5px]"
                  style="border-color: var(--border-default); color: var(--text-tertiary)"
                >
                  Récolté le 12/05 · Teneur en eau 17,5 % · Circuit court
                </div>
              </div>
              <p class="mt-3 text-center text-[11px] font-medium" style="color: var(--honey-deep)">
                Scannez le pot, découvrez son histoire
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const blocs = [
  {
    id: 'maya',
    icon: 'i-lucide-message-circle-heart',
    titre: 'Maya répond, et agit',
    texte:
      'Posez une question en langage naturel — à l’écrit ou à la voix. Maya lit vos données et vous propose le bon geste, sans jargon.',
    points: [
      'Comprend vos questions',
      'Dictée vocale « Salut Maya »',
      'Enregistre vos interventions',
    ],
  },
  {
    id: 'balances',
    icon: 'i-lucide-scale',
    titre: 'Le poids de vos ruches en direct',
    texte:
      'Suivez la prise de poids d’une miellée en temps réel et soyez alerté d’un vol ou d’une chute brutale. À la récolte, la quantité se pré-remplit.',
    points: ['Courbe de poids en continu', 'Alerte vol & anomalie', 'Récolte pré-remplie'],
  },
  {
    id: 'facturation',
    icon: 'i-lucide-file-text',
    titre: 'Des factures conformes en un clic',
    texte:
      'Éditez des factures au format Factur-X 2026 (PDF + XML), avec numérotation légale et mentions obligatoires. Prêt pour la réforme.',
    points: ['Factur-X inclus', 'Numérotation conforme', 'Aucun module en plus'],
  },
  {
    id: 'tracabilite',
    icon: 'i-lucide-badge-check',
    titre: 'La traçabilité qui rassure vos clients',
    texte:
      'Chaque lot raconte son histoire : origine, fleurs butinées, qualité, éco-score. Le client scanne le pot et découvre tout.',
    points: ['Traçabilité CE 178/2002', 'Éco-score par lot', 'Passeport miel à scanner'],
  },
];

// Mini-courbe de poids (montée type miellée) — points SVG.
const courbePoids = [12, 18, 22, 30, 44, 52, 40, 55, 68, 74, 82]
  .map((v, i, a) => {
    const x = (i / (a.length - 1)) * 300;
    const y = 90 - (v / 90) * 82 - 4;
    return `${x.toFixed(0)},${y.toFixed(0)}`;
  })
  .join(' ');

const lignesFacture = [
  { label: 'Miel toutes fleurs · 500 g × 12', montant: '90,00 €' },
  { label: 'Miel d’acacia · 250 g × 8', montant: '44,00 €' },
];

const fleurs = ['Acacia', 'Aubépine', 'Colza', 'Pissenlit'];
</script>
