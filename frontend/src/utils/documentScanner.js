// Recadrage automatique d'une photo de document (certificat) prise à la
// webcam : détecte le plus grand quadrilatère net dans l'image (le bord du
// papier, par opposition à l'arrière-plan/la personne qui prend la photo) et
// le redresse par transformation de perspective. Repose sur OpenCV.js,
// chargé à la volée en tant que script statique (voir public/vendor/README.md)
// plutôt qu'importé dans le bundle : ~13 Mo de WASM, inutile tant que
// l'utilisateur n'a pas ouvert la capture photo.
const OPENCV_SCRIPT_URL = "/vendor/opencv.js";

let cvPromise = null;

function loadOpenCv() {
  if (cvPromise) return cvPromise;
  cvPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${OPENCV_SCRIPT_URL}"]`);
    const onReady = () => {
      Promise.resolve(window.cv)
        .then(resolve)
        .catch(() => reject(new Error("Échec de chargement du module de recadrage")));
    };
    if (existing) {
      onReady();
      return;
    }
    const script = document.createElement("script");
    script.src = OPENCV_SCRIPT_URL;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Échec de chargement du module de recadrage"));
    document.body.appendChild(script);
  });
  return cvPromise;
}

// Ordonne 4 points en [haut-gauche, haut-droit, bas-droit, bas-gauche] :
// requis par getPerspectiveTransform, qui associe les points source/
// destination par position dans le tableau, pas par proximité géométrique.
function orderQuadPoints(points) {
  const sorted = [...points];
  const sums = sorted.map((p) => p.x + p.y);
  const diffs = sorted.map((p) => p.x - p.y);
  const topLeft = sorted[sums.indexOf(Math.min(...sums))];
  const bottomRight = sorted[sums.indexOf(Math.max(...sums))];
  const topRight = sorted[diffs.indexOf(Math.max(...diffs))];
  const bottomLeft = sorted[diffs.indexOf(Math.min(...diffs))];
  return [topLeft, topRight, bottomRight, bottomLeft];
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Cherche, parmi les contours détectés, le plus grand quadrilatère convexe
// couvrant une part significative de l'image (sinon on risque de recadrer
// sur un détail sans rapport — un coin de table, une ombre — plutôt que sur
// le document). Retourne null si rien d'assez net n'est trouvé : le photo
// brute (non recadrée) sert alors de repli, jamais bloquant.
function findDocumentQuad(cv, src) {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const dilated = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);

  let bestQuad = null;
  let bestArea = 0;
  const imageArea = src.rows * src.cols;
  const minArea = imageArea * 0.15;
  // Sur une image sans document net (bruit, fond uniforme), le contour du
  // cadre de la photo lui-même peut être détecté comme un "quadrilatère" —
  // un faux positif qui couvre quasi toute l'image. Un vrai document
  // photographié laisse presque toujours une marge de fond visible.
  const maxArea = imageArea * 0.92;

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 60, 180);
    cv.dilate(edges, dilated, kernel);
    cv.findContours(dilated, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > bestArea && area > minArea && area < maxArea) {
        const perimeter = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
        if (approx.rows === 4 && cv.isContourConvex(approx)) {
          const points = [];
          for (let j = 0; j < 4; j++) {
            points.push({ x: approx.data32S[j * 2], y: approx.data32S[j * 2 + 1] });
          }
          bestQuad = points;
          bestArea = area;
        }
        approx.delete();
      }
      contour.delete();
    }
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    dilated.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();
  }

  return bestQuad;
}

// Recadre une photo (canvas) sur le document qu'elle contient. Ne lève
// jamais d'exception vue de l'extérieur : en cas d'échec de détection ou de
// chargement d'OpenCV, retourne la photo d'origine avec `detected: false`,
// pour que l'appelant puisse toujours proposer la photo brute en repli.
export async function autoCropDocument(sourceCanvas) {
  let cv;
  try {
    cv = await loadOpenCv();
  } catch {
    return { canvas: sourceCanvas, detected: false };
  }

  const src = cv.imread(sourceCanvas);
  let dst;
  try {
    const quad = findDocumentQuad(cv, src);
    if (!quad) {
      return { canvas: sourceCanvas, detected: false };
    }

    const [topLeft, topRight, bottomRight, bottomLeft] = orderQuadPoints(quad);
    const outputWidth = Math.round(Math.max(distance(topLeft, topRight), distance(bottomLeft, bottomRight)));
    const outputHeight = Math.round(Math.max(distance(topLeft, bottomLeft), distance(topRight, bottomRight)));
    if (outputWidth < 50 || outputHeight < 50) {
      return { canvas: sourceCanvas, detected: false };
    }

    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      topLeft.x, topLeft.y,
      topRight.x, topRight.y,
      bottomRight.x, bottomRight.y,
      bottomLeft.x, bottomLeft.y,
    ]);
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      outputWidth, 0,
      outputWidth, outputHeight,
      0, outputHeight,
    ]);
    const transform = cv.getPerspectiveTransform(srcTri, dstTri);
    dst = new cv.Mat();
    cv.warpPerspective(src, dst, transform, new cv.Size(outputWidth, outputHeight));

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;
    cv.imshow(outputCanvas, dst);

    srcTri.delete();
    dstTri.delete();
    transform.delete();

    return { canvas: outputCanvas, detected: true };
  } catch {
    return { canvas: sourceCanvas, detected: false };
  } finally {
    src.delete();
    if (dst) dst.delete();
  }
}
