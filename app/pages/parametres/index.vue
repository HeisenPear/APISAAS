<template>
  <div class="settings-page">
    <!-- Topbar breadcrumb -->
    <div class="settings-topbar">
      <span class="settings-breadcrumb">Paramètres</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="!profil" class="settings-layout">
      <div class="settings-aside-placeholder" />
      <div class="settings-body">
        <div v-for="i in 4" :key="i" class="skeleton-block" />
      </div>
    </div>

    <!-- Content -->
    <div v-else class="settings-layout">
      <!-- Sticky aside nav -->
      <aside class="settings-aside">
        <p class="aside-label">Sur cette page</p>
        <nav>
          <a
            v-for="item in navItems"
            :key="item.id"
            :href="`#${item.id}`"
            class="aside-link"
            :class="{ active: activeSection === item.id }"
            @click.prevent="scrollTo(item.id)"
          >
            {{ item.label }}
          </a>
        </nav>
      </aside>

      <!-- Body -->
      <div class="settings-body">
        <!-- Hero -->
        <div>
          <h1 class="settings-h1">Paramètres</h1>
          <p class="settings-lede">
            Votre profil, vos préférences et les coordonnées de votre exploitation. Ces informations
            apparaissent sur vos factures et vos exports.
          </p>

          <!-- Profile card -->
          <div class="profile-card">
            <div class="profile-avatar">{{ initials }}</div>
            <div class="profile-info">
              <p class="profile-name">{{ profil.prenom }} {{ profil.nom }}</p>
              <p class="profile-meta">
                <span v-if="profil.ville">{{ profil.ville }} · </span>
                membre depuis {{ memberSince }}
              </p>
            </div>
            <div class="profile-stats">
              <div class="stat-item">
                <p class="stat-value">{{ usageDisplay('ruches') || '—' }}</p>
                <p class="stat-label">Ruches</p>
              </div>
              <div class="stat-item">
                <p class="stat-value">{{ usageDisplay('ruchers') || '—' }}</p>
                <p class="stat-label">Ruchers</p>
              </div>
              <div class="stat-item">
                <p class="stat-value stat-plan">{{ planLabels[profil.plan] ?? profil.plan }}</p>
                <p class="stat-label">Plan actif</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 01 Identité -->
        <section id="identite">
          <p class="section-eyebrow">01 — Identité</p>
          <h2 class="section-title">Identité</h2>
          <p class="section-desc">
            Ces informations restent privées. Elles ne sont visibles que par vous et les membres de
            votre équipe.
          </p>
          <div>
            <SettingsRow
              label="Prénom"
              :value="profil.prenom"
              action="Modifier"
              :editing="editingField === 'prenom'"
              :first="true"
              @edit="startEdit('prenom', profil.prenom ?? '')"
              @cancel="cancelEdit"
            >
              <template #input>
                <UInput
                  v-model="editValue"
                  size="sm"
                  autofocus
                  @keydown.enter="saveCurrentField"
                  @keydown.esc="cancelEdit"
                />
              </template>
            </SettingsRow>
            <SettingsRow
              label="Nom"
              :value="profil.nom"
              action="Modifier"
              :editing="editingField === 'nom'"
              @edit="startEdit('nom', profil.nom ?? '')"
              @cancel="cancelEdit"
            >
              <template #input>
                <UInput
                  v-model="editValue"
                  size="sm"
                  autofocus
                  @keydown.enter="saveCurrentField"
                  @keydown.esc="cancelEdit"
                />
              </template>
            </SettingsRow>
            <SettingsRow
              label="Email"
              :value="profil.email"
              hint="Identifiant de connexion — modification protégée"
              action="Vérifier"
              @edit="handleChangePassword"
            />
            <SettingsRow
              label="Téléphone"
              :value="profil.telephone"
              action="Modifier"
              :editing="editingField === 'telephone'"
              @edit="startEdit('telephone', profil.telephone ?? '')"
              @cancel="cancelEdit"
            >
              <template #input>
                <UInput
                  v-model="editValue"
                  size="sm"
                  type="tel"
                  autofocus
                  @keydown.enter="saveCurrentField"
                  @keydown.esc="cancelEdit"
                />
              </template>
            </SettingsRow>
            <SettingsRow
              label="Mot de passe"
              value="••••••••••••"
              action="Changer"
              @edit="handleChangePassword"
            />
          </div>
        </section>

        <!-- 02 Exploitation -->
        <section id="exploitation">
          <p class="section-eyebrow">02 — Exploitation</p>
          <h2 class="section-title">Exploitation</h2>
          <p class="section-desc">
            Coordonnées légales utilisées sur vos factures, exports comptables et déclarations
            sanitaires.
          </p>
          <div>
            <SettingsRow
              label="Adresse"
              :value="fullAddress"
              action="Modifier"
              :editing="editingField === 'adresse'"
              :first="true"
              @edit="openAddressEdit"
              @cancel="cancelEdit"
            >
              <template #input>
                <div class="address-fields">
                  <UInput v-model="addressEdit.adresse" size="sm" placeholder="Adresse" />
                  <div class="address-row">
                    <UInput
                      v-model="addressEdit.codePostal"
                      size="sm"
                      placeholder="Code postal"
                      class="w-28"
                    />
                    <UInput v-model="addressEdit.ville" size="sm" placeholder="Ville" />
                  </div>
                </div>
              </template>
            </SettingsRow>
            <SettingsRow
              label="NAPI"
              :value="profil.napi"
              hint="Numéro d'apiculteur — GDSA / DDPP"
              action="Modifier"
              :editing="editingField === 'napi'"
              @edit="startEdit('napi', profil.napi ?? '')"
              @cancel="cancelEdit"
            >
              <template #input>
                <UInput
                  v-model="editValue"
                  size="sm"
                  autofocus
                  @keydown.enter="saveCurrentField"
                  @keydown.esc="cancelEdit"
                />
              </template>
            </SettingsRow>
            <SettingsRow
              label="SIRET"
              :value="formattedSiret"
              action="Modifier"
              :editing="editingField === 'siret'"
              @edit="startEdit('siret', profil.siret ?? '')"
              @cancel="cancelEdit"
            >
              <template #input>
                <UInput
                  v-model="editValue"
                  size="sm"
                  placeholder="14 chiffres"
                  maxlength="14"
                  autofocus
                  @keydown.enter="saveCurrentField"
                  @keydown.esc="cancelEdit"
                />
              </template>
            </SettingsRow>
          </div>

          <!-- TVA toggle -->
          <div class="toggle-row" style="border-top: 1px solid var(--border-default)">
            <div>
              <p class="toggle-title">Option TVA sur les débits</p>
              <p class="toggle-desc">
                Si activé, la mention "Option pour le paiement de la taxe d'après les débits" est
                ajoutée automatiquement à toutes vos factures.
              </p>
            </div>
            <USwitch v-model="tvaDebitLocal" @update:model-value="saveTvaDebit" />
          </div>
        </section>

        <!-- 03 Notifications -->
        <section id="notifications">
          <p class="section-eyebrow">03 — Notifications</p>
          <h2 class="section-title">Notifications</h2>
          <p class="section-desc">
            Choisissez les événements qui vous envoient une alerte. Les autres restent consultables
            dans le journal d'activité.
          </p>
          <div>
            <div
              v-for="(notif, idx) in notifItems"
              :key="notif.key"
              class="toggle-row"
              :class="{ 'toggle-first': idx === 0 }"
            >
              <div>
                <p class="toggle-title">{{ notif.label }}</p>
                <p class="toggle-desc">{{ notif.desc }}</p>
              </div>
              <USwitch
                :model-value="prefs[notif.key]"
                @update:model-value="(v: boolean) => updatePref(notif.key, v)"
              />
            </div>
          </div>
        </section>

        <!-- 04 Abonnement -->
        <section id="abonnement">
          <p class="section-eyebrow">04 — Abonnement</p>
          <h2 class="section-title">Abonnement</h2>
          <p class="section-desc">
            Plan {{ planLabels[profil.plan] ?? profil.plan }}. Gérez votre abonnement et consultez
            vos factures.
          </p>
          <div class="plan-stats">
            <div class="plan-stat">
              <p class="plan-stat-value">{{ usageDisplay('ruches') || '—' }}</p>
              <p class="plan-stat-label">Ruches utilisées</p>
            </div>
            <div class="plan-stat">
              <p class="plan-stat-value">{{ usageDisplay('ruchers') || '—' }}</p>
              <p class="plan-stat-label">Ruchers</p>
            </div>
            <div class="plan-stat">
              <p class="plan-stat-value">{{ usageDisplay('membresEquipe') || '—' }}</p>
              <p class="plan-stat-label">Sièges équipe</p>
            </div>
          </div>
          <div class="plan-actions">
            <NuxtLink to="/parametres/facturation">
              <button class="btn-primary-dark">Gérer le plan</button>
            </NuxtLink>
            <NuxtLink to="/parametres/facturation">
              <button class="btn-secondary">Voir les factures</button>
            </NuxtLink>
          </div>
        </section>

        <!-- 05 Équipe -->
        <section id="equipe">
          <p class="section-eyebrow">05 — Équipe</p>
          <h2 class="section-title">Équipe</h2>
          <p class="section-desc">
            Gérez les membres de votre exploitation et leurs niveaux d'accès.
          </p>
          <div class="team-row team-row-first">
            <div>
              <p class="team-name">
                {{ profil.prenom }} {{ profil.nom }}
                <span class="team-you">· Vous</span>
              </p>
              <p class="team-email">{{ profil.email }}</p>
            </div>
            <p class="team-role">Propriétaire</p>
            <NuxtLink to="/parametres/equipe" class="row-action">Gérer</NuxtLink>
          </div>
          <div style="margin-top: 16px">
            <NuxtLink to="/parametres/equipe" class="row-action" style="font-size: 13px">
              Voir tous les membres →
            </NuxtLink>
          </div>
        </section>

        <!-- 06 Données -->
        <section id="donnees">
          <p class="section-eyebrow">06 — Données</p>
          <h2 class="section-title">Données</h2>
          <p class="section-desc">
            Vous restez propriétaire de vos données. Données hébergées en France, conformes RGPD.
          </p>
          <div>
            <SettingsRow
              label="Export complet"
              value="Archive ZIP au format CSV"
              action="Exporter"
              :first="true"
              @edit="exportData"
            />
            <SettingsRow
              label="CGU"
              value="Conditions Générales d'Utilisation"
              action="Lire"
              @edit="() => navigateTo('/cgu', { open: { target: '_blank' } })"
            />
            <SettingsRow
              label="Confidentialité"
              value="Conforme RGPD — hébergement OVH France"
              action="Lire"
              @edit="() => navigateTo('/politique-confidentialite', { open: { target: '_blank' } })"
            />
          </div>

          <!-- Danger zone -->
          <div class="danger-zone">
            <UIcon name="i-lucide-alert-triangle" class="danger-icon" />
            <div class="danger-content">
              <p class="danger-title">Supprimer mon compte</p>
              <p class="danger-desc">
                Action irréversible. Toutes vos ruches, interventions et factures seront effacées
                sous 30 jours.
              </p>
            </div>
            <button class="danger-btn" @click="handleDeleteAccount">Supprimer</button>
          </div>
        </section>

        <!-- Sécurité -->
        <section id="securite">
          <p class="section-eyebrow">— Sécurité</p>
          <h2 class="section-title">Sécurité</h2>
          <p class="section-desc">Protégez l'accès à votre compte.</p>
          <div>
            <SettingsRow
              label="Mot de passe"
              value="••••••••••••"
              action="Changer"
              :first="true"
              @edit="handleChangePassword"
            />
            <SettingsRow
              label="Session"
              value="Connecté"
              action="Se déconnecter"
              @edit="handleLogout"
            />
          </div>
        </section>
      </div>
    </div>

    <!-- Sticky save bar (prefs) -->
    <Transition name="save-bar">
      <div v-if="hasPendingPrefs && !editingField" class="save-bar">
        <p class="save-bar-hint">Préférences modifiées</p>
        <div class="save-bar-actions">
          <button class="save-bar-cancel" @click="resetPrefs">Annuler</button>
          <UButton
            label="Enregistrer"
            icon="i-lucide-check"
            size="sm"
            :loading="savingPrefs"
            color="neutral"
            @click="savePrefs"
          />
        </div>
      </div>
    </Transition>

    <!-- Sticky save bar (field edit) -->
    <Transition name="save-bar">
      <div v-if="editingField" class="save-bar">
        <p class="save-bar-hint">
          Modification de « {{ fieldLabels[editingField] ?? editingField }} »
        </p>
        <div class="save-bar-actions">
          <button class="save-bar-cancel" @click="cancelEdit">Annuler</button>
          <UButton
            label="Enregistrer"
            icon="i-lucide-check"
            size="sm"
            :loading="savingField"
            color="neutral"
            @click="saveCurrentField"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

