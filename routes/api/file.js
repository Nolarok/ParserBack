import Router from 'koa-router'
import FileCtrl from '../../controllers/file'

const fileCtrl = new FileCtrl()

const router = new Router()
router.prefix('/api/v1/file')

router.get('/', async (ctx) => {
  await fileCtrl.getFile(ctx)
})

router.get('/:fileId', async (ctx) => {
  await fileCtrl.getFile(ctx)
})

router.get('/content/:fileId', async (ctx) => {
  await fileCtrl.getFileContent(ctx)
})

router.post('/', async (ctx) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await fileCtrl.createFile(ctx)
})

router.delete('/', async (ctx) => {
  if (!ctx.user) {
    ctx.status = 401
    return
  }
  await fileCtrl.clearTable(ctx)
})

export default router
