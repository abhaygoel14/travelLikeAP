import express from 'express'
import { loginHandler as login, registerHandler as register } from '../Controllers/pgUserController.js'
// import bcrypt from 'bcryptjs'
// import jwt from 'jsonwebtoken'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)


export default router