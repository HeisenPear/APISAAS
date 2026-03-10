interface Template {
  id: string;
  nom: string;
  description: string | null;
  categories: string[];
  donneesDefaut: Record<string, unknown>;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useTemplatesIntervention() {
  const templates = ref<Template[]>([]);
  const loading = ref(false);

  async function fetchTemplates() {
    loading.value = true;
    try {
      const res = await $fetch<{ data: Template[] }>('/api/interventions/templates');
      templates.value = res.data;
    } finally {
      loading.value = false;
    }
  }

  async function createTemplate(payload: {
    nom: string;
    description?: string;
    categories: string[];
    donneesDefaut?: Record<string, unknown>;
  }) {
    const res = await $fetch<{ data: Template }>('/api/interventions/templates', {
      method: 'POST',
      body: payload,
    });
    templates.value.push(res.data);
    return res.data;
  }

  async function deleteTemplate(id: string) {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/interventions/templates/${id}`, {
      method: 'DELETE',
    });
    templates.value = templates.value.filter((t) => t.id !== id);
  }

  return { templates, loading, fetchTemplates, createTemplate, deleteTemplate };
}