// ─── Composables ─────────────────────────────────────────────────────────────
const authStore = useAuthStore();
const { logout, resetPassword } = useAuth();
const notifications = useNotifications();
const { usageDisplay, refreshUsage } = useGating();

// ─── Data ─────────────────────────────────────────────────────────────────────
const profil = computed(() => authStore.profil);
const initials = computed(() => authStore.initials);

const planLabels: Record<string, string> = {
  decouverte: 'Découverte',
  starter: 'Starter',
  pro: 'Pro',
  expert: 'Expert',
};

const memberSince = computed(() => {
  const d = profil.value?.createdAt;
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
});

const fullAddress = computed(() => {
  const p = profil.value;
  if (!p) return null;
  const parts = [
    p.adresse,
    p.codePostal && p.ville ? `${p.codePostal} ${p.ville}` : p.ville,
  ].filter(Boolean);
  return parts.join(', ') || null;
});

const formattedSiret = computed(() => {
  const s = profil.value?.siret;
  if (!s) return null;
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
});

onMounted(() => refreshUsage());

// ─── Nav & scroll-spy ────────────────────────────────────────────────────────
const navItems = [
  { id: 'identite', label: 'Identité' },
  { id: 'exploitation', label: 'Exploitation' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'abonnement', label: 'Abonnement' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'donnees', label: 'Données' },
  { id: 'securite', label: 'Sécurité' },
];

