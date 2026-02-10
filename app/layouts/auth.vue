<template>
  <div class="flex min-h-dvh items-center justify-center bg-[var(--surface-primary)] px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50"
        >
          <UIcon name="i-lucide-hexagon" class="h-8 w-8 text-amber-600" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Apiculture 360°</h1>
        <p class="mt-1 text-sm text-stone-500">Gestion apicole tout-en-un</p>
      </div>

      <div class="rounded-2xl border border-stone-200/60 bg-white p-8 shadow-sm">
        <slot />
      </div>

      <p class="mt-6 text-center text-xs text-stone-400">
        &copy; {{ new Date().getFullYear() }} Apiculture 360°. Tous droits reserves.
      </p>
    </div>
  </div>
</template>
