import { useRef, useState } from 'react';

export const erreurRetourMenu = 'La sauvegarde a échoué : tu restes dans la partie.';

export function useRetourMenuPrincipal(menuPrincipal?: () => Promise<boolean>) {
  const verrou = useRef(false);
  const [retourEnCours, definirEnCours] = useState(false);
  const [retourEchoue, definirEchec] = useState(false);
  const revenirAuMenuPrincipal = async () => {
    if (!menuPrincipal || verrou.current) return;
    verrou.current = true;
    definirEnCours(true);
    definirEchec(false);
    try { definirEchec(!await menuPrincipal()); }
    catch { definirEchec(true); }
    finally { verrou.current = false; definirEnCours(false); }
  };
  return { retourEnCours, retourEchoue, revenirAuMenuPrincipal };
}
