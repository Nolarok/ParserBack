import Koa from 'koa'
import {useMiddleware} from './middleware'
import env from 'dotenv'
import routes from './routes'
import {dbConnect} from './src/db'

async function start() {
  env.config()

  console.log({
    DB_NAME: process.env.DB_NAME,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    SERVER_HOST: process.env.SERVER_HOST,
    SERVER_PORT: process.env.SERVER_PORT,
  })

  const app = new Koa()

  await dbConnect({
    name: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
  })

  useMiddleware(app)
  app.use(routes())

  app.listen(
    process.env.SERVER_PORT,
    process.env.SERVER_HOST,
    () => {
      console.info(
        `Start server on ${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`
      )
    }
  )
}

start()
