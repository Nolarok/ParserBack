import cors from "@koa/cors"
import bodyParser from "koa-bodyparser"

export function useMiddleware(app) {
  app.use(cors())

  app.use(async function responseTime(ctx, next) {
    const t1 = Date.now()
    await next()
    const t2 = Date.now()
    ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms')
  })

  app.use(bodyParser({
    enableTypes: ['json', 'form'],
    jsonLimit: '1mb'
  }))

  // app.use(async (ctx, next) => {
  //   await passport.authenticate('jwt', async (error, user) => {
  //     ctx.user = user
  //
  //     await next()
  //   })(ctx, next)
  // })
}
