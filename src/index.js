require('dotenv').config();
const express = require('express');
const connectDB = require('./db');



const app = express();

// middleware
app.use(express.json());

// подключаем БД
connectDB();

// роуты
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server start ${PORT}`);
});

app.use('/uploads', express.static('uploads'));



//const BASE_URL = process.env.BASE_URL;
