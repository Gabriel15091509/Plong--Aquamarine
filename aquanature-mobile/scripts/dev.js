#!/usr/bin/env node
// Lance `expo start` en detectant nous-memes l'IP reseau du PC, que le mode
// choisi soit --lan (par defaut) ou --tunnel (passe en argument).
//
// Pourquoi la detection manuelle : Expo detecte l'IP LAN via le paquet
// "lan-network", qui spawn un sous-processus avec un timeout code en dur de
// 500ms. Sur cette machine ce sous-processus met ~700-800ms, il time out
// donc systematiquement et Expo retombe silencieusement sur 127.0.0.1 (aucune
// erreur affichee). On contourne ça avec REACT_NATIVE_PACKAGER_HOSTNAME, une
// variable que @expo/cli verifie en priorite avant sa propre detection
// (node_modules/@expo/cli/build/src/start/server/UrlCreator.js,
// fonction getDefaultHostname).
//
// Pourquoi tunneliser aussi le backend en mode --tunnel : sur ce reseau
// (hotspot "Huawei"), l'isolation des clients (AP isolation) est active cote
// routeur -- confirme par un ping de la machine vers sa propre IP LAN qui
// time out (aucun rapport avec le pare-feu Windows, teste desactive sans
// effet). Le telephone ne peut donc jamais atteindre le PC en LAN direct sur
// ce reseau. On ouvre alors un tunnel ngrok pour le port 5000 du backend via
// le SDK officiel @ngrok/ngrok (le paquet @expo/ngrok embarque un binaire
// ngrok v2 que ngrok.com rejette desormais pour les comptes gratuits --
// ERR_NGROK_121, "agent version too old"), et on transmet son URL publique
// via EXPO_PUBLIC_API_URL. Necessite NGROK_AUTHTOKEN dans .env (voir
// .env.example).
const path = require("path");
const dgram = require("dgram");
const { spawn } = require("child_process");

// Charge .env / .env.local (non commites, cf. .env.example) exactement
// comme le fait Expo lui-meme, pour recuperer NGROK_AUTHTOKEN.
require("@expo/env").load(path.join(__dirname, ".."));

const BACKEND_PORT = 5000;

// Meme technique que la detection interne d'Expo (probeDefaultRoute) : un
// socket UDP "connecte" a une IP publique n'envoie aucun paquet, il demande
// juste au systeme quelle interface/IP serait utilisee pour cette route --
// c'est instantane (pas d'E/S reseau reelle) et fiable meme avec plusieurs
// cartes reseau (VPN, partage de connexion, Hyper-V...).
function detectLanIp() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    socket.once("error", () => {
      socket.close();
      resolve(null);
    });
    socket.connect(53, "1.1.1.1", () => {
      const { address } = socket.address();
      socket.close();
      resolve(address && address !== "0.0.0.0" ? address : null);
    });
  });
}

async function resolveApiUrl(isTunnel, lanIp) {
  const fallbackUrl = lanIp
    ? `http://${lanIp}:5000/api`
    : "http://localhost:5000/api";

  if (process.env.EXPO_PUBLIC_API_URL) {
    return { apiUrl: process.env.EXPO_PUBLIC_API_URL, ngrokListener: null };
  }

  if (!isTunnel) {
    return { apiUrl: fallbackUrl, ngrokListener: null };
  }

  if (!process.env.NGROK_AUTHTOKEN) {
    console.warn(
      "> NGROK_AUTHTOKEN manquant (voir .env.example) : impossible de tunneliser le backend, retour a l'IP locale.",
    );
    return { apiUrl: fallbackUrl, ngrokListener: null };
  }

  console.log("> Ouverture d'un tunnel ngrok pour le backend (port 5000)...");
  const ngrok = require("@ngrok/ngrok");
  try {
    const listener = await ngrok.forward({
      addr: BACKEND_PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
    });
    const publicUrl = listener.url();
    console.log(`> Backend tunnel : ${publicUrl}`);
    return { apiUrl: `${publicUrl}/api`, ngrokListener: listener };
  } catch (err) {
    console.warn(
      "> Impossible d'ouvrir le tunnel ngrok pour le backend, retour a l'IP locale :",
      err.message,
    );
    return { apiUrl: fallbackUrl, ngrokListener: null };
  }
}

async function main() {
  const lanIp = await detectLanIp();
  const extraArgs = process.argv.slice(2);
  const isTunnel = extraArgs.includes("--tunnel");
  const hasExplicitHostMode = extraArgs.some((arg) =>
    ["--tunnel", "--lan", "--localhost", "--host"].includes(arg),
  );

  if (lanIp) {
    console.log(`> IP reseau detectee : ${lanIp}`);
  } else {
    console.warn(
      "> Impossible de detecter l'IP reseau : l'app mobile retombera sur localhost pour l'API, ce qui ne marchera pas sur un vrai telephone.",
    );
  }

  const { apiUrl, ngrokListener } = await resolveApiUrl(isTunnel, lanIp);
  console.log(`> EXPO_PUBLIC_API_URL = ${apiUrl}`);

  // On invoque directement le script Node du CLI Expo (au lieu de
  // "npx expo") : spawner un .cmd (npx.cmd) sans shell:true plante avec
  // "spawn EINVAL" sur Windows, et shell:true complique la propagation
  // propre des arguments/variables d'environnement.
  const expoCliEntry = require.resolve("@expo/cli/build/bin/cli");
  const child = spawn(
    process.execPath,
    [
      expoCliEntry,
      "start",
      ...(hasExplicitHostMode ? [] : ["--lan"]),
      ...extraArgs,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        ...(lanIp ? { REACT_NATIVE_PACKAGER_HOSTNAME: lanIp } : {}),
        EXPO_PUBLIC_API_URL: apiUrl,
      },
    },
  );

  const cleanupAndExit = async (code) => {
    if (ngrokListener) {
      try {
        await ngrokListener.close();
      } catch {}
    }
    process.exit(code ?? 0);
  };

  child.on("exit", (code) => cleanupAndExit(code));
  child.on("error", (err) => {
    console.error(err);
    cleanupAndExit(1);
  });
  process.on("SIGINT", () => cleanupAndExit(0));
}

main();
