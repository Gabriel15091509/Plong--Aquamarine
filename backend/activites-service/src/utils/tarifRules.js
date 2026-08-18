// Tarif appliqué à une inscription (CDC 3.2.1 : "Tarif de la sortie
// (adhérent vs non-adhérent)") : tarif_non_adherent pour un invité
// (Adherent.est_invite, identite-service), tarif_adherent sinon — avec repli
// sur tarif_adherent si la sortie n'a pas de tarif non-adhérent renseigné
// (montant_du ne doit jamais être `NaN`/`undefined`).
function computeMontantDu(sortie, adherentRecord) {
  const estInvite = !!adherentRecord?.est_invite;
  const tarif =
    estInvite && sortie?.tarif_non_adherent != null
      ? sortie.tarif_non_adherent
      : sortie?.tarif_adherent;
  return Number(tarif) || 0;
}

module.exports = { computeMontantDu };
