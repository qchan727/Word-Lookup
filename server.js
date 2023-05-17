const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
});

const app = express();
const portNumber = 3000;

const transporter = nodemailer.createTransport({
   service: "hotmail",
   auth: {
      user: "word-lookup@outlook.com",
      pass: "DictionaryProject1314*",
   },
});

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collectionName = process.env.MONGO_COLLECTION;

const databaseAndCollection = {
   db: dbName,
   collection: collectionName,
};

app.listen(portNumber);

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

process.stdin.setEncoding("utf8");

process.stdout.write(
   `Web server started and running at http://localhost:${portNumber}\nStop to shutdown the server: `
);

/******************************************/
// APIS
/******************************************/
let word = "word";
let url = `https://wordsapiv1.p.rapidapi.com/words/${word}`;
const options = {
   method: "GET",
   headers: {
      "X-RapidAPI-Key": "3a9ed0166bmshb54de57e953640ep1a0a7ejsn643071beb009",
      "X-RapidAPI-Host": "wordsapiv1.p.rapidapi.com",
   },
};

const urlRandom =
   "https://random-word-by-api-ninjas.p.rapidapi.com/v1/randomword?type=verb";
const optionsRandom = {
   method: "GET",
   headers: {
      "X-RapidAPI-Key": "3a9ed0166bmshb54de57e953640ep1a0a7ejsn643071beb009",
      "X-RapidAPI-Host": "random-word-by-api-ninjas.p.rapidapi.com",
   },
};

/******************************************/
// MONGODB
/******************************************/
async function insertWord(entry) {
   const uri = `mongodb+srv://${userName}:${password}@words.mtpvvvr.mongodb.net/?retryWrites=true&w=majority`;

   const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
   });
   try {
      await client.connect();
      await client
         .db(databaseAndCollection.db)
         .collection(databaseAndCollection.collection)
         .insertOne(entry);
   } catch (e) {
      console.error(e);
   } finally {
      await client.close();
   }
}

async function allWords() {
   const uri = `mongodb+srv://${userName}:${password}@words.mtpvvvr.mongodb.net/?retryWrites=true&w=majority`;

   const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
   });
   try {
      await client.connect();
      let filter = {};
      const cursor = client
         .db(databaseAndCollection.db)
         .collection(databaseAndCollection.collection)
         .find(filter);

      const result = await cursor.toArray();
      return result;
   } catch (e) {
      console.error(e);
   } finally {
      await client.close();
   }
}

async function lookupWord(word) {
   const uri = `mongodb+srv://${userName}:${password}@words.mtpvvvr.mongodb.net/?retryWrites=true&w=majority`;
   const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverApi: ServerApiVersion.v1,
   });
   try {
      await client.connect();
      let filter = { word: word };
      const result = await client
         .db(databaseAndCollection.db)
         .collection(databaseAndCollection.collection)
         .findOne(filter);
      return result;
   } catch (e) {
      console.error(e);
   } finally {
      await client.close();
   }
}
/******************************************/
// DEFINING AND PROCESSING ENDPOINTS
/******************************************/
app.get("/", (req, res) => {
   res.render("overview");
});

app.post("/", async (req, res) => {
   const email = req.body.email;
   const resWord = await fetch(urlRandom, optionsRandom);
   const jsonWord = await resWord.json();
   const word = jsonWord.word;
   const options = {
      from: "Word Lookup <word-lookup@outlook.com>",
      to: email,
      subject: "Your Random Word",
      html: `<b>Hello!</b><br><p>Here is a word for you: <em>${word}</em>!`,
   };

   transporter.sendMail(options, (err, info) => {
      if (err) {
         console.log(err);
      }
   });

   res.render("overview");
});

app.get("/fav-words", async (req, res) => {
   const wordsList = await allWords().catch(console.error);
   let words = `<div class="words-container">`;
   wordsList.forEach((e) => {
      words += `<span class="word">${e.word}</span>`;
   });
   words += "</div>";

   variables = {
      words: words,
   };

   res.render("fav-words", variables);
});

app.post("/fav-words", async (req, res) => {
   let variables = {
      word: req.body.word,
   };

   const result = await lookupWord(req.body.word);
   if (result === null) {
      await insertWord(variables).catch(console.error);
   }

   const wordsList = await allWords().catch(console.error);
   let words = `<div class="words-container">`;
   wordsList.forEach((e) => {
      words += `<span class="word">${e.word}</span>`;
   });
   words += "</div>";

   variables = {
      words: words,
   };

   res.render("fav-words", variables);
});

