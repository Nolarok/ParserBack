import mongoose from 'mongoose'
import '../schemas/task'
import '../schemas/file'

import {parseStringToCSV} from "../src/fileCheck"

const Task = mongoose.model('Task')
const File = mongoose.model('File')
const ObjectId = mongoose.Types.ObjectId

export default class TaskController {
  async getTask(ctx) {
    ctx.body = 'getTask'
  }

  async clearTable(ctx) {
    await Task.deleteMany()
    ctx.body = '200'
  }

  async getResult(ctx) {
    const response = await Task.find({
      fileId: ctx.params.fileId,
    })

    const result = response.reduce((acc, item) => {
      if (Array.isArray(item.result)) {
        const data = item.result.map((row) => {
          return row.filter((cell) => {
            return !~cell.indexOf('<h3>')
          })
        })

        acc = [...acc, ...data]
      }

      return acc
    }, [])

    const temp = result.map(row => {
      const modCurrentRow = row.map((cell) => {
        return cell.replace(/,/g, ' ')
      })

      return modCurrentRow.join(',')
    })

    ctx.body = temp.join('\n')

  }
}
