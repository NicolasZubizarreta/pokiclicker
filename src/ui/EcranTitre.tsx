export function EcranTitre({ quandJouer }: { quandJouer: () => void }) {
  return <section aria-label="Écran titre" className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-fond p-4 text-center text-base text-texte">
    <div className="motion-safe:animate-bounce">
      <h1 className="font-titre text-3xl text-lien">POKÉ CLICKER</h1>
      <p className="mt-2 text-base text-texte-doux">KANTO ORIGINS</p>
    </div>
    <button type="button" onClick={quandJouer}
      className="cadre min-h-11 min-w-11 bg-action px-8 py-4 font-titre text-xl text-action-texte shadow-md hover:bg-action-survol motion-safe:active:translate-y-0.5">
      JOUER
    </button>
    <p role="status" className="sr-only" />
  </section>;
}
