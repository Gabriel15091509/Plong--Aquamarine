class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Ressource non trouvée") {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = "Erreur de validation") {
    super(message, 400);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Accès refusé") {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflit") {
    super(message, 409);
  }
}

// Attache un status par défaut à une erreur qui n'en a pas déjà un (ex. une
// erreur métier levée via `new Error(...)` avant l'introduction des classes
// ci-dessus) — préserve le comportement existant de chaque contrôleur tout en
// le faisant transiter par `next()` vers le handler centralisé.
function withStatus(error, defaultStatus) {
  if (!error.status) error.status = defaultStatus;
  return error;
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  withStatus,
};
