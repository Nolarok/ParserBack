import mongoose from "mongoose"
import {generateResponseError, JobStatus, ResponseError} from '../types'

import '../schemas/job'
import {parseStringToCSV} from "../src/fileCheck"

const ObjectId = mongoose.Types.ObjectId
const Job = mongoose.model('Job')
const Task = mongoose.model('Task')
const File = mongoose.model('File')

export default class JobController {
  async create(ctx) {
    const fileId = new ObjectId(ctx.params.fileId)

    const newJob = new Job({
      fileId,
      status: JobStatus.CREATED,
    })

    await newJob.save()

    const file = await File.findOne({_id: fileId})
    let data = parseStringToCSV(file.data).data

    data = data.map(item => {
      return {payload: item, jobId: newJob._id}
    })

    await Task.insertMany(data, (errors) => {
      errors && console.error(errors)
    })

    ctx.body = newJob._id
  }

  async start(ctx) {
    const jobId = new ObjectId(ctx.params.jobId)
    const job = await Job.findOne({_id: jobId})

    if (!job) {
      [ctx.body, ctx.status] = generateResponseError(ResponseError.RECORD_NOT_FOUND, {document: 'Job', id: jobId})
      return
    }

    if (job.status === JobStatus.COMPLETED) {
      ctx.status = 200
      return
    }

    const hasActiveJob = Boolean(await Job.findOne({status: JobStatus.PROCESS}))

    await Job.updateOne(
      {_id: jobId},
      {status: hasActiveJob ? JobStatus.QUEUE : JobStatus.PROCESS},
      null,
      (error) => {
        if (!error) {
          !hasActiveJob && Job.startParse(job)
        }
      }
    )

    ctx.status = hasActiveJob ? 202 : 200
  }

  async clearTable(ctx) {
    if (ctx.params.id === undefined) {
      await Job.deleteMany()
    } else {
      await Job.deleteOne({
        _id: new ObjectId(ctx.params.id)
      })
    }

    ctx.body = 200
  }

  async unloadDataString(ctx) {
    const response = await Task.find({
      jobId: ctx.params.jobId
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

  async unloadData(ctx) {
    const response = await Task.find({
      jobId: ctx.params.jobId
    })

    const result = response.reduce((acc, item) => {
      if (Array.isArray(item.result)) {
        const data = item.result.map((row) => {
          row[0] = row[0].replace(/<div.+div/gm, '')
          return row.filter((cell) => {
            return !~cell.indexOf('<h3>')
          })
        })

        acc = [...acc, ...data]
      }

      return acc
    }, [])

    ctx.body = result
  }

  async getTableData(ctx) {
    let {limit = 10, offset = 0} = ctx.query
    limit = +limit
    offset = +offset

    const jobs = await Job.find()
      .sort('-created')
      .skip(limit * offset)
      .limit(10)

    ctx.body = jobs
  }

  async getJob(ctx) {
    let {limit = 10, offset = 0} = ctx.query
    limit = +limit
    offset = +offset

    if (ctx.query.byFileId) {
      ctx.body = await Job.find({fileId: ctx.params.id})
        .sort('-created')
        .skip(limit * offset)
        .limit(limit)
    } else if (ctx.params.id) {
      ctx.body = await Job.findOne({_id: ctx.params.id})
    } else {
       const result = await Job.find()
        .sort('-created')
        .skip(limit * offset)
        .limit(limit)

      const count = await Job.countDocuments()

      ctx.body = {
        data: result,
        count
      }
    }
  }
}
