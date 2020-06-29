import cors from "@koa/cors"
import bodyParser from "koa-bodyparser"
import passport from 'koa-passport'
import LocalStrategy from "passport-local";
import {ExtractJwt, Strategy as JwtStrategy} from "passport-jwt";
import mongoose from "mongoose";

export function useMiddleware(app) {
    const User = mongoose.model('User')

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

    passport.use(new LocalStrategy(
        {
            usernameField: 'login',
            passwordField: 'password',
            session: false
        },
        async (login, password, done) => {
            let user

            try {
                user = await User.findOne({login})

                if (!user || !user.validatePassword(password)) {
                    return done(null, false, 'Проверьте правильность ввода данных')
                }

                return done(null, user)

            } catch (error) {
                return done(error)
            }
        }))

    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'secret'
    }

    passport.use(new JwtStrategy(jwtOptions, async function (payload, done) {
            // console.log('JwtStrategy', payload)
            User.findOne({login: payload.login})
                .then(user => {
                    user ? done(null, user) : done(null, false)
                })
                .catch(error => (done(error)))
        })
    )

    app.use(async (ctx, next) => {
        await passport.authenticate('jwt', async (error, user) => {
            ctx.user = user

            await next()
        })(ctx, next)
    })
}
