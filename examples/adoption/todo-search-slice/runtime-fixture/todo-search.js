export function searchTodos(todos, query) {
  const normalizeSearchText = (value) =>
    String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()

  const normalizedQuery = normalizeSearchText(query)

  if (normalizedQuery.length === 0) {
    return [...todos]
  }

  return todos.filter((todo) => {
    const title = normalizeSearchText(todo.title)
    const note = normalizeSearchText(todo.note)
    const content = normalizeSearchText(todo.content)

    return title.includes(normalizedQuery) || note.includes(normalizedQuery) || content.includes(normalizedQuery)
  })
}
