module.exports = {
  testEnvironment: "node",
  verbose: true,
  // Sequelize garde le pool de connexions ouvert après les tests
  // d'intégration ; on force la sortie plutôt que de laisser chaque
  // fichier gérer sa propre fermeture explicite.
  forceExit: true,
};
