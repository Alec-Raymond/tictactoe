const express = require("express"),
  router = express.Router(),
  pg = require("pg"),
  cs = "postgres://postgres:1234@localhost:5432/tictactoe",
  client = new pg.Client({ connectionString: cs });
client.connect();

class Gameboard {
  constructor() {
    this.id;
    this.won;
    this.turn;
    this.board = [
      ["-", "-", "-"],
      ["-", "-", "-"],
      ["-", "-", "-"],
    ];
  }

  async load(id) {
    let where;
    if (!id) {
      let res = await client.query("SELECT * FROM gameboard ORDER BY id DESC");
      where = res.rows[0].id + 1;
      await client.query(
        "INSERT INTO gameinfo(won, turn) VALUES($1, $2) RETURNING *",
        ["no", "o"]
      );
      await client.query(
        "INSERT INTO gameboard(topLeft, topMiddle, topRight, middleLeft, middleMiddle, middleRight, bottomLeft, bottomMiddle, bottomRight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
        ["-", "-", "-", "-", "-", "-", "-", "-", "-"]
      );
    } else {
      where = id;
    }
    const q = await client.query(
      `SELECT * FROM gameinfo INNER JOIN gameboard ON gameinfo.id = gameboard.id WHERE gameboard.id = $1`,
      [where]
    );
    const r = q.rows[0];
    this.id = where;
    this.won = r.won;
    this.turn = r.turn;
    this.board[0][0] = r.topleft;
    this.board[0][1] = r.topmiddle;
    this.board[0][2] = r.topright;
    this.board[1][0] = r.middleleft;
    this.board[1][1] = r.middlemiddle;
    this.board[1][2] = r.middleright;
    this.board[2][0] = r.bottomleft;
    this.board[2][1] = r.bottommiddle;
    this.board[2][2] = r.bottomright;
  }

  async saveGame() {
    let values = this.board[0].concat(this.board[1], this.board[2], this.id);
    console.log(values);
    await client.query(
      `UPDATE gameinfo SET won = $1, turn = $2 WHERE id = $3`,
      [this.won, this.turn, this.id]
    );
    await client.query(
      `UPDATE gameboard SET topLeft = $1, topMiddle = $2, topRight = $3, middleLeft = $4, middleMiddle = $5, middleRight = $6, bottomLeft = $7, bottomMiddle = $8, bottomRight = $9 WHERE id=$10`,
      values
    );
  }

  setPos(x, y, value) {
    this.board[y][x] = value;
  }

  getPos(x, y) {
    return this.board[y][x];
  }

  winByRow(side, index) {
    const board = this.board;
    if (board[index].every((element) => element == side)) return true;
  }

  winByColumn(side, index) {
    const board = this.board;
    if (
      [board[0][index], board[1][index], board[2][index]].every(
        (element) => element == side
      )
    )
      return true;
  }

  winByDiag(side) {
    const board = this.board;
    if (
      [board[0][0], board[1][1], board[2][2]].every(
        (element) => element == side
      ) ||
      [board[0][2], board[1][1], board[2][0]].every(
        (element) => element == side
      )
    )
      return true;
  }
  makeTurn(side, x, y) {
    if (this.won == "no" && this.turn == side && this.getPos(x, y) === "-") {
      console.log(this.id);
      this.setPos(x, y, side);
      switch (this.turn) {
        case "x":
          this.turn = "o";
          break;
        case "o":
          this.turn = "x";
          break;
      }
    } else {
      throw new Error();
    }
  }
  winner() {
    let side;
    switch (this.turn) {
      case "x":
        side = "o";
        break;
      case "o":
        side = "x";
        break;
    }
    for (let index = 0; index < this.board.length; index++) {
      if (this.winByRow(side, index) || this.winByColumn(side, index)) {
        this.won = side;
        return side;
      }
    }
    if (this.winByDiag(side)) {
      this.won = side;
      return side;
    }
    return "no";
  }
}

// Updates tictactoe database with whatever is in the function parameter
//adds a new empty game to the end of the list
router.post("/", async (req, res) => {
  let game = new Gameboard();
  await game.load();
  res.send(JSON.stringify(game));
});

//returns a list of games
router.get("/", async (req, res) => {
  try {
    const q = await client.query(
      "SELECT * FROM gameinfo INNER JOIN gameboard ON gameinfo.id = gameboard.id ORDER BY gameboard.id DESC"
    );
    res.send(q.rows);
  } catch (err) {
    res.status(400).send(err);
  }
});

//returns a game from the gameboards array
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    let gameboard = new Gameboard();
    await gameboard.load(id);
    res.send(JSON.stringify(gameboard));
  } catch (err) {
    console.log(err);
    return res.status(404).send("The game with that id does not exist.");
  }
});

// puts an x or o at the coordinates given, updates game.won
router.put("/:id/:y/:x/:side", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let gameboard;
  try {
    gameboard = new Gameboard();
    await gameboard.load(id);
  } catch (err) {
    return res.status(404).send("The game with that id does not exist.");
  }
  const x = req.params.x;
  const y = req.params.y;
  const side = req.params.side;
  try {
    gameboard.makeTurn(side, x, y);
    gameboard.winner();
    await gameboard.saveGame();
    res.send(JSON.stringify(gameboard));
  } catch (err) {
    return res
      .status(400)
      .send("The side or position that you entered was invalid");
  }
});

module.exports = router;