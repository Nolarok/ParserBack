import mongoose from 'mongoose'
import '../schemas/task'
import '../schemas/file'
import {TaskStatus} from '../types'
import {RESULT} from '../src/pupParser/types'

import {parseStringToCSV} from "../src/fileCheck"
import {FSSPParser} from '../src/pupParser'

const Task = mongoose.model('Task')
const File = mongoose.model('File')
const ObjectId = mongoose.Types.ObjectId

export default class TaskController {
  async getTask(ctx) {
    ctx.body = 'getTask'
  }

  async startParse(ctx) {
    const file = await File.findOne({_id: new ObjectId(ctx.params.fileId)})
    let data = parseStringToCSV(file.data).data
    data = data.map(item => {
      return {payload: item, fileId: ctx.params.fileId}
    })

    await Task.insertMany(data, (errors, docs) => {
      if (errors) {
        console.error(errors)
        return
      }

      const result = docs.reduce((acc, row) => {
        const newRow = {
          'id': new ObjectId(row._id),
          'Имя': row.payload.name,
          'Фамилия': row.payload.surname,
          'Отчество': row.payload.patronymic,
          'Дата': row.payload.date,
        }

        acc.push(newRow)

        return acc
      }, [])

      FSSPParser(
        result,
        (data) => {
          Task.updateOne({_id: new ObjectId(data.id)}, {status: TaskStatus.PROCESS})
            .then(data => {
              // console.log('before', data)
            })
            .catch(error => {
              console.error('before', error)
            })
        },
        (data, result) => {
          if (result.result === RESULT.SUCCESS) {
            Task.updateOne({_id: new ObjectId(data.id)}, {status: TaskStatus.COMPLETED, result: result.data.parseTable})
              .then(data => {
                // console.log('after', data)
              })
              .catch(error => {
                console.error('after', error)
              })
          } else {
            Task.updateOne({_id: new ObjectId(data.id)}, {status: TaskStatus.ERROR, errorTrace: result.error.stack})
              .then(data => {
                // console.log('update', data)
              })
              .catch(error => {
                console.error(error)
              })
          }
        }
      )
    })

    ctx.body = 200
  }

  async clearTable(ctx) {
    await Task.deleteMany()
    ctx.body = '200'
  }
}
