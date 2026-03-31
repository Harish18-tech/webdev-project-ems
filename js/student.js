/**
 * student.js
 * Logic for student dashboard: viewing available exams and past results.
 */

let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    currentUser = window.DB.getCurrentUser();
    
    // Auth Check
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    // Set UI 
    document.getElementById('user-name-display').textContent = `Welcome, ${currentUser.name}`;
    
    // Load data
    loadAvailableTests();
});

function switchStudentTab(tab) {
    const availSec = document.getElementById('section-available');
    const resultsSec = document.getElementById('section-results');
    const tabAvail = document.getElementById('tab-available');
    const tabRes = document.getElementById('tab-results');

    if (tab === 'available') {
        availSec.classList.remove('hidden');
        resultsSec.classList.add('hidden');
        tabAvail.classList.add('active');
        tabRes.classList.remove('active');
        loadAvailableTests();
    } else {
        availSec.classList.add('hidden');
        resultsSec.classList.remove('hidden');
        tabAvail.classList.remove('active');
        tabRes.classList.add('active');
        loadMyResults();
    }
}

function loadAvailableTests() {
    const tests = window.DB.getTests();
    const container = document.getElementById('available-tests-list');
    
    container.innerHTML = '';
    
    if (tests.length === 0) {
        container.innerHTML = '<p>No exams have been published yet.</p>';
        return;
    }
    
    tests.forEach(test => {
        const hasTaken = window.DB.hasStudentTakenTest(currentUser.email, test.id);
        const date = new Date(test.createdAt).toLocaleDateString();
        
        let actionButton = '';
        if (hasTaken) {
            actionButton = `<span class="badge badge-success" style="padding: 0.5rem 1rem;">Completed</span>`;
        } else {
            actionButton = `<button class="btn btn-primary" onclick="startExam('${test.id}')">Take Exam</button>`;
        }
        
        const cardHtml = `
            <div class="glass-panel card">
                <div class="card-header">
                    <h3 class="card-title">${test.title}</h3>
                    <span class="badge badge-warning">${test.timeLimit} mins</span>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <p><strong>Teacher:</strong> ${test.teacherName}</p>
                    <p><strong>Questions:</strong> ${test.questions.length}</p>
                    <p><strong>Published:</strong> ${date}</p>
                </div>
                <div class="card-actions" style="margin-top: auto;">
                    ${actionButton}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function loadMyResults() {
    const results = window.DB.getResultsByStudent(currentUser.email);
    const tbody = document.getElementById('student-results-tbody');
    
    tbody.innerHTML = '';
    
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">You have not completed any exams yet.</td></tr>';
        return;
    }
    
    results.forEach(res => {
        const test = window.DB.getTestById(res.testId);
        const testTitle = test ? test.title : 'Deleted Exam';
        const teacherName = test ? test.teacherName : 'Unknown';
        
        const date = new Date(res.completedAt).toLocaleString();
        const pct = ((res.score / res.totalScore) * 100).toFixed(1);
        let badgeClass = pct >= 50 ? 'badge-success' : 'badge-warning';
        
        const tr = `
            <tr>
                <td><strong>${testTitle}</strong></td>
                <td>${teacherName}</td>
                <td>${date}</td>
                <td>${res.score} / ${res.totalScore}</td>
                <td><span class="badge ${badgeClass}">${pct}%</span></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function startExam(testId) {
    window.location.href = `take-exam.html?id=${testId}`;
}
