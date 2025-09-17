// seed.js
const mongoose = require("mongoose");
const fs = require('fs');

// Define the same schema as your main application
const planetSchema = new mongoose.Schema({
    name: String,
    id: Number,
    description: String,
    image: String,
    velocity: String,
    distance: String
});
const PlanetModel = mongoose.model('planets', planetSchema);

// The main seeding function
async function seedDB() {
    console.log("Database seeding started...");
    try {
        // Connect to MongoDB using the same environment variables as the tests
        await mongoose.connect(process.env.MONGO_URI, {
            user: process.env.MONGO_USERNAME,
            pass: process.env.MONGO_PASSWORD,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB connection successful for seeding.");

        // Clear existing data to ensure a clean slate for tests
        console.log("Clearing existing planet data...");
        await PlanetModel.deleteMany({});

        // Read the seed data from the JSON file
        const planetsData = JSON.parse(fs.readFileSync('planets-seed-data.json', 'utf8'));

        // Insert the new data
        console.log("Inserting new seed data...");
        await PlanetModel.insertMany(planetsData);

        console.log("Database seeding completed successfully!");
    } catch (err) {
        console.error("Error during database seeding:", err);
        process.exit(1); // Exit with an error code
    } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log("MongoDB connection closed.");
    }
}

// Run the seeding function
seedDB();