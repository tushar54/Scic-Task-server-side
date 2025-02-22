require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const http = require('http'); // Node's HTTP module
const { Server } = require('socket.io'); // Socket.IO

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Create HTTP server and attach our Express app
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this appropriately.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Socket.IO connection event
io.on('connection', (socket) => {
 
  socket.on('disconnect', () => {
    
  });
});

// MongoDB Connection URI from environment variables
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.aiyzp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db("ScicTask");
    const users = db.collection("user");
    const tasks = db.collection("task");

    // Create new user endpoint
    app.post('/user', async (req, res) => {
      const person = req.body;
      const query = { email: person.email };
      const existingUser = await users.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists' });
      }
      const result = await users.insertOne(person);
      res.send(result);
    });

    // Add a new task and emit update event
    app.post('/task', async (req, res) => {
      const data = req.body;
      const result = await tasks.insertOne(data);
      res.send(result);
      io.emit("tasksUpdated");
    });

    // Update task endpoint (update category, etc.)
    app.put('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      try {
        const result = await tasks.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send(result);
        io.emit("tasksUpdated");
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Retrieve all tasks
    app.get('/Alltask', async (req, res) => {
      const result = await tasks.find().toArray();
      res.send(result);
    });

    // Get all users (optional)
    app.get('/users', async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    // Delete task endpoint
    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tasks.deleteOne(query);
      res.send(result);
      io.emit("tasksUpdated");
    });

    // Reorder tasks endpoint
    app.put("/reorder", async (req, res) => {
      const { category, tasks: tasksOrder } = req.body;
     
    
      try {
        for (const { _id, order } of tasksOrder) {
          await tasks.updateOne(
            { _id: new ObjectId(_id) },
            { $set: { order } }
          );
        }
        res.json({ success: true });
        io.emit("tasksUpdated");
      } catch (error) {
        console.error("Error reordering tasks:", error);
        res.status(500).json({ error: "Failed to reorder tasks" });
      }
    });
    
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Task Management API Running');
});

// Start the HTTP server (which also starts Socket.IO)
server.listen(port, () => {
 
});
