<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1
          class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        >
          Charges & Achats
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Suivez vos dépenses et charges
        </p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
        @click="showForm = true"
      >
        <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
        Nouvel achat
      </button>
    </div>

    <!-- Sous-navigation Finances (composant partagé) -->
    <FinancesTabs />

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-[68px] animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
      />
    </div>

    <!-- Empty -->
    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <UiEmptyState
      v-else-if="achatsList.length === 0"
      icon="i-lucide-shopping-bag"
      title="Aucune dépense pour l'instant"
      description="Notez vos premiers achats — matériel, traitements, frais — et je les range dans votre comptabilité."
      action-label="Nouvel achat"
      @action="showForm = true"
    />

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="achat in achatsList"
        :key="achat.id"
        class="flex items-center gap-4 rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-3.5 transition-all hover:border-[var(--border-hover)] hover:shadow-sm cursor-pointer"
        @click="openDetail(achat)"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
          :class="achat.isRecurring ? 'bg-blue-50' : 'bg-[var(--surface-muted)]'"
        >
          <UIcon
            :name="achat.isRecurring ? 'i-lucide-repeat' : 'i-lucide-shopping-bag'"
            class="h-4 w-4"
            :class="achat.isRecurring ? 'text-blue-500' : 'text-[var(--text-tertiary)]'"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-[14px] font-semibold text-[var(--text-primary)]">{{
              achat.numero
            }}</span>
            <span
              v-if="achat.categorie"
              class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
            >
              {{ categorieLabel(achat.categorie) }}
            </span>
            <span
              v-if="achat.isRecurring"
              class="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600"
            >
              {{ achat.recurringInterval === 'mensuel' ? 'Mensuel' : 'Annuel' }}
            </span>
            <span
              v-if="achatLignesCount(achat) > 1"
              class="rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--honey-deep)]"
            >
              {{ achatLignesCount(achat) }} lignes
            </span>
          </div>
          <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
            {{ formatDate(achat.dateTransaction) }}
            <template v-if="achat.notes"> · {{ achat.notes }}</template>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[14px] font-semibold text-[var(--text-primary)]">{{
            formatMoney(Number(achat.total ?? 0))
          }}</span>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            @click.stop="handleDelete(achat.id)"
          />
        </div>
      </div>
    </div>

    <!-- Modal création -->
    <UModal v-model:open="showForm" title="Nouvel achat">
      <template #content>
        <div class="max-h-[90vh] overflow-y-auto p-6">
          <form class="space-y-4" @submit.prevent="handleCreate">
            <!-- Date + Catégorie -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                  >Date</label
                >
                <UiMobileDatePicker v-model="achatForm.dateTransaction" mode="date" />
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                  >Catégorie</label
                >
                <select
                  v-model="achatForm.categorie"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
                  <option value="">Non catégorisé</option>
                  <option v-for="id in CATEGORIES_ACHAT_IDS" :key="id" :value="id">
                    {{ LIBELLE_CATEGORIE_ACHAT[id] }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Lignes -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="text-[12px] font-medium text-[var(--text-secondary)]"
                  >Lignes d'achat</label
                >
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--honey-deep)] hover:text-[var(--honey)]"
                  @click="addLigne"
                >
                  <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
                  Ajouter une ligne
                </button>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(ligne, idx) in achatForm.lignes"
                  :key="idx"
                  class="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-3"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <span
                      class="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                      >Ligne {{ idx + 1 }}</span
                    >
                    <button
                      v-if="achatForm.lignes.length > 1"
                      type="button"
                      aria-label="Retirer cette ligne"
                      class="text-[var(--text-quaternary)] hover:text-red-500"
                      @click="removeLigne(idx)"
                    >
                      <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div class="mb-2">
                    <input
                      v-model="ligne.description"
                      type="text"
                      required
                      placeholder="Description…"
                      class="w-full rounded-[8px] border border-[var(--border-default)] bg-white px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                    />
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                        >Quantité</label
                      >
                      <input
                        v-model.number="ligne.quantite"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        class="w-full rounded-[8px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                        >Prix unitaire</label
                      >
                      <input
                        v-model.number="ligne.prixUnitaire"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        class="w-full rounded-[8px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">TVA</label>
                      <select
                        v-model.number="ligne.tauxTva"
                        class="w-full rounded-[8px] border border-[var(--border-default)] bg-white px-2 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      >
                        <option :value="5.5">5,5%</option>
                        <option :value="10">10%</option>
                        <option :value="20">20%</option>
                        <option :value="0">0%</option>
                      </select>
                    </div>
                  </div>
                  <div class="mt-1.5 text-right text-[11px] text-[var(--text-tertiary)]">
                    Total ligne TTC :
                    <strong class="text-[var(--text-primary)]">{{
                      formatMoney(ligneTtc(ligne))
                    }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total preview -->
            <div class="rounded-[10px] bg-[var(--surface-muted)] px-4 py-3 text-right">
              <span class="text-[12px] text-[var(--text-tertiary)]">Total TTC : </span>
              <span class="text-[14px] font-bold text-[var(--text-primary)]">{{
                formatMoney(formTotal)
              }}</span>
            </div>

            <!-- Intégration stock (basée sur la première ligne) -->
            <div class="rounded-[12px] border border-amber-200/60 bg-amber-50/40 p-4">
              <label class="flex cursor-pointer items-center gap-3">
                <input
                  v-model="achatForm.ajouterAuStock"
                  type="checkbox"
                  class="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--honey)]"
                />
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 items-center justify-center rounded-[8px] bg-amber-500">
                    <UIcon name="i-lucide-warehouse" class="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <span class="text-[13px] font-semibold text-[var(--text-primary)]"
                      >Ajouter au stock</span
                    >
                    <p class="text-[11px] text-[var(--text-tertiary)]">
                      Mise à jour automatique de l'inventaire (1ère ligne)
                    </p>
                  </div>
                </div>
              </label>

              <div v-if="achatForm.ajouterAuStock" class="mt-4 space-y-3">
                <!-- Stocks correspondants -->
                <div v-if="matchingStocks.length > 0">
                  <p class="mb-2 text-[11px] font-medium text-amber-800">
                    Produit existant dans vos stocks :
                  </p>
                  <div class="space-y-1.5">
                    <label
                      v-for="stock in matchingStocks"
                      :key="stock.id"
                      class="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 p-3 transition-all"
                      :class="
                        achatForm.stockId === stock.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-[var(--border-default)] bg-white hover:border-amber-300'
                      "
                    >
                      <input
                        v-model="achatForm.stockId"
                        type="radio"
                        :value="stock.id"
                        class="accent-amber-600"
                      />
                      <div class="flex-1">
                        <span class="text-[13px] font-medium text-[var(--text-primary)]">{{
                          stock.nom
                        }}</span>
                        <span class="ml-2 text-[11px] text-[var(--text-tertiary)]"
                          >{{ Number(stock.quantite) }} {{ stock.unite ?? 'u' }} en stock</span
                        >
                      </div>
                    </label>
                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 p-3 transition-all"
                      :class="
                        achatForm.stockId === ''
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-[var(--border-default)] bg-white hover:border-amber-300'
                      "
                    >
                      <input
                        v-model="achatForm.stockId"
                        type="radio"
                        value=""
                        class="accent-amber-600"
                      />
                      <div class="flex items-center gap-1.5">
                        <UIcon name="i-lucide-plus-circle" class="h-4 w-4 text-honey-deep" />
                        <span class="text-[13px] font-medium text-amber-700"
                          >Créer un nouveau produit</span
                        >
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Nouveau produit -->
                <div v-if="showNewStockFields" class="space-y-3 rounded-[10px] bg-white p-3">
                  <p class="text-[11px] font-medium text-[var(--text-secondary)]">
                    Nouveau produit en stock :
                  </p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                        >Catégorie de stock</label
                      >
                      <select
                        v-model="achatForm.stockCategorie"
                        class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      >
                        <option value="cadres">Cadres</option>
                        <option value="hausses">Hausses</option>
                        <option value="corps">Corps</option>
                        <option value="nourrissement">Nourrissement</option>
                        <option value="traitement">Traitement</option>
                        <option value="conditionnement">Conditionnement</option>
                        <option value="equipement">Équipement</option>
                        <option value="outillage">Outillage</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]"
                        >Unité</label
                      >
                      <select
                        v-model="achatForm.stockUnite"
                        class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      >
                        <option value="unites">Unités</option>
                        <option value="kg">Kilogrammes</option>
                        <option value="litres">Litres</option>
                        <option value="pots">Pots</option>
                        <option value="paquets">Paquets</option>
                      </select>
                    </div>
                  </div>
                  <!-- Palette / unités par colis -->
                  <div>
                    <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">
                      <UIcon name="i-lucide-package" class="inline h-3.5 w-3.5" />
                      Unités par colis (palette, carton…)
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="achatForm.unitesParColis"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ex : 240 pots par palette"
                        class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      />
                      <span class="shrink-0 text-[11px] text-[var(--text-tertiary)]">{{
                        achatForm.stockUnite
                      }}</span>
                    </div>
                    <p v-if="achatForm.unitesParColis > 1" class="mt-1 text-[11px] text-honey-deep">
                      → Stock crédité :
                      {{ (achatForm.lignes[0]?.quantite ?? 1) * achatForm.unitesParColis }}
                      {{ achatForm.stockUnite }}
                    </p>
                  </div>
                  <div>
                    <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">
                      <UIcon name="i-lucide-bell" class="inline h-3.5 w-3.5 text-[var(--honey)]" />
                      Alerte stock bas (seuil minimum)
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="achatForm.stockSeuilAlerte"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex : 5"
                        class="w-32 rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      />
                      <span class="text-[11px] text-[var(--text-tertiary)]">{{
                        achatForm.stockUnite || 'unités'
                      }}</span>
                      <span class="ml-auto text-[11px] text-[var(--text-quaternary)]"
                        >Alerte en dessous de ce seuil</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Achat récurrent -->
            <div class="rounded-[12px] border border-blue-200/60 bg-blue-50/40 p-4">
              <label class="flex cursor-pointer items-center gap-3">
                <input
                  v-model="achatForm.isRecurring"
                  type="checkbox"
                  class="h-4 w-4 rounded border-[var(--border-default)] accent-blue-500"
                />
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 items-center justify-center rounded-[8px] bg-blue-500">
                    <UIcon name="i-lucide-repeat" class="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <span class="text-[13px] font-semibold text-[var(--text-primary)]"
                      >Achat récurrent</span
                    >
                    <p class="text-[11px] text-[var(--text-tertiary)]">
                      Assurance, abonnement, charge fixe mensuelle
                    </p>
                  </div>
                </div>
              </label>
              <div v-if="achatForm.isRecurring" class="mt-3">
                <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">Fréquence</label>
                <select
                  v-model="achatForm.recurringInterval"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                >
                  <option value="mensuel">Mensuel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
                >Notes</label
              >
              <textarea
                v-model="achatForm.notes"
                :rows="2"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                placeholder="Notes optionnelles…"
              />
            </div>

            <div class="flex justify-end gap-2 border-t border-[var(--border-default)] pt-4">
              <UButton label="Annuler" variant="ghost" color="neutral" @click="showForm = false" />
              <UButton
                type="submit"
                label="Enregistrer"
                icon="i-lucide-check"
                color="primary"
                :loading="saving"
              />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Modal détail achat -->
    <UModal v-model:open="showDetail" :title="selectedAchat?.numero ?? 'Détail achat'">
      <template #content>
        <div v-if="selectedAchat" class="p-6 space-y-4">
          <!-- Meta -->
          <div class="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <span class="text-[var(--text-tertiary)]">Date</span>
              <p class="font-medium text-[var(--text-primary)]">
                {{ formatDate(selectedAchat.dateTransaction) }}
              </p>
            </div>
            <div>
              <span class="text-[var(--text-tertiary)]">Catégorie</span>
              <p class="font-medium text-[var(--text-primary)]">
                {{ selectedAchat.categorie ? categorieLabel(selectedAchat.categorie) : '—' }}
              </p>
            </div>
            <div v-if="selectedAchat.isRecurring">
              <span class="text-[var(--text-tertiary)]">Récurrence</span>
              <p class="font-medium text-blue-600">
                {{ selectedAchat.recurringInterval === 'mensuel' ? 'Mensuel' : 'Annuel' }}
              </p>
            </div>
            <div v-if="selectedAchat.isRecurring && selectedAchat.nextRecurringDate">
              <span class="text-[var(--text-tertiary)]">Prochain renouvellement</span>
              <p class="font-medium text-[var(--text-primary)]">
                {{ formatDate(selectedAchat.nextRecurringDate as string | Date) }}
              </p>
            </div>
          </div>

          <!-- Lignes -->
          <div>
            <p
              class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
            >
              Lignes
            </p>
            <div class="rounded-[10px] border border-[var(--border-default)] overflow-hidden">
              <table class="w-full text-[13px]">
                <thead class="bg-[var(--surface-muted)]">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-[var(--text-secondary)]">
                      Désignation
                    </th>
                    <th class="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">
                      Qté
                    </th>
                    <th class="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">
                      P.U.
                    </th>
                    <th class="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">
                      Total HT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(ligne, i) in detailLignes"
                    :key="i"
                    class="border-t border-[var(--border-default)]"
                  >
                    <td class="px-3 py-2.5 text-[var(--text-primary)]">{{ ligne.description }}</td>
                    <td class="px-3 py-2.5 text-right text-[var(--text-secondary)]">
                      {{ ligne.quantite }}
                    </td>
                    <td class="px-3 py-2.5 text-right text-[var(--text-secondary)]">
                      {{ formatMoney(ligne.prixUnitaire ?? 0) }}
                    </td>
                    <td class="px-3 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                      {{ formatMoney(ligne.quantite * (ligne.prixUnitaire ?? 0)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Total -->
          <div
            class="flex justify-between items-center rounded-[10px] bg-[var(--surface-muted)] px-4 py-3"
          >
            <span class="text-[13px] text-[var(--text-secondary)]">Total TTC</span>
            <span class="text-[16px] font-bold text-[var(--text-primary)]">{{
              formatMoney(Number(selectedAchat.total ?? 0))
            }}</span>
          </div>

          <!-- Notes -->
          <div
            v-if="selectedAchat.notes"
            class="rounded-[10px] bg-[var(--surface-muted)] px-4 py-3"
          >
            <p
              class="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1"
            >
              Notes
            </p>
            <p class="text-[13px] text-[var(--text-secondary)]">{{ selectedAchat.notes }}</p>
          </div>

          <div class="flex justify-end gap-2 border-t border-[var(--border-default)] pt-4">
            <UButton
              label="Supprimer"
              icon="i-lucide-trash-2"
              variant="ghost"
              color="error"
              @click="handleDeleteFromDetail"
            />
            <UButton label="Fermer" variant="outline" color="neutral" @click="showDetail = false" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
