module.exports = function(app) {

    // ---------- Students ----------
    app.get("/students", async (req, res) => {
        const list = await students.find().toArray();
        res.json(list);
    });

    app.post("/students", async (req, res) => {
        try {
            const doc = req.body;
            if (!doc || typeof doc._id !== "number")
                return res.status(400).json({ error: "_id required as number" });

            const exists = await students.findOne({ _id: doc._id });
            if (exists) return res.status(400).json({ error: "_id already exists" });

            await students.insertOne(doc);
            await autoProcess(students, doc);

            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put("/students/:id/score", async (req, res) => {
        const id = Number(req.params.id);
        const newScore = req.body.Score;
        const st = await students.findOne({ _id: id });
        if (!st) return res.status(404).json({ error: "Student not found" });

        st.Score = newScore;
        await autoProcess(students, st);

        res.json({ ok: true });
    });

    app.delete("/students/:id", async (req, res) => {
        const id = Number(req.params.id);
        const result = await students.deleteOne({ _id: id });
        res.json({ deletedCount: result.deletedCount });
    });


    // ---------- Courses ----------
    app.get("/courses", async (req, res) => {
        const list = await courses.find().toArray();
        res.json(list);
    });

    app.post("/courses", async (req, res) => {
        try {
            const doc = req.body;
            if (!doc || typeof doc._id !== "number")
                return res.status(400).json({ error: "_id required as number" });

            const exists = await courses.findOne({ _id: doc._id });
            if (exists) return res.status(400).json({ error: "_id already exists" });

            await courses.insertOne(doc);
            await autoProcess(courses, doc);

            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.put("/courses/:id/score", async (req, res) => {
        const id = Number(req.params.id);
        const newScore = req.body.Score;

        const c = await courses.findOne({ _id: id });
        if (!c) return res.status(404).json({ error: "Course not found" });

        c.Score = newScore;
        await autoProcess(courses, c);

        res.json({ ok: true });
    });

    app.delete("/courses/:id", async (req, res) => {
        const id = Number(req.params.id);
        const result = await courses.deleteOne({ _id: id });
        res.json({ deletedCount: result.deletedCount });
    });

    // ---------- Relations ----------
    app.post("/students/:id/assign", async (req, res) => {
        try {
            const id = Number(req.params.id);
            const toAssign = req.body.courses || [];

            const st = await students.findOne({ _id: id });
            if (!st) return res.status(404).json({ error: "Student not found" });

            const merged = [...new Set([...(st.courses || []), ...toAssign])];

            await students.updateOne({ _id: id }, { $set: { courses: merged } });

            res.json({ ok: true, courses: merged });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post("/students/:id/remove", async (req, res) => {
        try {
            const id = Number(req.params.id);
            const toRemove = req.body.courses || [];

            const st = await students.findOne({ _id: id });
            if (!st) return res.status(404).json({ error: "Student not found" });

            const filtered = (st.courses || []).filter(x => !toRemove.includes(x));

            await students.updateOne({ _id: id }, { $set: { courses: filtered } });

            res.json({ ok: true, courses: filtered });

        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}  ;
 