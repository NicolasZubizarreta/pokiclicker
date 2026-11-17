import { chargerPokemon } from '../core/pokemon';
import { zonesDeEspece } from '../core/zones-espece';

const catalogue = chargerPokemon();

/** Zones où trouver l'espèce, pour la fiche du Pokédex. Rien n'est révélé pour une espèce inconnue. */
export function ZonesEspeceFiche({ numero }: { numero: number }) {
  const { zones, via } = zonesDeEspece(numero);
  return <section aria-label="Où le trouver" className="grid gap-1">
    <p className="font-titre font-semibold">Où le trouver</p>
    {zones.length === 0
      ? <p className="text-texte-doux">Introuvable en zone : ce Pokémon s'obtient autrement (cadeau, pension, évolution).</p>
      : <>
        {via !== null && <p className="text-texte-doux">Via l'évolution de {catalogue.parNumero(via).nom}</p>}
        <ul className="flex flex-wrap gap-2">{zones.map(zone => <li key={zone.id} className="cadre bg-surface-2 px-2">{zone.nom}</li>)}</ul>
      </>}
  </section>;
}
