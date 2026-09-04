<!--
  EcranApigo — les quatre écrans d'APIGO, en CSS pur.

  ⚠️ EXTRAITS DE L'ANCIEN `LandingMockups.vue`, PAS RÉÉCRITS. C'était le seul endroit du
  site où l'on voyait le produit, et ce composant en est le déménagement — pas
  une seconde version. Deux copies de la même maquette finissent toujours par
  diverger, et celle-ci porte des promesses commerciales : le jour où l'une des
  deux dit « Factur-X inclus » pendant que l'autre dit « dès Starter », c'est le
  client qui arbitre, à nos dépens.

  Aucune image externe : tout est en CSS et en SVG, donc rien à charger et rien
  qui casse sous une politique de sécurité de contenu stricte.

  L'appelant choisit l'écran par son `id` ; les quatre identifiants sont ceux du
  catalogue de `MayaEnImages`, dont ce composant est le rendu.
-->
<template>
  <!-- ═══ MAYA — la conversation ═══ -->
  <div
    v-if="id === 'maya'"
    class="mx-auto w-full max-w-[420px] overflow-hidden rounded-[20px] border shadow-[0_20px_60px_rgba(40,30,20,0.1)]"
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
        <!-- L'alvéole VIVANTE, pas un hexagone de substitution : la maquette
             montre exactement ce que l'apiculteur verra dans l'application. -->
        <IaMayaMark :size="17" state="idle" />
      </span>
      <span class="text-[13px] font-semibold text-white">Maya</span>
      <span class="text-[10px]" style="color: rgba(255, 255, 255, 0.5)">· en ligne</span>
    </div>
    <div class="space-y-2.5 p-4" style="background: linear-gradient(180deg, #fdf8ef, #fbf3e4)">
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
        104 colonies, dont <strong>104 saines</strong>. 3 ruches n'ont pas été visitées depuis un
        moment — un petit tour leur ferait du bien&nbsp;🐝
        <!-- ⚠️ CES DEUX PUCES ÉTAIENT DES ACTIONS INVENTÉES (« Voir les 3
             ruches » / « Plus tard »). Les puces sous une réponse de Maya ne
             sont pas des actions : ce sont les QUESTIONS SUIVANTES qu'on peut
             lui poser d'un doigt (`message.suggestions` dans
             CopiloteMessage.vue). Les deux ci-dessous sont reprises mot pour
             mot du moteur (`server/utils/copilote-local.ts`), et elles ont
             toutes le même habillage dans le produit. -->
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="s in SUGGESTIONS"
            :key="s"
            class="rounded-full border px-2 py-0.5 text-[10.5px] font-semibold"
            style="
              border-color: color-mix(in srgb, var(--honey) 45%, transparent);
              background: var(--honey-soft);
              color: var(--honey-deep);
            "
            >{{ s }}</span
          >
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ BALANCES — le poids en direct ═══ -->
  <div
    v-else-if="id === 'balances'"
    class="mx-auto w-full max-w-[420px] rounded-[20px] border bg-white p-5 shadow-[0_20px_60px_rgba(40,30,20,0.08)]"
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
        <p class="text-[11px] font-medium" style="color: var(--honey-deep)">+1,4 kg / 24 h</p>
      </div>
    </div>
    <svg viewBox="0 0 300 90" class="w-full" preserveAspectRatio="none" aria-hidden="true">
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
    <div class="mt-2 flex justify-between text-[10px]" style="color: var(--text-tertiary)">
      <span v-for="j in JOURS" :key="j">{{ j }}</span>
    </div>
  </div>

  <!-- ═══ FACTURATION — Factur-X ═══ -->
  <div
    v-else-if="id === 'facturation'"
    class="mx-auto w-full max-w-[420px] rounded-[20px] border bg-white p-5 shadow-[0_20px_60px_rgba(40,30,20,0.08)]"
    style="border-color: var(--border-default)"
  >
    <div
      class="mb-4 flex items-start justify-between border-b pb-3"
      style="border-color: var(--border-default)"
    >
      <div>
        <p class="text-[15px] font-bold" style="color: var(--text-primary)">FACTURE</p>
        <p class="text-[11px]" style="color: var(--text-tertiary)">N° 2026-0042 · 23/07/2026</p>
      </div>
      <span
        class="rounded-full px-2.5 py-1 text-[10px] font-bold"
        style="background: var(--honey-soft); color: var(--honey-deep)"
        >Factur-X</span
      >
    </div>
    <div class="space-y-2">
      <div v-for="l in lignesFacture" :key="l.label" class="flex justify-between text-[12.5px]">
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
      <span>Total TTC</span><span class="tabular-nums">{{ totalFacture }}</span>
    </div>
    <div class="mt-2 flex items-center gap-1.5 text-[10.5px]" style="color: var(--text-tertiary)">
      <UIcon name="i-lucide-check-circle-2" class="h-3.5 w-3.5" style="color: var(--honey)" />
      Conforme réforme 2026 · PDF + XML
    </div>
  </div>

  <!-- ═══ TRAÇABILITÉ / ÉCO-SCORE — le passeport du pot ═══ -->
  <div
    v-else
    class="mx-auto w-full max-w-[380px] rounded-[20px] border p-6 shadow-[0_20px_60px_rgba(40,30,20,0.08)]"
    style="border-color: var(--honey); background: linear-gradient(180deg, #fdf8ef, #fbf3e4)"
  >
    <div class="rounded-[14px] border bg-white p-4" style="border-color: var(--border-default)">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[15px] font-bold" style="color: var(--text-primary)">Miel de printemps</p>
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
          v-for="f in FLEURS"
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
</template>

<script setup lang="ts">
import type { EcranId } from '~/config/ecrans-apigo';

defineProps<{ id: EcranId }>();

/**
 * Les deux puces sont reprises MOT POUR MOT du moteur : ce sont de vraies
 * suggestions de suivi, pas des libellés inventés pour la maquette.
 */
const SUGGESTIONS = ['Quelles ruches visiter en priorité ?', 'La météo est-elle favorable ?'];

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Auj'];

/** Mini-courbe de poids (montée type miellée) — points SVG. */
const courbePoids = [12, 18, 22, 30, 44, 52, 40, 55, 68, 74, 82]
  .map((v, i, a) => {
    const x = (i / (a.length - 1)) * 300;
    const y = 90 - (v / 90) * 82 - 4;
    return `${x.toFixed(0)},${y.toFixed(0)}`;
  })
  .join(' ');

/**
 * ⚠️ LE TOTAL SE CALCULE, IL NE SE RECOPIE PAS. Il était écrit « 142,50 € » en
 * dur sous deux lignes qui font 134,00 € : la maquette d'une facture qui ne
 * tombe pas juste est le pire endroit du site pour une erreur d'arithmétique —
 * c'est précisément le produit qu'on vend comme « conforme ». Un banc le
 * revérifie, parce qu'un total en dur reviendra par copier-coller.
 */
const lignesFacture = [
  { label: 'Miel toutes fleurs · 500 g × 12', montant: 90.0 },
  { label: 'Miel d’acacia · 250 g × 8', montant: 44.0 },
].map((l) => ({ ...l, montant: `${l.montant.toFixed(2).replace('.', ',')} €` }));

const totalFacture = `${[90.0, 44.0]
  .reduce((s, m) => s + m, 0)
  .toFixed(2)
  .replace('.', ',')} €`;

const FLEURS = ['Acacia', 'Aubépine', 'Colza', 'Pissenlit'];
</script>
