export function telechargerTexte(nomFichier: string, texte: string) {
  const url = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
  const lien = document.createElement('a');
  try {
    lien.href = url;
    lien.download = nomFichier;
    document.body.append(lien);
    lien.click();
  } finally {
    lien.remove();
    URL.revokeObjectURL(url);
  }
}
