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

    // User verify Admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded?.email;
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (isAdmin) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // User Related API
    app.get("/allusers", verifyToken, async (req, res) => {
      const result = await UserCollection.find().toArray();
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await UserCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already Exist", insertedId: null });
      }
      const result = await UserCollection.insertOne(user);
      res.send(result);
    });

    // Finding admin
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email != req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // Get profile Info
    app.get("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await UserCollection.findOne(query);
      res.send(result);
    });

    // finding Teacher
    app.get("/users/teacher/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email != req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Accesss" });
      }
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      let teacher = false;
      if (user) {
        teacher = user?.role === "teacher";
      }
      res.send({ teacher });
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await UserCollection.deleteOne(query);
      res.send(result);
    });

    // Making Admin
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await UserCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Making Teacher
    // ====================================>
    app.patch("/user/teacherrequest/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const updatedDoc = {
        $set: {
          role: "teacher",
          approved: true,
        },
      };
      const result = await UserCollection.updateOne(query, updatedDoc);
      const result2 = await TeachRequestCollection.updateOne(query, updatedDoc);
      res.send({ result, result2 });
    });

    // ===========================================>

    // getting teaccher req for admin
    app.get("/teacherreq", async (req, res) => {
      const result = await TeachRequestCollection.find().toArray();
      res.send(result);
    });

    // Disabling the reject button in admin pages
    app.delete("/user/teache-reject/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await TeachRequestCollection.deleteOne(query);
      res.send(result);
    });

    // Getting all the classes for admin
    app.get("/classatadmin", async (req, res) => {
      const result = await ClassesCollection.find().toArray();
      res.send(result);
    });

    // Search Functionalities
    app.get("/search:email", async (req, res) => {
      const result = await UserCollection.find({
        email: req.params.email,
      }).toArray();
      res.send();
    });

    // Updatinf class after adimin approve
    app.patch("/approve/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          approved: true,
        },
      };
      const result = await ClassesCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // Teach on EMX API
    app.post("/request", async (req, res) => {
      const request = req.body;
      const result = await TeachRequestCollection.insertOne(request);
      res.send(result);
    });

    // Class Enrollment API
    app.post("/enroll", async (req, res) => {
      const enroll = req.body;
      const result = await ClassEnrollCollection.insertOne(enroll);
      res.send(result);
    });

    app.get("/enroll", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await ClassEnrollCollection.find(query).toArray();
      res.send(result);
    });

    // get enroll at homepage
    app.get("/enrollall", async (req, res) => {
      const result = await ClassEnrollCollection.find().toArray();
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const result = await ClassesCollection.find().toArray();
      res.send(result);
    });

    app.get("/cla/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassesCollection.findOne(query);
      res.send(result);
    });

    // Added Class Collections by teacher
    app.post("/addclass", async (req, res) => {
      const addClass = req.body;
      const result = await ClassesCollection.insertOne(addClass);
      res.send(result);
    });

    // Get Class by Teacher
    app.get("/teacherclass/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await ClassesCollection.find(query).toArray();
      res.send(result);
    });

    // Update a Class
    app.patch("/updateteacherclass/:id", async (req, res) => {
      const value = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: value.name,
          title: value.title,
          price: value.price,
          image: value.image,
          email: value.email,
          description: value.description,
        },
      };
      const result = await ClassesCollection.updateOne(query, updateDoc);
    });
    // Delete a Class
    app.delete("/delete-cls/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassesCollection.deleteOne(query);
      res.send(result);
    });

    // Assignment API
    app.post("/assignment", async (req, res) => {
      const assignment = req.body;
      const result = await AssignmentCollection.insertOne(assignment);
      res.send(result);
    });

    //Feedback API
    app.post("/feedback", async (req, res) => {
      const review = req.body;
      const result = await FeedbackCollection.insertOne(review);
      res.send(result);
    });
    // get all assignment
    app.get("/all-assignment", async (req, res) => {
      const result = await AssignmentCollection.find().toArray();
      res.send(result);
    });

    // get specific coursees submitted assignment
    app.get("/submittedass/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await SubmittedAssignmentCollection.find(query).toArray();
      res.send(result);
      // console.log(result)
    });

    // get total  enroll class
    app.get("/totalenroll/:email", async (req, res) => {
      const email = req.params.email;
      const query = { teachermail: email };
      const result = await ClassEnrollCollection.find(query).toArray();
      res.send(result);
    });

    // get teacher assignmetn
    app.get("/teacher-all-assignment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await AssignmentCollection.find(query).toArray();
      res.send(result);
    });

    // get class info
    app.get("/get-class-info/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassesCollection.findOne(query);
      res.send(result);
    });

    app.get("/get-enrolled-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ClassEnrollCollection.find(query).toArray();
      res.send(result);
    });

    // Get Assignement in the student Pannel
    app.get("/getassignment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await AssignmentCollection.find(query).toArray();
      res.send(result);
    });

    // Submitted Assignment API
    app.post("/submittedassignment", async (req, res) => {
      const submit = req.body;
      const result = await SubmittedAssignmentCollection.insertOne(submit);
      res.send(result);
    });

    // Get all the submitted assignment for tacher pannel
    app.get("/submitassignment", async (req, res) => {
      const result = await SubmittedAssignmentCollection.find().toArray();
      res.send(result);
    });

    // Get Feedback
    app.get("/feedback", async (req, res) => {
      const result = await FeedbackCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Bhaai Running");
});
app.listen(port, () => {
  console.log(`Port Is Running On bhaai ree ${port}`);
});
