// Ouverture et fermeture de campagne pour les tests d'intégration.
import { afterAll, beforeAll } from 'vitest';
import { baseDisponible, decrireCible, ecritureAutorisee, fermerBase } from './harnais';

beforeAll(() => {
  // On annonce la cible AVANT le premier test : personne ne doit découvrir
  // après coup sur quelle base il vient d'écrire.
  const garde = ecritureAutorisee();
  console.info(`[harnais] base     : ${decrireCible()}`);
  console.info(`[harnais] écriture : ${garde.ok ? 'AUTORISÉE' : 'refusée'} — ${garde.raison}`);
  if (!baseDisponible()) {
    console.info('[harnais] aucune base : les bancs d’intégration sont sautés, pas échoués.');
  }
});

afterAll(async () => {
  await fermerBase();
});
