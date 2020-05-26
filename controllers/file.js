import mongoose from 'mongoose'

import { parseStringToCSV } from '../src/fileCheck/index'
import '../schemas/file'

const File = mongoose.model('File')

export default class FileController {
  async createFile(ctx) {
    const {content, mimeType} = ctx.request.body

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
    })

    ctx.body = (await newFile.save())._id
  }

  async getFile(ctx) {
    let {limit = 10, offset = 0} = ctx.query
    limit = +limit
    offset = +offset

    if (ctx.params.fileId) {
      ctx.body = await File.findOne({_id: ctx.params.fileId})
        .select('-data -updated')
    } else {
      ctx.body = await File.find()
        .select('-data -updated')
        .sort('-created')
        .limit(limit)
        .skip(offset)
    }
  }

  async clearTable(ctx) {
      await File.deleteMany()
      ctx.body = 200
  }
}
