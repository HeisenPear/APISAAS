<template>
  <div class="offline-shell">
    <div class="offline-card">
      <!-- Logo -->
      <div class="offline-logo">
        <img src="/logo_apigo.webp" alt="APIGO" class="offline-logo-img">
        <span class="offline-logo-text">APIGO</span>
      </div>

      <!-- Icon -->
      <div class="offline-icon-wrap">
        <UIcon name="i-lucide-wifi-off" class="offline-icon" />
      </div>

      <!-- Title + description -->
      <h1 class="offline-title">Vous êtes hors-ligne</h1>
      <p class="offline-desc">
        Pas de connexion internet. Vos ruchers et interventions restent accessibles depuis le cache.
      </p>

      <!-- Actions -->
      <div class="offline-actions">
        <button class="offline-btn-primary" @click="retry">
          <UIcon name="i-lucide-refresh-cw" class="offline-btn-icon" />
          Réessayer
        </button>

        <NuxtLink to="/dashboard" class="offline-btn-secondary">
          <UIcon name="i-lucide-layout-dashboard" class="offline-btn-icon" />
          Accéder au tableau de bord
        </NuxtLink>
      </div>

      <!-- Status -->
      <div class="offline-status">
        <span class="offline-status-dot" :class="isOnline ? 'offline-status-dot--on' : ''" />
        <span class="offline-status-text">
          {{ isOnline ? 'Connexion rétablie — rechargement…' : 'Hors connexion' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({ title: 'Hors-ligne — APIGO' });

const isOnline = useOnline();
const router = useRouter();

function retry() {
  if (isOnline.value) {
    router.replace('/dashboard');
  } else {
    window.location.reload();
  }
}

onMounted(() => {
  if (isOnline.value) {
    router.replace('/dashboard');
  }
});

watch(isOnline, (online) => {
  if (online) {
    setTimeout(() => router.replace('/dashboard'), 600);
  }
});
</script>

<style>
/* CSS critique inline — fonctionne même si le fichier CSS principal ne charge pas */
.offline-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #fafaf8;
  font-family: -apple-system, 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.offline-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
}
.offline-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
}
.offline-logo-img {
  height: 40px;
  width: 40px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.offline-logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1c1c1e;
}
.offline-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: #fef6e4;
  margin: 0 auto 24px;
}
.offline-icon {
  width: 36px;
  height: 36px;
  color: #a86a13;
}
.offline-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1c1c1e;
  margin: 0 0 12px;
}
.offline-desc {
  font-size: 15px;
  line-height: 1.6;
  color: #57534e;
  margin: 0 0 32px;
}
.offline-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.offline-btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: #f5a623;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
}
.offline-btn-primary:active { opacity: 0.8; }
.offline-btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 24px;
  border: 1px solid rgba(214,211,209,0.6);
  border-radius: 12px;
  background: transparent;
  color: #1c1c1e;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  box-sizing: border-box;
  transition: opacity 150ms;
}
.offline-btn-secondary:active { opacity: 0.7; }
.offline-btn-icon {
  width: 16px;
  height: 16px;
}
.offline-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 40px;
}
.offline-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a8a29e;
  flex-shrink: 0;
}
.offline-status-dot--on { background: #34d399; }
.offline-status-text {
  font-size: 12px;
  color: #a8a29e;
}
</style>
