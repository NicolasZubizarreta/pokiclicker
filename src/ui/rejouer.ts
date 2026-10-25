type Modele = { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
const enCours = new WeakMap<Element, Animation>();

// Une seule animation par élément, relancée à chaque toucher : créer un objet d'animation à chaque appui coûtait des tâches longues.
export function rejouer(element: Element, modele: Modele): void {
  const animation = enCours.get(element);
  if (animation) { animation.currentTime = 0; animation.play(); return; }
  const nouvelle = element.animate(modele.keyframes, modele.options) as Animation | undefined;
  if (nouvelle) enCours.set(element, nouvelle);
}
