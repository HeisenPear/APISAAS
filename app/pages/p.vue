<!--
  /p — PASSEPORT MIEL PUBLIC « l'histoire de ce pot ».

  Page PUBLIQUE, prérendue en statique (cf. routeRules nuxt.config) : elle ne lit
  AUCUNE base et n'appelle AUCUNE route serveur. Tout le contenu est décodé du
  fragment d'URL (`/p#<données>`), généré par le producteur sur sa fiche lot →
  zéro quota Vercel, fonctionne hors-ligne.

  Conformité (directive miel 2001/110/CE) : faits déclarés uniquement, AUCUNE
  allégation de santé. Le passeport complète l'étiquette, il ne la remplace pas.
-->
<template>
  <div class="pp-root">
    <div class="pp-card">
      <!-- Passeport valide -->
      <template v-if="p">
        <div class="pp-head">
          <span class="pp-badge">🍯 Passeport du miel</span>
          <h1 class="pp-miel">{{ titreMiel }}</h1>
          <p v-if="p.prod" class="pp-prod">par {{ p.prod }}</p>
        </div>

        <!-- Éco-score (échelle chaude, jamais vert) -->
        <div v-if="p.eco" class="pp-eco">
          <div class="pp-eco-top">
            <span class="pp-eco-lbl">Éco-score</span>
            <span class="pp-eco-val">{{ p.eco.s }}<small>/100</small></span>
          </div>
          <div class="pp-eco-scale">
            <span
              v-for="lettre in NOTES"
              :key="lettre"
              class="pp-eco-seg"
              :class="{ on: lettre === p.eco.n }"
              >{{ lettre }}</span
            >
          </div>
          <p class="pp-eco-note">
            Indicateur de transparence environnementale déclaré par le producteur (transport,
            traitements, diversité florale, naturalité).
          </p>
        </div>

        <!-- Faits du pot -->
        <dl class="pp-facts">
          <div v-if="p.origine" class="pp-fact">
            <dt>Origine</dt>
            <dd>{{ p.origine }}</dd>
          </div>
          <div v-if="miels.length" class="pp-fact">
            <dt>Fleurs butinées</dt>
            <dd>{{ miels.join(' · ') }}</dd>
          </div>
          <div v-if="p.recolte" class="pp-fact">
            <dt>Récolte</dt>
            <dd>{{ p.recolte }}</dd>
          </div>
          <div v-if="potLabel" class="pp-fact">
            <dt>Mise en pot</dt>
            <dd>{{ potLabel }}</dd>
          </div>
          <div v-if="p.eau != null" class="pp-fact">
            <dt>Teneur en eau</dt>
            <dd>{{ p.eau }} %</dd>
          </div>
          <div v-if="ddmLabel" class="pp-fact">
            <dt>À consommer de préférence avant</dt>
            <dd>{{ ddmLabel }}</dd>
          </div>
          <div class="pp-fact">
            <dt>Lot</dt>
            <dd>{{ p.lot }}</dd>
          </div>
        </dl>

        <!-- Chaîne récolte → pot -->
        <div class="pp-chain">
          <div class="pp-chain-step"><span class="pp-chain-ic">🐝</span><span>Butiné</span></div>
          <span class="pp-chain-line" />
          <div class="pp-chain-step"><span class="pp-chain-ic">🍯</span><span>Récolté</span></div>
          <span class="pp-chain-line" />
          <div class="pp-chain-step">
            <span class="pp-chain-ic">🫙</span><span>Mis en pot</span>
          </div>
        </div>

        <p class="pp-legal">
          Informations déclarées par le producteur, en complément des mentions de l'étiquette. Ce
          passeport ne constitue pas une allégation de santé.
        </p>
      </template>

      <!-- QR invalide / vide -->
      <template v-else>
        <div class="pp-head">
          <span class="pp-badge">🍯 Passeport du miel</span>
          <h1 class="pp-miel">Passeport introuvable</h1>
        </div>
        <p class="pp-legal">
          Ce lien ne contient pas de passeport valide. Scannez le QR code figurant sur le pot de
          miel.
        </p>
      </template>
    </div>

    <a class="pp-brand" href="https://apigo.fr" rel="noopener">
      Traçabilité par <strong>APIGO</strong>
    </a>
  </div>
</template>

<script setup lang="ts">
import { decoderPasseport, type PasseportMiel } from '~/utils/passeportMiel';

definePageMeta({ layout: false });
useHead({
  title: 'Passeport du miel — APIGO',
  meta: [{ name: 'robots', content: 'noindex' }],
});

const NOTES = ['A', 'B', 'C', 'D', 'E'] as const;