const activeSection = ref('identite');

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
  );
  for (const item of navItems) {
    const el = document.getElementById(item.id);
    if (el) observer.observe(el);
  }
});

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Notifications prefs ─────────────────────────────────────────────────────
interface Preferences {
  alertesStock: boolean;
  rappelsInterventions: boolean;
  alertesMeteo: boolean;
  alertesEssaim: boolean;
  pushMobile: boolean;
  digestHebdo: boolean;
}

const notifItems: { key: keyof Preferences; label: string; desc: string }[] = [
  {
    key: 'alertesStock',
    label: 'Stocks bas',
    desc: 'Quand un stock passe sous le seuil défini.',
  },
  {
    key: 'rappelsInterventions',
    label: 'Interventions à venir',
    desc: 'Rappel le matin pour les visites planifiées dans la journée.',
  },
  {
    key: 'alertesMeteo',
    label: 'Météo critique',
    desc: 'Gel sous -3 °C, canicule au-dessus de 36 °C, vents forts annoncés.',
  },
  {
    key: 'alertesEssaim',
    label: "Risque d'essaimage",
    desc: 'Détection à partir des cellules royales saisies en visite et de la phénologie locale.',
  },
  {
    key: 'pushMobile',
    label: 'Push mobile',
    desc: "Recevoir aussi sur l'app mobile, en plus des emails.",
  },
  {
    key: 'digestHebdo',
    label: 'Digest hebdomadaire',
    desc: 'Résumé envoyé chaque lundi matin à 7 h.',
  },
];

