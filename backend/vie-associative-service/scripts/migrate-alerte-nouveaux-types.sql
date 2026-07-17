\encoding UTF8

-- Nouveaux types d'alerte automatique (CDC 3.4.4 prêt en retard, 3.3.2
-- inactivité carnet de plongée) générés par des crons dans materiel/
-- activites-service (via un appel HTTP interne vers ce service, seul
-- propriétaire de la table `alertes`).
ALTER TYPE enum_alertes_type ADD VALUE IF NOT EXISTS 'Materiel en retard';
ALTER TYPE enum_alertes_type ADD VALUE IF NOT EXISTS 'Inactivite plongee';
