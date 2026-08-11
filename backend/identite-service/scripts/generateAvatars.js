// Génère un avatar SVG (initiales sur fond coloré) pour chaque compte User
// qui n'a pas encore de photo (moniteurs, trésorier, adhérents sans photo
// uploadée) et l'enregistre comme photo de profil partagée (voir
// middlewares/upload.js : la photo vit sur le compte User, tous rôles
// confondus).
const fs = require("fs");
const path = require("path");
const { sequelize } = require("../src/config/database");

const COLORS = [
  "#0891b2",
  "#4f46e5",
  "#0d9488",
  "#c026d3",
  "#ea580c",
  "#65a30d",
  "#2563eb",
  "#db2777",
  "#7c3aed",
  "#059669",
];

const initials = (name) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const svgAvatar = (name, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="100" fill="${color}" />
  <text x="100" y="100" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="80" font-weight="600" fill="#ffffff">${initials(name)}</text>
</svg>`;

const AVATARS_DIR = path.join(__dirname, "../uploads/avatars");

const run = async () => {
  await sequelize.authenticate();
  fs.mkdirSync(AVATARS_DIR, { recursive: true });

  const [users] = await sequelize.query(
    `SELECT id, name, role FROM identite.users WHERE photo IS NULL ORDER BY id`,
  );

  for (const user of users) {
    const color = COLORS[user.id % COLORS.length];
    const filename = `avatar-${user.id}.svg`;
    fs.writeFileSync(path.join(AVATARS_DIR, filename), svgAvatar(user.name, color));

    const photoPath = `/uploads/avatars/${filename}`;
    await sequelize.query(`UPDATE identite.users SET photo = :photo WHERE id = :id`, {
      replacements: { photo: photoPath, id: user.id },
    });
    console.log(`#${user.id} (${user.role}) ${user.name} -> ${photoPath}`);
  }

  console.log(`\nTerminé : ${users.length} avatar(s) généré(s).`);
  process.exit(0);
};

run().catch((error) => {
  console.error("Erreur:", error);
  process.exit(1);
});
