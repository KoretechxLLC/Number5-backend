const express = require("express")
const cors = require("cors")
const authRoutes = require("./src/Routes/AuthRoutes/authRoutes")
const createError = require("http-errors")
const morgan = require("morgan")
require("./helper/mongodb_init")


const PORT = process.env.Port || 5000

const app = express()


app.use(morgan('dev'))
app.use(cors())
app.use(express.static('public'))

app.use(express.json())
app.use(express.urlencoded({extended:true}))



app.use('/auth',authRoutes)





app.use(async(req,res,next)=>{

    next(createError.NotFound())

})

app.use((err,req,res,next)=>{

        res.status(err.status || 500)

        res.json({
            status : err?.status || 500,
            message : err.message 
        })

})



app.listen(PORT, () => console.log(`App running on localhost:${PORT}`))