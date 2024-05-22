const jwt = require("jsonwebtoken")
const createError = require("http-errors")
const client = require("./redis_init")




module.exports = {

    signAccessToken: (userId) => {


        return new Promise((resolve, reject) => {

            const secret_key = process.env.ACCESS_SECRET_KEY

            const payload = {

            }

            const options = {
                expiresIn: '1h',
                audience: userId,
                
            }

            jwt.sign(payload, secret_key, options, (err, token) => {

                if (err) {
                    
                    reject(createError.InternalServerError())
                    return
                }




                resolve(token)


            })



        })


    },
    signRefreshToken: (userId) => {


        return new Promise((resolve, reject) => {


            const secret_key = process.env.ACCESS_REFRESH_KEY

            const payload = {

            }

            const options = {
                expiresIn: '1y',
                audience: userId,
                
            }

            jwt.sign(payload, secret_key, options, async (err, token) => {

                if (err) {
                    
                    reject(createError.InternalServerError())
                    return
                }

                try {
                    await client.set(userId, token, {
                        EX: 365*24*60*60
                    });
                    resolve(token)
                } catch (error) {
                    reject(createError.InternalServerError())
                }
            })



        })


    },

    verifyAccessToken: (req, res, next) => {

        let authHeader = req.headers['authorization']

        if (!authHeader) {

            return next(createError.Unauthorized())

        }

        let token = authHeader.split(' ')?.[1]

        if (!token) {

            return next(createError.Unauthorized())
        }

        jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, payload) => {

            if (err) {

                let message = err.name == 'JsonWebTokenError' ? "Unauthorized" : err.message

                return next(createError.Unauthorized(message))

            }

            req.payload = payload

            next()

        })


    },
    verifyRefreshToken: (refreshToken) => {


        return new Promise((resolve, reject) => {

            jwt.verify(refreshToken, process.env.ACCESS_REFRESH_KEY, async (err, payload) => {

                if (err) {

                    reject(createError.Unauthorized())
                    return
                }

                const userId = payload?.aud

                try {
                    const value = await client.get(userId);

                    if (value == refreshToken) {
                        resolve(userId)
                    } else {
                        reject(createError.Unauthorized())
                    }
                } catch (error) {
                    reject(createError.Unauthorized())
                }
            })


        })


    }

}