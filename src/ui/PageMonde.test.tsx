// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageMonde } from './PageMonde'

afterEach(cleanup)

describe('PageMonde', () => {
  it('affiche les huit régions verrouillées sans bouton', () => {
    render(<PageMonde retour={vi.fn()} jouerKanto={vi.fn()} />)

    for (const nom of ['Johto', 'Hoenn', 'Sinnoh', 'Unys', 'Kalos', 'Alola', 'Galar', 'Paldea']) {
      const region = screen.getByText(nom).closest('li')!
      expect(within(region).getByText('Bientôt')).toBeTruthy()
      expect(within(region).queryByRole('button')).toBeNull()
    }
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('permet de jouer à Kanto et de revenir', () => {
    const retour = vi.fn()
    const jouerKanto = vi.fn()
    render(<PageMonde retour={retour} jouerKanto={jouerKanto} />)

    fireEvent.click(screen.getByRole('button', { name: 'Jouer à Kanto' }))
    expect(jouerKanto).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Retour' }))
    expect(retour).toHaveBeenCalledTimes(1)
  })

  it('affiche la carte de Kanto', () => {
    render(<PageMonde retour={vi.fn()} jouerKanto={vi.fn()} />)

    const image = screen.getByRole('button', { name: 'Jouer à Kanto' }).querySelector('img')
    expect(image?.getAttribute('src')).toContain('img/decors/carte-kanto.webp')
    expect(image?.getAttribute('alt')).toBe('')
  })
})
