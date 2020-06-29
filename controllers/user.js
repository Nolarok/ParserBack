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

        if (!ctx.user) {
            ctx.status = 401
            return
        }

        if (!ctx.user.isAdmin()) {
            ctx.status = 403
            return
        }

        if (await User.findOne({login})) {
            ctx.status = 400
            ctx.body = {message: `Пользователь '${login}' уже существует`}
            return
        }

        const newUser = new User({
            password,
            login,
            role: Roles.USER
        })

        newUser.setPassword(password)

        const id = (await newUser.save())._id

        ctx.body = id
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