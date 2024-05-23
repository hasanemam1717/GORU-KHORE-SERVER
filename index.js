const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config()
// Middleware

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9fglmuq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("goruDB").collection("menu");
    const reviews = client.db("goruDB").collection("reviews"); 
    const carts = client.db("goruDB").collection("carts");
    const dataUsers = client.db("goruDB").collection("dataUsers");


    // users related api
    app.get('/allusers',async (req, res,) => {
      const result  = await dataUsers.find().toArray();
      res.send(result); 
    })
    app.post("/dataUsers", async(req , res) => {
      const data = req.body;
      const query = {email:data.email}
      const exastingUser = await dataUsers.findOne(query)
      if(exastingUser){
        return res.send({massage:"User already exist",insertedId:null})
      }
      const result = await dataUsers.insertOne(data);
      res.send(result);

    })

    app.patch('/allUsers/admin/:id', async(req, res) => {
      const id = req.params.id
      const filter = {_id : new ObjectId(id) }
      const updateDoc = { $set: { role: "admin" } }
      const result = await dataUsers.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.delete('/allusers/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id) } 
      const result = await dataUsers.deleteOne(query);
      res.send(result);
    })


    // menu related apis
    app.get('/menu' , async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.json(result);
    })
   
    app.get('/reviews' , async (req, res) => {
      const result = await reviews.find().toArray();
      res.json(result);
    })

    app.post('/carts' , async (req, res) => {
      const cartsItem = req.body
      const result = await carts.insertOne(cartsItem);
      res.json(result);
    })

    app.get('/carts' , async (req, res) => {
      const email = req.query.email
      const query = {email: email}
      const result = await carts.find(query).toArray();
      res.json(result);
    })

    app.delete('/carts/:id' , async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await carts.deleteOne(query);
      res.send(result);
    }) 




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req, res) => {
    res.send('Hello World');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})