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
    ctx.body = await File.find()
  }

  async clearTable(ctx) {
      await File.deleteMany()
      ctx.body = '200'
  }
}
