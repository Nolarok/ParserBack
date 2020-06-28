import mongoose from 'mongoose'
import encodeUrl from 'encodeurl'

import '../schemas/file'
import {read, getFile} from '../src/excel/index'

const File = mongoose.model('File')

export default class FileController {
  async createFile(ctx) {
    const {content, filename} = ctx.request.body

    const {errors: fileErrors, type} = await read(content)

    if (fileErrors.length) {
      ctx.status = 400
      ctx.body = {
        errors: fileErrors
      }

      return
    }

    const newFile = new File({
      data: content,
      filename,
      type
    })

    ctx.body = (await newFile.save())
  }

  async getFileContent(ctx) {
    const fileId = ctx.params.fileId

    const file = await File.findOne({_id: fileId})
      .select('data filename')

    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ctx.set('Content-Disposition', `attachment; filename="${encodeUrl(file.filename)}"`)
    ctx.body = await getFile(file.data)
  }

  async getFile(ctx) {
    let {limit = 10, offset = 0, from, to} = ctx.query
    limit = +limit
    offset = +offset

    if (ctx.params.fileId) {
      ctx.body = await File.findOne({_id: ctx.params.fileId})
        .select('-data -updated')

    } else {
      const query = {
        created: {
          $gte: from,
          $lte: to
        }
      }

      const count = await File.countDocuments(query)
      const data = await File.aggregate([
        {$lookup: {from: "jobs", localField: "_id", foreignField: "fileId", as: "jobs"}},
        {$limit: limit},
        {$skip: offset},
        {
          $project: {
            "filename": 1,
            "created": 1,
            "lastTaskId": { $max: '$jobs._id' }
          },
        },
        {$sort: {created: -1}}
      ])


      ctx.body = {data, count}
    }
  }

  async clearTable(ctx) {
    await File.deleteMany()
    ctx.body = 200
  }
}
