<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">
        Guide d'étalonnage du réfractomètre
      </h2>
      <p class="mt-1 text-[12.5px] text-[var(--text-secondary)]">
        Le réfractomètre mesure le taux d'humidité du miel — un étalonnage régulier garantit des
        lectures fiables avant la mise en pot.
      </p>
    </div>

    <dl class="space-y-4">
      <div
        v-for="(etape, i) in ETAPES"
        :key="i"
        class="rounded-[14px] border border-[var(--border-default)] p-4"
      >
        <dt class="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-[10.5px] font-bold text-[var(--honey-deep)]"
          >
            {{ i + 1 }}
          </span>
          {{ etape.titre }}
        </dt>
        <dd class="mt-1.5 pl-7 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
          {{ etape.description }}
        </dd>
      </div>
    </dl>

    <div class="rounded-[14px] bg-[var(--surface-muted)] p-4">
      <p class="text-[12.5px] font-semibold text-[var(--text-primary)]">Repères utiles</p>
      <ul class="mt-2 space-y-1.5 text-[12.5px] text-[var(--text-secondary)]">
        <li>• Eau distillée = point de référence à 0 % sur l'échelle miel/eau</li>
        <li>• Un miel stable au stockage est généralement sous 18-20 % d'humidité</li>
        <li>• Re-étalonner avant chaque saison, ou si l'appareil a changé de température</li>
        <li>• Nettoyer le prisme après chaque lecture pour éviter les traces séchées</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Etape {
  titre: string;
  description: string;
}

const ETAPES: Etape[] = [
  {
    titre: "Laisser l'appareil et l'échantillon à température ambiante",
    description:
      'Un écart de température fausse la lecture. Attendez que le réfractomètre et le miel soient stabilisés à la même température (idéalement 20°C) avant de mesurer.',
  },
  {
    titre: "Étalonner avec de l'eau distillée",
    description:
      "Déposez quelques gouttes d'eau distillée sur le prisme, fermez le capot et visez une source lumineuse. La ligne de lecture doit indiquer 0 % sur l'échelle eau/miel — sinon, ajustez la vis de calibration jusqu'à obtenir ce repère.",
  },
  {
    titre: 'Nettoyer et sécher le prisme',
    description:
      "Essuyez soigneusement le prisme avec un chiffon doux et sec avant de déposer l'échantillon de miel, pour ne pas diluer la mesure avec les résidus d'eau distillée.",
  },
  {
    titre: 'Déposer une fine couche de miel',
    description:
      "Une à deux gouttes suffisent, réparties uniformément sur le prisme. Évitez les bulles d'air qui perturbent la lecture.",
  },
  {
    titre: "Lire le pourcentage d'humidité",
    description:
      "Visez une source de lumière naturelle ou une lampe, et lisez la valeur où la ligne de séparation clair/foncé croise l'échelle d'humidité du miel.",
  },
];
</script>
