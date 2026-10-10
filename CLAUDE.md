# controle

Outils de contrôle de l'attention. Pour l'instant un seul projet : `no-shorts/`,
une extension Firefox qui bloque les YouTube Shorts.

## no-shorts : extension Firefox (Manifest V3)

### Fichiers
- `manifest.json` : MV3, id `no-shorts@pierre.local`, version minimale Firefox 142
  (desktop et Android) à cause de la clé `data_collection_permissions` exigée par Mozilla.
- `hide-shorts.css` : masquage pur CSS des éléments Shorts (desktop `ytd-*` et mobile `ytm-*`),
  s'appuie sur `:has()`.
- `content.js` : bloque les URLs `/shorts/…` (chargement initial, navigation SPA via
  `yt-navigate-start/finish` et `popstate`, clics sur liens Shorts) en redirigeant vers
  `blocked.html`, puis balayage DOM par `MutationObserver` pour ce que le CSS rate.
- `rules.json` : règle `declarativeNetRequest` qui redirige `/shorts/…` vers
  `blocked.html` avant même le chargement.
- `blocked.html` : page « Short bloqué », déclarée en `web_accessible_resources`.
- `icon.svg` : vrai tracé de l'icône Shorts de YouTube + panneau interdit rouge sur fond
  anthracite. `icon-128.png` / `icon-512.png` : rendus pour la fiche du store (AMO ne
  prend pas le SVG du manifest pour la page produit).
- `amo-metadata.json` : résumé, description (fr / en-US), catégorie, licence MIT pour la fiche.
- `build.sh` : produit `no-shorts.xpi` non signé (liste explicite de fichiers).
- `env` : identifiants API AMO au format `JWT issuer: …` / `JWT secret: …`.
  **Secret en clair, ne jamais versionner ni empaqueter.** Le secret peut contenir des
  espaces parasites de copier-coller : les retirer avec `tr -d '[:space:]'`.

### Décisions
- Blocage strict : un `/shorts/ID` affiche `blocked.html`, pas de redirection vers
  `/watch?v=ID` (c'était le comportement initial, abandonné car il permettait de voir le Short).
- Limite connue et acceptée : un Short ouvert via `/watch?v=ID` passe, rien dans l'URL ne
  permet de le détecter. Les vignettes YouTube pointent toujours vers `/shorts/`, donc masquées.
- L'extension ne peut rien pour l'application YouTube Android. Pour ça : NoScroll
  (service d'accessibilité), ReVanced, NewPipe.

### Commandes
```sh
cd no-shorts
./build.sh                                   # xpi non signé
npx --yes web-ext lint --source-dir . \
  --ignore-files no-shorts.xpi 'no-shorts-*-signed.xpi' build.sh README.md env amo-metadata.json web-ext-artifacts
```
Test rapide : `about:debugging#/runtime/this-firefox` → charger `manifest.json`.
Après modification d'icône ou de manifest, « Recharger » l'extension, sinon cache.

### Publication sur AMO (addons.mozilla.org)
- Un numéro de version ne peut être soumis qu'une seule fois, quel que soit le canal.
  Toujours bumper `manifest.json` avant une nouvelle soumission.
- Canal `unlisted` : signature automatique en quelques minutes, xpi récupéré dans
  `web-ext-artifacts/`. Installable sur Firefox desktop stable et Firefox Android Nightly
  (« Installer une extension depuis un fichier »), pas sur Firefox Android stable.
- Canal `listed` : seule voie pour Firefox Android stable. Revue humaine (heures à jours).
  `web-ext sign` reste bloqué sur « Waiting for approval... » puis time out : normal, Ctrl+C.
  La soumission publique est une action à faire lancer par l'utilisateur (garde-fou de session).
- `web-ext sign` affiche la clé et le secret en clair dans la ligne `npm notice run`.

### État au 10 octobre 2026
- 1.1.0 : signée en canal non répertorié → `no-shorts/no-shorts-1.1.0-signed.xpi`.
- 1.2.0 : soumise en canal répertorié, en attente de revue Mozilla. Icône PNG à uploader
  sur la fiche (« Modifier la page du produit »).
- Pas encore testé sur `m.youtube.com` : les sélecteurs mobiles de `hide-shorts.css`
  sont à vérifier avec une capture.
