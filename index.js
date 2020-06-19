const games = require('./routes/games.js');
const express = require('express');
const sequelize = require("./database/connection.js")
const app = express();

app.use(express.json());
app.use('/api/games', games);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
