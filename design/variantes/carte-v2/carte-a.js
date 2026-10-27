CarteV2.demarrer({
  nom: 'A · La carte de Kanto V1',
  dessiner(hote) {
    hote.classList.add('carte-a');
    const image = document.createElement('img');
    image.src = '/img/decors/carte-kanto.webp';
    image.alt = '';
    hote.append(image);
    CarteV2.zones.forEach(({ n, nom }) => {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'repere';
      bouton.dataset.zone = n;
      bouton.setAttribute('aria-label', `Zone ${n}, ${nom}`);
      bouton.style.left = `${CarteV2.positions[n].x * 100}%`;
      bouton.style.top = `${CarteV2.positions[n].y * 100}%`;
      bouton.innerHTML = `<span>${n}</span><span class="symbole" aria-hidden="true"></span>`;
      bouton.onclick = () => CarteV2.choisir(n);
      hote.append(bouton);
    });
  },
});
