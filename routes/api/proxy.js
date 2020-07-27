import Router from 'koa-router'
import ProxyCtrl from '../../controllers/proxy'

const proxyCtrl = new ProxyCtrl()

const router = new Router()
router.prefix('/api/v1/proxy')

router.get('/', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }
  await proxyCtrl.get(ctx)
})

router.post('/', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }

  await proxyCtrl.create(ctx)
})

router.delete('/:id', async (ctx) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }

  await proxyCtrl.delete(ctx)
})

export default router
