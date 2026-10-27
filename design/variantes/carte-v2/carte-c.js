CarteV2.demarrer({
  nom: 'C · Kanto, atlas papier et encre',
  ratio: [16, 9],
  dessiner(hote) {
    hote.classList.add('carte-c');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const tracer = (balise, attributs, parent = svg) => {
      const element = document.createElementNS(svg.namespaceURI, balise);
      Object.entries(attributs).forEach(([cle, valeur]) => element.setAttribute(cle, valeur));
      parent.append(element);
      return element;
    };
    svg.setAttribute('viewBox', '0 0 160 90');
    svg.setAttribute('aria-hidden', 'true');
    const defs = tracer('defs', {});
    const motif = tracer('pattern', {
      id: 'atlas-hachures', width: 3, height: 3, patternUnits: 'userSpaceOnUse',
    }, defs);
    tracer('path', { d: 'M -1 1 L 1 -1 M 0 3 L 3 0 M 2 4 L 4 2', class: 'hachure' }, motif);
    tracer('rect', { width: 160, height: 90, class: 'papier' });
    tracer('rect', { width: 160, height: 90, fill: 'url(#atlas-hachures)' });
    const points = Object.fromEntries(CarteV2.zones.map(({ n }) => {
      const { x, y } = CarteV2.positions[n];
      return [n, [x * 160, y * 90]];
    }));
    const iles = new Set(CarteV2.zones.filter(({ nom }) => /cramois|écume|ecume/i.test(nom)).map(({ n }) => n));
    // Enveloppe des repères continentaux : chaque zone reste à l'intérieur des côtes.
    const rivage = CarteV2.zones.filter(({ n }) => !iles.has(n)).flatMap(({ n }) => {
      const [x, y] = points[n];
      return [[x - 6, y - 3], [x - 3, y - 6], [x + 5, y - 4],
        [x + 7, y + 2], [x + 2, y + 6], [x - 5, y + 4]];
    }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const tourner = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const demiCote = (liste) => {
      const bord = [];
      liste.forEach((point) => {
        while (bord.length > 1 && tourner(bord.at(-2), bord.at(-1), point) <= 0) bord.pop();
        bord.push(point);
      });
      return bord.slice(0, -1);
    };
    const contour = [...demiCote(rivage), ...demiCote([...rivage].reverse())];
    const terre = `M ${contour.map((p) => p.join(' ')).join(' L ')} Z`;
    tracer('path', { d: terre, class: 'cote-exterieure' });
    tracer('path', { d: terre, class: 'terre' });
    iles.forEach((n) => {
      const [x, y] = points[n];
      const d = `M ${x - 7} ${y + 1} q -1 -5 5 -6 q 5 -2 8 3 l 1 5 l -5 3 l -7 -1 Z`;
      tracer('path', { d, class: 'cote-exterieure' });
      tracer('path', { d, class: 'terre' });
    });
    const liaisons = [[0, 18], [18, 3], [3, 5], [5, 7], [5, 15], [15, 7],
      [15, 11], [15, 10], [10, 13], [11, 13]];
    const villes = [...new Set(liaisons.flat())];
    CarteV2.zones.forEach(({ n }) => {
      if (villes.includes(n)) return;
      const distance = (i) => Math.hypot(points[i][0] - points[n][0], points[i][1] - points[n][1]);
      const voisin = [...villes].sort((a, b) => distance(a) - distance(b))[0];
      liaisons.push([n, voisin]);
    });
    liaisons.forEach(([a, b]) => tracer('path', {
      d: `M ${points[a].join(' ')} L ${points[b].join(' ')}`, class: 'route-atlas',
    }));
    const pictogrammes = {
      ville: 'M 3 13 V 6 L 8 2 L 13 6 V 13 Z M 6 13 V 9 H 10 V 13 M 6 6 H 10',
      arene: 'M 3 3 L 8 1 L 13 3 V 8 Q 12 12 8 14 Q 4 12 3 8 Z M 8 4 V 10 M 5 7 H 11',
      ligue: 'M 2 4 L 5 7 L 8 2 L 11 7 L 14 4 L 12 12 H 4 Z M 4 14 H 12',
      donjon: 'M 1 13 L 4 5 L 8 2 L 13 6 L 15 13 Z M 6 13 V 9 Q 8 5 10 9 V 13',
      route: 'M 5 14 V 4 Q 8 0 11 4 V 14 Z M 6 7 H 10 M 3 14 H 13',
    };
    CarteV2.zones.forEach(({ n, nom, type }) => {
      const [x, y] = points[n];
      if (/sélénite|selenite|azurée|azuree/i.test(nom)) {
        const relief = tracer('g', { transform: `translate(${x - 11} ${y - 6})` });
        tracer('path', { d: 'M 0 5 L 5 -4 L 8 1 L 13 -7 L 20 5 Z', class: 'terre' }, relief);
        tracer('path', { d: 'M 0 5 L 5 -4 L 8 1 L 13 -7 L 20 5 Z', fill: 'url(#atlas-hachures)' }, relief);
        tracer('path', { d: 'M 5 -4 L 6 3 M 13 -7 L 12 -1 L 16 4', class: 'trait' }, relief);
      }
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'repere-c';
      bouton.dataset.zone = n;
      bouton.setAttribute('aria-label', `Zone ${n}, ${nom}`);
      bouton.style.left = `${CarteV2.positions[n].x * 100}%`;
      bouton.style.top = `${CarteV2.positions[n].y * 100}%`;
      const medaillon = document.createElement('span');
      medaillon.className = 'medaillon';
      const icone = tracer('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, medaillon);
      tracer('path', { d: pictogrammes[type] || pictogrammes.donjon }, icone);
      const numero = document.createElement('span');
      numero.textContent = n;
      const symbole = document.createElement('span');
      symbole.className = 'symbole';
      symbole.setAttribute('aria-hidden', 'true');
      medaillon.append(numero, symbole);
      bouton.append(medaillon);
      bouton.onclick = () => CarteV2.choisir(n);
      hote.append(bouton);
    });
    const cartouche = tracer('g', { transform: 'translate(125 5)' });
    tracer('path', { d: 'M 0 3 Q 4 3 4 0 H 26 Q 26 3 30 3 V 13 Q 26 13 26 16 H 4 Q 4 13 0 13 Z', class: 'terre' }, cartouche);
    tracer('path', { d: 'M 5 3 H 25 M 5 13 H 25 M -2 6 V 10 M 32 6 V 10', class: 'trait' }, cartouche);
    const titre = tracer('text', { x: 21.4, y: 14.5, transform: 'scale(.7)', class: 'titre-atlas' }, cartouche);
    titre.textContent = 'Kanto';
    const rose = tracer('g', { transform: 'translate(146 76)' });
    tracer('circle', { r: 6, class: 'terre' }, rose);
    tracer('path', { d: 'M 0 -10 L 2 -2 L 8 0 L 2 2 L 0 10 L -2 2 L -8 0 L -2 -2 Z', class: 'terre' }, rose);
    tracer('path', { d: 'M 0 -10 V 0 H 8 M 0 10 V 0 H -8', class: 'trait' }, rose);
    tracer('path', { d: 'M -1 -12 V -15 L 1 -12 V -15', class: 'trait' }, rose);
    hote.prepend(svg);
  },
});
