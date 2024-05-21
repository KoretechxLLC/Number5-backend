const mongoose = require('mongoose')
require('dotenv').config()

const Mongodb_url = process.env.Mongodb_url


mongoose.connect(Mongodb_url).then((res)=>{


    console.log("mongodb connected")



}).catch((error)=>{
    console.error(error,"database not connected")
})



mongoose.connection.on("connected",()=>{

        console.log("Mongoose connected to db")

})


mongoose.connection.on("error",(err)=>{

    console.error(err?.message)

})


mongoose.connection.on("disconnected",(err)=>{

    console.log("Mongoose connection is disconnected")
})


process.on('SIGINT',async () => {

        await mongoose.connection.close()
        process.exit(0)
}) 