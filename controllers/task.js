import mongoose from 'mongoose'
import '../schemas/task'
import '../schemas/file'

const Task = mongoose.model('Task')

export default class TaskController {
  async getTask(ctx) {
    let {limit = 10, offset = 0} = ctx.query
    limit = +limit
    offset = +offset

    if (ctx.query.byJobId) {
      ctx.body = await Task.find({jobId: ctx.params.id})
        .select('-errorTrace -payload')
        .sort('-created')
        .skip(limit * offset)
        .limit(limit)

    } else if (ctx.params.id) {
      ctx.body = await Task.findOne({_id: ctx.params.id})
        .select('-errorTrace -payload')

    } else {
      ctx.body = await Task.find()
        .select('-errorTrace -payload')
        .sort('-created')
        .skip(limit * offset)
        .limit(limit)
    }
  }

  async clearTable(ctx) {
    await Task.deleteMany()
    ctx.body = 200
  }
}
