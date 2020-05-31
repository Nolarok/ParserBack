import Router from 'koa-router'
import JobCtrl from '../../controllers/job'

const jobCtrl = new JobCtrl()
const router = new Router()

router.prefix('/api/v1/job')

router.get('/test/:jobId', async (ctx, next) => {
  console.log('ROUTE')
  await jobCtrl.test(ctx)
})

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

router.get('/unload/:jobId', async (ctx, next) => {
  await jobCtrl.unloadData(ctx)
})

router.get('/data', async (ctx, next) => {
  await jobCtrl.getTableData(ctx)
})

router.get('/:id', async (ctx, next) => {
  await jobCtrl.getJob(ctx)
})

router.get('/', async (ctx, next) => {
  await jobCtrl.getJob(ctx)
})

export default router
