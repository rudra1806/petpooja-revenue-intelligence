require("dotenv").config();
const app = require('./src/app.js')
const connectDB = require('./src/config/db.js')

connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT || 3000}`);
});