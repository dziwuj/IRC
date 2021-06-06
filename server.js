import { fileURLToPath } from 'url'
import express from 'express'
import path, { dirname } from 'path';

const app = express()
const PORT = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'))

const server = app.listen(PORT, function () {
  console.log("start serwera na porcie " + PORT)
})

let subscribers = Object.create(null);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"))
})

app.get("/chat.js", (req, res) => {
  res.sendFile(path.join(__dirname + "/chat.js"))
})

// new client wants messages

app.get("/subscribe", (req, res) => {
  onSubscribe(req, res);
})

app.post("/publish", (req, res) => {
  console.log(req.body);
  let inserted = ""
  let temp = {}
  if (req.body.message[0] == "/") {
    switch (req.body.message.split(" ")[0]) {
      case '/nick':
        inserted = req.body.message.substring(6)
        temp = {
          message: req.body.nick.substring(1) + " set nick to " + inserted,
          nick: "SYSTEM",
          color: "black",
          who: req.body.nick.substring(1),
          new_nick: inserted,
          new_color: req.body.color,
          command: ""
        }
        publish(temp)
        break;
      case '/color':
        inserted = req.body.message.substring(7)
        temp = {
          message: req.body.nick.substring(1) + " set color to " + inserted,
          nick: "SYSTEM",
          color: "black",
          who: req.body.nick.substring(1),
          new_nick: req.body.nick.substring(1),
          new_color: inserted,
          command: ""
        }
        publish(temp); // publish it to everyone
        break;
      case '/quit':
        inserted = req.body.message.substring(6)
        temp = {
          message: req.body.nick.substring(1) + " left the chat",
          nick: "SYSTEM",
          color: "black",
          who: req.body.nick.substring(1),
          new_nick: req.body.nick.substring(1),
          new_color: req.body.color,
          command: "quit"
        }
        publish(temp); // publish it to everyone
        break;
      default:
        publish(req.body); // publish it to everyone
    }
  } else
    publish(req.body); // publish it to everyone
  // accept POST
  res.end("ok");

})

function onSubscribe(req, res) {
  let id = Math.random();

  res.setHeader('Content-Type', 'text/plain;charset=utf-8');
  res.setHeader("Cache-Control", "no-cache, must-revalidate");

  subscribers[id] = res;

  req.on('close', function () {
    delete subscribers[id];
  });

}

function publish(message) {

  for (let id in subscribers) {
    let res = subscribers[id];
    res.send(message);
  }

  subscribers = Object.create(null);
}

function close() {
  for (let id in subscribers) {
    let res = subscribers[id];
    res.end();
  }
}


// -----------------------------------
