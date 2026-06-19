import { describe, expect, it } from 'vitest'

import { APP_TITLE } from '../src/main'

describe('application shell', () => {
  it('exports the application title', () => {
    expect(APP_TITLE).toBe('杖剑传说·4v4阵容图')
  })
})
