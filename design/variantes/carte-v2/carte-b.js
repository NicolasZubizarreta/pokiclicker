CarteV2.demarrer({
  nom: 'B · Kanto, Town Map',
  dessiner(hote) {
    hote.classList.add('carte-b');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 160 90');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    const tracer = (balise, attributs, parent = svg) => {
      const element = document.createElementNS(svg.namespaceURI, balise);
      Object.entries(attributs).forEach(([cle, valeur]) => element.setAttribute(cle, valeur));
      parent.append(element);
      return element;
    };
    const points = Object.fromEntries(CarteV2.zones.map(({ n }) => {
      const { x, y } = CarteV2.positions[n];
      return [n, [x * 160, y * 90]];
    }));
    const iles = new Set(CarteV2.zones.filter(({ nom }) => /cramois|écume|ecume/i.test(nom)).map(({ n }) => n));
    const liaisons = [
      [0, 18], [18, 3], [3, 5], [5, 7], [5, 15], [15, 7],
      [15, 11], [15, 10], [10, 13], [11, 13],
    ];
    // Les étapes intermédiaires rejoignent le réseau au point le plus proche.
    const villes = new Set(liaisons.flat());
    CarteV2.zones.forEach(({ n }) => {
      if (villes.has(n)) return;
      const voisins = [...villes].sort((a, b) => {
        const distance = (i) => Math.hypot(points[i][0] - points[n][0], points[i][1] - points[n][1]);
        return distance(a) - distance(b);
      });
      liaisons.push([n, voisins[0]]);
    });
    const chemin = (a, b) => `M ${points[a].join(' ')} H ${points[b][0]} V ${points[b][1]}`;
    tracer('rect', { width: 160, height: 90, class: 'mer' });
    const terre = tracer('g', { class: 'terre' });
    liaisons.forEach(([a, b]) => {
      if (!iles.has(a) && !iles.has(b)) tracer('path', { d: chemin(a, b), class: 'continent' }, terre);
    });
    CarteV2.zones.forEach(({ n }) => {
      const [x, y] = points[n];
      tracer('path', {
        d: `M ${x - 7} ${y - 5} h 4 v -2 h 9 v 4 h 2 v 7 h -5 v 2 h -10 Z`,
      }, terre);
    });
    const routes = tracer('g', { class: 'routes' });
    liaisons.forEach(([a, b]) => tracer('path', {
      d: chemin(a, b), class: iles.has(a) || iles.has(b) ? 'liaison-mer' : 'route-terre',
    }, routes));
    CarteV2.zones.forEach(({ n, nom, type }) => {
      const [x, y] = points[n];
      if (/sélénite|selenite|azurée|azuree/i.test(nom)) {
        tracer('path', {
          d: `M ${x - 8} ${y + 2} l 4 -7 l 3 4 l 4 -6 l 5 9 Z`, class: 'relief',
        });
      }
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'repere-b';
      bouton.dataset.zone = n;
      bouton.dataset.type = ['ville', 'arene', 'ligue', 'route'].includes(type) ? type : 'donjon';
      bouton.setAttribute('aria-label', `Zone ${n}, ${nom}`);
      bouton.style.left = `${CarteV2.positions[n].x * 100}%`;
      bouton.style.top = `${CarteV2.positions[n].y * 100}%`;
      const forme = document.createElement('span');
      forme.className = 'forme';
      const numero = document.createElement('span');
      numero.className = 'numero-zone';
      numero.textContent = n;
      const symbole = document.createElement('span');
      symbole.className = 'symbole';
      symbole.setAttribute('aria-hidden', 'true');
      forme.append(numero);
      bouton.append(forme, symbole);
      bouton.onclick = () => CarteV2.choisir(n);
      hote.append(bouton);
    });
    hote.prepend(svg);
    const cartouche = document.createElement('span');
    cartouche.className = 'cartouche';
    cartouche.textContent = 'Kanto';
    cartouche.setAttribute('aria-hidden', 'true');
    hote.append(cartouche);
  },
});
