const { MongoClient } = require("mongodb");
const readline = require("readline");

const url = "mongodb://localhost:27017/";
const client = new MongoClient(url);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(q) {
    return new Promise(res => rl.question(q, res));
}

// ---------------- PROCESS FUNCTIONS ----------------

async function autoProcessStudent(students, doc) {
    if (doc.Score && Array.isArray(doc.Score)) {
        if (doc._id === 1) {
            doc.Score[2] = 5;   // third position
        } else {
            doc.Score[3] = 6;   // fourth position
        }
        const multiplied = doc.Score.map(x => x * 20);
        await students.updateOne({ _id: doc._id }, { $set: { Score: multiplied } });
        console.log("Auto Processing Completed For Student _id = " + doc._id);
    }
}

async function autoProcessCourse(courses, doc) {
    if (doc.Score && Array.isArray(doc.Score)) {
        if (doc._id === 1) {
            doc.Score[2] = 5;
        } else {
            doc.Score[3] = 6;
        }
        const multiplied = doc.Score.map(x => x * 20);
        await courses.updateOne({ _id: doc._id }, { $set: { Score: multiplied } });
        console.log("Auto Processing Completed For Course _id = " + doc._id);
    }
}

// --------------------- MAIN RUN ---------------------

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");

        const db = client.db("SchoolDB");
        const students = db.collection("Students");
        const courses = db.collection("Courses");

        // ---------------- INITIAL INSERT ----------------

        await students.insertMany([
            { _id: 1, name: "Ali", age: 16 },
            { _id: 2, name: "Sara", age: 15 },
            { _id: 3, name: "Mona", age: 19 },
            { _id: 4, name: "Omar", age: 18 },
            { _id: 5, name: "Ahmed", age: 20 }
        ]).catch(()=>{});

        await courses.insertMany([
            { _id: 1, title: "Math" },
            { _id: 2, title: "Physics" },
            { _id: 3, title: "Biology" },
            { _id: 4, title: "Chemistry" },
            { _id: 5, title: "Arabic" }
        ]).catch(()=>{});

        // ---------------- DELETE SOME DOCUMENTS ----------------
        await students.deleteOne({_id:3});
        await courses.deleteOne({_id:3});

        // ---------------- ASSIGN COURSES ----------------
        await students.updateOne({name:"Ali"}, { $set: { courses: [1,2] } });
        await students.updateOne({name:"Sara"}, { $set: { courses: [2,4] } });
        await students.updateOne({name:"Omar"}, { $set: { courses: [1,3,5] } });
        await students.updateOne({name:"Ahmed"}, { $set: { courses: [4,5] } });

        // ---------------- DEFAULT SCORES ----------------
        const defaultScores = [
            { _id: 1, name: "Ali", Score: [20, 22, 15, 30] },
            { _id: 2, name: "Sara", Score: [18, 17, 19, 20] },
            { _id: 4, name: "Ahmed", Score: [35, 25, 19, 20] }
        ];

        for (let ds of defaultScores) {
            await students.updateOne(
                { _id: ds._id },
                { $set: { Score: ds.Score } },
                { upsert: true }
            );
            await autoProcessStudent(students, ds);
        }
          const defaultCourses = [
              { _id: 1, Score: [50, 60, 70,10] },   
              { _id: 2, Score: [65, 70, 80, 15] },
              { _id: 4, Score: [55, 60, 65, 20] },
              { _id: 5, Score: [60, 65, 70, 10] }  
            ];


        for (let course of defaultCourses) {
            await courses.updateOne(
                { _id: course._id },
                { $set: { Score: course.Score } },
                { upsert: true }
            );
            await autoProcessCourse(courses, course);
        }

        // --------------------- MENU LOOP ---------------------

        let exit = false;
        while(!exit){

            console.log("\n=== Choose an option ===");
            console.log("1) Insert New Student");
            console.log("2) Delete Student by _id");
            console.log("3) Delete Course by _id");
            console.log("4) Update Student Score");
            console.log("5) Insert New Course");
            console.log("6) Update Course Score");
            console.log("7) Assign Course(s) to Student");
            console.log("8) Remove Course(s) from Student");
            console.log("9) Exit");

            const choice = await ask("Your choice: ");

            switch(choice){

                case "1": // INSERT STUDENT
                    const id = parseInt(await ask("Enter _id: "));
                    const name = await ask("Enter name: ");
                    const age = parseInt(await ask("Enter age: "));
                    const scoreInput = await ask("Enter Scores (comma separated): ");
                    const score = scoreInput.split(",").map(Number);
                    const coursesInput = await ask("Enter course IDs (comma separated): ");
                    const coursesList = coursesInput.split(",").map(Number);

                    const newDoc = { _id: id, name, age, Score: score, courses: coursesList };
                    await students.insertOne(newDoc);
                    await autoProcessStudent(students, newDoc);
                    break;

                case "2": // DELETE STUDENT
                    const delStudentId = parseInt(await ask("Enter student _id: "));
                    const del1 = await students.deleteOne({_id: delStudentId});
                    console.log(del1.deletedCount ? "Student Deleted":"Student Not Found");
                    break;

                case "3": // DELETE COURSE
                    const delCourseId = parseInt(await ask("Enter course _id: "));
                    const del2 = await courses.deleteOne({_id: delCourseId});
                    console.log(del2.deletedCount ? "Course Deleted":"Course Not Found");
                    break;

                case "4": // UPDATE STUDENT SCORE
                    const upId = parseInt(await ask("Enter student _id: "));
                    const student = await students.findOne({_id: upId});
                    if(!student){ console.log("Student Not Found"); break; }
                    const newScores = (await ask("Enter new Scores (comma separated): ")).split(",").map(Number);
                    const updatedStudent = { ...student, Score: newScores };
                    await autoProcessStudent(students, updatedStudent);
                    break;

                case "5": // INSERT COURSE
                    const courseId = parseInt(await ask("Enter course _id: "));
                    const courseTitle = await ask("Enter course title: ");
                    const courseScoreInput = await ask("Enter Scores (comma separated): ");
                    const courseScore = courseScoreInput.split(",").map(Number);
                    const newCourse = { _id: courseId, title: courseTitle, Score: courseScore };
                    await courses.insertOne(newCourse);
                    await autoProcessCourse(courses, newCourse);
                    break;

                case "6": // UPDATE COURSE SCORE
                    const upCourseId = parseInt(await ask("Enter course _id: "));
                    const course = await courses.findOne({_id: upCourseId});
                    if(!course){ console.log("Course Not Found"); break; }
                    const newCourseScoreInput = await ask("Enter new Scores (comma separated): ");
                    const newCourseScore = newCourseScoreInput.split(",").map(Number);
                    const updatedCourse = { ...course, Score: newCourseScore };
                    await autoProcessCourse(courses, updatedCourse);
                    break;

                case "7": // ASSIGN COURSES
                    const studentIdAssign = parseInt(await ask("Enter student _id: "));
                    const studentAssign = await students.findOne({ _id: studentIdAssign });
                    if(!studentAssign){ console.log("Student Not Found"); break; }
                    const coursesAssignInput = await ask("Enter course IDs to assign (comma separated): ");
                    const coursesAssign = coursesAssignInput.split(",").map(Number);
                    const currentCourses = studentAssign.courses || [];
                    await students.updateOne(
                        { _id: studentIdAssign },
                        { $set: { courses: [...new Set([...currentCourses, ...coursesAssign])] } }
                    );
                    console.log("Courses Assigned Successfully");
                    break;

                case "8": // REMOVE COURSES
                    const studentIdRemove = parseInt(await ask("Enter student _id: "));
                    const studentRemove = await students.findOne({ _id: studentIdRemove });
                    if (!studentRemove) { console.log("Student Not Found"); break; }
                    const coursesRemoveInput = await ask("Enter course IDs to remove (comma separated): ");
                    const coursesRemove = coursesRemoveInput.split(",").map(Number);
                    const updatedCourses = (studentRemove.courses || []).filter(id => !coursesRemove.includes(id));
                    await students.updateOne(
                        { _id: studentIdRemove },
                        { $set: { courses: updatedCourses } }
                    );
                    console.log("Courses Removed Successfully");
                    break;

                case "9": // EXIT
                    exit = true;
                    break;

                default:
                    console.log("Invalid Choice");
            }
        }

        rl.close();
        console.log("Program Finished");

    } catch(err){
        console.error(err);
    } finally{
        await client.close();
    }
}

run();
