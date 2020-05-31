import mongoose from 'mongoose'

import { parseStringToCSV } from '../src/fileCheck/index'
import '../schemas/file'

const File = mongoose.model('File')

export default class FileController {
  async createFile(ctx) {
    const {content, mimeType, filename} = ctx.request.body

    const fileErrors = parseStringToCSV(content).errors

    if (fileErrors.length) {
      ctx.status = 400
      ctx.body = {
        errors: fileErrors
      }

      return
    }

    const newFile = new File({
      data: content,
      filename
    })

    ctx.body = (await newFile.save())
  }

  async getFileContent(ctx) {
    const {fileId} = ctx.request.body

    const file = await File.findOne()
      .select('data')

    const result = parseStringToCSV(file.data).data.map(row => Object.values(row))

    ctx.body = result
  }

  async getFile(ctx) {
    let {limit = 10, offset = 0} = ctx.query
    limit = +limit
    offset = +offset

    if (ctx.params.fileId) {
      ctx.body = await File.findOne({_id: ctx.params.fileId})
        .select('-data -updated')

    } else {
      const count = await File.countDocuments()
      const data = await File.find()
        .select('-data -updated')
        .sort('-created')
        .limit(limit)
        .skip(offset)


      ctx.body = { data, count }
    }
  }

  async clearTable(ctx) {
      await File.deleteMany()
      ctx.body = 200
  }
}