function getInitialPrefs(): Preferences {
  const sp = (profil.value?.preferences ?? {}) as Partial<Preferences>;
  return {
    alertesStock: sp.alertesStock ?? true,
    rappelsInterventions: sp.rappelsInterventions ?? true,
    alertesMeteo: sp.alertesMeteo ?? true,
    alertesEssaim: sp.alertesEssaim ?? false,
    pushMobile: sp.pushMobile ?? false,
    digestHebdo: sp.digestHebdo ?? false,
  };
}

const prefs = reactive<Preferences>(getInitialPrefs());
const savedPrefsSnapshot = ref<Preferences>({ ...prefs });

const hasPendingPrefs = computed(() => {
  for (const k of Object.keys(prefs) as (keyof Preferences)[]) {
    if (prefs[k] !== savedPrefsSnapshot.value[k]) return true;
  }
  return false;
});

function updatePref(key: keyof Preferences, value: boolean) {
  prefs[key] = value;
}

function resetPrefs() {
  Object.assign(prefs, savedPrefsSnapshot.value);
}

const savingPrefs = ref(false);
async function savePrefs() {
  savingPrefs.value = true;
  try {
    await authStore.updateProfil({ preferences: { ...prefs } });
    savedPrefsSnapshot.value = { ...prefs };
    notifications.success('Préférences enregistrées');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    savingPrefs.value = false;
  }
}

