import zonesKanto from '../../data/regions/kanto/zones.json';
import { chargerMonde } from './monde';
import type { FichierZones } from './monde';

// L'import JSON élargit les littéraux ; chargerMonde valide les données au chargement.
export const kanto = chargerMonde(zonesKanto as FichierZones);
