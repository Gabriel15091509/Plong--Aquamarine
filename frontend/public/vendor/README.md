# vendor/

- `opencv.js` — build OpenCV.js `@techstark/opencv-js@5.0.0-release.1` (dist/opencv.js),
  copié tel quel depuis `node_modules/@techstark/opencv-js/dist/opencv.js`.
  Chargé à la volée (balise `<script>` injectée dynamiquement, jamais dans le
  bundle principal) uniquement quand l'utilisateur ouvre la capture photo par
  webcam, pour le recadrage automatique du document — voir
  `src/utils/documentScanner.js`. Non importé via `import`/npm côté code : le
  module UMD de ce build expose `window.cv` comme un objet "thenable" (pas un
  export ES classique), plus simple à charger comme script statique que via
  le bundler. Pour mettre à jour : `npm install @techstark/opencv-js@<version>`
  dans un dossier temporaire, recopier son `dist/opencv.js` ici.
