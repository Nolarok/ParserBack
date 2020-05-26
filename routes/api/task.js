import Router from 'koa-router'
import TaskCtrl from '../../controllers/task'

const taskCtrl = new TaskCtrl()

const router = new Router()
router.prefix('/api/v1/task')

router.get('/:id', async (ctx, next) => {
  await taskCtrl.getTask(ctx)
})

router.get('/', async (ctx, next) => {
  await taskCtrl.getTask(ctx)
})

router.get('/data/:fileId', async (ctx, next) => {
  await taskCtrl.getResult(ctx)
})

router.delete('/', async (ctx) => {
  await taskCtrl.clearTable(ctx)
})

export default router
