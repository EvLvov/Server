require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const app = express();
const cors = require('cors');


app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server start ${PORT}`);
});

app.use('/uploads', express.static('uploads'));

// mongorestore dump
