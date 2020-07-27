import mongoose from 'mongoose'
import '../schemas/proxy'

const Proxy = mongoose.model('Proxy')

export default class TaskController {
  async get(ctx) {
    ctx.body = await Proxy.find()
  }

  async delete(ctx) {
    const id = ctx.params.id

    await Proxy.deleteOne({
      _id: id
    })

    ctx.body = 200
  }

  async create(ctx) {
    const {host, port, login, password} = ctx.request.body

    const newProxy = new Proxy({
      host, port, login, password
    })

    ctx.body = (await newProxy.save())
  }

}
