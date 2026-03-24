const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { MongoClient, ServerApiVersion } = require("mongodb")

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = process.env.MONGODB_URI

let client = null

if (uri) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })
}

app.get("/", (_req, res) => {
  res.send("Server is running")
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