// ─── TVA toggle (saved immediately) ─────────────────────────────────────────
const tvaDebitLocal = ref(profil.value?.optionTvaDebits ?? false);

async function saveTvaDebit(value: boolean) {
  try {
    await authStore.updateProfil({ optionTvaDebits: value });
    notifications.success('Option TVA mise à jour');
  } catch (e: unknown) {
    tvaDebitLocal.value = !value;
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  }
}

// ─── Inline field editing ─────────────────────────────────────────────────────
type EditableField = 'prenom' | 'nom' | 'telephone' | 'napi' | 'siret' | 'adresse';

const editingField = ref<EditableField | null>(null);
const editValue = ref('');
const savingField = ref(false);

const addressEdit = reactive({ adresse: '', codePostal: '', ville: '' });

const fieldLabels: Record<string, string> = {
  prenom: 'Prénom',
  nom: 'Nom',
  telephone: 'Téléphone',
  napi: 'NAPI',
  siret: 'SIRET',
  adresse: 'Adresse',
};

function startEdit(field: EditableField, value: string) {
  editingField.value = field;
  editValue.value = value;
}

function openAddressEdit() {
  editingField.value = 'adresse';
  addressEdit.adresse = profil.value?.adresse ?? '';
  addressEdit.codePostal = profil.value?.codePostal ?? '';
  addressEdit.ville = profil.value?.ville ?? '';
}

function cancelEdit() {
  editingField.value = null;
  editValue.value = '';
}

async function saveCurrentField() {
  if (!editingField.value) return;
  savingField.value = true;
  try {
    if (editingField.value === 'adresse') {
      await authStore.updateProfil({
        adresse: addressEdit.adresse || null,
        codePostal: addressEdit.codePostal || null,
        ville: addressEdit.ville || null,
      });
    } else {
      await authStore.updateProfil({ [editingField.value]: editValue.value || null });
    }
    editingField.value = null;
    editValue.value = '';
    notifications.success('Modification enregistrée');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la sauvegarde'));
  } finally {
    savingField.value = false;
  }
}

// ─── Watch profil sync ───────────────────────────────────────────────────────
watch(profil, (p) => {
  if (!p) return;
  tvaDebitLocal.value = p.optionTvaDebits ?? false;
  const sp = (p.preferences ?? {}) as Partial<Preferences>;
  prefs.alertesStock = sp.alertesStock ?? true;
  prefs.rappelsInterventions = sp.rappelsInterventions ?? true;
  prefs.alertesMeteo = sp.alertesMeteo ?? true;
  prefs.alertesEssaim = sp.alertesEssaim ?? false;
  prefs.pushMobile = sp.pushMobile ?? false;
  prefs.digestHebdo = sp.digestHebdo ?? false;
  savedPrefsSnapshot.value = { ...prefs };
});

