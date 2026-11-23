import { dateLocale } from './suivi-store';

const semaine = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });

export function joursRecents(argentJours: Record<string, number>, aujourdhui: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - 6 + index, 12);
    const cle = dateLocale(date.getTime());
    return { cle, libelle: semaine.format(date), valeur: argentJours[cle] ?? 0 };
  });
}
