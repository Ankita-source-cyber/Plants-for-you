const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// mongoose.connect('mongodb://localhost:27017/mydb', {
//   useNewUrlParser: true,2
//   useUnifiedTopology: true,
// });

mongoose.connect("mongodb://localhost:27017/plant_DB")
.then(()=>{
    console.log("DB connection established");
})
.catch((err)=>{
    console.log(err);
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();

  // Generate JWT token
  const token = jwt.sign({ userId: newUser._id }, 'secretKey');

  // Return token and user info
  res.json({ token, user: { name: newUser.name, email: newUser.email } });
});

// Signin endpoint
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, 'secretKey');

  // Return token and user info
  res.json({ token, user: { name: user.name, email: user.email } });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});