<script setup lang="ts">
/**
 * MobileDatePicker — remplace `<input type="date">` et `type="datetime-local">`.
 *
 * Pourquoi : les inputs date/datetime natifs sont catastrophiques sur iOS Safari :
 *   - keyboard ne se ferme pas
 *   - layout shift au focus
 *   - picker different selon la version iOS (parfois inutilisable)
 *   - sur Android Chrome, ok mais pas terrible
 *
 * Solution : un bouton qui affiche la date formatee, et au tap, ouvre une
 * UPopover contenant UCalendar (Nuxt UI v3) + champs heure si mode datetime.
 *
 * Le v-model accepte/emet une string ISO compatible avec ce qu'un input
 * `datetime-local` produit (YYYY-MM-DDTHH:mm) — drop-in remplacement.
 *
 * Usage :
 *   <MobileDatePicker v-model="rdvDate" mode="datetime" />
 *   <MobileDatePicker v-model="dateRecolte" mode="date" />
 */
import { CalendarDate, CalendarDateTime, parseDate, parseDateTime } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    mode?: 'date' | 'datetime';
    placeholder?: string;
    minValue?: string;
    maxValue?: string;
    disabled?: boolean;
    invalid?: boolean;
    /**
     * Si true (defaut), l'input formate est visible plein largeur et stretchable.
     * Si false, c'est un bouton plus compact.
     */
    block?: boolean;
  }>(),
  {
    modelValue: null,
    mode: 'date',
    placeholder: 'Selectionner une date',
    minValue: undefined,
    maxValue: undefined,
    disabled: false,
    invalid: false,
    block: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const open = ref(false);

// Convertit la string v-model en DateValue pour UCalendar.
// Accepte les formats : "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm[:ss]"
function toDateValue(input: string | null): DateValue | undefined {
  if (!input) return undefined;
  try {
    if (props.mode === 'datetime') {
      // Tronque les secondes si presentes (parseDateTime n'aime pas YYYY-MM-DDTHH:mm)
      const padded = input.length === 16 ? `${input}:00` : input;
      return parseDateTime(padded);
    }
    return parseDate(input.length > 10 ? input.slice(0, 10) : input);
  } catch {
    return undefined;
  }
}

// Convertit un DateValue vers le format ISO local equivalent datetime-local
function fromDateValue(value: DateValue): string {
  if (value instanceof CalendarDateTime) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
  }
  if (value instanceof CalendarDate) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
  }
  return value.toString();
}

const calendarValue = computed({
  get: () => toDateValue(props.modelValue),
  set: (v: DateValue | undefined) => {
    if (!v) {
      emit('update:modelValue', null);
      return;
    }
    // Si on est en mode datetime mais que UCalendar renvoie une CalendarDate
    // (pas de time), on ajoute l'heure actuelle de la modelValue ou 12:00 par defaut
    if (props.mode === 'datetime' && v instanceof CalendarDate) {
      const existing = toDateValue(props.modelValue);
      const hour = existing instanceof CalendarDateTime ? existing.hour : 12;
      const minute = existing instanceof CalendarDateTime ? existing.minute : 0;
      const dt = new CalendarDateTime(v.year, v.month, v.day, hour, minute);
      emit('update:modelValue', fromDateValue(dt));
      return;
    }
    emit('update:modelValue', fromDateValue(v));
  },
});

// Formatte pour affichage utilisateur (locale fr-FR)
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  try {
    const d = new Date(props.modelValue);
    if (isNaN(d.getTime())) return '';
    if (props.mode === 'datetime') {
      return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
});

// Time inputs (mode datetime uniquement)
const timeValue = computed({
  get: () => {
    const v = toDateValue(props.modelValue);
    if (v instanceof CalendarDateTime) {
      return `${String(v.hour).padStart(2, '0')}:${String(v.minute).padStart(2, '0')}`;
    }
    return '12:00';
  },
  set: (newTime: string) => {
    const [h, m] = newTime.split(':').map(Number);
    if (h === undefined || m === undefined || isNaN(h) || isNaN(m)) return;
    const current = toDateValue(props.modelValue);
    const base =
      current instanceof CalendarDateTime || current instanceof CalendarDate
        ? current
        : new CalendarDate(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            new Date().getDate(),
          );
    const dt = new CalendarDateTime(base.year, base.month, base.day, h, m);
    emit('update:modelValue', fromDateValue(dt));
  },
});

const minDateValue = computed(() => toDateValue(props.minValue ?? null));
const maxDateValue = computed(() => toDateValue(props.maxValue ?? null));

function clear() {
  emit('update:modelValue', null);
  open.value = false;
}

function confirm() {
  open.value = false;
}
</script>

<template>
  <UPopover v-model:open="open" :disabled="disabled">
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'inline-flex items-center justify-between gap-2 rounded-[10px] border px-3.5 text-[14px]',
        'min-h-[48px] transition-colors',
        block ? 'w-full' : 'w-auto',
        invalid
          ? 'border-red-300 bg-red-50/40 text-red-900'
          : 'border-[var(--border-default)] bg-white text-[var(--text-primary)] hover:border-[var(--border-hover)]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
    >
      <span :class="displayValue ? '' : 'text-[var(--text-tertiary)]'">
        {{ displayValue || placeholder }}
      </span>
      <UIcon name="i-lucide-calendar" class="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
    </button>

    <template #content>
      <div class="p-3" style="min-width: 280px; max-width: 92vw">
        <UCalendar v-model="calendarValue" :min-value="minDateValue" :max-value="maxDateValue" />

        <!-- Heure : visible uniquement en mode datetime -->
        <div v-if="mode === 'datetime'" class="mt-3 flex items-center gap-2 border-t pt-3">
          <UIcon name="i-lucide-clock" class="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            v-model="timeValue"
            type="time"
            class="form-input flex-1 rounded-[8px] border border-[var(--border-default)] px-2 text-[14px]"
            style="min-height: 40px"
          />
        </div>

        <!-- Actions -->
        <div class="mt-3 flex items-center justify-between gap-2">
          <UButton variant="ghost" color="neutral" size="sm" label="Effacer" @click="clear" />
          <UButton color="primary" size="sm" label="Valider" @click="confirm" />
        </div>
      </div>
    </template>
  </UPopover>
</template>
