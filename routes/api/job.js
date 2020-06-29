import Router from 'koa-router'
import JobCtrl from '../../controllers/job'
import {Roles} from "../../types";

const jobCtrl = new JobCtrl()
const router = new Router()

router.prefix('/api/v1/job')

router.get('/test/:jobId', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.test(ctx)
})

router.post('/create/:fileId', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.create(ctx)
})

router.post('/start/:jobId', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.start(ctx)
})

router.delete('/:id', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }
  await jobCtrl.clearTable(ctx)
})

router.delete('/', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }
  await jobCtrl.clearTable(ctx)
})

router.get('/unload/:jobId', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.unloadData(ctx)
})

router.get('/data', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.getTableData(ctx)
})

router.get('/:id', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.getJob(ctx)
})

router.get('/', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.getJob(ctx)
})

router.get('/search/:str', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await jobCtrl.search(ctx)
})

export default router
