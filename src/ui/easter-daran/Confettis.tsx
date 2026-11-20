import { useMemo, type CSSProperties } from 'react';

const couleurs = ['--action', '--region-argent', '--region-accent', '--succes-base', '--alerte-base', '--erreur-base'];

export function Confettis() {
  const pieces = useMemo(() => Array.from({ length: 48 }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `calc(var(--spacing) * ${1 + Math.random()})`,
    height: `calc(var(--spacing) * ${2 + Math.random() * 2})`,
    backgroundColor: `var(${couleurs[Math.floor(Math.random() * couleurs.length)]})`,
    '--rotation': `${Math.random() * 360}deg`,
    '--delai': `${-Math.random() * 8}s`,
    '--duree': `${5 + Math.random() * 5}s`,
  } as CSSProperties)), []);
  return <div className="daran-confettis" aria-hidden="true">
    {pieces.map((style, i) => <span key={i} style={style} />)}
  </div>;
}
