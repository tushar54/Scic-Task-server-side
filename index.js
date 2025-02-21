require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// MongoDB Connection
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
        console.log("Connected to MongoDB");

        const db = client.db("MicroWork");
        const users = db.collection("user");
        const tasks = db.collection("Task");

        // ✅ Get All Tasks
        app.get('/tasks', async (req, res) => {
            const result = await tasks.find().toArray();
            res.send(result);
        });

        // ✅ Add New Task
        app.post('/tasks', async (req, res) => {
            const newTask = req.body;
            const result = await tasks.insertOne({ ...newTask, timestamp: new Date() });
            res.send(result);
        });

        // ✅ Update Task (Title, Description, or Category)
        app.put('/tasks/:id', async (req, res) => {
            const { id } = req.params;
            const updatedTask = req.body;
            const result = await tasks.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedTask }
            );
            res.send(result);
        });

        // ✅ Delete Task
        app.delete('/tasks/:id', async (req, res) => {
            const { id } = req.params;
            const result = await tasks.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // ✅ Create User (if not exists)
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

        // ✅ Get All Users (Optional)
        app.get('/users', async (req, res) => {
            const result = await users.find().toArray();
            res.send(result);
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Task Management API Running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
