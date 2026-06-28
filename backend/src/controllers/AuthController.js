const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Vérifier si l'email et le mot de passe sont fournis
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      // Trouver l'utilisateur
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier si l'utilisateur est actif
      if (!user.active) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé'
        });
      }

      // Vérifier le mot de passe
      const isValid = await user.comparePassword(password);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Générer le token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Retourner le token et les informations utilisateur
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion'
      });
    }
  }

  async register(req, res) {
    try {
      const { email, password, name, role = 'user' } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password,
        name,
        role
      });

      // Générer le token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'inscription'
      });
    }
  }

  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'name', 'role', 'active']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  }

  async logout(req, res) {
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  }
}

module.exports = AuthController;