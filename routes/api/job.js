import Router from 'koa-router'
import JobCtrl from '../../controllers/job'

const jobCtrl = new JobCtrl()
const router = new Router()

router.prefix('/api/v1/job')

router.post('/create/:fileId', async (ctx, next) => {
  await jobCtrl.create(ctx)
})

router.post('/start/:jobId', async (ctx, next) => {
  await jobCtrl.start(ctx)
})

router.delete('/:id', async (ctx, next) => {
  await jobCtrl.clearTable(ctx)
})

router.delete('/', async (ctx, next) => {
  await jobCtrl.clearTable(ctx)
})

router.get('/test', async (ctx, next) => {
  await jobCtrl.test(ctx)
})



export default router