app.get("/dictionary", async (req, res) => {
   try {
      word = req.query.word ?? "word";
      url = `https://wordsapiv1.p.rapidapi.com/words/${word}`;
      const response = await fetch(url, options);
      const json = await response.json();
      const def = json.results;
      let syllables = "";
      json.syllables?.list.forEach((e) => {
         syllables += `${e}&centerdot;`;
      });
      syllables =
         syllables === ""
            ? word
            : syllables.substring(0, syllables.length - 11);

      let defList = [];
      let partOfSpeechList = [];
      let obj;
      def.forEach((e) => {
         if (!partOfSpeechList.includes(e.partOfSpeech)) {
            const ex = e.examples ? e.examples[0] : "";
            obj = {
               partOfSpeech: e.partOfSpeech,
               definition: [[e.definition, ex]],
            };
            defList.push(obj);
            partOfSpeechList.push(e.partOfSpeech);
         } else {
            obj = defList.find((f) => {
               return f.partOfSpeech === e.partOfSpeech;
            });
            const ex = e.examples ? e.examples[0] : "";
            const arr = obj.definition;
            arr.push([e.definition, ex]);
            obj.definition = arr;
         }
      });

      let definition = "";
      let notFirst = false;
      let count = 1;
      defList.forEach((group) => {
         if (notFirst) {
            definition += ` <hr>
               <div class="word-info">
               <span class="part-of-speech">
               ${group.partOfSpeech}
               </span>
               </div>`;
         }
         notFirst = true;
         const arr = group.definition;
         definition += "<ul class='def-list'> ";
         arr.forEach((e) => {
            definition += `<li>
               <div class="num-def">
                  <span class="${
                     count > 9 ? "num-double" : "num-single"
                  }">${count++}</span>
                  <span class="def">${e[0]}
                  </span>
               </div>`;
            if (e[1] !== "") {
               definition += `<span class="example">"${e[1]}"</span>
                  </li>`;
            }
         });
         count = 1;
         definition += "</ul>";
      });
      const variables = {
         word: word,
         partOfSpeech: def.length != 0 ? def[0].partOfSpeech : "n/a",
         pronunciation: json?.pronunciation?.all ?? json?.pronunciation ?? word,
         syllables: syllables,
         defList: definition,
         // saveBtn: `<button type="submit" class="btn save-btn">Save</button>`,
      };
      res.render("dictionary", variables);
   } catch (error) {
      let definition = `<span>The word you entered isn't defined in the lookup.</span>`;
      const variables = {
         word: req.query.word,
         partOfSpeech: "&horbar;",
         pronunciation: "&horbar;",
         syllables: "&horbar;",
         defList: definition,
         saveBtn: "",
      };
      console.log("ERROR" + error);
      res.render("dictionary", variables);
   }
});

app.get("/random-word", async (req, res) => {
   try {
      const resWord = await fetch(urlRandom, optionsRandom);
      const jsonWord = await resWord.json();
      word = jsonWord.word;
      url = `https://wordsapiv1.p.rapidapi.com/words/${word}`;
      const response = await fetch(url, options);
      const json = await response.json();
      const def = json.results;
      let syllables = "";

      json.syllables?.list.forEach((e) => {
         syllables += `${e}&centerdot;`;
      });
      syllables =
         syllables === ""
            ? word
            : syllables.substring(0, syllables.length - 11);

      let defList = [];
      let partOfSpeechList = [];
      let obj;
      def?.forEach((e) => {
         if (!partOfSpeechList.includes(e.partOfSpeech)) {
            const ex = e.examples ? e.examples[0] : "";
            obj = {
               partOfSpeech: e.partOfSpeech,
               definition: [[e.definition, ex]],
            };
            defList.push(obj);
            partOfSpeechList.push(e.partOfSpeech);
         } else {
            obj = defList.find((f) => {
               return f.partOfSpeech === e.partOfSpeech;
            });
            const ex = e.examples ? e.examples[0] : "";
            const arr = obj.definition;
            arr.push([e.definition, ex]);
            obj.definition = arr;
         }
      });

      let definition = "";
      let notFirst = false;
      let count = 1;
      defList.forEach((group) => {
         if (notFirst) {
            definition += ` <hr>
               <div class="word-info">
               <span class="part-of-speech">
               ${group.partOfSpeech}
               </span>
               </div>`;
         }
         notFirst = true;
         const arr = group.definition;
         definition += "<ul class='def-list'> ";
         arr.forEach((e) => {
            definition += `<li>
               <div class="num-def">
                  <span class="${
                     count > 9 ? "num-double" : "num-single"
                  }">${count++}</span>
                  <span class="def">${e[0]}
                  </span>
               </div>`;
            if (e[1] !== "") {
               definition += `<span class="example">"${e[1]}"</span>
                  </li>`;
            }
         });
         count = 1;
         definition += "</ul>";
      });

      const variables = {
         // dateFormat: dateFormat,
         word: word,
         partOfSpeech: def.length != 0 ? def[0].partOfSpeech : "n/a",
         pronunciation: json?.pronunciation?.all ?? json?.pronunciation ?? word,
         syllables: syllables,
         defList: definition,
         // saveBtn: `<form method="post" action="/random-word"> <button type="submit" class="btn save-btn">Save</button></form>`,
      };
      res.render("random-word", variables);
   } catch (error) {
      console.error(error);
   }
});
