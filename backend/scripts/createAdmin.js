const { sequelize, User } = require("../src/models");
const logger = require("../src/utils/logger");

const createAdmin = async () => {
  try {
    // ✅ Utiliser sequelize directement depuis le modèle
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({
      where: { email: "admin@plongee.com" },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      console.log("📧 Email: admin@plongee.com");
      console.log("🔑 Password: admin123");
      process.exit(0);
    }

    // Créer l'admin
    await User.create({
      email: "admin@plongee.com",
      password: "admin123",
      name: "Administrateur",
      role: "president",
      active: true,
    });

    console.log("✅ Admin user created successfully");
    console.log("📧 Email: admin@plongee.com");
    console.log("🔑 Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin:", error);
    process.exit(1);
  }
};

createAdmin();
