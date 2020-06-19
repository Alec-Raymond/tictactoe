const express = require("express");
const router = express.Router();
const fs = require("fs");
let gameboards;


// Initializes gameboards to be equal to gameboards.json
const initGameboards = function () {
  gameboards = JSON.parse(fs.readFileSync("./files/gameboards.json"));
};
initGameboards();

// Updates gameboards.json with whatever is in the function parameter
const updateGames = async function (update) {
  let newFile = fs.writeFile(
    "./files/gameboards.json",
    `${JSON.stringify(update)}`,
    () => {}
  );
  return newFile;
};

// Finds the game with a specific id in the array gameboards
const findGameById = function (id) {
  return gameboards.find((c) => c.id === parseInt(id, 10));
};

// Replaces the array
const makeTurn = function (row, column, game, side) {
  if (game.turn === side && game.won === "no") {
    game.board[row][column] = side;
    switch (side) {
      case "x":
        game.turn = "o";
        break;
      case "o":
        game.turn = "x";
        break;
    }
    return true;
  } 
};

// Checks if the coordinates given are able to be pu
const checkIfValidCoords = function (row, column, game) {
  if (
    row >= 0 ||
    row <= 2 ||
    column >= 0 ||
    column <= 2 ||
    game.board[row][column] === "-"
  )
    return true;
};

// Analyzes the function to see who won
const winner = function (board, side) {
  for (let index = 0; index < board.length; index++) {
    if (
      board[index].every((element) => element == side) ||
      [board[0][index], board[1][index], board[2][index]].every(
        (element) => element == side
      )
    )
      return side;
  }
  if (
    [board[0][0], board[1][1], board[2][2]].every(
      (element) => element == side
    ) ||
    [board[0][2], board[1][1], board[2][0]].every((element) => element == side)
  ) {
    return side;
  }
  return "no";
};

//adds a new empty game to the end of the list
router.post("/", async (req, res) => {
  const game = {
    id: gameboards[gameboards.length - 1].id + 1,
    board: [
      ["-", "-", "-"],
      ["-", "-", "-"],
      ["-", "-", "-"],
    ],
    won: "no",
    turn: "o",
  };
  gameboards.push(game);
  await updateGames(gameboards);
  res.send(gameboards[gameboards.length - 1]);
});

//returns a list of games 
router.get("/", (req, res) => {
  res.send(gameboards);
});

//returns a game from the gameboards array
router.get("/:id", (req, res) => {
  const game = findGameById(req.params.id);
  if (!game)
    return res.status(404).send("The game with that id does not exist.");
  res.send(game);
});

// puts an x or o at the coordinates given, updates game.won
router.put("/:id/:row/:col/:side", async (req, res) => {
  const game = findGameById(req.params.id);
  const row = parseInt(req.params.row, 10);
  const column = parseInt(req.params.col, 10);
  const side = req.params.side;
  if (!game)
    return res.status(404).send("The game with that id does not exist.");
  if (!checkIfValidCoords(row, column, game))
    return res.status(400).send("The position that you entered was invalid.");
  if (!makeTurn(row, column, game, side))
    return res.status(400).send("The side that you entered invalid.");
  game.won = winner(game.board, side);
  await updateGames(gameboards);
  res.send(game);
});

//deletes a game from gameboard
router.delete("/:id", async (req, res) => {
  const game = findGameById(req.params.id);
  if (!game)
    return res.status(404).send("The game with that id does not exist.");
  const index = gameboards.indexOf(game);
  gameboards.splice(index, 1);
  await updateGames(gameboards);
  res.send(game);
});

module.exports = router;