import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'

afterEach(() => { cleanup(); localStorage.clear() })

describe('FIELDNOTE workspace', () => {
  it('opens the resale inventory and shows no fabricated stock figures', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Партии и остатки/ }))
    expect(screen.getByRole('heading', { name: 'Партии и остатки' })).toBeTruthy()
    expect(screen.getByText(/пока нет — мы не подставляли выдуманное количество/)).toBeTruthy()
  })

  it('turns a content plan item into an assignable team task', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(within(screen.getByRole('navigation')).getByRole('button', { name: /План и задачи/ }))
    const contentTable = screen.getByRole('table')
    await user.click(within(contentTable).getAllByRole('button', { name: /Создать задачу из идеи/ })[0])
    expect(screen.getByDisplayValue(/Подготовить: Показать ценность предложения/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Задачи команды' })).toBeTruthy()
  })
})
