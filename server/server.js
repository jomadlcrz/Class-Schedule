const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://class-schedule-ruby.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Enable CORS for all routes
app.use(cors({
  origin: 'https://class-schedule-ruby.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  keepAlive: true,
  keepAliveInitialDelay: 300000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  readPreference: 'primaryPreferred'
});

async function run() {
  try {
    // Connect the client to the server
    await mongoClient.connect();
    // Send a ping to confirm a successful connection
    await mongoClient.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Use Mongoose with the existing MongoClient instance
    await mongoose.connect(uri, {
      dbName: "Cluster0",
      autoCreate: true,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    const db = mongoose.connection;
    db.on("error", (error) => {
      console.error("MongoDB connection error:", error);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log("Attempting to reconnect to MongoDB...");
        run().catch(console.dir);
      }, 5000);
    });

    db.once("open", () => {
      console.log("Mongoose connected to MongoDB");
    });

    // Handle application shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      await mongoClient.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      console.log("Attempting to reconnect to MongoDB...");
      run().catch(console.dir);
    }, 5000);
  }
}
run().catch(console.dir);

// Course Schema with indexes
const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  title: { type: String, required: true },
  units: { type: String, required: true },
  days: { type: String, required: true },
  time: { type: String, required: true },
  room: { type: String, required: true },
  instructor: { type: String, required: true },
  userEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Add compound indexes for common queries
courseSchema.index({ userEmail: 1, courseCode: 1 }, { unique: true });
courseSchema.index({ userEmail: 1, title: 1 }, { unique: true });
courseSchema.index({ userEmail: 1, days: 1, time: 1 });
courseSchema.index({ userEmail: 1, createdAt: -1 });

const Course = mongoose.model("Course", courseSchema);

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    req.user = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Routes
app.get("/", (req, res) => {
  res.send("<title>Welcome</title>Welcome to the server!");
});

app.get("/api", (req, res) => {
  res.send("<title>API</title>Welcome to the API!");
});

app.get("/api/courses", authenticate, async (req, res) => {
  try {
    const courses = await Course.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .lean()
      .cache(60);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/courses", authenticate, async (req, res) => {
  try {
    // Check for duplicate course code
    const existingCourseCode = await Course.findOne({
      courseCode: req.body.courseCode,
      userEmail: req.user.email,
    });
    if (existingCourseCode) {
      return res.status(400).json({ message: "Course Code already exists" });
    }

    // Check for duplicate title
    const existingTitle = await Course.findOne({
      title: req.body.title,
      userEmail: req.user.email,
    });
    if (existingTitle) {
      return res
        .status(400)
        .json({ message: "Descriptive Title already exists" });
    }

    // Check for schedule conflict with same course code
    const existingCourseCodeConflict = await Course.findOne({
      courseCode: req.body.courseCode,
      userEmail: req.user.email,
      days: req.body.days,
      time: req.body.time,
    });
    if (existingCourseCodeConflict) {
      return res
        .status(400)
        .json({ message: "Schedule conflict: Course Code already exists" });
    }

    // Check for schedule conflict with same title
    const existingTitleConflict = await Course.findOne({
      title: req.body.title,
      userEmail: req.user.email,
      days: req.body.days,
      time: req.body.time,
    });
    if (existingTitleConflict) {
      return res
        .status(400)
        .json({
          message: "Schedule conflict: Descriptive Title already exists",
        });
    }

    const newCourse = new Course({
      ...req.body,
      userEmail: req.user.email,
    });
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/courses/:id", authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check for duplicate course code (excluding current course)
    const existingCourseCode = await Course.findOne({
      courseCode: req.body.courseCode,
      userEmail: req.user.email,
      _id: { $ne: req.params.id },
    });
    if (existingCourseCode) {
      return res.status(400).json({ message: "Course Code already exists" });
    }

    // Check for duplicate title (excluding current course)
    const existingTitle = await Course.findOne({
      title: req.body.title,
      userEmail: req.user.email,
      _id: { $ne: req.params.id },
    });
    if (existingTitle) {
      return res
        .status(400)
        .json({ message: "Descriptive Title already exists" });
    }

    // Check for schedule conflict with same course code (excluding current course)
    const existingCourseCodeConflict = await Course.findOne({
      courseCode: req.body.courseCode,
      userEmail: req.user.email,
      days: req.body.days,
      time: req.body.time,
      _id: { $ne: req.params.id },
    });
    if (existingCourseCodeConflict) {
      return res
        .status(400)
        .json({ message: "Schedule conflict: Course Code already exists" });
    }

    // Check for schedule conflict with same title (excluding current course)
    const existingTitleConflict = await Course.findOne({
      title: req.body.title,
      userEmail: req.user.email,
      days: req.body.days,
      time: req.body.time,
      _id: { $ne: req.params.id },
    });
    if (existingTitleConflict) {
      return res
        .status(400)
        .json({
          message: "Schedule conflict: Descriptive Title already exists",
        });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, userEmail: req.user.email },
      { new: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/courses/:id", authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
