const express = require('express')
const cors = require("cors")
const app = express()
require("dotenv").config()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const categories = require("./categories.json")

app.get("/categories", (req, res) => {
    res.send(categories)
})

app.get("/", (req, res) => {
    res.send("Recycle Hub Server is Running")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})