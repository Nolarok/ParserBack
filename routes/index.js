import combineRouters from 'koa-combine-routers/index'
import api from './api'

const routes = [
  ...api
]

export default combineRouters(
  routes
)

let rList = []

routes.map(route => {
  return route.stack.map(r => {
    return rList.push(r)
  })
})

export const routesList = rList
