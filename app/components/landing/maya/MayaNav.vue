<!--
  En-tête propre à /maya : les six chapitres à portée de clic, et le chapitre en
  cours mis en avant pendant qu'on descend.

  La landing garde son en-tête générique ; ici on lit un RÉCIT en six temps, et
  ne pas savoir où l'on en est dans un récit, c'est le perdre. Le repérage se
  fait par IntersectionObserver plutôt qu'en écoutant le scroll : pas de calcul
  à chaque pixel, et le navigateur fait le travail au bon moment.
-->
<template>
  <header class="nav">
    <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="flex shrink-0 items-center gap-2">
        <IaMayaMark :size="22" state="idle" />
        <span class="text-[14px] font-semibold tracking-[-0.01em] text-white">APIGO</span>
      </NuxtLink>

      <nav class="chapitres" aria-label="Chapitres">
        <a
          v-for="c in CHAPITRES"
          :key="c.ancre"
          :href="`#${c.ancre}`"
          class="chapitre"
          :class="{ 'chapitre-actif': actif === c.ancre }"
          :aria-current="actif === c.ancre ? 'true' : undefined"
        >
          {{ c.nom }}
        </a>
      </nav>

      <NuxtLink to="/register" class="cta-nav">
        Essayer Maya
        <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const CHAPITRES = [
  { ancre: 'veille', nom: 'Elle veille' },
  { ancre: 'propose', nom: 'Elle propose' },
  { ancre: 'raisonne', nom: 'Comment elle raisonne' },
  { ancre: 'reagit', nom: 'Elle réagit' },
  { ancre: 'anticipe', nom: 'Elle anticipe' },
  { ancre: 'parle', nom: 'Elle vous parle' },
  { ancre: 'limites', nom: 'Ses limites' },
];

const actif = ref<string | null>(null);
let io: IntersectionObserver | null = null;

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return;
  io = new IntersectionObserver(
    (entrees) => {
      // Plusieurs sections peuvent croiser la bande à la fois : on retient la
      // plus haute à l'écran, celle qu'on est réellement en train de lire.
      const visibles = entrees
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visibles[0]) actif.value = visibles[0].target.id;
    },
    // Bande étroite au tiers haut de l'écran : le chapitre « courant » est celui
    // qui occupe la zone de lecture, pas celui qui pointe en bas.
    { rootMargin: '-25% 0px -65% 0px' },
  );
  for (const c of CHAPITRES) {
    const el = document.getElementById(c.ancre);
    if (el) io.observe(el);
  }
});

onBeforeUnmount(() => io?.disconnect());
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(26, 26, 28, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chapitres {
  display: none;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
@media (min-width: 900px) {
  .chapitres {
    display: flex;
  }
}

.chapitre {
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  transition: color 160ms ease;
}
.chapitre:hover {
  color: #fff;
}
.chapitre:focus-visible {
  outline: 2px solid var(--honey);
  outline-offset: 2px;
}
.chapitre-actif,
.chapitre-actif:hover {
  color: #f0b454;
  background: rgba(245, 166, 35, 0.12);
}

.cta-nav {
  margin-left: auto;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 7px;
  background: var(--honey);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 10px;
}
.cta-nav:hover {
  filter: brightness(1.06);
}
.cta-nav:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .chapitre {
    transition: none;
  }
}
</style>
