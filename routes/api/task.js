import Router from 'koa-router'
import TaskCtrl from '../../controllers/task'

const taskCtrl = new TaskCtrl()

const router = new Router()
router.prefix('/api/v1/task')

router.get('/:id', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await taskCtrl.getTask(ctx)
})

router.get('/', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await taskCtrl.getTask(ctx)
})

router.get('/data/:fileId', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await taskCtrl.getResult(ctx)
})

router.delete('/', async (ctx) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }
  await taskCtrl.clearTable(ctx)
})

export default router
