import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { checkConnections } from "./utils/connectionCheck.js";

dotenv.config({ path: './.env' });

connectDB()
    .then(async () => {
        // Run the utility check here
        await checkConnections();

        const port = process.env.PORT || 8000;
        app.listen(port, () => {
            console.log(`⚙️  Server is running at port : ${port}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
        process.exit(1);
    });