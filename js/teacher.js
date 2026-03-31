/**
 * teacher.js
 * Logic for teacher dashboard: test creation and results viewing.
 */

let currentUser = null;
let questionCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    currentUser = window.DB.getCurrentUser();
    
    // Auth Check
    if (!currentUser || currentUser.role !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }

    // Set UI 
    document.getElementById('user-name-display').textContent = `Welcome, ${currentUser.name}`;
    
    // Default 1 question
    addQuestionBlock();
    
    // Load Tests
    loadMyTests();
});

// UI View Toggle
function switchTeacherTab(tab) {
    const myTestsSec = document.getElementById('section-my-tests');
    const createTestSec = document.getElementById('section-create-test');
    const tabMyTests = document.getElementById('tab-my-tests');
    const tabCreate = document.getElementById('tab-create-test');

    if (tab === 'my-tests') {
        myTestsSec.classList.remove('hidden');
        createTestSec.classList.add('hidden');
        tabMyTests.classList.add('active');
        tabCreate.classList.remove('active');
        loadMyTests(); // Refresh view
    } else {
        myTestsSec.classList.add('hidden');
        createTestSec.classList.remove('hidden');
        tabMyTests.classList.remove('active');
        tabCreate.classList.add('active');
    }
}

// ------ Create Test Flow ------

function addQuestionBlock() {
    questionCount++;
    const container = document.getElementById('questions-container');
    
    const html = `
        <div class="glass-panel question-block" id="q-block-${questionCount}" style="padding: 1.5rem; margin-bottom: 1rem;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4>Question #${questionCount}</h4>
                ${questionCount > 1 ? `<button type="button" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="removeQuestionBlock(${questionCount})">Remove</button>` : ''}
            </div>
            
            <div class="form-group">
                <label>Question Text</label>
                <textarea required class="q-text" rows="2" placeholder="Enter question here..."></textarea>
            </div>
            
            <div class="dashboard-grid" style="gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                    <label>Option A</label>
                    <input type="text" required class="q-opt" data-opt="A">
                </div>
                <div class="form-group">
                    <label>Option B</label>
                    <input type="text" required class="q-opt" data-opt="B">
                </div>
                <div class="form-group">
                    <label>Option C</label>
                    <input type="text" required class="q-opt" data-opt="C">
                </div>
                <div class="form-group">
                    <label>Option D</label>
                    <input type="text" required class="q-opt" data-opt="D">
                </div>
            </div>
            
            <div class="form-group" style="max-width: 200px;">
                <label>Correct Answer</label>
                <select required class="q-ans">
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                </select>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
}

function removeQuestionBlock(id) {
    const block = document.getElementById(`q-block-${id}`);
    if (block) block.remove();
}

document.getElementById('create-test-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('test-title').value;
    const timeLimit = parseInt(document.getElementById('test-time').value);
    
    // Parse Questions
    const questions = [];
    const blocks = document.querySelectorAll('.question-block');
    let valid = true;
    
    blocks.forEach((block, index) => {
        const qText = block.querySelector('.q-text').value;
        const opts = block.querySelectorAll('.q-opt');
        const correct = block.querySelector('.q-ans').value;
        
        const optionsObj = {};
        opts.forEach(o => {
            optionsObj[o.getAttribute('data-opt')] = o.value;
        });
        
        questions.push({
            id: 'q_' + index,
            text: qText,
            options: optionsObj,
            correctOption: correct
        });
    });
    
    if (questions.length === 0) {
        alert("You must add at least 1 question.");
        return;
    }
    
    const newTest = {
        title: title,
        timeLimit: timeLimit,
        teacherEmail: currentUser.email,
        teacherName: currentUser.name,
        questions: questions
    };
    
    window.DB.saveTest(newTest);
    
    alert('Test successfully created and published!');
    
    // Reset form
    document.getElementById('create-test-form').reset();
    document.getElementById('questions-container').innerHTML = '';
    questionCount = 0;
    addQuestionBlock();
    
    // Switch tab
    switchTeacherTab('my-tests');
});

// ------ My Tests Flow ------

function loadMyTests() {
    const tests = window.DB.getTestsByTeacher(currentUser.email);
    const container = document.getElementById('tests-list');
    const resultsView = document.getElementById('results-view');
    
    // Reset Views
    container.innerHTML = '';
    resultsView.classList.add('hidden');
    resultsView.innerHTML = '';
    
    if (tests.length === 0) {
        container.innerHTML = '<p>You have not created any tests yet.</p>';
        return;
    }
    
    tests.forEach(test => {
        // Find how many results exist for this test
        const testResults = window.DB.getResultsByTest(test.id);
        const participantCount = testResults.length;
        
        let avgScore = 0;
        if (participantCount > 0) {
            const sum = testResults.reduce((acc, curr) => acc + (curr.score / curr.totalScore), 0);
            avgScore = ((sum / participantCount) * 100).toFixed(1);
        }
        
        const date = new Date(test.createdAt).toLocaleDateString();
        
        const cardHtml = `
            <div class="glass-panel card">
                <div class="card-header">
                    <h3 class="card-title">${test.title}</h3>
                    <span class="badge badge-warning">${test.timeLimit} mins</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p><strong>Questions:</strong> ${test.questions.length}</p>
                    <p><strong>Created:</strong> ${date}</p>
                    <p><strong>Participants:</strong> ${participantCount}</p>
                    <p><strong>Avg Score:</strong> ${avgScore}%</p>
                </div>
                <div class="card-actions" style="display:flex; justify-content:space-between;">
                    <button class="btn btn-secondary" style="font-size: 0.9rem;" onclick="viewTestResults('${test.id}')">View Results</button>
                    <button class="btn btn-danger" style="font-size: 0.9rem;" onclick="deleteTest('${test.id}')">Delete</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function deleteTest(testId) {
    if (confirm("Are you sure you want to delete this test? All student results for it will also be lost.")) {
        window.DB.deleteTest(testId);
        loadMyTests();
    }
}

function viewTestResults(testId) {
    const test = window.DB.getTestById(testId);
    const results = window.DB.getResultsByTest(testId);
    const resultsView = document.getElementById('results-view');
    
    if (!test) return;
    
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
            <h3>Results: ${test.title}</h3>
            <button class="btn btn-secondary" onclick="document.getElementById('results-view').classList.add('hidden')">Close</button>
        </div>
    `;
    
    if (results.length === 0) {
        html += `<p>No students have taken this test yet.</p>`;
    } else {
        html += `
            <div style="overflow-x: auto;">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Completed At</th>
                            <th>Score</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        results.forEach(res => {
            const date = new Date(res.completedAt).toLocaleString();
            const pct = ((res.score / res.totalScore) * 100).toFixed(1);
            let badgeClass = pct >= 50 ? 'badge-success' : 'badge-warning';
            
            html += `
                <tr>
                    <td>${res.studentName}</td>
                    <td>${res.studentEmail}</td>
                    <td>${date}</td>
                    <td>${res.score} / ${res.totalScore}</td>
                    <td><span class="badge ${badgeClass}">${pct}%</span></td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    resultsView.innerHTML = html;
    resultsView.classList.remove('hidden');
    resultsView.scrollIntoView({ behavior: 'smooth' });
}
