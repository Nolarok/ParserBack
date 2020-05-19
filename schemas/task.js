import mongoose, {Schema} from 'mongoose'
import {TaskStatus} from '../types'

const TaskSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },

  updated: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    default: TaskStatus.CREATED,
  },

  payload: {
    type: Object,
    required: true,
  },

  result: {
    type: Array,
    default: null,
  },

  errorTrace: {
    type: String,
    default: null,
  },

  jobId: {
    type: Schema.Types.ObjectId,
  }
})


const Task = mongoose.model('Task', TaskSchema)

// Task.save((data) => {
//   console.log('save', {data})
// })

TaskSchema.post(('deleteMany'), (doc) => {
  console.log({doc})
})
//
// TaskSchema.pre(('deleteMany'), (doc) => {
//   console.log({doc})
// })
//
// TaskSchema.post(('save'), (doc) => {
//   console.log({doc})
// })
//
// TaskSchema.pre(('save'), (doc) => {
//   console.log({doc})
// })
