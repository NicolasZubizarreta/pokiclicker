export const dansChampSaisie = (cible: EventTarget | null) =>
  cible instanceof Element && !!cible.closest('input, textarea, select, [contenteditable]');
