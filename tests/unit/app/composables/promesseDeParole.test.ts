// ═══════════════════════════════════════════════════════════════════════════
// LA PROMESSE DE `dire()` — la boucle vocale s'en sert pour rendre le micro.
//
// ⚠️ SON COMMENTAIRE AFFIRMAIT QU'ELLE SE RÉSOLVAIT TOUJOURS. Elle était FAUSSE
// sur quatre chemins, et aucun banc du dépôt n'importait `useVoixMaya` :
//
//   · `taire()` appelle `cancel()`, qui n'émet `end` sur AUCUN navigateur de
//     façon garantie ;
//   · un second `dire()` écrasait le premier, dont la promesse restait
//     suspendue ;
//   · le démontage coupait tout, sans rendre la main ;
//   · un navigateur muet ne répond jamais.
//
// Dans les quatre cas, `parler()` attendait une main qu'on ne lui rendait plus :
// `enParole` restait levé, le micro ne se rouvrait jamais, et rien à l'écran ne
// l'expliquait — un mode vocal figé et muet.
//
// ⚠️ ET LE BUS EST ICI AUSSI, pour la même raison : personne ne l'avait jamais
// mesuré avec DEUX abonnés.
// ═══════════════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  effectScope,
  getCurrentInstance,
  onScopeDispose,
  onUnmounted,
  ref,
  type EffectScope,
} from 'vue';
import { useDataBus } from '../../../../app/composables/useDataBus';

// ─── Le double de synthèse vocale ──────────────────────────────────────────

/** Les énonciations vivantes — on choisit si (et quand) elles finissent. */
let enCours: {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  voice?: { name: string; localService: boolean } | null;
}[] = [];
/** Le navigateur émet-il `end` sur `cancel()` ? Chrome oui, d'autres non. */
let cancelEmetEnd = false;
/** `speak()` lève-t-il ? (extension, politique de geste utilisateur) */
let speakLeve = false;

/** Les voix que le navigateur propose — locales ou servies à distance. */
let voixDisponibles: { lang: string; localService: boolean; name: string }[] = [];
/**
 * Les abonnés à `voiceschanged`. Le double les GARDE, au lieu de les jeter :
 * Chrome livre ses voix APRÈS le montage, et c'est précisément ce moment-là
 * qu'il faut pouvoir rejouer.
 */
let ecouteursVoix: (() => void)[] = [];

/** Le navigateur livre ses voix (Chrome le fait de façon asynchrone). */
function livrerLesVoix(liste: typeof voixDisponibles): void {
  voixDisponibles = liste;
  for (const f of [...ecouteursVoix]) f();
}

function poserSynthese(present: boolean): void {
  if (!present) {
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    return;
  }
  (window as unknown as { speechSynthesis?: unknown }).speechSynthesis = {
    getVoices: () => voixDisponibles,
    addEventListener: (nom: string, f: () => void) => {
      if (nom === 'voiceschanged') ecouteursVoix.push(f);
    },
    removeEventListener: (nom: string, f: () => void) => {
      if (nom === 'voiceschanged') ecouteursVoix = ecouteursVoix.filter((g) => g !== f);
    },
    speak(u: (typeof enCours)[number]) {
      if (speakLeve) throw new Error('refusé');
      enCours.push(u);
    },
    cancel() {
      const liste = enCours;
      enCours = [];
      if (cancelEmetEnd) for (const u of liste) u.onend?.();
    },
  };
}

/** Termine proprement la parole en cours (le cas nominal). */
function finirDeParler(): void {
  const liste = enCours;
  enCours = [];
  for (const u of liste) u.onend?.();
}

let portee: EffectScope | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  enCours = [];
  cancelEmetEnd = false;
  speakLeve = false;
  ecouteursVoix = [];
  voixDisponibles = [{ lang: 'fr-FR', localService: true, name: 'fr' }];
  poserSynthese(true);
  (globalThis as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
    class {
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      lang = '';
      voice: unknown = null;
      rate = 1;
      pitch = 1;
      constructor(public text: string) {}
    };
  for (const [nom, valeur] of Object.entries({
    ref,
    onMounted: (f: () => void) => f(),
    onUnmounted,
    onScopeDispose,
    getCurrentInstance,
  })) {
    vi.stubGlobal(nom, valeur);
  }
});

