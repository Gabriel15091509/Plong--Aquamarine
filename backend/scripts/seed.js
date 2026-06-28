const { sequelize, testConnection } = require('../src/config/database');
const { Adherent, Adhesion, CertificatMedical } = require('../src/models');
const logger = require('../src/utils/logger');

const seed = async () => {
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    console.log('✅ Database connection established');

    // Vérifier si des données existent déjà
    const count = await Adherent.count();
    if (count > 0) {
      console.log('✅ Les données existent déjà, suppression...');
      await sequelize.truncate({ cascade: true, restartIdentity: true });
    }

    // Créer des données de test
    console.log('📝 Création des adhérents...');
    const adherents = await Adherent.bulkCreate([
      {
        civilite: 'M.',
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: new Date('1990-01-15'),
        adresse: '15 Rue de la Plongée, 75001 Paris',
        telephone: '0612345678',
        email: 'jean.dupont@email.com',
        niveau: 'Niveau 2',
        statut: 'Actif'
      },
      {
        civilite: 'Mme',
        nom: 'Martin',
        prenom: 'Sophie',
        date_naissance: new Date('1985-05-20'),
        adresse: '25 Avenue de la Mer, 13001 Marseille',
        telephone: '0687654321',
        email: 'sophie.martin@email.com',
        niveau: 'Niveau 3',
        statut: 'Actif'
      },
      {
        civilite: 'M.',
        nom: 'Bernard',
        prenom: 'Pierre',
        date_naissance: new Date('1978-11-10'),
        adresse: '8 Boulevard de la Plage, 83000 Toulon',
        telephone: '0678901234',
        email: 'pierre.bernard@email.com',
        niveau: 'Moniteur',
        statut: 'Actif'
      }
    ]);

    console.log(`✅ ${adherents.length} adhérents créés`);

    // Créer des adhésions
    console.log('📝 Création des adhésions...');
    await Adhesion.bulkCreate([
      {
        num_adherent: adherents[0].num_adherent,
        type: 'Adhésion annuelle',
        date_debut: new Date('2024-01-01'),
        date_fin: new Date('2024-12-31'),
        montant_paye: 150.00,
        statut_paiement: 'Payé',
        annee_adhesion: 2024
      },
      {
        num_adherent: adherents[1].num_adherent,
        type: 'Licence FFESM',
        date_debut: new Date('2024-01-01'),
        date_fin: new Date('2024-12-31'),
        montant_paye: 100.00,
        statut_paiement: 'Payé',
        annee_adhesion: 2024
      },
      {
        num_adherent: adherents[2].num_adherent,
        type: 'Adhésion annuelle',
        date_debut: new Date('2024-01-01'),
        date_fin: new Date('2024-12-31'),
        montant_paye: 150.00,
        statut_paiement: 'Payé',
        annee_adhesion: 2024
      }
    ]);

    console.log('✅ Adhésions créées');

    // Créer des certificats médicaux
    console.log('📝 Création des certificats médicaux...');
    await CertificatMedical.bulkCreate([
      {
        num_adherent: adherents[0].num_adherent,
        type_certificat: 'Plongée',
        date_validite: new Date('2025-01-15'),
        date_delivrance: new Date('2024-01-15'),
        medecin: 'Dr. Bernard',
        statut: 'Valide'
      },
      {
        num_adherent: adherents[1].num_adherent,
        type_certificat: 'Plongée',
        date_validite: new Date('2025-05-20'),
        date_delivrance: new Date('2024-05-20'),
        medecin: 'Dr. Dubois',
        statut: 'Valide'
      },
      {
        num_adherent: adherents[2].num_adherent,
        type_certificat: 'Plongée',
        date_validite: new Date('2025-11-10'),
        date_delivrance: new Date('2024-11-10'),
        medecin: 'Dr. Martin',
        statut: 'Valide'
      }
    ]);

    console.log('✅ Certificats médicaux créés');
    console.log('✅ Seed data créé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();