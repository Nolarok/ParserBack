import mongoose, {Schema} from 'mongoose'

const ProxySchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },

  blocked: {
    type: Date,
    default: new Date(0)
  },

  updated: {
    type: Date,
    default: Date.now,
  },

  host: {
    type: String,
    required: true,
  },

  port: {
    type: Number,
    required: true,
  },

  login: {
    type: String,
    default: '',
  },

  password: {
    type: String,
    default: '',
  },
})

ProxySchema.static('getActive', async function getActive() {
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));

  const proxy = Proxy.findOne({
    blocked: {
      $lte: yesterday
    }
  })

  return proxy
})

ProxySchema.static('setBlocked', async function setBlocked(id) {
  const proxy = Proxy.findOneAndUpdate({
    _id: id
  }, {
    blocked: new Date()
  })

  return proxy
})

const Proxy = mongoose.model('Proxy', ProxySchema)
