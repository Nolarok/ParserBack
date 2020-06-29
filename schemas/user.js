import mongoose, {Schema} from 'mongoose'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import {Roles} from "../types";

const UserSchema = new Schema({
    hash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    login: {
        type: String,
        unique: true,
        required: true
    },
    role: {
        type: String,
        default: Roles.USER
    },
    active: {
        type: Boolean,
        default: true
    },
    created: {
        type: Date,
        default: Date.now,
    }
})

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex')
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
}

UserSchema.methods.isAdmin = function() {
    return this.role ===  Roles.ADMIN
}

UserSchema.methods.validatePassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex')
    return this.hash === hash
}

UserSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today)
    expirationDate.setDate(today.getDate() + 60)

    return jwt.sign({
        id: this._id,
        login: this.login,
        exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, 'secret')
}

UserSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        login: this.login,
        token: this.generateJWT(),
    }
}

mongoose.model('User', UserSchema);
