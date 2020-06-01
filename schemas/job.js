import mongoose, {Schema} from 'mongoose'
import {JobStatus, TaskStatus} from '../types'
import {FSSPParser} from "../src/pupParser"
import {RESULT} from "../src/pupParser/types"
import {DocumentType} from '../src/excel'


const JobSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    default: JobStatus.CREATED
  },

  updated: {
    type: Date,
    default: Date.now,
  },

  fileId: {
    type: Schema.Types.ObjectId,
  }
})

const Task = mongoose.model('Task')
const File = mongoose.model('File')
const ObjectId = mongoose.Types.ObjectId

JobSchema.pre('deleteOne', async function () {
  const jobId = this.getQuery()["_id"]
  await Task.deleteMany({jobId})
})

JobSchema.pre('deleteMany', async function () {
  // TODO добавить_обработку_запроса
  await Task.deleteMany()
})

JobSchema.static('getFileName', async function (_id) {
  const job = await Job.findOne({_id})
  const file = await File.findOne({_id: job.fileId})
  return file.filename
})



JobSchema.static('startParse', async function startParse(job) {
  if (!job) {
    job = await Job.findOne({
      status: JobStatus.QUEUE
    })

    if (!job) {
      return
    }
  }

  const {type} = await File.findOne({_id: job.fileId})

  const jobId = job._id

  if (job.status === JobStatus.QUEUE) {
    await Job.updateOne({_id: jobId}, {status: JobStatus.PROCESS})
  } else {
    console.assert(job.status === JobStatus.PROCESS, 'StartParse: unexpected Job status')
  }

  const docs = await Task.find({
    jobId: new ObjectId(jobId),
    status: {$in: [TaskStatus.CREATED, TaskStatus.ERROR]}
  })

  await Task.updateMany(
    {
      jobId,
      status: {$in: [TaskStatus.CREATED, TaskStatus.ERROR]}
    },
    {status: TaskStatus.QUEUE}
  )

  let tasks

  if (type === DocumentType.FIO) {
    tasks = docs.reduce((acc, row) => {
      acc.push({
        'id': new ObjectId(row._id),
        'Имя': row.payload.name,
        'Фамилия': row.payload.surname,
        'Отчество': row.payload.patronymic,
        'Дата': row.payload.date,
      })

      return acc
    }, [])
  }

  if (type === DocumentType.IP) {
    tasks = docs.reduce((acc, row) => {
      acc.push({
        'id': new ObjectId(row._id),
        'Номер_ИП': row.payload.ipNumber,
      })

      return acc
    }, [])
  }

  await FSSPParser(
    type,
    tasks,
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
    },
  )

  const jobHasErrors = await Task.findOne({jobId, status: TaskStatus.ERROR})
  await Job.updateOne({_id: jobId}, {status: jobHasErrors ? JobStatus.COMPLETED_WITH_ERRORS : JobStatus.COMPLETED})
  startParse()
})

const Job = mongoose.model('Job', JobSchema)
