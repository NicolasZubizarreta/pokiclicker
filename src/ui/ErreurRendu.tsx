import { Component, type ReactNode } from 'react';

export class ErreurRendu extends Component<{ children: ReactNode }, { erreur: boolean }> {
  state = { erreur: false };

  static getDerivedStateFromError() { return { erreur: true }; }

  componentDidCatch(erreur: Error) { console.error(erreur); }

  render() {
    if (!this.state.erreur) return this.props.children;
    return <main data-theme="dark" role="alert" className="grid min-h-dvh place-content-center justify-items-center gap-4 bg-fond font-texte text-texte">
      <h1 className="font-titre text-2xl font-semibold">Oups, l'affichage a planté.</h1>
      <p>Ta partie est gardée. Recharge la page pour reprendre.</p>
      <button type="button" className="plaque min-h-11 min-w-11 p-2" onClick={() => window.location.reload()}>Recharger la page</button>
    </main>;
  }
}
