const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require("cors")
const app = express()
require("dotenv").config()
const jwt = require("jsonwebtoken")

const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Access Forbidden" })
        }
        req.decoded = decoded;
        next()
    })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ltefwui.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        const categoriesCollection = client.db('recycleHub').collection("categories")
        const carsCollection = client.db('recycleHub').collection("cars")
        const usersCollection = client.db('recycleHub').collection("users");
        const ordersCollection = client.db('recycleHub').collection("orders");


        // Admin verify:
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.user?.role !== "admin") {
                return res.status(403).send({ message: "Forbidden access" })
            }
            next()
        }

        // Seller verify:
        const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.user?.role !== "seller") {
                return res.status(403).send({ message: "Forbidden access" })
            }
            next()
        }

        // // Verify Buyer:

        const verifyBuyer = async (req, res, next) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.user?.role !== "buyer") {
                return res.status(403).send({ message: "Forbidden access" })
            }
            next()
        }

        // Jwt token:

        app.get("/jwt", async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: "5h" })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ message: "Unauthorized Access" })
        })

        // category section:

        app.get("/categories", async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray()
            res.send(categories)
        })

        // cars data section:

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

        app.get("/carDetails/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const cars = await carsCollection.findOne(query)
            res.send(cars)
        })

        app.get("/categoriesId", async (req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).project({ id: 1 }).toArray()
            res.send(result)
        })

        // Cars by category_id:

        app.get("/categoryItem/:category_id", async (req, res) => {
            const category_id = req.params.category_id;
            const query = { category_id: category_id }
            const cars = await carsCollection.find(query).toArray()
            res.send(cars)
        })

        // Users Section:

        app.put("/users", async (req, res) => {
            const user = req.body.user;
            const filter = { email: user?.email }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    user: user
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // Orders Section(Buyer):

        app.get("/orders", verifyJwt, verifyBuyer, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: "Unauthorized access" })
            }
            const query = { email: email };
            const result = await ordersCollection.find(query).toArray()
            res.send(result)
        })

        app.post("/orders", async (req, res) => {
            const order = req.body
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })


        // Admin Section:

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.user?.role === "admin" })
        })

        // Buyer Section:

        app.get("/users/buyer/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            res.send({ isBuyer: user?.user?.role === "buyer" })
        })

        // Seller Section :

        app.get("/users/seller/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            res.send({ isSeller: user?.user?.role === "seller" })
        })





        // Temporary Update function:

        // app.get("/payment", async (req, res) => {
        //     const filter = {};
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             paid: false
        //         }
        //     }
        //     const result = await carsCollection.updateMany(filter, updatedDoc, options);
        //     res.send(result)
        // })


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