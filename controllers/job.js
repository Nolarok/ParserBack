import mongoose from "mongoose"
import {TaskStatus, JobStatus} from '../types'
import {RESULT} from '../src/pupParser/types'

import '../schemas/job'
import {parseStringToCSV} from "../src/fileCheck"
import {FSSPParser} from '../src/pupParser'

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
      if (errors) {
        console.error(errors)
      }
    })

    ctx.body = newJob._id
  }

  async start(ctx) {
    const jobId = new ObjectId(ctx.params.jobId)

    const job = await Job.findOne({_id: jobId})
    const hasActiveJob = await Job.findOne({status: JobStatus.PROCESS})

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

  async test(ctx) {

  }
}
