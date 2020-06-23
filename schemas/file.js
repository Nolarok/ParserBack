import mongoose, {Schema} from 'mongoose'
import { format } from 'date-fns'


const FileSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },

  updated: {
    type: Date,
    default: Date.now,
  },

  data: {
    type: String,
    required: true,
  },

  filename: {
    type: String,
    default: format(new Date(), 'dd.MM.yyyy hh:mm')
  },

  type: {
    type: String,
    required: true
  }
})

const Task = mongoose.model('Task')


FileSchema.post('save', () => {
  console.log('FileSchema.post')
})

FileSchema.static('getLastTask', async function(fileId) {
  return await Task.findOne({fileId})
    .select('_id')
    .sort('-created')
    .limit(1)
})

mongoose.model('File', FileSchema)
