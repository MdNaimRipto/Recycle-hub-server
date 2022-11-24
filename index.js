const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const cors = require("cors")
const app = express()
require("dotenv").config()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// const categories = require("./categories.json")


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ltefwui.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        const categoriesCollection = client.db('recycleHub').collection("categories")
        const carsCollection = client.db('recycleHub').collection("cars")

        app.get("/categories", async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray()
            res.send(categories)
        })

        app.get("/allCars", async (req, res) => {
            const query = {};
            const cars = await carsCollection.find(query).toArray()
            res.send(cars)
        })
        app.get("/latestCars", async (req, res) => {
            const query = {};
            const cursor = carsCollection.find(query).sort({ _id: -1 })
            const cars = await cursor.limit(3).toArray()
            res.send(cars)
        })

        app.get("/categoryItem/:category_id", async (req, res) => {
            const category_id = req.params.category_id;
            const query = { category_id: category_id }
            const cars = await carsCollection.find(query).toArray()
            res.send(cars)
        })
    }
    finally {

    }
}
run().catch(err => console.error(err))


app.get("/", (req, res) => {
    res.send("Recycle Hub Server is Running")
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})