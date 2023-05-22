import express from "express"
import cors from "cors"
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/books"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

// const Author = mongoose.model('Author', {
//   name: String
// })

// const Book = mongoose.model('Book', {
//   title: String,
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Author'
//   }
// })

const User = mongoose.model('User', {
  name:{
    type:String,
    unique: true
  },
  password:{
    type:String,
    required:true
  },
  accessToken:{
    type:String,
    default:()=>crypto.randomBytes(128).toString('hex')
  },
  email:{
    type:String,
    unique: true
  }
})

// //example
// // POST request
// const request = {name:"Bob", password:"foobar"}
// // db entry
// const dbEntry = {name:"Bob", password:"5aaak45676fd"}

// bcrypt.compareSync(request.password, dbEntry.password)

// One way encryption
// const user = new User({name:"Bobby", password:bcrypt.hashSync("foobar")})
// user.save()


// I can choose how to run my server with this env variable RESET_DATABASE=true npm run dev
// if(process.env.RESET_DATABASE){
//     console.log('Resets DB')
//   const seedDatabase = async () => {
//     await Author.deleteMany()
//     await Book.deleteMany()

//     const tolkien = new Author ({name: 'Tolkien'})
//     await tolkien.save()

//     const rowling = new Author ({name: 'J.K. Rowling'})
//     await rowling.save()

//     await new Book({ title: "Harry Potter and the Philosopher's Stone", author: rowling }).save()
//     await new Book({ title: "Harry Potter and the Chamber of Secrets", author: rowling }).save()
//     await new Book({ title: "Harry Potter and the Prisoner of Azkaban", author: rowling }).save()
//     await new Book({ title: "Harry Potter and the Goblet of Fire", author: rowling }).save()
//     await new Book({ title: "Harry Potter and the Order of the Phoenix", author: rowling }).save()
//     await new Book({ title: "Harry Potter and the Half-Blood Prince", author: rowling }).save()
//     await new Book({ title: "Harry Potter and the Deathly Hallows", author: rowling }).save()
//     await new Book({ title: "The Lord of the Rings", author: tolkien }).save()
//     await new Book({ title: "The Hobbit", author: tolkien }).save()
// }
// seedDatabase()
// }



// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();



// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());
app.use(bodyParser.json())

// protecting our secrets endpoint
const authenticateUser = async (req, res, next) => {
const user = await User.findOne ({accessToken: req.header('Authorization')});
if(user){
  req.user = user;
  next();
}else{
  res.status(401).json({loggedOut: true}); //unauthorized status code
}
}

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Technigo!");
});

app.get("/secrets", authenticateUser);
app.get("/secrets", (req, res) => {
  res.json({secret: 'This is super secret'})
});

app.post("/users", async (req, res) => {
  try{
const {name, email, password} =req.body;
// do not store plaintext passwords
const user = new User({name, email, password: bcrypt.hashSync(password)})
user.save();
res.status(201).json({id:user._id, accessToken: user.accessToken})
  }catch(err){
res.status(400).json({message: 'could not create user', error:err})
  }
});

// app.post("/tweets", authenticateUser);
// app.post("/tweets", (req, res) => {
//   // this will only happen if the next() function is called from the middleware
//   // now we can access the req.user object from the middleware
// });

// app.get('/authors', async (req, res) => {
//   const authors = await Author.find()
//   res.json(authors)
// })

// app.get('/authors/:id', async (req, res) => {
//   const author = await Author.findById(req.params.id)
//   if (author) {
//     res.json(author)
//   } else {
//     res.status(404).json({ error: 'Author not found' })
//   }
// })

// app.get('/authors/:id/books', async (req, res) => {
//     try{
//       const author = await Author.findById(req.params.id)
//   if (author) {
//     const books = await Book.find({ author: new mongoose.Types.ObjectId(author.id) })
//     res.json(books)
//   } else {
//     res.status(404).json({ error: 'Author not found' })
//   }
//   }
//   catch (err){
//     console.log(err)
// res.status(400).json({error:'Invalid user id'})
//     }

// })

// app.get('/books', async (req, res) => {
//   const books = await Book.find().populate('author')
//   res.json(books)
// })

app.post('/sessions', async (req, res)=>{
  const user = await User.findOne({email: req.body.email})
  if(user && bcrypt.compareSync(req.body.password, user.password)){
//success
res.json({userId: user._id, accessToken: user.accessToken})
  }else{
//failure : 
//a:pw doesn't match
// b: user doesn't exist
res.json({notFound:true})
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

console.log(bcrypt.hashSync("foobar"))
