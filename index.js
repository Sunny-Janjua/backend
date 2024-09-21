import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import fs from "fs"; // Import the fs module
import path from "path"; // For handling file paths
import mongoose from "mongoose";

dotenv.config({
    path: "./.env"
});

const app = express();
const portName = process.env.PORT_NAME || 5000;

app.use(express.urlencoded({extended:false}))
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGOOSE_API_KEY)
.then(() => {
    console.log("MongoDB Connected");
}).catch((error) => {
    console.error("MongoDB Connection Error:", error);
});
// Define a Mongoose schema
const userSchema = new mongoose.Schema({
    imgUrl: {
        type: String,
        required: true
    }
},{
    timestamps:true
}
);

// Create a Mongoose model
const User = mongoose.model("User", userSchema);

    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDNARY_NAME,
        api_key:process.env.API_KEY,
        api_secret:process.env.API_SEC_KEY 
    });

// Setting up view engine
app.set('view engine', 'ejs');
app.set('views',"views"); // Correct path for views

// Handling GET request
app.get("/", (req, res) => {
    console.log("GET request received");
    res.render("upload");
});

// Multer setup for file storage locally
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // Specify the directory where files should be stored
    },
    filename: function (req, file, cb) {
        const uniqueName = uuidv4() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// POST request to handle file upload
// POST request to handle file upload
app.post("/uploads", upload.single('myfile'), async (req, res) => {
    try {
        console.log("Uploading file:", req.file);

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path);
        console.log("Cloudinary Upload Result:", uploadResult);

        // Save URL in MongoDB
        const newUser = new User({
            imgUrl: uploadResult.secure_url
        });
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error("Error deleting local file:", err);
            } else {
                console.log("Local file deleted:", req.file.path);
            }
        });
        await newUser.save();
        console.log("Saved image URL to MongoDB");
        res.redirect(`/image/${newUser._id}`);
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).send("Error uploading file: " + error.message);
    }
});

app.get("/image/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send("Image not found");
        }
        res.render("newupload", { imageUrl: user.imgUrl });
    } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).send("Error fetching image: " + error.message);
    }
});





// Start the server
app.listen(portName, () => {
    console.log(`Server started on port ${portName}`);
});
