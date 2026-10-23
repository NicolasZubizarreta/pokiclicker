export function PageBientot({ titre }: { titre: string }) {
  return (
    <section className="rounded-cadre border border-bordure bg-surface p-4 inset-ring inset-ring-region-argent lg:p-8">
      <h1 className="font-titre text-2xl font-semibold">{titre}</h1>
      <p className="mt-2">{titre === 'Combat' ? 'Le combat arrive bientôt.' : 'Cette page arrive bientôt.'}</p>
    </section>
  );
}
