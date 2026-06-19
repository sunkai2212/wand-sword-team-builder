import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('application shell', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = '<div id="app"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('exports the application title and starts with stage selection', async () => {
    const { APP_TITLE } = await import('../src/main')

    expect(APP_TITLE).toBe('杖剑传说·4v4阵容图')
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain('选择当前转数')
    expect(document.querySelector('h1')).toBeNull()
  })
})
