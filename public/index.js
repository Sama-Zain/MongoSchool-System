// --- API Helper ---
async function api(path, method="GET", body=null){
    const res = await fetch(path, {
        method,
        headers: body ? {"Content-Type":"application/json"} : undefined,
        body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
}

// --- Students ---
async function loadStudents(){ 
    const data = await api("/students"); 
    document.getElementById("students_list").textContent = JSON.stringify(data,null,2); 
}
async function insertStudent(){ 
    const doc = { 
        _id: Number(document.getElementById("st_id").value), 
        name: document.getElementById("st_name").value, 
        age: Number(document.getElementById("st_age").value), 
        Score: document.getElementById("st_score").value ? document.getElementById("st_score").value.split(",").map(Number) : undefined 
    }; 
    const res = await api("/students","POST",doc); 
    alert(JSON.stringify(res)); 
    loadStudents(); 
}
async function deleteStudent(){ 
    const id = Number(document.getElementById("del_st").value); 
    const res = await api(`/students/${id}`,"DELETE"); 
    alert(JSON.stringify(res)); 
    loadStudents(); 
}
async function updateStudentScore(){ 
    const id = Number(document.getElementById("up_st_id").value); 
    const score = document.getElementById("up_st_score").value.split(",").map(Number); 
    const res = await api(`/students/${id}/score`,"PUT",{Score:score}); 
    alert(JSON.stringify(res)); 
    loadStudents(); 
}

// --- Courses ---
async function loadCourses(){ 
    const data = await api("/courses"); 
    document.getElementById("courses_list").textContent = JSON.stringify(data,null,2); 
}
async function insertCourse(){ 
    const doc = { 
        _id: Number(document.getElementById("c_id").value), 
        title: document.getElementById("c_title").value, 
        Score: document.getElementById("c_score").value ? document.getElementById("c_score").value.split(",").map(Number) : undefined 
    }; 
    const res = await api("/courses","POST",doc); 
    alert(JSON.stringify(res)); 
    loadCourses(); 
}
async function deleteCourse(){ 
    const id = Number(document.getElementById("del_c").value); 
    const res = await api(`/courses/${id}`,"DELETE"); 
    alert(JSON.stringify(res)); 
    loadCourses(); 
}
async function updateCourseScore(){ 
    const id = Number(document.getElementById("up_c_id").value); 
    const score = document.getElementById("up_c_score").value.split(",").map(Number); 
    const res = await api(`/courses/${id}/score`,"PUT",{Score:score}); 
    alert(JSON.stringify(res)); 
    loadCourses(); 
}

// --- Assign / Remove ---
async function assignCourses() {
    const id = Number(document.getElementById("assign_st_id").value);
    const courses = document.getElementById("assign_courses").value
                     .split(",").map(x => Number(x.trim()));
    const res = await api(`/students/${id}/assign`, "POST", { courses });
    alert(JSON.stringify(res));
    loadStudents();
}
async function removeCourses(){
    const id = Number(document.getElementById("assign_st_id").value);
    const courses = document.getElementById("assign_courses").value.split(",").map(Number);
    const res = await api(`/students/${id}/remove`, "POST", { courses });
    alert(JSON.stringify(res));
    loadStudents();
}

// --- Load on start ---
loadStudents();
loadCourses();