// ─── Actions ──────────────────────────────────────────────────────────────────
async function handleChangePassword() {
  if (!profil.value?.email) return;
  const sent = await resetPassword(profil.value.email);
  if (sent) {
    notifications.success('Un email de réinitialisation a été envoyé à ' + profil.value.email);
  } else {
    notifications.error("Erreur lors de l'envoi de l'email");
  }
}

async function handleLogout() {
  await logout();
}

function exportData() {
  window.open('/api/finances/export?format=csv', '_blank');
  notifications.success('Export lancé');
}

function handleDeleteAccount() {
  notifications.error('Contactez le support pour supprimer votre compte');
}
</script>

<style scoped>
/* ─── Page shell ──────────────────────────────────────────────────────────── */
.settings-page {
  /* dvh evite que la barre Safari iOS coupe le contenu en bas */
  min-height: 100dvh;
  background: var(--surface-primary);
}

/* ─── Topbar ──────────────────────────────────────────────────────────────── */
.settings-topbar {
  height: 56px;
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  padding: 0 56px;
}
.settings-breadcrumb {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */
.settings-layout {
  display: flex;
  gap: 56px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 56px 80px;
}
.settings-aside-placeholder {
  width: 180px;
  flex-shrink: 0;
}

/* ─── Aside ───────────────────────────────────────────────────────────────── */
.settings-aside {
  width: 180px;
  flex-shrink: 0;
  position: sticky;
  top: 40px;
  align-self: flex-start;
  height: fit-content;
}
.aside-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 14px;
}
.aside-link {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-decoration: none;
  padding: 6px 0 6px 12px;
  margin-left: -14px;
  border-left: 2px solid transparent;
  transition:
    color 150ms,
    border-color 150ms;
}
.aside-link:hover {
  color: var(--text-primary);
}
.aside-link.active {
  color: var(--text-primary);
  font-weight: 600;
  border-left-color: var(--honey);
}

/* ─── Body ────────────────────────────────────────────────────────────────── */
.settings-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 64px;
  min-width: 0;
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
.settings-h1 {
  font-family: var(--font-display, 'SF Pro Display', -apple-system, sans-serif);
  font-size: 38px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: var(--text-primary);
  margin: 0 0 12px;
}
.settings-lede {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.55;
  max-width: 600px;
  margin: 0;
}

/* ─── Profile card ────────────────────────────────────────────────────────── */
.profile-card {
  margin-top: 28px;
  padding: 24px 0;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 20px;
}
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: #1c1c1e;
  color: var(--honey);
  font-family: var(--font-display, 'SF Pro Display', -apple-system, sans-serif);
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.profile-info {
  flex: 1;
  min-width: 0;
}
.profile-name {
  font-family: var(--font-display, 'SF Pro Display', -apple-system, sans-serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.profile-meta {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
.profile-stats {
  margin-left: auto;
  display: flex;
  gap: 36px;
  flex-shrink: 0;
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-family: var(--font-display, 'SF Pro Display', -apple-system, sans-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
}
.stat-plan {
  color: var(--honey-deep, #a86a13);
}
.stat-label {
  font-size: 11.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 4px 0 0;
}

/* ─── Section headers ─────────────────────────────────────────────────────── */
.section-eyebrow {
  font-size: 11px;
  font-weight: 600;
  color: var(--honey-deep, #a86a13);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0 0 8px;
}
.section-title {
  font-family: var(--font-display, 'SF Pro Display', -apple-system, sans-serif);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0 0 6px;
}
.section-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.55;
  max-width: 560px;
  margin: 0 0 24px;
}

/* ─── Address field group ─────────────────────────────────────────────────── */
.address-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.address-row {
  display: flex;
  gap: 8px;
}

/* ─── Toggle rows ─────────────────────────────────────────────────────────── */
.toggle-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  padding: 18px 0;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-default);
}
.toggle-first {
  border-top: 1px solid var(--border-default);
}
.toggle-title {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px;
}
.toggle-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 520px;
  margin: 0;
}

/* ─── Plan stats ──────────────────────────────────────────────────────────── */
.plan-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 20px;
}
.plan-stat {
  padding: 20px 0;
  text-align: center;
}
.plan-stat + .plan-stat {
  border-left: 1px solid var(--border-default);
}
.plan-stat-value {
  font-family: var(--font-display, 'SF Pro Display', -apple-system, sans-serif);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 0;
}
.plan-stat-label {
  font-size: 11.5px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 4px 0 0;
}
.plan-actions {
  display: flex;
  gap: 14px;
}
.btn-primary-dark {
  height: 38px;
  padding: 0 18px;
  background: #1c1c1e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 150ms;
}
.btn-primary-dark:hover {
  opacity: 0.85;
}
.btn-secondary {
  height: 38px;
  padding: 0 18px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 150ms;
}
.btn-secondary:hover {
  border-color: var(--border-hover);
}

/* ─── Team rows ───────────────────────────────────────────────────────────── */
.team-row {
  display: grid;
  grid-template-columns: 1fr 200px auto;
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-default);
  align-items: center;
}
.team-row-first {
  border-top: 1px solid var(--border-default);
}
.team-name {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 2px;
}
.team-you {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}
.team-email {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}
.team-role {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
}

