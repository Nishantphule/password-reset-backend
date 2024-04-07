const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const usersRouter = require("./controllers/users");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());


mongoose.set('strictQuery', false);

console.log("Connecting to Backend Database")

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to Database.")

    })
    .catch((error) => {
        console.log(error)
    })

app.get("/", (req, res) => {
    res.status(200).json('<h1>Welcome to the App</h1>');
})

app.use("/users", usersRouter);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server running on PORT http://localhost:${PORT}`)
})