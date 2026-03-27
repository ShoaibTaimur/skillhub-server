const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

let client = null;

if (uri) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function run() {
  try {
    const clientDB = await client.connect();

    const skillsCollection = clientDB.db("skillhubDB").collection("skills");
    const usersCollection = clientDB.db("skillhubDB").collection("users");
    await usersCollection.createIndex({ email: 1 }, { unique: true });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const userInfo = req.body;

      const result = await usersCollection.updateOne(
        { email: userInfo.email },
        {
          $setOnInsert: {
            email: userInfo.email,
            creationTime: userInfo.creationTime,
          },
          $set: {
            name: userInfo.displayName,
            lastSignInTime: userInfo.lastSignInTime,
          },
        },
        { upsert: true },
      );

      res.send(result);
    });

    app.get("/skills", async (req, res) => {
      const data = await skillsCollection.find().toArray();
      res.send(data);
    });

    app.post("/skills", async (req, res) => {
      const data = req.body;
      const result = await skillsCollection.insertOne(data);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);
