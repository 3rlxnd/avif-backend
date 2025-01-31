const express = require("express");
const app = express();
require("dotenv").config();
const sessions = require("express-session");
const rateLimit = require("express-rate-limit");
const indexRouter = require("./routes/index.js");
require("./model/clean.js");
app.use(indexRouter);
const cluster = require('cluster');
const os = require('os');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allows all origins
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allowed methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allowed headers
  next();
});

const limiter = rateLimit({
  windowMs: 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);

app.use(function (req, res, next) {
  if (!req.headers) {
    res.status(403).send("Forbidden");
    // return res.status(403).json({
    //   success: false,
    //   message: '403 Forbidden',
    // });
  }

  if (!req.headers["user-agent"]) {
    res.status(403).send("Forbidden");
    // return res.status(403).json({
    //   success: false,
    //   message: '403 Forbidden',
    // });
  }

  next();
});

const port = process.env.PORT;
const cookieTimeout = 1000 * 60 * 60 * 24;

app.use(
  sessions({
    secret: "somesecret",
    saveUninitialized: true,
    cookie: { maxAge: cookieTimeout },
    resave: false,
  })
);

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  app.listen(port, () => {
    console.log(`Worker process ${process.pid} listening on https://localhost:${port}`);
  });
}

// app.listen(port, () => {
//   console.log(`App listening on https://localhost:${port}`);
// });
