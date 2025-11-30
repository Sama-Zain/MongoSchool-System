const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

(async () => {

const app = express();
app.use(express.json());

const url = "mongodb://localhost:27017/";
const client = new MongoClient(url);

let db, students, courses;

// conditional auto-processing function
async function autoProcess(collection, doc) {
    if (doc.Score && Array.isArray(doc.Score)) {
        if (doc._id === 1) doc.Score[2] = 5;
        else doc.Score[3] = 6;

        const multiplied = doc.Score.map(x => x * 20);
        await collection.updateOne({ _id: doc._id }, { $set: { Score: multiplied } });
    }
}

async function initDb() {
    await client.connect();
    db = client.db("SchoolDB");
    students = db.collection("Students");
    courses = db.collection("Courses");

    global.students = students;
    global.courses = courses;
    global.autoProcess = autoProcess;

    // -----------------------
    // 1) Insert initial data
    // -----------------------

    await students.deleteMany({});
    await courses.deleteMany({});

    await students.insertMany([
        { _id: 1, name: "Ali", age: 16 },
        { _id: 2, name: "Sara", age: 15 },
        { _id: 3, name: "Mona", age: 17 },
        { _id: 4, name: "Omar", age: 18 },
        { _id: 5, name: "Ahmed", age: 20 }
    ]);
    

    await courses.insertMany([
        { _id: 1, title: "Math" },
        { _id: 2, title: "Physics" },
        { _id: 3, title: "English" },
        { _id: 4, title: "Chemistry" },
        { _id: 5, title: "Arabic" }
    ]);

    console.log("1. DB initialized");

    // -----------------------
    // 2) Delete documents
    // -----------------------
    await students.deleteOne({ _id: 3 });
    await courses.deleteOne({ title: "English" });

    console.log("2. Deleted one document from each collection");

    // -----------------------
    // 3) Update Score arrays
    // -----------------------
    await students.updateOne({ _id: 1 }, { $set: { Score: [10,20,50,60] } });
    await students.updateOne({ _id: 2 }, { $set: { Score: [15,25,55,65] } });
    await students.updateOne({ _id: 4 }, { $set: { Score: [18,28,58,68] } });
    await students.updateOne({ _id: 5 }, { $set: { Score: [20,30,60,70] } });

    await courses.updateOne({ _id: 1 }, { $set: { Score: [12,22,52,62] } });
    await courses.updateOne({ _id: 2 }, { $set: { Score: [14,24,54,64] } });
    await courses.updateOne({ _id: 4 }, { $set: { Score: [19,29,59,69] } });
    await courses.updateOne({ _id: 5 }, { $set: { Score: [21,31,61,71] } });

    console.log("3. Score arrays updated");
       // Trigger auto-processing for all students
    const allStudents = await students.find().toArray();
       for (const st of allStudents) {
             await autoProcess(students, st);
    }
    // Trigger auto-processing for all courses
      const allCourses = await courses.find().toArray();
        for (const c of allCourses) {
           await autoProcess(courses, c);
        }
    // -----------------------
    // 4) One-to-Many Relationship
    // -----------------------

    await students.updateMany({}, [
        {
            $set: {
                courses: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$_id", 1] }, then: [1, 2, 5] },
                            { case: { $eq: ["$_id", 2] }, then: [1, 3] },
                            { case: { $eq: ["$_id", 4] }, then: [2, 4] },
                            { case: { $eq: ["$_id", 5] }, then: [5] }
                        ],
                        default: []
                    }
                }
            }
        }
    ]);

    console.log("4. One–Many relationship added");

    // -----------------------
    // 5) Aggregation Lookup
    // -----------------------
    const aggResult = await students.aggregate([
        {
            $lookup: {
                from: "Courses",
                localField: "courses",
                foreignField: "_id",
                as: "courseDetails"
            }
        }
    ]).toArray();

    console.log("5. Aggregation Output:");
    console.log(JSON.stringify(aggResult, null, 2));

} // END OF initDb



require("./api_routes")(app);
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(err => console.error("Failed to init DB:", err));

})();
