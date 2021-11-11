import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const connection_url = process.env.DB_URL
async function connectDB() {
    const options= {
        autoIndex: false, // Don't build indexes
        maxPoolSize: 50, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
    };
    await mongoose.connect(connection_url, options);
    console.log("Mongodb connected...")
}

export default connectDB;