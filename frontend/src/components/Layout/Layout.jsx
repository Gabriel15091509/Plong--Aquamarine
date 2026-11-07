import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ChatAssistant from "../Assistant/ChatAssistant";
import ErrorBoundary from "../Common/ErrorBoundary";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Les routes /x/create et /x/edit/:id rendent maintenant la même page que
  // /x (liste), avec un formulaire en modale par-dessus (voir useFormModal) —
  // sans ce recalage, la clé de transition ci-dessous (basée sur le pathname
  // brut) changerait quand même à chaque ouverture/fermeture de modale,
  // démontant et ranimant toute la page (Sidebar comprise) sous la modale.
  // Une page qui n'a pas ce suffixe (ex. /adherents/42 fiche détail,
  // /adherents/communication) garde sa propre clé, inchangée.
  //
  // /adherents, /moniteurs, /presidents, /tresoriers rendent tous les 4 le
  // même composant <MembresPage/> (voir App.jsx/pages/Membres/MembresPage.jsx)
  // pour ne jamais être démontés en changeant d'onglet (TabBar, voir
  // constants/roleTabs.js) — mais SANS ce regroupement supplémentaire, ce
  // motion.div (juste en dessous) changeait quand même de clé entre eux,
  // ce qui le fait sortir/rentrer (AnimatePresence) et remonte tout ce
  // qu'il contient, y compris MembresPage : le flash restait visible même
  // si React, lui, préservait bien le composant. Uniquement ces 4 chemins
  // exacts (post-recalage ci-dessus) partagent désormais une clé commune ;
  // /adherents/42, /adherents/communication etc. gardent la leur. Même
  // regroupement pour /materiels, /attributions, /reparations
  // (<MaterielGroupPage/>, voir pages/Materiel/MaterielGroupPage.jsx) et
  // pour /formations, /specialites-formation, /brevets
  // (<FormationGroupPage/>, voir pages/Formation/FormationGroupPage.jsx) et
  // pour /adhesions, /certificats (<DossierGroupPage/>, voir
  // pages/Dossier/DossierGroupPage.jsx) — 3 groupes distincts, donc 3 clés
  // distinctes ("/materiel-groupe", "/formation-groupe", "/dossier-groupe"),
  // jamais "/membres" : les groupes ne doivent pas se confondre les uns les
  // autres s'ils apparaissaient un jour côte à côte dans l'historique.
  //
  // Toutes les fiches Détails (/moniteurs/:id, /adherents/:id, /sorties/:id,
  // etc.) rendent désormais la même page que leur liste, la fiche
  // s'affichant en modale par-dessus (voir DetailsModal.jsx et
  // useDetailsModal) — sans ce recalage supplémentaire, ouvrir une fiche
  // depuis la liste changerait quand même de clé (pathname différent) et
  // remonterait toute la liste sous la modale, alors qu'elle doit rester en
  // place. `[^/]+` (un seul segment, jamais purement numérique : l'id d'un
  // matériel est son num_inventaire, ex. "INV-1234") plutôt qu'un `.+`
  // générique, avec une exclusion explicite des quelques sous-chemins
  // textuels de la même entité qui doivent garder leur propre clé
  // (/adherents/communication, /sorties/carte) — /sorties/:id_sortie/pointage
  // a de toute façon un segment de plus, donc déjà exclu par l'ancrage `$`
  // sans qu'il soit besoin de l'exclure nommément. Placé AVANT le recalage
  // groupe ci-dessous pour que le résultat (ex. "/moniteurs") y soit à son
  // tour normalisé en "/membres"/"/materiel-groupe"/"/formation-groupe"/
  // "/dossier-groupe" comme le reste de son groupe ; les entités hors
  // groupe (ex. "/paiements") gardent simplement leur propre clé stable
  // après ce recalage.
  const layoutKey = location.pathname
    .replace(/\/edit\/[^/]+$/, "")
    .replace(/\/create$/, "")
    .replace(
      /^\/(adherents|moniteurs|presidents|tresoriers|materiels|attributions|reparations|formations|adhesions|certificats|paiements|sorties|inscriptions|plongees|incidents)\/(?!communication$|carte$)[^/]+$/,
      "/$1",
    )
    .replace(/^\/(adherents|moniteurs|presidents|tresoriers)$/, "/membres")
    .replace(/^\/(materiels|attributions|reparations)$/, "/materiel-groupe")
    .replace(
      /^\/(formations|specialites-formation|brevets)$/,
      "/formation-groupe",
    )
    .replace(/^\/(adhesions|certificats)$/, "/dossier-groupe");

  // Aucune remise à zéro du scroll n'existait nulle part dans l'app :
  // react-router ne le fait pas de lui-même, contrairement à une navigation
  // classique (rechargement complet). Symptôme constaté : depuis une longue
  // liste (ex. Plongées > Mes plongées, groupée par sortie — des centaines
  // de lignes), cliquer "Voir" tout en bas de la page ouvrait bien la fiche
  // détail, mais le navigateur restait scrollé à la même position — la
  // nouvelle page, plus courte, semblait "ne rien afficher" alors qu'elle
  // s'affichait bel et bien, juste hors de l'écran visible. `behavior:
  // "instant"` (plutôt que le `scroll-behavior: smooth` global, voir
  // styles/index.css) : un saut lent et animé à chaque changement de page
  // serait plus gênant qu'utile ici.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [layoutKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ml-0 ${sidebarOpen ? "md:ml-[260px]" : "md:ml-[72px]"}`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* pt-20 (hauteur du header h-16 + le pt-4 d'origine) : le header
            est "fixed" (sorti du flux — voir Header.jsx) à TOUTES les
            tailles d'écran désormais, sans quoi le contenu remonterait
            sous lui ; répété en sm:pt-20 car un "pt-*" isolé serait sinon
            écrasé par le pt de "sm:p-6" à partir de 640px. Plus de
            variante "md:pt-6" : le header ne repasse plus jamais dans le
            flux normal au-delà de md (il n'est plus "sticky"). */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 pt-20 sm:pt-20">
          {/* mode="wait" (retiré) attendait que l'ancienne page finisse
              ENTIÈREMENT de se démonter (animation de sortie + nettoyage de
              chacun de ses composants Framer Motion) avant de monter la
              suivante — donc avant que la nouvelle page ait la moindre
              chance de lancer ses propres requêtes. Sur une page très
              chargée en éléments animés (ex: Plongées > Mes plongées après
              plusieurs "Charger plus", des dizaines de groupes de sorties
              chacun avec ses palanquées) ce démontage peut prendre plusieurs
              secondes — voir le commentaire historique sur
              SORTIES_DEPLIEES_PAR_DEFAUT dans PlongeeList.jsx (~2500 lignes
              animées mesurées à ~7s de blocage). Résultat perçu : cliquer
              "Voir" changeait bien l'URL (history.pushState est synchrone)
              mais plus rien ne se passait tant que ce nettoyage tournait —
              aucune requête réseau, page suivante invisible, et le thread
              JS occupé rendait aussi les AUTRES liens inertes entre-temps.
              Sans `mode` (défaut "sync"), l'ancienne page continue de sortir
              en arrière-plan pendant que la nouvelle se monte et démarre ses
              requêtes immédiatement — le côté "fondu croisé" de la
              transition est identique à l'œil, seul le blocage disparaît. */}
          <AnimatePresence>
            {/* flex-1 flex flex-col (plutôt qu'un `min-h-full` en
                pourcentage, qui ne se résolvait pas de façon fiable ici) :
                ce wrapper grandit pour occuper toute la hauteur restante de
                <main>, et redevient lui-même un contexte flex pour la page
                qu'il contient — une page qui a besoin de se centrer
                verticalement dans tout l'espace disponible (ex:
                ChangePasswordPage.jsx) n'a alors qu'à poser `flex-1` sur sa
                propre racine. Une page "normale" (liste/tableau, sans
                `flex-1` sur sa racine) n'est ni étirée ni recadrée : elle
                garde sa hauteur de contenu habituelle, `flex-1` ne fait
                qu'ajouter de l'espace disponible en plus quand il y en a. */}
            <motion.div
              key={layoutKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {/* Pas besoin de `key` séparée sur ErrorBoundary : elle vit
                  dans ce motion.div déjà remonté à chaque changement de page
                  (key={layoutKey} ci-dessus) — un plantage sur UNE page ne
                  reste donc jamais bloqué au-delà de cette page. */}
              <ErrorBoundary>{children}</ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
