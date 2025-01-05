const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://first-project-308dc.web.app",
      "https://first-project-308dc.firebaseapp.com/",
    ],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.pyoefad.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const ClassesCollection = client
      .db("EscapeTheMatrix")
      .collection("ClassesCollection");
    const UserCollection = client
      .db("EscapeTheMatrix")
      .collection("UserCollection");

    const TeachRequestCollection = client
      .db("EscapeTheMatrix")
      .collection("TeachRequestCollection");

    const ClassEnrollCollection = client
      .db("EscapeTheMatrix")
      .collection("ClassEnrollCollection");

    // const ClassAddCollection = client
    //   .db("EscapeTheMatrix")
    //   .collection("ClassAddCollection");

    const AssignmentCollection = client
      .db("EscapeTheMatrix")
      .collection("AssignmentCollection");

    const FeedbackCollection = client
      .db("EscapeTheMatrix")
      .collection("FeedbackCollection");

    const SubmittedAssignmentCollection = client
      .db("EscapeTheMatrix")
      .collection("SubmittedAssignmentCollection");

    // Jwt Related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };
