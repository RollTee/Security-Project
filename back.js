const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const port = 3030;

app.use(fileUpload());

// Use CORS middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Generate a random encryption key
function generateKey() {
    return crypto.randomBytes(16);
}

// Encrypt an image using AES (CBC mode)
function encryptImage(imagePath, key) {
    const plaintext = fs.readFileSync(imagePath);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    // Create the 'encrypted' folder if it doesn't exist
    const encryptedDir = path.join(__dirname, 'encrypted');
    fs.mkdirSync(encryptedDir, { recursive: true });

    // Save the encrypted file in the 'encrypted' folder
    const encryptedPath = path.join(encryptedDir, `${path.basename(imagePath)}.enc`);
    fs.writeFileSync(encryptedPath, Buffer.concat([iv, ciphertext]));

    return encryptedPath;
}

// Decrypt an image using AES (CBC mode)
function decryptImage(encryptedPath, key) {
    const data = fs.readFileSync(encryptedPath);
    const iv = data.slice(0, 16);
    const ciphertext = data.slice(16);
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const decryptedPath = path.join(__dirname, 'decrypt', path.basename(encryptedPath, '.enc'));
    fs.mkdirSync(path.dirname(decryptedPath), { recursive: true });
    fs.writeFileSync(decryptedPath, plaintext);
    return decryptedPath;
}

// Fetch all images from the database
app.get('/', (req, res) => {
    const query = 'SELECT imageID, Img FROM images';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching images:', err);
            res.status(500).send('Error fetching images');
            return;
        }

        const images = results.map((result) => {
            const imagePath = result.Img;
            try {
                const imageData = fs.readFileSync(imagePath);
                const encodedImage = imageData.toString('base64');
                return { id: result.imageID, data: encodedImage };
            } catch (err) {
                console.error(`File not found: ${imagePath}`);
                return null;
            }
        }).filter(Boolean);

        res.json(images);
    });
});

// Upload and encrypt an image
app.post('/upload', (req, res) => {
    if (!req.files || !req.files.file) {
        console.log('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    const file = req.files.file; // Access the uploaded file
    const uploadDir = path.join(__dirname, 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, file.data);

    const key = generateKey();
    const encryptedPath = encryptImage(filePath, key);
    console.log('Encrypted file:', encryptedPath);
    const decryptedPath = decryptImage(encryptedPath, key);
    console.log('Decrypted file:', decryptedPath);

    const query = 'INSERT INTO images (Img, encryptedImg, keyImg, decryptedImg) VALUES (?, ?, ?, ?)';
    connection.query(query, [filePath, encryptedPath, key.toString('hex'), decryptedPath], (err) => {
        if (err) {
            console.error('Error saving image data:', err);
            res.status(500).send('Error saving image data');
            return;
        }
        res.send('Image uploaded and encrypted successfully');
    });
});

// Download a decrypted image
app.get('/download/:imageID', (req, res) => {
    const imageID = req.params.imageID;
    const query = 'SELECT decryptedImg FROM images WHERE imageID = ?';
    connection.query(query, [imageID], (err, results) => {
        if (err) {
            console.error('Error fetching decrypted image:', err);
            res.status(500).send('Error fetching decrypted image');
            return;
        }

        if (results.length === 0) {
            res.status(404).send('Image not found');
            return;
        }

        const decryptedPath = results[0].decryptedImg;
        res.download(decryptedPath);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});