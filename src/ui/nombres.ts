export const formateurArgent = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
export const formaterNombre = (nombre: number) => formateurArgent.format(nombre);

export const formaterDps = (dps: number) => formaterNombre(Math.round(dps));
