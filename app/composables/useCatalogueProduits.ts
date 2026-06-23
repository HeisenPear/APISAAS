export interface ProduitCatalogue {
  id: string;
  nom: string;
  categorie: string;
  categorieVente: string | null;
  tauxTva: string | null;
  uniteTypique: string | null;
  modePrix: 'format' | 'poids';
  conditionnement: string | null;
  contenance: string | null;
  uniteContenance: string | null;
  icon: string | null;
  groupe: string | null;
  estDefaut: boolean;
}

/** Entrée de création/édition (montants en nombres, comme attendu par l'API). */
export interface ProduitCatalogueInput {
  nom?: string;
  groupe?: string | null;
  categorie?: string;
  categorieVente?: string | null;
  tauxTva?: number | null;
  uniteTypique?: string | null;
  modePrix?: 'format' | 'poids';
  conditionnement?: string | null;
  contenance?: number | null;
  uniteContenance?: string | null;
  icon?: string | null;
}

export function useCatalogueProduits() {
  async function list(): Promise<ProduitCatalogue[]> {
    const res = await $fetch<{ data: ProduitCatalogue[] }>('/api/catalogue');
    return res.data;
  }

  async function create(body: ProduitCatalogueInput): Promise<ProduitCatalogue> {
    const res = await $fetch<{ data: ProduitCatalogue }>('/api/catalogue', {
      method: 'POST',
      body,
    });
    return res.data;
  }

  async function update(id: string, body: ProduitCatalogueInput): Promise<ProduitCatalogue> {
    const res = await ($fetch as typeof $fetch<{ data: ProduitCatalogue }, string>)(
      `/api/catalogue/${id}`,
      { method: 'PUT', body },
    );
    return res.data;
  }

  async function remove(id: string): Promise<void> {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/catalogue/${id}`, { method: 'DELETE' });
  }

  return { list, create, update, remove };
}
