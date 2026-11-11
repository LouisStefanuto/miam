/**
 * Pixel-art avatars a user can pick instead of their account photo.
 * The images live in public/avatars/<id>.svg; the id is what gets stored, so never rename one.
 */

export type AvatarGroup = 'castors' | 'marche' | 'divers';

export interface Avatar {
  id: string;
  label: string;
  group: AvatarGroup;
}

export const AVATAR_GROUPS: { id: AvatarGroup; label: string }[] = [
  { id: 'castors', label: 'Castors' },
  { id: 'marche', label: 'Au marché' },
  { id: 'divers', label: 'Divers' },
];

export const AVATARS: Avatar[] = [
  { id: 'tete-ronde', label: 'Castor', group: 'castors' },
  { id: 'petite-toque', label: 'Petite toque', group: 'castors' },
  { id: 'grande-toque', label: 'Grande toque', group: 'castors' },
  { id: 'clin-d-oeil', label: "Clin d'œil", group: 'castors' },
  { id: 'ravi', label: 'Ravi', group: 'castors' },
  { id: 'cuillere-en-bois', label: 'Cuillère en bois', group: 'castors' },
  { id: 'dans-la-marmite', label: 'Dans la marmite', group: 'castors' },
  { id: 'moustache', label: 'Moustache', group: 'castors' },
  { id: 'foulard', label: 'Foulard', group: 'castors' },
  { id: 'tons-doux', label: 'Tons doux', group: 'castors' },
  { id: 'endormi', label: 'Endormi', group: 'castors' },
  { id: 'bonnet-de-nuit', label: 'Bonnet de nuit', group: 'castors' },
  { id: 'bulle', label: 'Bulle', group: 'castors' },

  { id: 'tomate', label: 'Tomate', group: 'marche' },
  { id: 'tomate-kawaii', label: 'Tomate souriante', group: 'marche' },
  { id: 'tomates-cerises', label: 'Tomates cerises', group: 'marche' },
  { id: 'tomate-coupee', label: 'Tomate coupée', group: 'marche' },
  { id: 'coeur-de-boeuf', label: 'Cœur de bœuf', group: 'marche' },
  { id: 'poivron', label: 'Poivron', group: 'marche' },
  { id: 'citron', label: 'Citron', group: 'marche' },
  { id: 'ail', label: 'Ail', group: 'marche' },
  { id: 'fraise', label: 'Fraise', group: 'marche' },
  { id: 'carotte', label: 'Carotte', group: 'marche' },
  { id: 'carotte-droite', label: 'Carotte droite', group: 'marche' },
  { id: 'carotte-kawaii', label: 'Carotte souriante', group: 'marche' },
  { id: 'botte', label: 'Botte de carottes', group: 'marche' },
  { id: 'au-potager', label: 'Au potager', group: 'marche' },
  { id: 'radis', label: 'Radis', group: 'marche' },
  { id: 'aubergine', label: 'Aubergine', group: 'marche' },
  { id: 'champignon', label: 'Champignon', group: 'marche' },
  { id: 'avocat', label: 'Avocat', group: 'marche' },
  { id: 'brocoli', label: 'Brocoli', group: 'marche' },
  { id: 'fromage', label: 'Fromage', group: 'marche' },

  { id: 'lune', label: 'Lune', group: 'divers' },
  { id: 'sablier', label: 'Sablier', group: 'divers' },
  { id: 'ca-mijote', label: 'Ça mijote', group: 'divers' },
  { id: 'oeuf-qui-eclot', label: 'Œuf qui éclot', group: 'divers' },
  { id: 'appareil-photo', label: 'Appareil photo', group: 'divers' },
  { id: 'minuteur', label: 'Minuteur', group: 'divers' },
  { id: 'pousse', label: 'Pousse', group: 'divers' },
];

export function avatarSrc(id: string): string {
  return `/avatars/${id}.svg`;
}

export function getAvatarById(id: string): Avatar | undefined {
  return AVATARS.find((avatar) => avatar.id === id);
}

// Kept per account so two people sharing a browser don't swap avatars.
const storageKey = (email: string) => `miam-avatar:${email}`;

const listeners = new Set<() => void>();

/** The avatar this user picked on this device, or null for their account photo. */
export function getAvatar(email: string): string | null {
  try {
    const stored = localStorage.getItem(storageKey(email));
    return stored && getAvatarById(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Saves the pick (null goes back to the account photo) and tells every mounted avatar. */
export function setAvatar(email: string, id: string | null): void {
  try {
    if (id) localStorage.setItem(storageKey(email), id);
    else localStorage.removeItem(storageKey(email));
  } catch {
    // Storage unavailable (private mode): there is nowhere to keep the pick.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToAvatar(listener: () => void): () => void {
  listeners.add(listener);
  // Picks made in another tab arrive through the storage event.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}