/* ─── Row action (shared) ─────────────────────────────────────────────────── */
.row-action {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  text-decoration: none;
  transition: color 150ms;
  white-space: nowrap;
}
.row-action:hover {
  color: var(--text-primary);
}

/* ─── Danger zone ─────────────────────────────────────────────────────────── */
.danger-zone {
  margin-top: 24px;
  padding: 18px 22px;
  border-radius: 12px;
  border: 1px solid #f0d4d4;
  background: #fdf6f6;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.danger-icon {
  color: #c54545;
  margin-top: 2px;
  flex-shrink: 0;
}
.danger-content {
  flex: 1;
}
.danger-title {
  font-size: 14px;
  font-weight: 600;
  color: #9a2f2f;
  margin: 0 0 4px;
}
.danger-desc {
  font-size: 13px;
  color: #a85555;
  line-height: 1.5;
  max-width: 460px;
  margin: 0;
}
.danger-btn {
  height: 34px;
  padding: 0 14px;
  background: #fff;
  border: 1px solid #e8c5c5;
  color: #9a2f2f;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms;
}
.danger-btn:hover {
  background: #fdf0f0;
}

/* ─── Sticky save bar ─────────────────────────────────────────────────────── */
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 40px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-default);
}
.save-bar-hint {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0;
}
.save-bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.save-bar-cancel {
  font-size: 13.5px;
  color: var(--text-tertiary);
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 150ms;
}
.save-bar-cancel:hover {
  color: var(--text-primary);
}

/* ─── Save bar transition ─────────────────────────────────────────────────── */
.save-bar-enter-active,
.save-bar-leave-active {
  transition:
    transform 250ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 200ms;
}
.save-bar-enter-from,
.save-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
.skeleton-block {
  height: 120px;
  border-radius: 12px;
  background: var(--surface-muted, #f5f4f1);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .settings-topbar {
    padding: 0 24px;
  }
  .settings-layout {
    flex-direction: column;
    gap: 0;
    padding: 0 24px 80px;
  }
  .settings-aside {
    width: 100%;
    position: static;
    display: flex;
    gap: 0;
    overflow-x: auto;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-default);
    margin-bottom: 32px;
  }
  .aside-label {
    display: none;
  }
  .aside-link {
    flex-shrink: 0;
    padding: 6px 14px;
    margin-left: 0;
    border-left: none;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
  }
  .aside-link.active {
    border-left-color: transparent;
    border-bottom-color: var(--honey);
  }
  .profile-stats {
    display: none;
  }
}

@media (max-width: 767px) {
  .settings-layout {
    padding: 0 16px 80px;
  }
  .settings-h1 {
    font-size: 28px;
  }
  .team-row {
    grid-template-columns: 1fr auto;
  }
  .team-role {
    display: none;
  }
  .plan-stats {
    grid-template-columns: 1fr;
  }
  .plan-stat + .plan-stat {
    border-left: none;
    border-top: 1px solid var(--border-default);
  }
  .save-bar {
    padding: 14px 20px;
  }
}
</style>
