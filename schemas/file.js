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

  isValid: {
    type: Boolean,
  }
})

FileSchema.post('save', () => {
  console.log('FileSchema.post')
})

mongoose.model('File', FileSchema)
