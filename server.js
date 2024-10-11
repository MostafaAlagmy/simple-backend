// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');


require('dotenv').config();

// إعداد التطبيق
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());


// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// نماذج البيانات
const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true }
});
const User = mongoose.model('User', UserSchema);

const FavoriteSchema = new mongoose.Schema({
    movieName: { type: String, required: true },
    imgUrl: { type: String, required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movieID: { type: String, required: true }
});
const Favorite = mongoose.model('Favorite', FavoriteSchema);

const NoteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String, required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Note = mongoose.model('Note', NoteSchema);

// نقاط النهاية

// Signup
app.post('/api/users/signup', async (req, res) => {
    const { first_name, last_name, email, password, age } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ first_name, last_name, email, password: hashedPassword, age });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Signin
app.post('/api/users/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Signout
app.post('/api/users/signOut', (req, res) => {
    res.json({ message: 'Signed out successfully' });
});

// Get all users
app.get('/api/users/getAllUsers', async (req, res) => {
    const { page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    try {
        const users = await User.find().skip(skip).limit(limit);
        res.json({ message: 'success', Page: page, Users: users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add to favorites
app.post('/api/favorites/addToFavorites', async (req, res) => {
    const { movieName, imgUrl, userID, movieID } = req.body;
    try {
        const favorite = new Favorite({ movieName, imgUrl, userID, movieID });
        await favorite.save();
        res.status(201).json({ message: 'Movie added to favorites' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get favorites
app.get('/api/favorites/getFavorites', async (req, res) => {
    const { userID } = req.query;
    try {
        const favorites = await Favorite.find({ userID });
        res.json({ message: 'success', Favorites: favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add note
app.post('/api/notes/addNote', async (req, res) => {
    const { title, desc, userID } = req.body;
    try {
        const note = new Note({ title, desc, userID });
        await note.save();
        res.status(201).json({ message: 'Note added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user notes
app.get('/api/notes/getUserNotes', async (req, res) => {
    const { userID } = req.query;
    try {
        const notes = await Note.find({ userID });
        res.json({ message: 'success', Notes: notes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete note
app.delete('/api/notes/deleteNote', async (req, res) => {
    const { NoteID } = req.body;
    try {
        await Note.findByIdAndDelete(NoteID);
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update note
app.put('/api/notes/updateNote', async (req, res) => {
    const { title, desc, NoteID } = req.body;
    try {
        await Note.findByIdAndUpdate(NoteID, { title, desc });
        res.json({ message: 'Note updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
