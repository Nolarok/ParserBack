import Router from 'koa-router'
import user from './user'
import task from './task'
import file from './file'
import job from './job'

const router = new Router()

router.get('/', (ctx, next) => {
  ctx.body = 'Empty page'
})

export default [ user, task, file, job ]
