export const modeDeveloppeur = (): boolean => import.meta.env.DEV || import.meta.env.MODE === 'test' || import.meta.env.MODE === 'e2e';
