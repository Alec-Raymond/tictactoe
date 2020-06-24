const express = require("express"),
  router = express.Router(),
  pg = require("pg"),
  cs = "postgres://postgres:1234@localhost:5432/tictactoe",
  client = new pg.Client({ connectionString: cs });
client.connect();

// Updates tictactoe database with whatever is in the function parameter
const newGame = async function (update) {
  await client.query(
    "INSERT INTO gameinfo(won, turn) VALUES($1, $2) RETURNING *",
    [update.won, update.turn]
  );
  await client.query(
    "INSERT INTO gameboard(topLeft, topMiddle, topRight, middleLeft, middleMiddle, middleRight, bottomLeft, bottomMiddle, bottomRight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [
      update.board[0][0],
      update.board[0][1],
      update.board[0][2],
      update.board[1][0],
      update.board[1][1],
      update.board[1][2],
      update.board[2][0],
      update.board[2][1],
      update.board[2][2],
    ]
  );
};

const makeTurn = async function (game, id, update, where) {
  try {
    if (
      game.rows[0].won == "no" &&
      game.rows[0].turn == update &&
      game.rows[0][where] == "-"
    ) {
      console.log(id);
      const res = await client.query(
        `UPDATE gameboard SET ` + where + `= '` + update + `' WHERE id =${id}`
      );
      switch (game.rows[0].turn) {
        case "x":
          await client.query(`UPDATE gameinfo SET turn = 'o' WHERE id =${id}`);
          break;
        case "o":
          await client.query(`UPDATE gameinfo SET turn = 'x' WHERE id =${id}`);
          break;
      }
      return res;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

// Finds the game with a specific id in the database tictactoe
const findGameById = async function (id) {
  const res = client.query(
    `SELECT * FROM gameinfo INNER JOIN gameboard ON gameinfo.id = gameboard.id WHERE gameboard.id = ${id}`
  );
  return res;
};

const winByRow = function (board, side, index) {
  if(board[index].every((element) => element == side)) return true;
};

const winByColumn = function (board, side, index) {
  if([board[0][index], board[1][index], board[2][index]].every(
        (element) => element == side
      )) return true;
};

const winByDiag = function (board, side) {
  if([board[0][0], board[1][1], board[2][2]].every(
      (element) => element == side
    ) ||
    [board[0][2], board[1][1], board[2][0]].every((element) => element == side)
  ) return true;
};


// Analyzes the function to see who won
const winner = async function (id, side) {
  let gameboard = await client.query(`SELECT * FROM gameboard WHERE id=${id}`);
  let board = [
    [
      gameboard.rows[0].topleft,
      gameboard.rows[0].topmiddle,
      gameboard.rows[0].topright,
    ],
    [
      gameboard.rows[0].middleleft,
      gameboard.rows[0].middlemiddle,
      gameboard.rows[0].middleright,
    ],
    [
      gameboard.rows[0].bottomleft,
      gameboard.rows[0].bottommiddle,
      gameboard.rows[0].bottomright,
    ],
  ];
  console.log(board, side);
  for (let index = 0; index < board.length; index++) {
    if (
      winByRow(board, side, index) ||
      winByColumn(board, side, index)
    ) {
      await client.query(
        `UPDATE gameinfo SET won = REPLACE(won, 'no', '` +
          side +
          `') WHERE id = ` +
          id
      );
      return side;
    }
  }
  if (
    winByDiag(board, side)
  ) {
    await client.query(
      `UPDATE gameinfo SET won = REPLACE(won, 'no', '` +
        side +
        `') WHERE id = ` +
        id
    );
    return side;
  }
  return "no";
};

//adds a new empty game to the end of the list
router.post("/", async (req, res) => {
  let game = {
     id: 1,
    board: [
      ["-", "-", "-"],
      ["-", "-", "-"],
      ["-", "-", "-"],
    ],
    won: "no",
    turn: "o",
  };
  await newGame(game);
  let id = await client.query("SELECT * FROM gameinfo INNER JOIN gameboard ON gameinfo.id = gameboard.id ORDER BY gameboard.id DESC");
  try {game.id = id.rows[0].id;}
  catch (err) {
    game.id = 1;
  }
  res.send(game);
});

//returns a list of games
router.get("/", async (req, res) => {
  try {
    const q = client.query(
      "SELECT * FROM gameinfo INNER JOIN gameboard ON gameinfo.id = gameboard.id ORDER BY gameboard.id DESC"
    );
    res.send(await q);
  } catch (err) {
    res.status(400).send(err);
  }
});

//returns a game from the gameboards array
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const game = await findGameById(id);
  if (!game)
    return res.status(404).send("The game with that id does not exist.");
  res.send(game);
});

// puts an x or o at the coordinates given, updates game.won
router.put("/:id/:position/:side", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let game = await findGameById(id);
  if (!game)
    return res.status(404).send("The game with that id does not exist.");
  const position = req.params.position;
  const side = req.params.side;
  if (!(await makeTurn(game, id, side, position)))
    return res
      .status(400)
      .send("The side or position that you entered was invalid.");
  await winner(id, side);
  res.send(await findGameById(id));
});

module.exports = router;
