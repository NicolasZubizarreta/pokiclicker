// Les DPS dépendent du niveau et du bonheur : ils ne sont plus entiers. La V1 les affiche avec une décimale (toFixed(1)).
const formateurDps = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

export const formaterDps = (dps: number) => formateurDps.format(dps);
