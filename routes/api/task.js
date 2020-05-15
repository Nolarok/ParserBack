import Router from 'koa-router'
import TaskCtrl from '../../controllers/task'

const taskCtrl = new TaskCtrl()

const router = new Router()
router.prefix('/api/v1/task')

router.get('/', async (ctx, next) => {
  await taskCtrl.getTask(ctx)
})

router.get('/start/:fileId', async (ctx, next) => {
  await taskCtrl.startParse(ctx)
})

router.delete('/', async (ctx) => {
  await taskCtrl.clearTable(ctx)
})

export default router
