class Helpers {
  static formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  static formatDateTime(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  }

  static calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  static generateReference(prefix = 'REF') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  static paginate(data, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);
    
    return {
      data: paginatedData,
      total: data.length,
      page,
      totalPages: Math.ceil(data.length / limit)
    };
  }

  static sanitizeString(str) {
    if (!str) return '';
    return str
      .trim()
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ');
  }

  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validatePhone(phone) {
    const regex = /^[0-9+\-\s()]{10,20}$/;
    return regex.test(phone);
  }

  static getStatusColor(status) {
    const colors = {
      'Actif': 'green',
      'Inactif': 'gray',
      'Suspendu': 'red',
      'En attente': 'yellow',
      'Confirmée': 'green',
      'Annulée': 'red',
      'Terminée': 'blue',
      'Validé': 'green',
      'Payé': 'green'
    };
    return colors[status] || 'gray';
  }
}

module.exports = Helpers;