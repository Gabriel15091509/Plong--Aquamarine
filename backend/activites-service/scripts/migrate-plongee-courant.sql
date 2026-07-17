\encoding UTF8

-- Champ manquant du carnet de plongée (CDC 3.3.1) : condition de courant au
-- même titre que température_eau/visibilité.
ALTER TABLE activites.plongees ADD COLUMN IF NOT EXISTS courant VARCHAR(20);
