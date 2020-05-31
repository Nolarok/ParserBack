import Excel from 'exceljs'
import atob from "atob"

const columns = [
  { header: 'Должник', key: 'debtor', width: 40 },
  { header: 'Исполнительное производство', key: 'exec_production', width: 40 },
  { header: 'Реквизиты исполнительного документа', key: 'requisites', width: 40 },
  { header: 'Дата, причина окончания или прекращения ИП', key: 'date_and_reason', width: 40 },
  { header: 'Предмет исполнения, сумма непогашенной задолженности', key: 'subject_and_amount', width: 40 },
  { header: 'Отдел судебных приставов', key: 'department_of_bailiffs', width: 40 },
  { header: 'Судебный пристав-исполнитель', key: 'bailiff', width: 40 },
]

const col2 = [
  { header: 'Имя', key: 'name', width: 40 },
  { header: 'Фамилия', key: 'surname', width: 40 },
  { header: 'Отчество', key: 'patronymic', width: 40 },
  { header: 'Дата', key: 'date', width: 40 },
]

export const generate = (data) => {
  const workbook = new Excel.Workbook()
  const worksheet = workbook.addWorksheet('Выгрузка')

  worksheet.columns = columns

  data.forEach(row => {
    worksheet.addRow(row)
  })

  return workbook.xlsx.writeBuffer()
}

export const getFile = async (base64Content) => {
  const workbook = new Excel.Workbook()
  await workbook.xlsx.load(base64ToBuffer(base64Content))

  return workbook.xlsx.writeBuffer()
}

export const read = async (base64Content) => {
  try {
    const workbook = new Excel.Workbook()
    await workbook.xlsx.load(base64ToBuffer(base64Content))
    const worksheet = workbook.worksheets[0]

    const headerErrors = getHeadersErrors(worksheet)

    if (headerErrors.length) {
      return { errors: headerErrors }
    }

    worksheet.columns = getHeaders(worksheet)

    const dataErrors = getDataErrors(worksheet)

    if (dataErrors.length) {
      return { errors: dataErrors }
    }

    const data = getData(worksheet)

    return { data, errors: [] }
  } catch (error) {
    console.error(error)
    return {
      errors: ['Ошибка сервера']
    }
  }

}

const getHeadersErrors = (worksheet) => {
  const headerRow = worksheet.getRow(1).values.slice(1)
  if (headerRow.length !== 4) {
    return [{
      message: `'Документ должен содержать столбцы: 'Имя', Фамилия','Отчество' и 'Дата'`
    }]
  }

  headerRow.forEach(cell => {
    if (!['Имя', 'Фамилия', 'Отчество', 'Дата'].includes(cell)) {
      return [{
        message: `'Документ должен содержать столбцы: 'Имя', Фамилия','Отчество' и 'Дата'`
      }]
    }
  })

  return []
}

const getHeaders = (worksheet) => {
  const headerRow = worksheet.getRow(1).values.slice(1)
  const matches =  {
    'Имя': 'name',
    'Фамилия': 'surname',
    'Отчество': 'patronymic',
    'Дата': 'date',
  }

  return headerRow.map((cell) => {
    return {
      header: cell,
      key: matches[cell]
    }
  })
}

const getDataErrors = (worksheet) => {
  const errors = []

  worksheet.eachRow((row, index) => {
    if (index < 2) {
      return
    }

    const name = row.getCell('name').value
    const surname = row.getCell('surname').value
    const date = row.getCell('date').value

    if (!name || !surname || !date) {
      errors.push({
        message: `Ошибка в строке(${index}): столбцы 'Имя', 'Фамилия' и 'Дата' обязательны для заполнения.`
      })

      return
    }

    if (isNaN(+normalizeDate(row.getCell('date').value))) {
      errors.push({
        message: `Ошибка в строке(${index}): некорректный формат даты`
      })
    }
  })

  return errors
}

const getData = (worksheet) => {
  console.log('getData')
  const data = []

  worksheet.eachRow((row, index) => {
    if (index < 2) {
      return
    }

    data.push({
      'name': row.getCell('name').value || '',
      'surname': row.getCell('surname').value || '',
      'patronymic': row.getCell('patronymic').value || '',
      'date': row.getCell('date').value || '',
    })
  })

  return data
}

const base64ToBuffer = (content) => {
  const data = content.split(';base64,').pop()

  const byteCharacters = atob(data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return Buffer.from(byteArray)
}

const normalizeDate = (date) => {
  const day = date.slice(0,2)
  const month = date.slice(3,5)
  const year = date.slice(6,10)

  return new Date(`${month}.${day}.${year}`)
}
