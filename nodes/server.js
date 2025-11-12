const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API Mon Éditeur Vidéo en marche !' });
});

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucune vidéo uploadée' });
  }

  // Ici on ajoutera FFmpeg plus tard
  res.json({ 
    message: 'Vidéo reçue !', 
    filename: req.file.filename,
    path: req.file.path
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});