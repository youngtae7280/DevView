import { describe, expect, it } from 'vitest'

import { searchTodos } from './todo-search.js'

const todos = [
  {
    id: 'TODO-001',
    title: 'Buy oat milk',
    note: 'Use the neighborhood market',
    tag: 'errand',
    dueDate: '2026-06-24',
  },
  {
    id: 'TODO-002',
    title: 'Prepare release notes',
    note: 'Summarize PP-001 runtime evidence',
    tag: 'docs',
    dueDate: '2026-06-25',
  },
  {
    id: 'TODO-003',
    title: 'Book train tickets',
    content: 'Check window seat availability',
    tag: 'travel',
    dueDate: '2026-06-26',
  },
]

const ids = (items) => items.map((item) => item.id)

describe('todo search runtime fixture', () => {
  it('matches Todo title text', () => {
    expect(ids(searchTodos(todos, 'milk'))).toEqual(['TODO-001'])
  })

  it('matches Todo note text', () => {
    expect(ids(searchTodos(todos, 'runtime evidence'))).toEqual(['TODO-002'])
  })

  it('normalizes repeated whitespace in multi-word queries', () => {
    expect(ids(searchTodos(todos, 'runtime    evidence'))).toEqual(['TODO-002'])
  })

  it('matches Todo content text', () => {
    expect(ids(searchTodos(todos, 'window seat'))).toEqual(['TODO-003'])
  })

  it('returns an empty result when title, note, and content do not match', () => {
    expect(searchTodos(todos, 'not present anywhere')).toEqual([])
  })

  it('does not treat tag or date as selected search targets', () => {
    expect(searchTodos(todos, 'docs')).toEqual([])
    expect(searchTodos(todos, '2026-06-25')).toEqual([])
  })

  it('returns the full Todo list for a blank query', () => {
    expect(ids(searchTodos(todos, '   '))).toEqual(['TODO-001', 'TODO-002', 'TODO-003'])
  })
})