/**
 * ⚠️ LES HUIT CATÉGORIES ÉTAIENT ÉCRITES TROIS FOIS DANS CE SEUL FICHIER — le
 * menu, l'union du champ, la table des libellés — et une quatrième dans
 * `achats.post.ts`. Elles viennent du catalogue partagé.
 */
import {
  CATEGORIES_ACHAT_IDS,
  LIBELLE_CATEGORIE_ACHAT,
  type CategorieAchat,
} from '~/config/categories-achat';
import type { Transaction, Stock } from '~/types/models';
import type { ApiListResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const { createAchat, deleteFacture } = useFinances();

const showForm = ref(route.query.new === '1');
const saving = ref(false);

type AchatRow = Transaction & {
  isRecurring?: boolean;
  recurringInterval?: string;
  nextRecurringDate?: string | Date | null;
};

function defaultLignes() {
  return [{ description: '', quantite: 1, prixUnitaire: 0, tauxTva: 20 }];
}

const achatForm = reactive({
  dateTransaction: dateDuJour(),
  categorie: '',
  lignes: defaultLignes() as {
    description: string;
    quantite: number;
    prixUnitaire: number;
    tauxTva: number;
  }[],
  notes: '',
  ajouterAuStock: true,
  stockId: '',
  stockCategorie: 'autre',
  stockUnite: 'unites',
  stockSeuilAlerte: 0,
  unitesParColis: 1,
  isRecurring: false,
  recurringInterval: 'mensuel' as 'mensuel' | 'annuel',
});

function addLigne() {
  achatForm.lignes.push({ description: '', quantite: 1, prixUnitaire: 0, tauxTva: 20 });
}

function removeLigne(idx: number) {
  achatForm.lignes.splice(idx, 1);
}

function ligneTtc(ligne: { quantite: number; prixUnitaire: number; tauxTva: number }) {
  const ht = ligne.quantite * ligne.prixUnitaire;
  return Math.round((ht + (ht * ligne.tauxTva) / 100) * 100) / 100;
}

const formTotal = computed(() => achatForm.lignes.reduce((s, l) => s + ligneTtc(l), 0));

const { data: stocksData } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  query: { limit: 200 },
  key: 'achats-stocks',
  default: () => ({ data: [], pagination: { page: 1, limit: 200, total: 0, totalPages: 0 } }),
});

