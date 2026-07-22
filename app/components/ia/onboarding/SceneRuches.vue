<template>
  <div class="cine-form">
    <!-- Saisie DIRECTE : un pro qui installe 300 ruches ne va pas cliquer 300 fois. -->
    <div class="cine-step">
      <button class="cine-step-btn" type="button" :disabled="nb <= 1" @click.stop="ajuster(-1)">
        −
      </button>
      <input
        v-model.number="nb"
        class="cine-step-input"
        type="number"
        min="1"
        :max="cap"
        inputmode="numeric"
      />
      <button class="cine-step-btn" type="button" :disabled="nb >= cap" @click.stop="ajuster(1)">
        +
      </button>
      <span class="cine-step-val">{{ nb > 1 ? 'ruches' : 'ruche' }}</span>
    </div>

    <!-- `cine-presets` et non `cine-hive-chips` : la maquette n'affichait que
         trois puces ici, on peut en avoir huit — il leur faut le retour à la
         ligne, sinon les dernières sortent de l'écran et sont rognées. -->
    <div class="cine-presets">
      <button
        v-for="p in presetsUtiles"
        :key="p"
        class="cine-hive-chip"
        :class="{ 'is-sel': nb === p }"
        type="button"
        @click.stop="nb = p"
      >
        {{ p }}
      </button>
    </div>

    <div class="cine-types">
      <button
        v-for="t in TYPES"
        :key="t.value"
        class="cine-typec"
        :class="{ 'is-sel': type === t.value }"
        type="button"
        @click.stop="type = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Le plafond n'est pas un mur muet : on dit pourquoi et ce qui l'ouvre. -->
    <p v-if="nb >= cap && cap < 9999" class="cine-upsell">
      Ta formule s’arrête à {{ cap }}. Tu pourras en ajouter en passant à l’essai Pro — plus tard,
      rien ne presse.
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * Scène « ruches » — combien on en prépare d'un coup.
 *
 * Trois exigences de terrain, reprises de la spec d'intégration :
 *  - saisie CLAVIER acceptée (un professionnel tape 300, il ne clique pas) ;
 *  - préréglages pour le cas courant ;
 *  - bornage au plafond RÉEL de la formule, jamais un chiffre écrit à la main.
 */
const nb = defineModel<number>('nb', { required: true });
const type = defineModel<string>('type', { required: true });
const props = defineProps<{ cap: number }>();

const PRESETS = [1, 3, 5, 10, 25, 50, 100, 200];
const TYPES = [
  { value: 'dadant_10', label: 'Dadant 10' },
  { value: 'langstroth', label: 'Langstroth' },
  { value: 'warre', label: 'Warré' },
  { value: 'voirnot', label: 'Voirnot' },
];

/** On ne propose jamais un préréglage que la formule interdit. */
const presetsUtiles = computed(() => PRESETS.filter((p) => p <= props.cap));

function ajuster(d: number) {
  nb.value = Math.min(props.cap, Math.max(1, (nb.value || 1) + d));
}

// Le plafond peut BAISSER si l'apiculteur revient changer de formule : on
// reclampe, sinon on tenterait de créer plus de ruches que le plan n'autorise
// et l'API répondrait 402 au pire moment.
watch(
  () => props.cap,
  (c) => {
    if (nb.value > c) nb.value = c;
  },
);
</script>
