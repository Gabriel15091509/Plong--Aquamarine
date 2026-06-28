import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-sm text-gray-500">
          © {currentYear} Plongée Club. Tous droits réservés.
        </p>
        <p className="text-sm text-gray-400">
          Version 1.0.0
        </p>
      </div>
    </footer>
  );
};

export default Footer;