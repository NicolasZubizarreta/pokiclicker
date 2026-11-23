import { useState } from 'react';
import { tirerAstuce } from '../core/astuces';

export function AstuceChargement() {
  const [astuce] = useState(() => tirerAstuce(Math.random));
  return <p aria-live="off" className="max-w-prose px-4 text-center text-base text-texte-doux">{astuce}</p>;
}
