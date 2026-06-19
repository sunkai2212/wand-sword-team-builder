import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('application shell', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('exports and renders the application title', async () => {
    const { APP_TITLE } = await import('../src/main')

    expect(APP_TITLE).toBe('杖剑传说·4v4阵容图')
    expect(document.querySelector('h1')?.textContent).toBe(APP_TITLE)
  })
})
