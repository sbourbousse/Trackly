/**
 * Utilitaires pour les statuts de livraison
 */

import type { DeliveryStatus } from '../types/api';

export interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export function getStatusInfo(status: DeliveryStatus): StatusInfo {
  switch (status) {
    case 'Pending':
      return {
        label: 'En attente',
        color: 'text-stone-600',
        bgColor: 'bg-stone-100',
        icon: '⏱️',
      };
    case 'InProgress':
      return {
        label: 'En cours de livraison',
        color: 'text-teal-700',
        bgColor: 'bg-teal-100',
        icon: '🚚',
      };
    case 'Completed':
      return {
        label: 'Livrée',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: '✅',
      };
    case 'Cancelled':
      return {
        label: 'Annulée',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: '❌',
      };
    default:
      return {
        label: 'Inconnu',
        color: 'text-stone-500',
        bgColor: 'bg-stone-50',
        icon: '❓',
      };
  }
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(dateString: string | null): string {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