const allStocks = computed(() => stocksData.value?.data ?? []);

const matchingStocks = computed(() => {
  const query = (achatForm.lignes[0]?.description ?? '').toLowerCase().trim();
  if (!query || query.length < 2) return allStocks.value.slice(0, 5);
  return allStocks.value.filter(
    (s) => s.nom.toLowerCase().includes(query) || query.includes(s.nom.toLowerCase()),
  );
});

const showNewStockFields = computed(
  () => achatForm.ajouterAuStock && (matchingStocks.value.length === 0 || achatForm.stockId === ''),
);

const {
  data: achatsData,
  status,
  error,
  refresh,
} = useFetch<ApiListResponse<AchatRow>>('/api/finances/achats', {
  query: { limit: 100 },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

/**
 * ⚠️ CETTE PAGE N'ÉCOUTAIT RIEN, ET C'EST CELLE OÙ LA DÉPENSE ARRIVE.
 *
 * L'apiculteur ouvre ses achats, dicte « j'ai acheté 30 kg de candi à 45 euros »
 * — Maya l'enregistre, répond « c'est noté », et la liste sous ses yeux ne bouge
 * pas. Il redicte, et se retrouve avec deux lignes. L'événement partait bien du
 * serveur : personne ici ne l'écoutait.
 */
const { on: surEvenementDonnees } = useDataBus();
surEvenementDonnees(['achat:created'], () => refresh());

/**
 * ⚠️ Les ARTICLES de stock remplissent les lignes d'une dépense. Maya bouge le stock à la voix ; le sélecteur gardait l'ancien état.
 */
const { on: surStockAchats } = useDataBus();
surStockAchats(['stock:updated', 'stock:mouvement'], () => {
  void refreshNuxtData(['achats-stocks']);
});

const loading = computed(() => status.value === 'pending');
const achatsList = computed(() => achatsData.value?.data ?? []);

function achatLignesCount(achat: AchatRow) {
  const lignes = (achat as unknown as { lignes?: unknown[] }).lignes;
  return Array.isArray(lignes) ? lignes.length : 1;
}

// --- Detail modal ---
const showDetail = ref(false);
const selectedAchat = ref<AchatRow | null>(null);

const detailLignes = computed(() => {
  if (!selectedAchat.value) return [];
  const lignes = (
    selectedAchat.value as unknown as {
      lignes?: { description: string; quantite: number; prixUnitaire?: number }[];
    }
  ).lignes;
  return Array.isArray(lignes) ? lignes : [];
});

function openDetail(achat: AchatRow) {
  selectedAchat.value = achat;
  showDetail.value = true;
}

async function handleDeleteFromDetail() {
  if (!selectedAchat.value) return;
  if (!confirm('Supprimer cet achat ?')) return;
  try {
    await deleteFacture(selectedAchat.value.id);
    notifications.success('Achat supprimé');
    showDetail.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

async function handleCreate() {
  if (saving.value) return;
  saving.value = true;
  try {
    const lignesPayload = achatForm.lignes.map((l, idx) => {
      const base: Record<string, unknown> = {
        description: l.description,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        total: l.quantite * l.prixUnitaire,
      };
      if (idx === 0 && achatForm.ajouterAuStock) {
        base.ajouterAuStock = true;
        if (achatForm.stockId) {
          base.stockId = achatForm.stockId;
          if (achatForm.unitesParColis > 1) base.unitesParColis = achatForm.unitesParColis;
        } else {
          base.stockCategorie = achatForm.stockCategorie;
          base.stockUnite = achatForm.stockUnite;
          if (achatForm.stockSeuilAlerte > 0) base.stockSeuilAlerte = achatForm.stockSeuilAlerte;
          if (achatForm.unitesParColis > 1) base.unitesParColis = achatForm.unitesParColis;
        }
      }
      return base as { description: string; quantite: number; prixUnitaire: number; total: number };
    });

    await createAchat({
      dateTransaction: achatForm.dateTransaction,
      lignes: lignesPayload,
      tauxTva: achatForm.lignes[0]?.tauxTva ?? 20,
      notes: achatForm.notes || undefined,
      categorie: (achatForm.categorie as CategorieAchat) || undefined,
      isRecurring: achatForm.isRecurring || undefined,
      recurringInterval: achatForm.isRecurring ? achatForm.recurringInterval : undefined,
    });

    const msg = achatForm.ajouterAuStock
      ? 'Achat enregistré et stock mis à jour'
      : 'Achat enregistré';
    notifications.success(msg);
    showForm.value = false;
    Object.assign(achatForm, {
      categorie: '',
      lignes: defaultLignes(),
      notes: '',
      stockId: '',
      stockSeuilAlerte: 0,
      unitesParColis: 1,
      isRecurring: false,
    });
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('Supprimer cet achat ?')) return;
  try {
    await deleteFacture(id);
    notifications.success('Achat supprimé');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

function categorieLabel(cat: string | null) {
  // `?? cat` reste : une catégorie enregistrée AVANT une refonte du catalogue
  // doit continuer à s'afficher, même si elle n'y figure plus. Une ligne
  // d'achat vieille de deux ans ne doit pas devenir muette.
  return cat ? (LIBELLE_CATEGORIE_ACHAT[cat as CategorieAchat] ?? cat) : '';
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
