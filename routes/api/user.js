import Router from 'koa-router'
import UserCtrl from "../../controllers/user";

const userCtrl = new UserCtrl()

const router = new Router()
router.prefix('/api/v1/user')

router.get('/', async (ctx, next) => {
  await userCtrl.login(ctx)
})

router.get('/list', async (ctx, next) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }

  if (!ctx.user.isAdmin()) {
    ctx.status = 403
    return
  }

  await userCtrl.getList(ctx)
})

router.delete('/drop', async (ctx, next) => {
  await userCtrl.drop(ctx)
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

  await userCtrl.delete(ctx)
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

  await userCtrl.create(ctx)
})

export default router
