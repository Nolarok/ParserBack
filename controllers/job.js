import mongoose from "mongoose"
import {generateResponseError, JobStatus, ResponseError, TaskStatus} from '../types'

import '../schemas/job'
import {generate, read} from '../src/excel/index'
import addMonths from 'date-fns/addMonths'
import addDays from 'date-fns/addDays'

const ObjectId = mongoose.Types.ObjectId
const Job = mongoose.model('Job')
const Task = mongoose.model('Task')
const File = mongoose.model('File')

const matchesFIO = {
  0: 'debtor',
  1: 'exec_production',
  2: 'requisites',
  3: 'date_and_reason',
  4: 'subject_and_amount',
  5: 'department_of_bailiffs',
  6: 'bailiff',
}

export default class JobController {
  async create(ctx) {
    const fileId = new ObjectId(ctx.params.fileId)

    const newJob = new Job({
      fileId,
      status: JobStatus.CREATED,
    })

    await newJob.save()

    const file = await File.findOne({_id: fileId})
    let data = (await read(file.data)).data

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

  async unloadData(ctx) {
    const response = await Task.find({
      jobId: ctx.params.jobId
    })

    const filename = await Job.getFileName(ctx.params.jobId)

    const result = response.map((task) => {
      return task.result.map((result) => {
        return result.reduce((acc, item, index) => {
          acc[matchesFIO[index]] = item

          return acc
        }, {})
      })
    }).flat()

    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ctx.set('Content-Disposition', `attachment; filename="report.xlsx"`)
    ctx.body = await generate(result)
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
    let {
      limit = 10,
      offset = 0,
      from = addMonths(new Date(), -1),
      to = addDays(new Date(), 1)
    } = ctx.query

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
      const query = {
        created: {
          $gte: from,
          $lte: to
        }
      }

      let count, response

      if(ctx.query.search) {
        const data = await this.search(ctx, ctx.query.search)
        count = data.count
        response = data.jobs
      } else {
        count = await Job.countDocuments(query)
        response = await Job.find(query)
          .sort('-created')
          .skip(limit * offset)
          .limit(limit)
      }

      const result = []

      for (let i = 0; i < response.length; i++) {
        const job = response[i].toObject()
        job.fileName = await Job.getFileName(job._id)
        job.tasksState = {
          failed: await Task.countDocuments({jobId: response[i]._id, status: TaskStatus.ERROR}) | NaN,
          completed: await Task.countDocuments({jobId: response[i]._id, status: TaskStatus.COMPLETED}) | NaN,
          summary: await Task.countDocuments({jobId: response[i]._id}) | NaN,
          notProcessed: await Task.countDocuments({
            jobId: response[i]._id,
            status: {$in: [TaskStatus.CREATED, TaskStatus.QUEUE]}
          }) | NaN
        }

        result.push(job)
      }

      ctx.body = {
        data: result,
        count
      }
    }
  }

  async search(ctx, str) {
    const resultById = await Job.findOne({_id: str})
      .catch(error => {})

    if (resultById) {
      return {count: resultById.length, jobs: [resultById]}
    }

    return await Job.findByFileName(ctx, str)
  }

  async test(ctx) {
    const result = await generate()

    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ctx.body = result
  }
}
