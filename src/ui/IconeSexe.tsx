export function IconeSexe({ sexe, className = 'size-7' }: { sexe: 'male' | 'femelle'; className?: string }) {
  return <span role="img" aria-label={sexe === 'male' ? 'Mâle' : 'Femelle'} className={`h-7 inline-flex items-center ${sexe === 'male' ? 'text-info-base' : 'text-erreur-base'}`}>
    <svg className={`${className} fill-none stroke-current`} viewBox="0 0 24 24" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {sexe === 'male' ? <><circle cx="9.5" cy="14.5" r="6" /><path d="M14 10L21 3M15 3h6v6" /></> : <><circle cx="12" cy="8.5" r="6" /><path d="M12 14.5V22M8.5 18.5h7" /></>}
    </svg>
  </span>;
}
