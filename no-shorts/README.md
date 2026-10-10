# No Shorts – extension Firefox

Masque les Shorts partout sur YouTube (accueil, abonnements, recherche, chaînes,
suggestions, notifications, barre latérale) et bloque toute URL `/shorts/…` en
affichant une page « Short bloqué » à la place.

## Installation temporaire (pour tester)

1. Ouvrir `about:debugging#/runtime/this-firefox` dans Firefox.
2. Cliquer sur **Charger un module complémentaire temporaire…**.
3. Sélectionner le fichier `manifest.json` de ce dossier.

L'extension disparaît à la fermeture de Firefox.

## Installation permanente

Firefox exige une signature pour installer un `.xpi` de façon permanente :

- **Firefox Developer Edition / Nightly / ESR** : mettre `xpinstall.signatures.required`
  à `false` dans `about:config`, puis ouvrir le fichier `no-shorts.xpi`
  (généré par `./build.sh`).
- **Firefox stable** : soumettre le `.xpi` sur https://addons.mozilla.org/developers/
  en mode « distribution non répertoriée » pour obtenir une version signée.

## Fonctionnement

- `hide-shorts.css` : masquage pur CSS des éléments Shorts (utilise `:has()`, Firefox ≥ 121 ; version minimale déclarée 142).
- `content.js` : blocage des URLs Shorts (y compris navigation interne SPA),
  interception des clics sur des liens Shorts, et balayage DOM complémentaire via
  `MutationObserver` pour les cas que le CSS ne couvre pas.
- `rules.json` : règle `declarativeNetRequest` qui bloque `/shorts/…` avant même
  le chargement de la page.
- `blocked.html` : page affichée à la place d'un Short.

## Limite connue

Un Short ouvert via une URL `/watch?v=ID` (et non `/shorts/ID`) est servi par
YouTube comme une vidéo classique : rien dans l'URL ne permet de savoir qu'il
s'agit d'un Short, l'extension ne le bloque donc pas. Les vignettes menant à ces
vidéos sont en revanche masquées puisque YouTube les lie en `/shorts/`.
