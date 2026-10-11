# DevisFlash — SaaS de devis/factures pour artisans du bâtiment (39 €/mois)

## Contenu
- `index.html` — landing page (français) : hero, fonctionnalités, prix 39 €/mois, FAQ, CTA essai gratuit → `app.html`
- `app.html` — l'application : auth, tableau de bord, éditeur de devis, paramètres entreprise, aperçu PDF (impression)
- `netlify/functions/` — 9 functions serverless monofichiers, **zéro dépendance npm** :
  - `auth-signup`, `auth-login`, `auth-me`, `auth-logout` (scrypt natif, sessions 30 j, rate limiting)
  - `devis-save` (création/mise à jour, numérotation auto DEV-AAAA-0001, totaux calculés serveur)
  - `devis-list`, `devis-get`, `devis-delete`
  - `settings` (GET/POST — infos entreprise : SIRET, décennale…)
- `netlify.toml`, `_headers`
- `src/` + `build.py` — sources ; régénérer les functions après modif : `python3 build.py`

## Stockage
Netlify Blobs, store `site:devisflash`. Clés : `users/{id}`, `users-by-email/{sha256}`, `sessions/{token}`, `devis/{userId}/{devisId}`, `counters/{userId}/DEV`, `settings/{userId}`.

## Données devis
Client (nom/adresse/CP/ville/tél/email), lignes (description, quantité, unité, prix HT), TVA (20/10/5,5/0), acompte %, notes, statut (brouillon/envoyé/accepté/refusé/facturé). Totaux HT/TVA/TTC/acompte calculés **côté serveur**. Mentions légales FR sur le PDF (décennale si renseignée, validité 3 mois, pénalités L441-10).

## PDF
Généré via CSS d'impression (`window.print()` → « Enregistrer en PDF » sur mobile). Zéro dépendance.

## Déploiement (NOUVEAU REPO — ne pas utiliser le repo qr-avis-google)
1. Sur GitHub (compte `contactgourayaprestations-crypto`) : créer un repo vide, ex. `devisflash`.
2. `cd ~/workspace/revenue-agent/devisflash && git init && git add -A && git commit -m "DevisFlash MVP" && git push` vers le nouveau repo (token `repo` requis).
3. Sur Netlify : **créer un NOUVEAU site** connecté à ce repo (ne pas réutiliser le site qr-avis-google). Le build Git publiera automatiquement les functions.
4. Vérifier : page d'accueil 200, inscription → création devis → aperçu PDF.

## Limites MVP (assumées)
- Pas de paiement (Stripe = gate jil, au premier client)
- Pas d'envoi email du devis (le PDF se télécharge/partage depuis le téléphone)
- Pas de facturation auto depuis devis accepté (statut manuel « facturé »)
- Compteur de numéros sans verrouillage (acceptable à ce volume)
