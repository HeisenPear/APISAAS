<template>
  <footer class="border-t border-stone-200/60 bg-[#FAFAF8] py-12">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2.5 mb-4">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500">
              <UIcon name="i-lucide-hexagon" class="h-5 w-5 text-white" />
            </div>
            <span class="text-base font-bold text-stone-900">APIGO</span>
          </div>
          <p class="text-sm text-stone-500 leading-relaxed">
            Le logiciel de gestion apicole tout-en-un. Du rucher à la comptabilité.
          </p>
          <p class="mt-3 text-xs text-stone-400">
            Par <span class="font-medium">La Jocondienne</span>
          </p>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Produit
          </h3>
          <ul class="space-y-2.5">
            <li>
              <a
                href="#fonctionnalites"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Fonctionnalités
              </a>
            </li>
            <li>
              <NuxtLink
                to="/tarifs"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Tarifs
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/register"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Inscription
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/login"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Connexion
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h3 class="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">Légal</h3>
          <ul class="space-y-2.5">
            <li>
              <NuxtLink
                to="/mentions-legales"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Mentions légales
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/politique-confidentialite"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Politique de confidentialité
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/cgu"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                CGU
              </NuxtLink>
            </li>
            <li>
              <a
                href="mailto:contact@apigo.fr"
                class="text-sm text-stone-500 transition-colors hover:text-stone-800"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div
        class="mt-10 flex flex-col items-center justify-between gap-3 border-t border-stone-200/60 pt-6 sm:flex-row"
      >
        <p class="text-xs text-stone-400">
          &copy; {{ year }} La Jocondienne. Tous droits réservés.
        </p>
        <div class="flex items-center gap-4">
          <span class="inline-flex items-center gap-1 text-xs text-stone-400">
            <UIcon name="i-lucide-shield-check" class="h-3.5 w-3.5 text-emerald-500" />
            Données hébergées en UE
          </span>
          <span class="inline-flex items-center gap-1 text-xs text-stone-400">
            <UIcon name="i-lucide-lock" class="h-3.5 w-3.5 text-blue-500" />
            RGPD conforme
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>
