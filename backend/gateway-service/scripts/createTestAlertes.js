const { sequelize, Alerte, Adherent } = require('../src/models');

const createTestAlertes = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Récupérer les adhérents
    const adherents = await Adherent.findAll({ limit: 5 });
    if (adherents.length === 0) {
      console.log('Aucun adhérent trouvé');
      process.exit(1);
    }

    const alertes = [
      {
        num_adherent: adherents[0].num_adherent,
        type: 'Certificat expiré',
        date_envoi: new Date(),
        canal: 'Email',
        statut: 'Envoyé',
        read: false
      },
      {
        num_adherent: adherents[1]?.num_adherent || adherents[0].num_adherent,
        type: 'Adhésion expirée',
        date_envoi: new Date(),
        canal: 'SMS',
        statut: 'Envoyé',
        read: false
      },
      {
        num_adherent: adherents[2]?.num_adherent || adherents[0].num_adherent,
        type: 'Paiement en retard',
        date_envoi: new Date(),
        canal: 'Email',
        statut: 'Envoyé',
        read: false
      },
      {
        num_adherent: adherents[3]?.num_adherent || adherents[0].num_adherent,
        type: 'Formation',
        date_envoi: new Date(),
        canal: 'Notification',
        statut: 'Envoyé',
        read: false
      },
      {
        num_adherent: adherents[4]?.num_adherent || adherents[0].num_adherent,
        type: 'Certificat expiré',
        date_envoi: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 jour avant
        canal: 'Email',
        statut: 'Lu',
        read: true
      }
    ];

    await Alerte.bulkCreate(alertes);
    console.log(`${alertes.length} alertes de test créées`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createTestAlertes();