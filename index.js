import express from "express";
import { config } from "dotenv";
import routesNew from "./routes/routes.js";
import connectDB from "./connectdb/connect.js";
import bodyParser from "body-parser";

config({ path: './.env' });

const port = process.env.PORT_NAME || 5000;
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/loginsignup"; 

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(bodyParser.urlencoded({extended:true}))

app.set('view engine', 'ejs');
app.set('views', 'views');


(async () => {
  try {
    await connectDB(mongoURI);
    console.log("Connected to MongoDB successfully");
    
    app.use("/", routesNew);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1); 
  }
})();
