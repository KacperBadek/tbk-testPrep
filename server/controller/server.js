const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require("../error-handling/errorHandler");
const notFoundHandler = require('../error-handling/notFoundHandler');
const movieRouter = require('../routes/movies');

// npm init -y
// npm create vite@latest client --template react
// npm install express;
// npm install mongoose;
// npm install cors;

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

mongoose.connect('mongodb://root:example@localhost:27020/mongo_db_test?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect to MongoDB', err));

app.use(express.json());
app.use("/api/movies", movieRouter);
app.use(notFoundHandler)
app.use(errorHandler)

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));