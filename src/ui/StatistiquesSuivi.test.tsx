// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { suiviVide } from '../core/suivi';
import { StatistiquesSuivi } from './StatistiquesSuivi';

it('affiche le suivi vide puis les jeux joués, le mannequin et les sept gains', () => {
  const suivi = suiviVide();
  const props = { suivi, tempsJeuMs: 0, aujourdhui: new Date(2026, 0, 2) };
  const vue = render(<StatistiquesSuivi {...props} />);
  expect(screen.getByText('Aucune partie')).toBeTruthy();
  expect(screen.getByText('Rien de gagné depuis le début du suivi.')).toBeTruthy();
  expect(screen.queryByText('Record du mannequin')).toBeNull();
  suivi.records.mannequinDpsMax = 80;
  suivi.argentJours['2026-01-02'] = 12;
  suivi.casino.roulette = { parties: 2, meilleurGain: 0, meilleureSerie: 0, serieActuelle: 0 };
  vue.rerender(<StatistiquesSuivi {...props} />);
  expect(screen.getByText('Record du mannequin')).toBeTruthy();
  expect(screen.getByText('2 parties')).toBeTruthy();
  expect(screen.queryByText('Machine à sous')).toBeNull();
  expect(screen.getByRole('img', { name: /ven\. 2026-01-02 : 12/ }).querySelectorAll('rect')).toHaveLength(7);
  vue.unmount();
});
