// Simulation d'envoi d'email (à remplacer par un vrai service comme Nodemailer)
const sendEmail = async ({ to, subject, template, data }) => {
  console.log(`📧 Email envoyé à ${to}`);
  console.log(`📝 Sujet: ${subject}`);
  console.log(`📄 Template: ${template}`);
  console.log(`📊 Données:`, data);
  
  // Simuler un délai d'envoi
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};

module.exports = { sendEmail };