const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const dbPath = path.join(__dirname, "financepeer.db");
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`SERVER ERROR ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/user/", async (request, response) => {
  console.log("triggered");
  const getQuery = `
    SELECT * FROM user;`;

  const result = await database.all(getQuery);
  response.send(result);
  response.status(400);
});

app.post("/register/", async (request, response) => {
  const { username, password } = request.body;
  console.log(username);
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username LIKE '${username}'`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username,  password) 
      VALUES 
        (
          '${username}', 
          
          '${hashedPassword}'
          
        )`;
    const dbResponse = await database.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    response.send({ msg: `Created new user with ${newUserId}` });
  } else {
    response.status = 400;
    response.send({ err_msg: "User already exists" });
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwt_token: jwtToken });
    } else {
      // console.log("error");

      response.status(400);
      response.send({ msg: "hello" });
    }
  }
});

app.post("/upload/", async (req, res) => {
  let data = req.body;
  console.log(data);

  let placeholders = data
    .map((s) => `(${s.userId},${s.id}, '${s.title}', '${s.body}')`)
    .join(", ");

  let postQuery =
    `INSERT INTO datastore(user_id , id , title , body) VALUES ` +
    placeholders +
    ";";

  console.log(postQuery);
  const dbResponse = await database.run(postQuery);
  const userId = dbResponse.lastID;
  res.send({ msg: "Added" });
});

app.get("/data/", async (request, response) => {
  const getData = `
    SELECT * FROM datastore;`;

  const result = await database.all(getData);

  response.send(result);
});
