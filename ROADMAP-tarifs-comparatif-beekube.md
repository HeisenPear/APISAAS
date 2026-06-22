# Roadmap tarifs & comparatif concurrentiel Beekube

> Document de travail (planification). **Aucune fonctionnalité n'est encore implémentée ici** —
> il s'agit de regrouper les infos pour décider ensuite quoi ajouter et dans quel pack.
>
> ⚠️ La remise annuelle **-20 %** et les prix actuels (Starter 4,99 € · Pro 14,99 € · Expert 29,99 €)
> **ne sont PAS modifiés**. Ce doc ne touche pas au code.

---

## 1. Fonctionnalités à ajouter / valoriser par pack (demande Antoine)

| Pack       | Fonctionnalité                                                 | État actuel dans APIGO                                                                                                   | Justification / ce que ça apporte                                                                                                                                                                                              | Travail estimé                                                                |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Pro**    | 🤖 **Assistant IA « Maya »** _(déjà en dev — cf. MAYA.md)_     | ❌ Absent. APIGO a déjà un _score prédictif santé_ et des _suggestions nationales_, mais pas d'assistant conversationnel | Argument de vente fort + alignement avec Beekube qui pousse l'IA (conseils contextuels, diagnostic photo, saisie vocale). Affiché en « bientôt disponible » pour donner de la valeur perçue au pack Pro sans bloquer la sortie | Moyen→élevé (selon périmètre : conseil contextuel < diagnostic photo < vocal) |
| **Expert** | 👥 **Multi-utilisateurs (équipe + rôles)**                     | ⚠️ Déjà présent (`multiUsers`) : 3 membres en Pro, illimité en Expert                                                    | À **mettre en avant** comme argument Expert : équipe illimitée + gestion fine des rôles/permissions (à créer si pas encore le cas)                                                                                             | Faible (affichage) / Moyen (rôles fins)                                       |
| **Expert** | 📊 **Export comptable « expert-comptable »**                   | ⚠️ Déjà : Export FEC + XLSX + bilan annuel PDF                                                                           | Packager un **export dédié à l'expert-comptable** : FEC + journaux + grand-livre + balance + bilan, en un clic, période paramétrable. Argument « votre comptable reçoit tout »                                                 | Faible→moyen                                                                  |
| **Expert** | ⭐ **Support prioritaire**                                     | ⚠️ Déjà : flag `supportPrioritaire` (affichage seul)                                                                     | Formaliser : interlocuteur dédié + SLA de réponse plus court (ex. < 4 h ouvrées) + canal prioritaire                                                                                                                           | Faible (process)                                                              |
| **Expert** | 🏢 **Gestion multi-sites** _(définition à trancher — voir §5)_ | ❌ Absent en tant que tel (les ruchers sont déjà illimités)                                                              | Niveau d'organisation **au-dessus du rucher** pour les grosses exploitations / structures multi-lieux. 3 interprétations possibles, à choisir (cf. §5)                                                                         | Moyen→élevé selon l'option                                                    |

---

## 2. Beekube en bref

- **Modèle** : application **gratuite, sans limite de ruches** + **Premium ~36 €/an** (≈ 3 €/mois).
  Le Premium débloque : **graphiques détaillés, exports complets, IA**.
- **Positionnement** : « la référence française gratuite », orientée **terrain / suivi / sélection génétique**.
- **Cible** : du débutant au sélectionneur, + **syndicats / GDSA** via l'espace Organisation.

---

## 3. Comparatif fonctionnel APIGO ⟷ Beekube

Légende : ✅ présent · ⚠️ partiel / basique · ❌ absent

