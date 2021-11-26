const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

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
    response.send(`Created new user with ${newUserId}`);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  //console.log(username);

  const getQuery = `
  SELECT * FROM user WHERE username = '${request.body.username}';`;

  const dbUser = await database.get(getQuery);

  if (dbUser === undefined) {
    response.send("Invalid User");
    response.status(401);
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
