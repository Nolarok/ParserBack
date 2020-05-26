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


router.post('/', async (ctx) => {
  await fileCtrl.createFile(ctx)
})

router.delete('/', async (ctx) => {
  await fileCtrl.clearTable(ctx)
})

export default router