// Décodage CLIENT uniquement : le fragment n'est jamais envoyé au serveur. On
// part donc de null — aucun décalage d'hydratation — puis on le lit.
//
// ─── POURQUOI UN `watch` ET NON UN `onMounted` ────────────────────────────
// Cette page est PRÉRENDUE. Sur une page prérendue, le routeur normalise
// l'URL au démarrage et ne repose le fragment qu'à la MACROTÂCHE SUIVANTE.
// Mesuré, en production :
//
//   évaluation du module  → hash vide
//   onMounted             → hash vide
//   nextTick (microtâche) → hash vide
//   setTimeout 0          → hash présent
//
// Un `onMounted` lisait donc une chaîne vide et affichait « Passeport
// introuvable » — à TOUT consommateur scannant un pot. Le défaut n'existait
// qu'en production : le serveur de dev ne produit pas de page prérendue, le
// fragment y est présent dès le montage, et les bancs passaient au vert.
//
// On suit `route.hash` de façon réactive plutôt que de le lire une fois : pas
// de délai deviné, pas de sondage. Le garde `if (decode)` empêche une lecture
// vide d'écraser un passeport déjà décodé.
const route = useRoute();
const p = ref<PasseportMiel | null>(null);
watch(
  () => route.hash,
  (fragment) => {
    const decode = decoderPasseport(
      (fragment || (import.meta.client ? window.location.hash : '')).replace(/^#/, ''),
    );
    if (decode) p.value = decode;
  },
  { immediate: true },
);

const miels = computed(() => p.value?.miels ?? []);
const titreMiel = computed(() => {
  const m = miels.value;
  if (!m.length) return 'Miel';
  if (m.length === 1) return `Miel de ${m[0]}`;
  return 'Miel toutes fleurs';
});

function moisLisible(aaaammm?: string): string | null {
  if (!aaaammm) return null;
  const [a, m] = aaaammm.split('-');
  const mois = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  const idx = Number(m) - 1;
  return idx >= 0 && idx < 12 ? `${mois[idx]} ${a}` : (a ?? null);
}
const potLabel = computed(() => moisLisible(p.value?.pot));
const ddmLabel = computed(() => moisLisible(p.value?.ddm));
</script>

<style scoped>
.pp-root {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff8ec 0%, #faf7f0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
  color: #1c1c1e;
}
.pp-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border: 1px solid rgba(245, 166, 35, 0.25);
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(180, 120, 30, 0.12);
  padding: 26px 22px;
}
.pp-head {
  text-align: center;
  border-bottom: 1px dashed rgba(245, 166, 35, 0.35);
  padding-bottom: 18px;
  margin-bottom: 18px;
}
.pp-badge {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #925b0f;
  background: #fef6e4;
  padding: 4px 11px;
  border-radius: 999px;
}
.pp-miel {
  margin: 12px 0 0;
  font-size: 25px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.pp-prod {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: #7a736a;
}
.pp-eco {
  background: linear-gradient(180deg, #fef6e4, #fffdf8);
  border: 1px solid rgba(245, 166, 35, 0.28);
  border-radius: 14px;
  padding: 13px 14px;
  margin-bottom: 18px;
}
.pp-eco-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.pp-eco-lbl {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #925b0f;
}
.pp-eco-val {
  font-size: 22px;
  font-weight: 800;
  color: #1c1c1e;
}
.pp-eco-val small {
  font-size: 12px;
  font-weight: 600;
  color: #a89b86;
}
.pp-eco-scale {
  display: flex;
  gap: 5px;
  margin: 10px 0 8px;
}
.pp-eco-seg {
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  color: #b8ab97;
  background: #f4ecdd;
  border-radius: 7px;
  padding: 5px 0;
}
.pp-eco-seg.on {
  color: #fff;
  background: linear-gradient(135deg, #f5a623, #c9873d);
  box-shadow: 0 2px 8px rgba(245, 166, 35, 0.45);
}
.pp-eco-note {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: #8a8175;
}
.pp-facts {
  margin: 0 0 18px;
}
.pp-fact {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid #f2ece2;
}
.pp-fact dt {
  font-size: 12.5px;
  color: #8a8175;
}
.pp-fact dd {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  text-align: right;
}
.pp-chain {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
}
.pp-chain-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #7a736a;
}
.pp-chain-ic {
  font-size: 20px;
}
.pp-chain-line {
  flex: 1;
  max-width: 42px;
  height: 2px;
  background: linear-gradient(90deg, #f5a623, #e6c78a);
  border-radius: 2px;
}
.pp-legal {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: #a89b86;
  text-align: center;
}
.pp-brand {
  margin-top: 16px;
  font-size: 12px;
  color: #a89b86;
  text-decoration: none;
}
.pp-brand strong {
  color: #925b0f;
}
</style>
