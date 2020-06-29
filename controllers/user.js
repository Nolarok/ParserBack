import mongoose from 'mongoose'
import passport from 'koa-passport'

import '../schemas/user'
import {Roles} from "../types";


const User = mongoose.model('User')

setAdminUser()

export default class UserController {
  async login(ctx, next) {
    await passport.authenticate('local', (error, user, info) => {
      if (error) {
        ctx.status = 400
        console.error(error)
        return
      }

      if (user) {
        user.token = user.generateJWT()
        ctx.body = {token: user.token}
        return
      }
    })(ctx, next)

    return ctx
  }

  async create(ctx, next) {
    const {password, login} = ctx.request.body

    if (await User.findOne({login})) {
      ctx.status = 400
      ctx.body = {message: `Авторизация: Пользователь '${login}' уже существует`}
      return
    }

    const newUser = new User({
      password,
      login,
      role: Roles.USER
    })

    newUser.setPassword(password)

    const _id = (await newUser.save())._id

    ctx.body = {_id, login, role: Roles.USER}
  }

  async getList(ctx) {
    const users = await User.find({role: Roles.USER})
      .select('login role')

    ctx.body = users
  }

  async delete(ctx) {
    const id = ctx.params.id

    const user = await User.findOne({_id: id})

    if (user && user.role !== Roles.ADMIN) {
      await User.deleteOne({_id: id})
      ctx.status = 200
    } else {
      ctx.status = 400
    }
  }
}

async function setAdminUser() {
  try {
    const adminUserExist = await User.findOne({role: Roles.ADMIN})

    if (!adminUserExist) {
      const admin = new User({
        role: Roles.ADMIN,
        login: 'admin@admin.ru'
      })

      admin.setPassword('admin')

      await admin.save()
    }

  } catch (error) {
    console.error(error)
  }
}