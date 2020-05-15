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
    default: TaskStatus.QUEUE,
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

  fileId: {
    type: Schema.Types.ObjectId,
  }
})


mongoose.model('Task', TaskSchema)
