<template>
  <div>
    <!-- Feature gate si plan ne permet pas les photos -->
    <UiFeatureGate feature="photos" blur>
      <template #preview>
        <div class="rounded-[12px] border-2 border-dashed border-[var(--border-default)] p-8 text-center">
          <UIcon name="i-lucide-image" class="mx-auto mb-2 h-8 w-8 text-[var(--text-quaternary)]" />
          <p class="text-[13px] text-[var(--text-tertiary)]">Photos disponibles à partir du plan Starter</p>
        </div>
      </template>

      <!-- Grille photos existantes -->
      <div v-if="modelValue.length > 0" class="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="(photo, i) in modelValue"
          :key="photo.path"
          class="group relative aspect-square overflow-hidden rounded-[10px] border border-[var(--border-default)]"
        >
          <img
            :src="photo.url"
            :alt="photo.name"
            class="h-full w-full cursor-pointer object-cover transition-transform duration-200 group-hover:scale-105"
            @click="lightboxIndex = i"
          >
          <button
            class="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Supprimer"
            @click.stop="removePhoto(i)"
          >
            <UIcon name="i-lucide-x" class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- Zone d'upload -->
      <div
        v-if="canAddMore"
        class="cursor-pointer rounded-[12px] border-2 border-dashed border-[var(--border-default)] p-5 text-center transition-all"
        :class="{ 'border-[var(--honey)] bg-[var(--honey-soft)]': dragOver, 'pointer-events-none opacity-60': uploading }"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <div v-if="uploading" class="flex flex-col items-center gap-2">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-[var(--honey)]" />
          <span class="text-[12px] text-[var(--text-secondary)]">Compression et upload…</span>
        </div>
        <div v-else class="flex flex-col items-center gap-1.5">
          <UIcon name="i-lucide-image-plus" class="h-6 w-6 text-[var(--text-tertiary)]" />
          <span class="text-[13px] text-[var(--text-secondary)]">
            Glissez une photo ou <span class="font-medium text-[var(--honey-deep)]">cliquez ici</span>
          </span>
          <span class="text-[11px] text-[var(--text-quaternary)]">
            {{ modelValue.length }}/{{ maxPhotos }} · JPEG, PNG, WebP · 5 Mo max
          </span>
        </div>
      </div>

      <!-- Bouton caméra sur mobile -->
      <button
        v-if="canAddMore && !uploading"
        class="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] py-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors active:bg-[var(--honey-soft)] lg:hidden"
        @click="openCamera"
      >
        <UIcon name="i-lucide-camera" class="h-4 w-4" />
        Prendre une photo
      </button>

      <!-- Input file caché -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        capture="environment"
        class="hidden"
        @change="onFileSelect"
      >
    </UiFeatureGate>

    <!-- Lightbox -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="lightboxIndex !== null"
          class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90"
          @click="lightboxIndex = null"
        >
          <img
            :src="modelValue[lightboxIndex]?.url"
            :alt="modelValue[lightboxIndex]?.name"
            class="max-h-[90vh] max-w-[90vw] rounded-[8px] object-contain"
            @click.stop
          >
          <button
            class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center text-white"
            @click="lightboxIndex = null"
          >
            <UIcon name="i-lucide-x" class="h-6 w-6" />
          </button>
          <button
            v-if="lightboxIndex > 0"
            class="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white"
            @click.stop="lightboxIndex--"
          >
            <UIcon name="i-lucide-chevron-left" class="h-6 w-6" />
          </button>
          <button
            v-if="lightboxIndex < modelValue.length - 1"
            class="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white"
            @click.stop="lightboxIndex++"
          >
            <UIcon name="i-lucide-chevron-right" class="h-6 w-6" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import imageCompression from 'browser-image-compression';

export interface PhotoEntry {
  url: string;
  path: string;
  name: string;
  size: number;
  uploadedAt: string;
  caption?: string;
}

type PhotoBucket = 'interventions-photos' | 'ruches-photos' | 'produits-photos' | 'recoltes-photos';

const props = withDefaults(
  defineProps<{
    modelValue: PhotoEntry[];
    bucket: PhotoBucket;
    entityId: string;
    maxPhotos?: number;
  }>(),
  { maxPhotos: 5 },
);

const emit = defineEmits<{
  'update:modelValue': [photos: PhotoEntry[]];
}>();

const notifications = useNotifications();
const uploading = ref(false);
const dragOver = ref(false);
const lightboxIndex = ref<number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const canAddMore = computed(() => props.modelValue.length < props.maxPhotos);

async function uploadFiles(files: FileList | File[]) {
  if (!canAddMore.value) return;
  uploading.value = true;
  dragOver.value = false;

  const toUpload = Array.from(files).slice(0, props.maxPhotos - props.modelValue.length);

  try {
    const results: PhotoEntry[] = await Promise.all(
      toUpload.map(async (file) => {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        });

        const formData = new FormData();
        formData.append('file', compressed, compressed.name);
        formData.append('bucket', props.bucket);
        formData.append('entityId', props.entityId);

        const res = await $fetch<{ data: PhotoEntry }>('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });
        return res.data;
      }),
    );

    emit('update:modelValue', [...props.modelValue, ...results]);
    notifications.success(`${results.length} photo${results.length > 1 ? 's' : ''} ajoutée${results.length > 1 ? 's' : ''}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'upload"));
  } finally {
    uploading.value = false;
  }
}

async function removePhoto(index: number) {
  const photo = props.modelValue[index];
  if (!photo) return;
  try {
    await $fetch('/api/photos/delete', {
      method: 'POST',
      body: { bucket: props.bucket, path: photo.path },
    });
    const updated = [...props.modelValue];
    updated.splice(index, 1);
    emit('update:modelValue', updated);
  } catch {
    notifications.error('Erreur lors de la suppression');
  }
}

function onDrop(e: DragEvent) {
  if (e.dataTransfer?.files) uploadFiles(e.dataTransfer.files);
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) uploadFiles(input.files);
  input.value = '';
}

function openCamera() {
  fileInput.value?.click();
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
