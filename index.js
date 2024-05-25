const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
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

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'1h'});
      res.send(token);
    })

    // middleware
    const verifyToken = async (req,res,next) => {
      console.log("Inside verify token",req.headers.authorization);
      if(!req.headers.authorization ){
 
        return res.status(401).send({
          message: "No token provided!"
        });
      }
      const token  = await req.headers.authorization.split(" ")[1];
     await jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded) =>{
      if(err){
        return res.status(401).send({
          message: "Invalid token!"
        });

      }
      req.decoded = decoded;
      console.log( decoded);
      next();
 
     })
      // next();

    }

    const verifyAdmin =async (req,res,next) => {
      const email = await req?.decoded?.email;
      console.log(2,await req?.decoded);
      const query = {email: email ? email:""}
      const user = await dataUsers.findOne(query)
      console.log(1,user);
      const isAdmin = user?.role === "admin"  
      if(!isAdmin){
        return res.status(403).send({
          message: "You are not admin!"
        });
       
      }
      next()

    }

    // users related api
    app.get('/allusers',async (req, res,) => {
      const result  = await dataUsers.find().toArray();
      res.send(result); 
    })
    app.post("/dataUsers", async(req , res) => {
      const data = req.body.email
      const query = {email:data.email}
      const exastingUser = await dataUsers.findOne(query)
      if(exastingUser){
        return res.send({massage:"User already exist",insertedId:null})
      }
      const result = await dataUsers.insertOne(data);
      res.send(result);

    })

    app.get('/allusers/admin/:email',verifyToken, async(req, res) => {
      const email  = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({massage:"User already exist"})
      }
      const query = {email: email}
      const user = await dataUsers.findOne(query);
      let isAdmin = false
      if(user){
        isAdmin = user.role === "admin"

      }
      res.send({isAdmin})
    })

    app.patch('/allusers/admin/:id',verifyToken,verifyAdmin, async(req, res) => {
      const id = req.params.id
      const filter = {_id : new ObjectId(id) }
      const updateDoc = { $set: { role: "admin" } }
      const result = await dataUsers.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.delete('/allusers/:id',verifyToken, verifyAdmin, async (req, res) => {
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