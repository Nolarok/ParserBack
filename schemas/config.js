import mongoose, {Schema} from 'mongoose'

const ConfigSchema = new Schema({
  numberOfParserThreads: {
    type: Number,
    default: 2,
  },
  maxPageLifeTime: {
    type: Number,
    default: 30,
  },
  maxNumberTaskExecuteAttempt: {
    type: Number,
    default: 2,
  }
})

mongoose.model('Config', ConfigSchema)
