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
* ngrok http 8080
* psql -U postgres -h localhost (password should be 1234) 

For the last command, you may need to install postgres onto your system. If you are using the server  
for the first time, use the command __sudo service postgresql start__

Another option would be to change the cs url const at line 4 of games.js to match the format  
postgres://dbuser:secretpassword@database.server.com:3211/mydb

Then, run these commands to get the necessary schema:

CREATE DATABASE tictactoe;  
\c database;  
CREATE TABLE gameinfo(  
    id SERIAL,  
    won TEXT,  
    turn CHAR(1),  
);  
CREATE TABLE gameboard(  
    id SERIAL,  
    topleft CHAR(1),  
    topmiddle CHAR(1),  
    topright CHAR(1),  
    middleleft CHAR(1),  
    middlemiddle CHAR(1),  
    middleright CHAR(1),  
    bottomleft CHAR(1),  
    bottommiddle CHAR(1),    
    bottomright CHAR(1),  
);

### How to play

Use a service like postman to send requests to the http, using the ngrok links provided:  
http://fdba674ba9c9.ngrok.io/api/games/ is how you access the game

* A get request with / or /id can get show the games in the database
* A post request with / can post a new game with an incremented id to the database
* A put request with /id/position/side can play a turn at the position and id you give it with the side you play
