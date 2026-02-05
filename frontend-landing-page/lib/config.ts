/**
 * Configuration des URLs de l'application
 * 
 * Ce fichier centralise la gestion des variables d'environnement
 * pour les URLs de redirection vers les différentes applications Trackly.
 */

export const config = {
  /**
   * URL de l'application Business (Dashboard)
   * Utilisée pour les redirections vers l'interface de gestion
   */
  businessAppUrl: process.env.NEXT_PUBLIC_BUSINESS_APP_URL || 'http://localhost:5173',

  /**
   * URL de l'application Driver
   * Utilisée pour les redirections vers l'app livreur
   */
  driverAppUrl: process.env.NEXT_PUBLIC_DRIVER_APP_URL || 'http://localhost:5174',

  /**
   * URL de l'application Tracking
   * Utilisée pour les redirections vers le suivi client
   */
  trackingAppUrl: process.env.NEXT_PUBLIC_TRACKING_APP_URL || 'http://localhost:3001',

  /**
   * URL de la démo
   * Utilisée pour le bouton "Découvrir la démo"
   */
  demoUrl: process.env.NEXT_PUBLIC_DEMO_URL || 'http://localhost:5173/demo',

  /**
   * URL d'inscription
   * Utilisée pour le bouton "S'inscrire"
   */
  signupUrl: process.env.NEXT_PUBLIC_SIGNUP_URL || 'http://localhost:5173/signup',
} as const;

/**
 * URLs de navigation interne (ancrages dans la landing page)
 */
export const internalLinks = {
  pricing: '#tarification',
  cta: '#cta',
} as const;