afterEach(() => {
  portee?.stop();
  portee = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  poserSynthese(false);
});

async function monterVoix() {
  const { useVoixMaya } = await import('~~/app/composables/useVoixMaya');
  portee = effectScope();
  return portee.run(() => useVoixMaya())!;
}

/** Une promesse s'est-elle résolue ? (sans jamais bloquer le banc) */
function reglee<T>(p: Promise<T>): Promise<boolean> {
  return Promise.race([p.then(() => true), Promise.resolve().then(() => false)]);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Le garde-fou
// ═══════════════════════════════════════════════════════════════════════════

describe('garde-fou : le cas nominal ne rend PAS la main tout seul', () => {
  it('la promesse attend la fin de l’énonciation', async () => {
    /**
     * Sans ce cas, un `dire()` qui rendrait la main immédiatement satisferait
     * tous les cas suivants — et Maya parlerait par-dessus elle-même, micro
     * rouvert au milieu de sa phrase.
     */
    const voix = await monterVoix();
    const p = voix.dire('Tes douze ruches vont bien.');
    expect(await reglee(p), 'elle parle encore').toBe(false);
    finirDeParler();
    expect(await reglee(p)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Les quatre chemins où la promesse était fausse
// ═══════════════════════════════════════════════════════════════════════════

describe('⚠️ `dire()` rend TOUJOURS la main', () => {
  it('quand `taire()` coupe, même si le navigateur n’émet pas `end`', async () => {
    // Le chemin le plus fréquent : l'apiculteur touche le micro, ferme la
    // bulle, ou dit « stop ». `cancel()` n'émet `end` sur aucun navigateur de
    // façon garantie.
    const voix = await monterVoix();
    const p = voix.dire('Une longue réponse.');
    expect(await reglee(p)).toBe(false);
    voix.taire();
    expect(await reglee(p), 'le micro ne se rouvrirait jamais').toBe(true);
    expect(voix.parle.value).toBe(false);
  });

  it('quand un SECOND `dire()` prend la place', async () => {
    const voix = await monterVoix();
    const premier = voix.dire('Première réponse.');
    const second = voix.dire('Deuxième réponse.');
    expect(await reglee(premier), 'la première est abandonnée, pas suspendue').toBe(true);
    finirDeParler();
    expect(await reglee(second)).toBe(true);
  });

  it('quand le navigateur n’a pas de synthèse (Firefox)', async () => {
    // La boucle vocale doit continuer sans la voix, pas s'arrêter.
    poserSynthese(false);
    const voix = await monterVoix();
    expect(voix.supporte.value).toBe(false);
    expect(await reglee(voix.dire('Tes ruches vont bien.'))).toBe(true);
  });

  it('quand le texte ne vaut pas la peine d’être dit', async () => {
    const voix = await monterVoix();
    expect(await reglee(voix.dire('🐝'))).toBe(true);
    expect(await reglee(voix.dire('   '))).toBe(true);
  });

  it('quand le texte suivant ne vaut RIEN à dire', async () => {
    /**
     * ⚠️ LA SÉQUENCE RÉELLE, et elle manquait. Maya lit une longue réponse ;
     * la suivante n'est qu'un tableau ou un émoji, que le nettoyage vide. Si ce
     * `dire()`-là rendait la main SANS libérer le précédent, la première
     * promesse restait suspendue pour toujours — et c'est elle que `parler()`
     * attend pour rouvrir le micro.
     */
    const voix = await monterVoix();
    const longue = voix.dire('Une réponse que Maya est en train de lire.');
    expect(await reglee(longue)).toBe(false);
    await voix.dire('🐝');
    expect(await reglee(longue), 'la parole précédente reste suspendue').toBe(true);
  });

  it('quand la portée est DÉTRUITE (navigation, démontage)', async () => {
    // `onScopeDispose` appelle `taire()`. Une promesse restée suspendue là
    // retiendrait `enParole` d'un composant qui n'existe plus.
    const { useVoixMaya } = await import('~~/app/composables/useVoixMaya');
    const porteeLocale = effectScope();
    const voix = porteeLocale.run(() => useVoixMaya())!;
    const p = voix.dire('Une réponse interrompue par une navigation.');
    expect(await reglee(p)).toBe(false);
    porteeLocale.stop();
    expect(await reglee(p)).toBe(true);
  });

  it('quand `speak()` LÈVE', async () => {
    speakLeve = true;
    const voix = await monterVoix();
    expect(await reglee(voix.dire('Tes ruches vont bien.'))).toBe(true);
  });

  it('quand le navigateur n’émet NI `end` NI `error` — le filet de sécurité', async () => {
    /**
     * ⚠️ LE CAS QUI FIGEAIT TOUT. Système qui interrompt la synthèse (appel
     * entrant, mise en veille, onglet suspendu) : aucun évènement ne vient
     * jamais. Sans borne, `enParole` reste levé pour toujours.
     */
    const voix = await monterVoix();
    const p = voix.dire('Une réponse que personne ne terminera.');
    expect(await reglee(p)).toBe(false);
    vi.advanceTimersByTime(120_000);
    expect(await reglee(p), 'la boucle vocale resterait figée, muette').toBe(true);
  });

  it('la borne SUIT la longueur du texte — elle ne coupe pas une longue fiche', async () => {
    /**
     * ⚠️ UNE BORNE FIXE DE 30 s COUPAIT 79 DES 484 TEXTES DU SAVOIR au milieu
     * d'une phrase : la fiche varroa fait 1 227 caractères, près d'une minute
     * de synthèse. Une borne qui tronque le conseil est pire que pas de borne.
     */
    const voix = await monterVoix();
    const longue = 'Le seuil de traitement se mesure au comptage. '.repeat(28); // ~1 260 car.
    const p = voix.dire(longue);
    vi.advanceTimersByTime(45_000);
    expect(await reglee(p), 'elle parle encore : ne pas la couper').toBe(false);
    finirDeParler();
    expect(await reglee(p)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Le bus, mesuré avec DEUX abonnés
// ═══════════════════════════════════════════════════════════════════════════

describe('⚠️ un abonné qui LÈVE n’emporte pas les autres', () => {
  it('tous les abonnés d’un événement sont réveillés', async () => {
    // Le garde-fou : sans lui, un bus qui ne réveillerait que le premier
    // passerait le cas suivant au vert.
    const { on, emit } = useDataBus();
    const vus: string[] = [];
    const c1 = on('ruche:created', () => vus.push('barre latérale'));
    const c2 = on('ruche:created', () => vus.push('tableau de bord'));
    const c3 = on('ruche:created', () => vus.push('page ouverte'));
    emit('ruche:created');
    c1();
    c2();
    c3();
    expect(vus).toEqual(['barre latérale', 'tableau de bord', 'page ouverte']);
  });

  it('un abonné qui lève ne fait pas mentir Maya', async () => {
    /**
     * ⚠️ LE DÉFAUT DERRIÈRE LE TROU DE BANC. `emit` est appelé depuis la boucle
     * SSE de `useCopilote`, elle-même sous un `catch` qui affiche « Connexion
     * interrompue » ET RETIRE la question du fil. Un `posthog.capture` bloqué
     * par un bloqueur de publicité suffisait donc à : une ruche parfaitement
     * écrite côté serveur, un tableau de bord jamais rafraîchi, un faux message
     * d'erreur réseau, et le bouton « Annuler » perdu — donc une écriture qui
     * n'est plus défaisable.
     */
    const { on, emit } = useDataBus();
    const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});
    const vus: string[] = [];
    const c1 = on('ruche:created', () => {
      throw new Error('bloqueur de publicité');
    });
    const c2 = on('ruche:created', () => vus.push('tableau de bord'));

    expect(() => emit('ruche:created'), 'l’exception ne doit pas remonter').not.toThrow();
    expect(vus, 'les abonnés suivants doivent être réveillés').toEqual(['tableau de bord']);
    expect(erreur, 'et l’incident doit être tracé, pas avalé').toHaveBeenCalled();
    c1();
    c2();
    erreur.mockRestore();
  });

  it('un abonné qui se DÉSABONNE pendant la diffusion ne casse rien', async () => {
    // Une navigation déclenchée par l'événement lui-même démonte un composant :
    // son `onUnmounted` retire le handler du Set en cours de parcours.
    const { on, emit } = useDataBus();
    const vus: string[] = [];
    let couper2 = (): void => {};
    const c1 = on('rucher:created', () => {
      vus.push('un');
      couper2();
    });
    couper2 = on('rucher:created', () => vus.push('deux'));
    expect(() => emit('rucher:created')).not.toThrow();
    expect(vus).toEqual(['un', 'deux']);
    c1();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ON NE PARLE QU'AVEC UNE VOIX EMBARQUÉE
//
// ⚠️ L'EN-TÊTE AFFIRMAIT « SANS APPEL RÉSEAU » SANS CONDITION, et le repli
// acceptait en silence une voix SERVIE À DISTANCE. Ce sont les réponses de Maya
// — noms de ruchers, noms de clients, chiffres de récolte — qui partaient alors
// chez l'éditeur du navigateur, sans que personne l'ait décidé.
//
// La règle appliquée est celle du dépôt, telle quelle : « inconnu ne vaut
// jamais laisse-passer ». Et elle a sa porte de sortie — là où aucune voix
// locale n'existe, la boucle vocale continue sans la voix, comme sur Firefox.
// ═══════════════════════════════════════════════════════════════════════════

describe('⚠️ aucune voix servie à distance', () => {
  it('parle avec une voix EMBARQUÉE, ET la POSE sur l’énoncé', async () => {
    // Le garde-fou : sans lui, un refus systématique satisferait les cas
    // suivants tout en rendant Maya muette partout.
    voixDisponibles = [{ lang: 'fr-FR', localService: true, name: 'locale' }];
    const voix = await monterVoix();
    const p = voix.dire('Tes ruches vont bien.');
    expect(enCours.length, 'elle doit parler').toBe(1);
    /**
     * ⚠️ LA DEUXIÈME MOITIÉ DE LA RÈGLE, ET ELLE N'ÉTAIT PAS TENUE. Une
     * mutation qui retirait `enonce.voice = voix` laissait tout le bloc VERT :
     * la porte se refermait bien sur les voix distantes, puis l'énoncé partait
     * SANS voix — et un énoncé sans voix laisse le navigateur choisir
     * lui-même, c'est-à-dire, sur Chrome, exactement la voix distante qu'on
     * venait de refuser. Choisir une voix locale ne sert à rien si on ne la
     * donne pas à l'énonciation.
     */
    expect(
      enCours[0]!.voice,
      'l’énoncé doit PORTER la voix embarquée : sans elle, le navigateur choisit',
    ).toMatchObject({ name: 'locale', localService: true });
    finirDeParler();
    await p;
  });

  it('REFUSE une voix distante, même en français', async () => {
    voixDisponibles = [{ lang: 'fr-FR', localService: false, name: 'distante' }];
    const voix = await monterVoix();
    await voix.dire('Le rucher des Tilleuls a produit 18 kilos.');
    expect(
      enCours.length,
      'le texte de Maya — noms de ruchers, de clients — partirait chez l’éditeur du navigateur',
    ).toBe(0);
  });

  it('accepte une voix EMBARQUÉE d’une autre variante de français', async () => {
    // Une voix québécoise ou belge embarquée lit le français correctement, et
    // rien ne sort de l'appareil : le repli utile reste.
    voixDisponibles = [{ lang: 'fr-CA', localService: true, name: 'québécoise' }];
    const voix = await monterVoix();
    const p = voix.dire('Tes ruches vont bien.');
    expect(enCours.length).toBe(1);
    expect(enCours[0]!.voice, 'la variante embarquée doit être posée, elle aussi').toMatchObject({
      name: 'québécoise',
    });
    finirDeParler();
    await p;
  });

  it('rend la main quand AUCUNE voix locale n’existe — la boucle continue', async () => {
    // La porte de sortie : Maya se tait, mais l'écoute repart. Un mode vocal
    // qui se fige parce qu'il n'a pas de voix serait pire que muet.
    voixDisponibles = [{ lang: 'en-US', localService: true, name: 'anglaise' }];
    const voix = await monterVoix();
    expect(await reglee(voix.dire('Tes ruches vont bien.'))).toBe(true);
  });

  it('ne prête PAS la voix distante à l’énoncé', async () => {
    /**
     * Le cas précédent regarde le nombre d'énonciations ; celui-ci regarde ce
     * qui aurait été dit. Ils tomberaient ensemble aujourd'hui — mais le jour
     * où quelqu'un « répare » le refus en laissant partir l'énoncé sans voix,
     * seul ce cas-ci dira que le navigateur choisira alors LUI-MÊME.
     */
    voixDisponibles = [
      { lang: 'fr-FR', localService: false, name: 'Google français' },
      { lang: 'en-GB', localService: true, name: 'anglaise embarquée' },
    ];
    const voix = await monterVoix();
    await voix.dire('Marie Dupont a acheté 12 pots.');
    expect(
      enCours.map((u) => u.text),
      'rien ne doit être énoncé : la seule voix française est servie à distance',
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. `supporte` dit-il la vérité ?
//
// ⚠️ IL DISAIT « l'API existe », l'appelant lisait « Maya peut parler ». Tant
// qu'un repli distant existait, les deux coïncidaient. Depuis qu'on refuse les
// voix distantes, un système sans voix française embarquée répond « supporté »
// et reste muet — un écran qui annonce la parole et ne la donne pas.
// ═══════════════════════════════════════════════════════════════════════════

describe('`supporte` suit la VOIX, pas l’API', () => {
  it('garde-fou : vrai avec une voix française embarquée', async () => {
    voixDisponibles = [{ lang: 'fr-FR', localService: true, name: 'locale' }];
    const voix = await monterVoix();
    expect(voix.supporte.value, 'sans ce cas, un `false` constant passerait').toBe(true);
  });

  it('faux quand la seule voix française est servie à distance', async () => {
    voixDisponibles = [{ lang: 'fr-FR', localService: false, name: 'distante' }];
    const voix = await monterVoix();
    expect(voix.supporte.value, 'annoncer la parole puis se taire, c’est mentir').toBe(false);
  });

  it('faux sans synthèse du tout', async () => {
    poserSynthese(false);
    const voix = await monterVoix();
    expect(voix.supporte.value).toBe(false);
  });

  it('devient vrai quand Chrome livre ses voix APRÈS le montage', async () => {
    /**
     * ⚠️ LE PIÈGE HISTORIQUE DE CE FICHIER. `getVoices()` rend souvent un
     * tableau VIDE au premier appel ; les voix arrivent par `voiceschanged`.
     * Un `supporte` calculé une seule fois au montage resterait faux pour
     * toujours sur le navigateur le plus courant.
     */
    voixDisponibles = [];
    const voix = await monterVoix();
    expect(voix.supporte.value, 'aucune voix encore livrée').toBe(false);
    livrerLesVoix([{ lang: 'fr-FR', localService: true, name: 'locale' }]);
    expect(voix.supporte.value, 'les voix sont arrivées : la parole est possible').toBe(true);
    const p = voix.dire('Tes ruches vont bien.');
    expect(enCours.length, 'et elle parle vraiment').toBe(1);
    finirDeParler();
    await p;
  });
});
