import mongoose from 'mongoose'
import passport from 'koa-passport'
import LocalStrategy from 'passport-local'
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt'

const User = mongoose.model('User')

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

    } catch(error) {
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


// KoaPassport.serializeUser((user, done) => {
//   done(null, user._id)
// })
//
// KoaPassport.deserializeUser((id, done) => {
//   Users.findById({_id: id})
//     .then(user => {
//       done(null, user)
//     })
//     .catch(error => {
//       done(error)
//     })
// })
