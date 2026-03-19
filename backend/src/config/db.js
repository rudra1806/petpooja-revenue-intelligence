const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            `${process.env.MONGO_URL}`,
            {
                family: 4,
                serverSelectionTimeoutMS: 15000,
            }
        );

        console.log(
            "MongoDB connected !! DB HOST:",
            connection.connection.host
        );
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
