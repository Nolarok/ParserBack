import Excel from 'exceljs'
import atob from "atob"

const columns = [
  {header: 'Должник', key: 'debtor', width: 40},
  {header: 'Исполнительное производство', key: 'exec_production', width: 40},
  {header: 'Реквизиты исполнительного документа', key: 'requisites', width: 40},
  {header: 'Дата, причина окончания или прекращения ИП', key: 'date_and_reason', width: 40},
  {header: 'Предмет исполнения, сумма непогашенной задолженности', key: 'subject_and_amount', width: 40},
  {header: 'Отдел судебных приставов', key: 'department_of_bailiffs', width: 40},
  {header: 'Судебный пристав-исполнитель', key: 'bailiff', width: 40},
]

export const DocumentType = {
  IP: 'IP',
  FIO: 'FIO'
}

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

    const documentType = getDocumentType(worksheet)

    const headerErrors = getHeadersErrors(worksheet, documentType)

    if (headerErrors.length) {
      return {errors: headerErrors}
    }

    worksheet.columns = getHeaders(worksheet, documentType)

    const dataErrors = getDataErrors(worksheet, documentType)

    if (dataErrors.length) {
      return {errors: dataErrors}
    }

    const data = getData(worksheet, documentType)

    return {data, errors: [], type: documentType}
  } catch (error) {
    console.error(error)
    return {
      errors: ['Ошибка сервера']
    }
  }

}

// TODO update_checker_func
const getDocumentType = (worksheet) => {
  const headerRow = worksheet.getRow(1).values.slice(1)

  return headerRow.length === 1 ? DocumentType.IP : DocumentType.FIO
}

const getHeadersErrors = (worksheet, type) => {
  const headerRow = worksheet.getRow(1).values.slice(1)

  if (type === DocumentType.FIO) {
    if (headerRow.length !== 4) {
      return [{
        message: `Документ должен содержать столбцы: 'Имя', Фамилия','Отчество' и 'Дата'`
      }]
    }

    headerRow.forEach(cell => {
      if (!['Имя', 'Фамилия', 'Отчество', 'Дата'].includes(cell)) {
        return [{
          message: `Документ должен содержать столбцы: 'Имя', Фамилия','Отчество' и 'Дата'`
        }]
      }
    })
  }

  if (type === DocumentType.IP) {
    headerRow.forEach(cell => {
      if (!['Номер ИП'].includes(cell)) {
        return [{
          message: `Документ должен содержать столбец: 'Номер ИП'`
        }]
      }
    })
  }

  return []
}

const getHeaders = (worksheet, type) => {
  const headerRow = worksheet.getRow(1).values.slice(1)

  if (type === DocumentType.FIO) {
    const matches = {
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

  if (type === DocumentType.IP) {
    const matches = {
      'Номер ИП': 'ip_number',
    }

    return headerRow.map((cell) => {
      return {
        header: cell,
        key: matches[cell]
      }
    })
  }
}

const getDataErrors = (worksheet, type) => {
  const errors = []

  if (type === DocumentType.FIO) {
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
  }

  if (type === DocumentType.IP) {
    worksheet.eachRow((row, index) => {
      if (index < 2) {
        return
      }

      const ipNumber = row.getCell('ip_number').value

      if (!ipNumber) {
        errors.push({
          message: `Ошибка в строке(${index}): столбец 'Номер ИП', обязателен для заполнения.`
        })
      }
    })
  }

  return errors
}

const getData = (worksheet, type) => {
  const data = []

  if (type === DocumentType.FIO) {
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
  }

  if (type === DocumentType.IP) {
    worksheet.eachRow((row, index) => {
      if (index < 2) {
        return
      }

      data.push({
        'ipNumber': row.getCell('ip_number').value || '',
      })
    })
  }


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
  const day = date.slice(0, 2)
  const month = date.slice(3, 5)
  const year = date.slice(6, 10)

  return new Date(`${month}.${day}.${year}`)
}
