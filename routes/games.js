const express = require("express");
const router = express.Router();
const fs = require("fs");
let gameboards;

const initGameboards = function () {
  gameboards = JSON.parse(fs.readFileSync("./files/gameboards.json"));
};
initGameboards();
console.log("initialized gameboards");

const updateGames = async function (update) {
  let newFile = fs.writeFile(
    "./files/gameboards.json",
    `${JSON.stringify(update)}`,
    function (err) {
      if (err) console.log(err);
      return JSON.stringify(update);
    }
  );
  console.log("Updating gameboards.json ...");
  return newFile;
};

const findGameById = function (id) {
  return gameboards.find((c) => c.id === parseInt(id, 10));
};

const checkIfGameExists = function (gameInstance) {
  if (!gameInstance) {
    console.log("Game Exists");
    return true;
  }
};

const makeTurn = function (response, row, column, game, side) {
  if (game.turn === side && game.won == "no") {
    game.board[row][column] = side;
    switch (side) {
      case "x":
        game.turn = "o";
        break;
      case "o":
        game.turn = "x";
        break;
    }
    console.log("Turn Made!");
  } else return response.status(400).send("The side that you entered invalid.");
};

const checkIfValidCoords = function (row, column, game) {
  if (
    row < 0 ||
    row > 2 ||
    column < 0 ||
    column > 2 ||
    game.board[row][column] != "-"
  )
    return false;
  else return true;
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
    console.log("Winner Found!");
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
  console.log(`gameboards updated with new game with id ${game.id}`);
  res.send(gameboards[gameboards.length - 1]);
});

//returns a list of games
router.get("/", (req, res) => {
  console.log("Got gameboards");
  res.send(gameboards);
});

//returns a 2d array of the game, and which side has won
router.get("/:id", (req, res) => {
  const game = findGameById(req.params.id);
  if (checkIfGameExists(game))
    return res.status(404).send("The game with that id does not exist.");
  console.log(`Got game of id ${game.id}`);
  res.send(game);
});

//takes puts an x or o at the coordinates, updates won
router.put("/:id/:row/:col/:side", async (req, res) => {
  const game = findGameById(req.params.id);
  const row = parseInt(req.params.row, 10);
  const column = parseInt(req.params.col, 10);
  const side = req.params.side;
  console.log(side);
  if (checkIfGameExists(game))
    return res.status(404).send("The game with that id does not exist.");
  if (!checkIfValidCoords(row, column, game))
    return res.status(400).send("The position that you entered was invalid.");
  makeTurn(res, row, column, game, side);
  game.won = winner(game.board, side);
  await updateGames(gameboards);
  console.log(`gameboards.json updated with ${side} move at ${row}, ${column}`);
  res.send(game);
});

//deletes a game
router.delete("/:id", async (req, res) => {
  const game = findGameById(req.params.id);
  console.log(game);
  if (checkIfGameExists(game))
    return res.status(404).send("The game with that id does not exist.");
  const index = gameboards.indexOf(game);
  console.log(index);
  gameboards.splice(index, 1);
  await updateGames(gameboards);
  console.log(`gameboards.json updated with deletion at id ${game.id}`);
  res.send(game);
});

module.exports = router;
