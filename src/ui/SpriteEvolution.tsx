import { Image } from './Image';

export function SpriteEvolution({ ancien, nouveau, nom, actif, shiny = false }: {
  ancien: string;
  nouveau: string;
  nom: string;
  actif: boolean;
  shiny?: boolean;
}) {
  if (!actif) return <Image src={nouveau} genre="sprite" alt={nom} className={shiny ? 'halo-shiny' : ''} />;
  return <span className="inline-grid motion-safe:evolution-flash">
    <Image src={nouveau} genre="sprite" alt={nom}
      className={`col-start-1 row-start-1 evolution-nouveau motion-safe:evolution-alternance ${shiny ? 'halo-shiny' : ''}`} />
    <Image src={ancien} genre="sprite" alt=""
      className={`col-start-1 row-start-1 opacity-0 motion-reduce:hidden evolution-ancien motion-safe:evolution-alternance ${shiny ? 'halo-shiny' : ''}`} />
  </span>;
}
