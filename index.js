const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
let client = null;
let dbInitPromise = null;

app.get("/", (_req, res) => {
  res.send("Server is running");
});

async function getCollections() {
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  if (!dbInitPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    dbInitPromise = client.connect().then(async (connectedClient) => {
      const db = connectedClient.db("skillhubDB");
      const usersCollection = db.collection("users");
      const skillsCollection = db.collection("skills");

      await usersCollection.createIndex({ email: 1 }, { unique: true });
      await connectedClient.db("admin").command({ ping: 1 });

      console.log(
        "Pinged your deployment. You successfully connected to MongoDB!",
      );

      return { usersCollection, skillsCollection };
    });
  }

  return dbInitPromise;
}

app.get("/users", async (_req, res) => {
  try {
    const { usersCollection } = await getCollections();
    const result = await usersCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { usersCollection } = await getCollections();
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
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/skills", async (_req, res) => {
  try {
    const { skillsCollection } = await getCollections();
    const data = await skillsCollection.find().toArray();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

app.post("/skills", async (req, res) => {
  try {
    const { skillsCollection } = await getCollections();
    const data = req.body;
    const result = await skillsCollection.insertOne(data);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

app.get("/skills/:id", async (req, res) => {
  try {
    const { skillsCollection } = await getCollections();
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await skillsCollection.findOne(query);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
});

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
