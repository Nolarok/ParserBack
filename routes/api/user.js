import Router from 'koa-router'

const router = new Router()
router.prefix('/api/v1/user')

router.get('/', async (ctx, next) => {
  ctx.body = 'user'
})

export default router
