/**
 * db.js
 * Handles all interacting with localStorage to simulate a database.
 */

const DB_KEYS = {
    USERS: 'exam_users',
    TESTS: 'exam_tests',
    RESULTS: 'exam_results',
    CURRENT_USER: 'exam_current_user'
};

const DB = {
    // ---- Users ----
    getUsers: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
    },
    saveUser: function(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    },
    getUserByEmail: function(email) {
        return this.getUsers().find(u => u.email === email);
    },

    // ---- Current User (Session) ----
    setCurrentUser: function(user) {
        localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    },
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER));
    },
    logout: function() {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    },

    // ---- Tests ----
    getTests: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.TESTS)) || [];
    },
    getTestById: function(id) {
        return this.getTests().find(t => t.id === id);
    },
    saveTest: function(test) {
        const tests = this.getTests();
        // Generate ID
        test.id = 'test_' + Date.now();
        test.createdAt = new Date().toISOString();
        tests.push(test);
        localStorage.setItem(DB_KEYS.TESTS, JSON.stringify(tests));
    },
    deleteTest: function(id) {
        const tests = this.getTests().filter(t => t.id !== id);
        localStorage.setItem(DB_KEYS.TESTS, JSON.stringify(tests));
        // Also delete related results
        const results = this.getResults().filter(r => r.testId !== id);
        localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(results));
    },
    getTestsByTeacher: function(teacherEmail) {
        return this.getTests().filter(t => t.teacherEmail === teacherEmail);
    },

    // ---- Results ----
    getResults: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.RESULTS)) || [];
    },
    saveResult: function(result) {
        const results = this.getResults();
        result.id = 'res_' + Date.now();
        result.completedAt = new Date().toISOString();
        results.push(result);
        localStorage.setItem(DB_KEYS.RESULTS, JSON.stringify(results));
    },
    getResultsByStudent: function(studentEmail) {
        return this.getResults().filter(r => r.studentEmail === studentEmail);
    },
    getResultsByTest: function(testId) {
        return this.getResults().filter(r => r.testId === testId);
    },
    getResultsByTeacher: function(teacherEmail) {
        // Find all tests by this teacher
        const tests = this.getTestsByTeacher(teacherEmail).map(t => t.id);
        // Find results that belong to any of those tests
        return this.getResults().filter(r => tests.includes(r.testId));
    },
    hasStudentTakenTest: function(studentEmail, testId) {
        return this.getResults().some(r => r.studentEmail === studentEmail && r.testId === testId);
    }
};

window.DB = DB;
