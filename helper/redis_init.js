const {createClient} = require("redis")


const client =  createClient({
    port: 6379,
    host: '127.0.0.1'
})


client.connect();


client.on("connect", () => {

    console.log("client connected to redis")

})

client.on("error", (err) => {

    console.error(err.message,"message")

})

client.on("ready", () => {

    console.log("client connected to redis and ready to use")

})

client.on('end', () => {

    client.disconnect()

    console.log("client disconnected from redis")

})

client.on('SIGINT', () => {
    client.quit()
})


module.exports = client