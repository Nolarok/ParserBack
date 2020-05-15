
export function parseStringToCSV(content) {
  const arr = content.split('\n')
  const cols = defineCols(arr[0].split(','))
  console.log({cols})

  if (!~cols.name || !~cols.surname || !~cols.data) {
    return {
      errors: ['Файл должен содержать колонки "Имя", "Фамилия" и "Дата"'],
      data: [],
    }
  }

  return arr.reduce((acc, row, index) => {
    const parsedRow = row.replace('\r', '').split(',')

    if (index === 0 || row === '') {
      return acc
    }

    // TODO добавить валидаторы
    if (!parsedRow[cols.name] || !parsedRow[cols.surname] || !parsedRow[cols.date]) {
      acc.errors.push({row: index, message: 'Строка не валидна', content: row})
      return acc
    }

    acc.data.push({
      name: parsedRow[cols.name],
      surname: parsedRow[cols.surname],
      patronymic: ~parsedRow[cols.patronymic] ? parsedRow[cols.patronymic] : '',
      date: parsedRow[cols.date]
    })

    return acc

  }, { errors: [], data: [] })
}

const defineCols = (header) => {
  const result = {}

  result.name = header.findIndex(col => col.toLowerCase().trim() === 'имя')
  result.surname = header.findIndex(col => col.toLowerCase().trim() === 'фамилия')
  result.patronymic = header.findIndex(col => col.toLowerCase().trim() === 'отчество')
  result.date = header.findIndex(col => col.toLowerCase().trim() === 'дата')

  return result
}
