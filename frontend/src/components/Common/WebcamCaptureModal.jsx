import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  FiCamera,
  FiX,
  FiCheck,
  FiRefreshCw,
  FiAlertTriangle,
  FiRepeat,
  FiScissors,
} from "react-icons/fi";
import ModalOverlay from "./ModalOverlay";
import { autoCropDocument } from "../../utils/documentScanner";

const STEP_LABELS = { recto: "recto", verso: "verso" };

// Capture directe depuis la caméra de l'ordinateur (webcam), avec recadrage
// automatique sur le document (retire l'arrière-plan/la personne qui prend
// la photo) et prise en charge du recto verso : flux vidéo live -> photo
// figée -> détection du quadrilatère du document -> redressement de
// perspective. Si le recto ET le verso sont capturés, les deux sont combinés
// en un PDF à 2 pages. Générique : utilisé pour le certificat médical, la
// licence FFESM, l'assurance RC... partout où un formulaire accepte déjà un
// import de fichier classique (même champ `documentFile`, juste une autre
// façon de le remplir).
const WebcamCaptureModal = ({ title = "Photo du document", onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  // React.StrictMode (dev) monte/démonte/remonte l'effet d'ouverture de
  // caméra : sans ce garde, deux `getUserMedia` se chevauchent et le premier
  // flux résolu après le second devient orphelin (jamais arrêté) ou écrase
  // le bon flux. On ignore le résultat de toute requête qui n'est plus la
  // plus récente au moment où elle se résout.
  const streamRequestIdRef = useRef(0);

  const [step, setStep] = useState("recto"); // 'recto' | 'verso'
  const [phase, setPhase] = useState("live"); // 'live' | 'review'
  const [error, setError] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [captures, setCaptures] = useState({ recto: null, verso: null });

  const stopStream = () => {
    // Invalide aussi toute requête `getUserMedia` encore en vol : sans ça,
    // un flux qui résout après cet arrêt (fermeture rapide de la modale,
    // cleanup StrictMode) redémarrerait quand même la caméra sans jamais
    // être arrêté ensuite (composant déjà démonté).
    streamRequestIdRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startStream = async () => {
    setError(null);
    const requestId = ++streamRequestIdRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (requestId !== streamRequestIdRef.current) {
        // Une requête plus récente a été lancée entre-temps (StrictMode,
        // ou l'utilisateur a fermé/relancé vite) : ce flux est obsolète.
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      if (requestId !== streamRequestIdRef.current) return;
      setError(
        err.name === "NotAllowedError"
          ? "Accès à la caméra refusé. Autorisez l'accès dans les paramètres du navigateur."
          : "Impossible d'accéder à une caméra sur cet appareil.",
      );
    }
  };

  useEffect(() => {
    startStream();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d", { willReadFrequently: true }).drawImage(video, 0, 0, canvas.width, canvas.height);
    stopStream();

    setCropping(true);
    const { canvas: croppedCanvas, detected } = await autoCropDocument(canvas);
    const url = croppedCanvas.toDataURL("image/jpeg", 0.92);
    setCaptures((prev) => ({ ...prev, [step]: { canvas: croppedCanvas, url, detected } }));
    setCropping(false);
    setPhase("review");
  };

  const handleRetake = () => {
    setCaptures((prev) => ({ ...prev, [step]: null }));
    setPhase("live");
    startStream();
  };

  const handleAddVerso = () => {
    setStep("verso");
    setPhase("live");
    startStream();
  };

  const buildOutputFile = () => {
    const { recto, verso } = captures;
    if (recto && !verso) {
      return new Promise((resolve) => {
        recto.canvas.toBlob(
          (blob) => resolve(new File([blob], `document-webcam-${Date.now()}.jpg`, { type: "image/jpeg" })),
          "image/jpeg",
          0.92,
        );
      });
    }
    // Recto + verso : un PDF à 2 pages, pour rester compatible avec le champ
    // `document`/`document_path` déjà existant partout où ce composant est
    // utilisé (pas de 2ᵉ champ fichier à ajouter pour un cas d'usage
    // additionnel, optionnel).
    // L'orientation doit être précisée explicitement (déduite du ratio
    // largeur/hauteur de chaque photo) : jsPDF force sinon un format portrait
    // par défaut et réordonne largeur/hauteur en conséquence, ce qui déforme
    // toute photo prise en mode paysage (page trop haute, image tronquée).
    const rectoOrientation = recto.canvas.width >= recto.canvas.height ? "l" : "p";
    const doc = new jsPDF({
      unit: "px",
      format: [recto.canvas.width, recto.canvas.height],
      orientation: rectoOrientation,
    });
    doc.addImage(recto.url, "JPEG", 0, 0, recto.canvas.width, recto.canvas.height);
    const versoOrientation = verso.canvas.width >= verso.canvas.height ? "l" : "p";
    doc.addPage([verso.canvas.width, verso.canvas.height], versoOrientation);
    doc.addImage(verso.url, "JPEG", 0, 0, verso.canvas.width, verso.canvas.height);
    const blob = doc.output("blob");
    return Promise.resolve(new File([blob], `document-webcam-${Date.now()}.pdf`, { type: "application/pdf" }));
  };

  const handleFinish = async () => {
    setFinalizing(true);
    try {
      const file = await buildOutputFile();
      onCapture(file);
      onClose();
    } finally {
      setFinalizing(false);
    }
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const current = captures[step];

  return (
    <ModalOverlay className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCamera className="w-4 h-4 text-blue-500" />
            {title} — {STEP_LABELS[step]}
            {captures.recto && step === "verso" && (
              <span className="text-xs font-normal text-gray-400">(recto déjà pris)</span>
            )}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <FiAlertTriangle className="w-8 h-8 text-amber-500" />
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
              <button
                type="button"
                onClick={startStream}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <FiRefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center relative">
              {phase === "review" && current ? (
                <img src={current.url} alt={`Document ${STEP_LABELS[step]} capturé`} className="w-full h-full object-contain" />
              ) : (
                <video ref={videoRef} muted playsInline className="w-full h-full object-contain" />
              )}
              {cropping && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white text-sm">
                  <FiScissors className="w-5 h-5 animate-pulse" />
                  Recadrage automatique du document...
                </div>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {phase === "review" && current && !current.detected && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <FiAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Document non détecté automatiquement — photo brute utilisée. Reprenez sur fond contrasté si besoin.
            </p>
          )}
        </div>

        {!error && (
          <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-end gap-3">
            {phase === "live" && (
              <button
                type="button"
                onClick={handleCapture}
                disabled={cropping}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
              >
                <FiCamera className="w-4 h-4" />
                Capturer
              </button>
            )}
            {phase === "review" && (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Reprendre
                </button>
                {step === "recto" && (
                  <button
                    type="button"
                    onClick={handleAddVerso}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <FiRepeat className="w-4 h-4" />
                    Ajouter le verso
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={finalizing}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
                >
                  {finalizing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                  {step === "recto" ? "Terminer (recto seul)" : "Terminer"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

export default WebcamCaptureModal;
