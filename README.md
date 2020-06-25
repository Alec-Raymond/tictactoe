## TICTACTOE GAME

This tictactoe uses nodejs, express, and postgresql to create a REST API that can store and play games of tictactoe.

You can:

* get tictactoe games
* get a singular tictactoe game
* post a new tictactoe game
* put a move onto a tictactoe board when following the tictactoe rules

This program stores the tictactoe games in a database on your system using a psql server.

### How to use:

#### Run these commands in 3 different terminals

* node index.js
* ngrok http 5432
* psql -U postgres -h localhost

For the last command, you may need to install postgres onto your system. If you are using the server  
for the first time, use the command __sudo service postgresql start__

### How to play

Use a service like postman to send requests to the http, using the ngrok links provided:  
http://fdba674ba9c9.ngrok.io/api/games/ is how you access the game

* A get request with / or /id can get show the games in the database
* A post request with / can post a new game with an incremented id to the database
* A put request with /id/position/side can play a turn at the position and id you give it with the side you play
