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

function processScore(score, id) {
    if (!score || score.length < 4) score = [1,2,3,4];
    if (id === 1) score[2] = 5;
    else score[3] = 6;
    return score.map(x => x*20);
}

async function autoProcessStudent(students, doc) {
    const multiplied = processScore(doc.Score, doc._id);
    await students.updateOne({ _id: doc._id }, { $set: { Score: multiplied } });
    console.log("Auto Processing Completed For Student _id = " + doc._id);
}

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");

        const db = client.db("SchoolDB");
        const students = db.collection("Students");
        const courses = db.collection("Courses");

        await students.insertMany([
            { _id: 1, name: "Ali", age: 16 },
            { _id: 2, name: "Sara", age: 15 },
            { _id: 3, name: "Mona", age: 19 },
            { _id: 4, name: "Omar", age: 18 },
            { _id: 5, name: "Ahmed", age: 20 }
        ]).catch(()=>{});

        await courses.insertMany([
            { _id: 10, title: "Math" },
            { _id: 11, title: "Physics" },
            { _id: 12, title: "Biology" },
            { _id: 13, title: "Chemistry" },
            { _id: 14, title: "Arabic" }
        ]).catch(()=>{});
        
        await students.deleteOne({_id:3});
        await courses.deleteOne({_id:12});

        await students.updateOne({name:"Ali"}, { $set: { courses: [10,11] } });
        await students.updateOne({name:"Sara"}, { $set: { courses: [11,13] } });
        await students.updateOne({name:"Omar"}, { $set: { courses: [10,12,14] } });
        await students.updateOne({name:"Ahmed"}, { $set: { courses: [13,14] } });

        const defaultScores = [
    { _id: 1, name: "Ali", Score: [20, 22, 15, 30] },
    { _id: 2, name: "Sara", Score: [18, 17, 19, 20] },
    { _id: 3, name: "Omar", Score: [16, 14, 13, 15] },
    { _id: 4, name: "Ahmed", Score: [35, 25, 19, 20] }
    ];
    for (let ds of defaultScores) {
        const processed = processScore(ds.Score, ds._id === 1 ? 1 : 0);
        await students.updateOne({ name: ds.name }, { $set: { Score: processed } });
    }
    
        await courses.updateOne({ _id: 10 }, { $set: { Score: 50 } });
        await courses.updateOne({ _id: 11 }, { $set: { Score: 80 } });
        await courses.updateOne({ _id: 13 }, { $set: { Score: 55 } });
        await courses.updateOne({ _id: 14 }, { $set: { Score: 60 } });

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
                case "1": // Insert Student
                 const id = parseInt(await ask("Enter _id: "));
                 const name = await ask("Enter name: ");
                 const age = parseInt(await ask("Enter age: "));
                 const scoreInput = await ask("Enter Scores (10,20,30,40): ");
                 const score = scoreInput.split(",").map(Number);
                 const coursesInput = await ask("Enter course IDs for this student (comma separated): ");
                 const courses = coursesInput.split(",").map(Number);
                
                const newDoc = { _id: id, name, age, Score: score, courses };
                await students.insertOne(newDoc);
                await autoProcessStudent(students, newDoc);
                console.log("Insert Completed and Auto Processing Applied");
                break;


                case "2": // Delete Student
                    const delStudentId = parseInt(await ask("Enter student _id: "));
                    const del1 = await students.deleteOne({_id: delStudentId});
                    console.log(del1.deletedCount ? "Student Deleted":"Student Not Found");
                    break;

                case "3": // Delete Course
                    const delCourseId = parseInt(await ask("Enter course _id: "));
                    const del2 = await courses.deleteOne({_id: delCourseId});
                    console.log(del2.deletedCount ? "Course Deleted":"Course Not Found");
                    break;

                case "4": // Update Student Score
                    const upId = parseInt(await ask("Enter student _id: "));
                    const student = await students.findOne({_id: upId});
                    if(!student){ console.log("Student Not Found"); break; }
                    const newScores = (await ask("Enter new Scores: ")).split(",").map(Number);
                    const multiplied = processScore(newScores, upId);
                    await students.updateOne({_id: upId}, {$set:{Score: multiplied}});
                    console.log("Score Updated Successfully and Multiplied by 20");
                    break;

                case "5": // Insert Course
                    const courseId = parseInt(await ask("Enter course _id: "));
                    const courseTitle = await ask("Enter course title: ");
                    const courseScore = parseInt(await ask("Enter course Score: ")) || 0;
                    await courses.insertOne({ _id: courseId, title: courseTitle, Score: courseScore });
                    console.log("Course Inserted Successfully");
                    break;

                case "6": // Update Course Score
                    const upCourseId = parseInt(await ask("Enter course _id: "));
                    const course = await courses.findOne({_id: upCourseId});
                    if(!course){ console.log("Course Not Found"); break; }
                    const newCourseScore = parseInt(await ask("Enter new course Score: ")) || 0;
                    await courses.updateOne({_id: upCourseId}, {$set:{Score:newCourseScore}});
                    console.log("Course Score Updated Successfully");
                    break;

                
                case "7": // Assign courses to student
                const studentAssign = await students.findOne({ _id: studentIdAssign });
                if (!studentAssign) { console.log("Student Not Found"); break; }
                const studentIdAssign = parseInt(await ask("Enter student _id: "));
                const coursesAssignInput = await ask("Enter course IDs to assign (comma separated): ");
                const coursesAssign = coursesAssignInput.split(",").map(Number);
                const currentCourses = studentAssign.courses || [];
                await students.updateOne(
                    { _id: studentIdAssign },
                    { $set: { courses: [...new Set([...currentCourses, ...coursesAssign])] } }
                );
                console.log("Courses Assigned Successfully");
                break;
                
                case "8": // Remove courses from student
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
                
                
                case "9": exit=true; break;
                default: console.log("Invalid Choice");
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
