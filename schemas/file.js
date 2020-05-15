import mongoose, {Schema} from 'mongoose'

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

  isValid: {
    type: Boolean,
  }
})

FileSchema.post('save', () => {
  console.log('FileSchema.post')
})

mongoose.model('File', FileSchema)