| Domaine / Fonctionnalité                                     |                       Beekube                       |                   APIGO                    | Écart              | Action recommandée (pack cible)                            |
| ------------------------------------------------------------ | :-------------------------------------------------: | :----------------------------------------: | ------------------ | ---------------------------------------------------------- |
| Suivi interventions par ruche + historique                   |                         ✅                          |                     ✅                     | —                  | RAS                                                        |
| Suivi par **reine** (généalogie)                             |                         ✅                          |             ⚠️ (module Reine)              | Beekube + poussé   | Enrichir le module Reine (Pro)                             |
| QR code par ruche                                            |                         ✅                          |                     ✅                     | —                  | RAS                                                        |
| Mode hors-ligne terrain                                      |                         ✅                          |                     ✅                     | —                  | RAS                                                        |
| Météo intégrée par rucher                                    |                         ✅                          |              ✅ (Open-Meteo)               | —                  | RAS                                                        |
| **Sélection génétique / BLUP** (éval. objective des reines)  |                     ✅ **fort**                     |                     ❌                     | **Gros écart**     | Ajouter scoring/sélection reines, idéalement BLUP (Expert) |
| **Élevage de reines** (lignées, greffage, testage)           |                         ✅                          |                ✅ (Expert)                 | —                  | Valoriser                                                  |
| **Moteur d'automatisation** (règles → tâches auto)           |                         ✅                          |                ⚠️ (alertes)                | Écart              | Moteur de règles personnalisables (Pro/Expert)             |
| **Assistant IA** : conseils contextuels                      |                    ✅ (Premium)                     |                     ❌                     | Écart              | **→ Pro (en dev)**                                         |
| **IA — diagnostic santé par photo de cadre**                 |                         ✅                          |     ⚠️ (score prédictif, pas de photo)     | Écart              | Roadmap IA (Pro)                                           |
| **IA — saisie vocale** des observations                      |                         ✅                          |                     ❌                     | Écart              | Roadmap IA (Pro)                                           |
| **IA — fenêtres d'intervention prédictives** (histo + météo) |                         ✅                          |           ⚠️ (corrélation météo)           | Partiel            | Compléter (Pro)                                            |
| **Objets connectés / balances** (IoT)                        |                         ✅                          |                     ❌                     | Écart              | À évaluer (Expert) — dépend du hardware                    |
| Récolte **multi-produits** (miel, pollen, propolis)          |                         ✅                          |              ⚠️ (miel-centré)              | Écart              | Étendre stocks/production (Starter+)                       |
| Statistiques & graphiques multi-saisons                      |                    ✅ (Premium)                     |                ✅ (ECharts)                | —                  | RAS                                                        |
| Exports PDF / Excel                                          |                    ✅ (Premium)                     |           ✅ (PDF/CSV/XLSX/FEC)            | APIGO + complet    | Valoriser                                                  |
| Multi-utilisateurs + rôles                                   |                         ✅                          |           ✅ (Pro 3 / Expert ∞)            | —                  | Formaliser les rôles                                       |
| Espace **Organisation / syndicats / GDSA**                   | ✅ (adhérents, commandes groupées, crédits Premium) | ✅ (gestion syndicat + campagnes groupées) | Comparable         | Vérifier la parité fine                                    |
| Contenu / SEO (guides, blog, centre d'aide massif)           |                  ✅ **très fort**                   |               ⚠️ (articles)                | Écart marketing    | Renforcer le contenu/SEO                                   |
| Application mobile native                                    |                         ✅                          |        ⚠️ (Capacitor prévu phase 3)        | Écart              | Suivre la roadmap mobile                                   |
| **Facturation / Factur-X (EN 16931)**                        |                         ❌                          |                ✅ **fort**                 | **Avantage APIGO** | Mettre en avant ++                                         |
| **TVA auto, compta achats, FEC, bilan**                      |                         ❌                          |                     ✅                     | **Avantage APIGO** | Mettre en avant ++                                         |
| **Clients + bons de livraison**                              |                         ❌                          |                     ✅                     | **Avantage APIGO** | Mettre en avant                                            |
| **Conformité NAPI / registre d'élevage PDF officiel**        |                         ⚠️                          |                     ✅                     | Avantage APIGO     | Mettre en avant                                            |
| **Ordonnances vétérinaires**                                 |                         ⚠️                          |                     ✅                     | Avantage APIGO     | Mettre en avant                                            |
| **Transhumance & emplacements**                              |                         ⚠️                          |                     ✅                     | Avantage APIGO     | Mettre en avant                                            |
| **Prévisionnel de trésorerie / analytics rentabilité**       |                         ❌                          |                     ✅                     | **Avantage APIGO** | Mettre en avant ++                                         |

---

## 4. Ce que Beekube fait de bien que l'on n'a PAS (priorités pour les concurrencer)

1. **🧬 Sélection génétique / BLUP** — leur signature côté éleveurs/sélectionneurs. _Gros différenciateur._ → Expert.
2. **🤖 IA réellement intégrée** — conseils contextuels, **diagnostic santé par photo**, **saisie vocale**, fenêtres d'intervention prédictives. → Pack Pro = **Maya** (spec minimum : voir `MAYA.md`).
3. **⚙️ Moteur d'automatisation** — règles personnalisées qui créent des tâches automatiquement. → Pro/Expert.
4. **📡 Objets connectés / balances** — intégration IoT (poids, données ruche). → à évaluer (dépend du matériel).
5. **🍯 Récolte multi-produits** (pollen, propolis, cire…) — pas seulement le miel. → Starter+.
6. **📚 Machine de contenu / SEO** — immense centre d'aide + guides + blog = acquisition organique massive. → marketing.
7. **💸 Modèle « gratuit illimité »** — pas de limite de ruches en gratuit, ce qui lève la barrière d'entrée. → réflexion pricing (cf. §5).

## 5. Forces d'APIGO à conserver/valoriser (là où on gagne)

- **Facturation pro complète + Factur-X 2026** (norme EN 16931) — Beekube n'a pas ça. Argument « remplace votre logiciel de facturation ».
- **Comptabilité** : TVA auto, compta achats, **export FEC**, bilan annuel, prévisionnel de trésorerie, analytics rentabilité.
- **Conformité réglementaire FR** : NAPI, registre d'élevage PDF officiel, ordonnances vétérinaires.
- **Gestion commerciale** : clients, bons de livraison, traçabilité des lots (CE 178/2002).
- **Du rucher à la compta dans un seul outil** = positionnement « tout-en-un pro » vs Beekube « suivi + génétique ».

---

## 6. Décisions validées (par Antoine)

1. **Gestion multi-sites = (a) + (c)** :
   - **(a) Multi-établissements / multi-SIRET** : plusieurs entités juridiques sous un même compte, avec facturation/compta **séparées par établissement**.
   - **(c) Regroupement géographique des ruchers en « sites »** : un niveau hiérarchique **au-dessus du rucher** (zone/région) pour piloter une grande exploitation multi-régions.
   - _(écartée pour l'instant : (b) multi-mielleries / sites de production)_
2. **Promo facturation — pas de « mois offerts »** :
   - **Mensuel → période d'essai** offerte au client qui s'abonne au mois.
   - **Annuel → -20 %** direct (remise annuelle existante, **inchangée**).
3. **IA = Maya** (déjà en dev) — on **ne démarre pas** d'autre assistant. Le périmètre minimum pour égaler Beekube est cadré dans **`MAYA.md`**. Ordre MVP : conseil texte → prédictif → vocal → photo.

### Encore ouvert

- **Modèle gratuit** : garde-t-on les limites actuelles (1 ruche en Découverte) ou s'aligne-t-on partiellement sur le « gratuit plus généreux » de Beekube pour l'acquisition ?

---

## Sources (Beekube)

- [Beekube — application de gestion de rucher](https://www.beekube.com/en/)
- [Fonctionnalités de l'application Beekube](https://www.beekube.com/fonctionnalites-apicole.html)
- [Application apiculture — centre d'aide](https://www.beekube.com/apiculture/guide-apiculture/application-apiculture/)
- [Beekube prices — Free & Premium](https://www.beekube.com/en/beekeeping-pricing.html)
- [Top 10 fonctionnalités d'une application apiculture](https://www.beekube.com/apiculture/article/top-10-fonctionnalites-indispensables-application-apiculture/)
- [Outils numériques pour apiculteurs connectés](https://www.beekube.com/apiculture/guide-apiculture/outils-logiciels-apiculteurs/outils-numeriques-apiculteur-connecte/)
- [Nouveautés Beekube — juin 2024](https://www.beekube.com/apiculture/blog/nouveautes-apiculture-beekube-juin-2024/)
- [Les objets connectés sur Beekube](https://www.beekube.com/apiculture/docs/objets-connectes/donnee-objets-connectes/)
- [Créer un site d'apiculteur (guide)](https://www.beekube.com/apiculture/article/creer-un-site-apiculteur/)
