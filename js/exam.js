/**
 * exam.js
 * Logic for taking an exam, countdown timer, and calculating scores.
 */

let currentUser = null;
let currentTest = null;
let timerInterval = null;
let timeRemaining = 0; // seconds

document.addEventListener('DOMContentLoaded', () => {
    currentUser = window.DB.getCurrentUser();
    
    // Auth Check
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    // Get Exam ID
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');

    if (!testId) {
        showError("Invalid exam link.");
        return;
    }

    // Fetch Test
    currentTest = window.DB.getTestById(testId);
    if (!currentTest) {
        showError("The specified exam could not be found.");
        return;
    }

    // Check if taken
    if (window.DB.hasStudentTakenTest(currentUser.email, testId)) {
        showError("You have already completed this exam.");
        return;
    }

    // Initialize UI
    document.getElementById('exam-dashboard').style.display = 'block';
    document.getElementById('exam-title').textContent = currentTest.title;
    document.getElementById('exam-subtitle').textContent = `Instructor: ${currentTest.teacherName} | ${currentTest.questions.length} Questions`;
    
    renderQuestions();
    startTimer(currentTest.timeLimit * 60);
});

function showError(msg) {
    document.getElementById('exam-dashboard').style.display = 'none';
    document.getElementById('error-view').classList.remove('hidden');
    document.getElementById('error-message').textContent = msg;
}

function startTimer(seconds) {
    timeRemaining = seconds;
    const display = document.getElementById('timer-display');

    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const min = Math.floor(timeRemaining / 60);
        const sec = timeRemaining % 60;
        
        display.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        
        if (timeRemaining <= 60) {
            display.style.color = '#ef4444'; // Red color for danger
        }

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your answers automatically.");
            submitExam();
        }
    }, 1000);
}

function renderQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    currentTest.questions.forEach((q, index) => {
        let optionsHtml = '';
        
        for (const [key, value] of Object.entries(q.options)) {
            optionsHtml += `
                <label class="option-item">
                    <input type="radio" name="${q.id}" value="${key}" required>
                    <span style="font-weight: 500; margin-right: 0.5rem; color: var(--text-muted);">${key})</span>
                    <span>${value}</span>
                </label>
            `;
        }
        
        const html = `
            <div class="glass-panel question-block" style="padding: 2rem; margin-bottom: 1.5rem;">
                <h4 style="color: var(--text-muted); margin-bottom: 1rem;">Question ${index + 1} of ${currentTest.questions.length}</h4>
                <div class="question-text">${q.text}</div>
                <div class="options-list">
                    ${optionsHtml}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
    });
}

function submitExam() {
    // Clear Timer
    clearInterval(timerInterval);
    
    const form = document.getElementById('exam-form');
    const formData = new FormData(form);
    
    let score = 0;
    const totalScore = currentTest.questions.length;
    
    // Evaluate answers
    currentTest.questions.forEach(q => {
        const studentAns = formData.get(q.id);
        if (studentAns === q.correctOption) {
            score++;
        }
    });
    
    const result = {
        testId: currentTest.id,
        studentEmail: currentUser.email,
        studentName: currentUser.name,
        score: score,
        totalScore: totalScore,
        answers: Object.fromEntries(formData.entries())
    };
    
    window.DB.saveResult(result);
    
    // Show Success Modal
    document.getElementById('exam-dashboard').style.display = 'none';
    document.getElementById('success-view').classList.remove('hidden');
    
    const displayScore = document.getElementById('score-display');
    const details = document.getElementById('score-details');
    
    const pct = ((score / totalScore) * 100).toFixed(1);
    displayScore.textContent = `${pct}%`;
    if (pct >= 50) {
        displayScore.style.color = 'var(--success)';
    } else {
        displayScore.style.color = '#fcd34d';
    }
    details.textContent = `You scored ${score} out of ${totalScore} points.`;
}

document.getElementById('exam-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    if(confirm("Are you sure you want to submit? You cannot change your answers later.")) {
        submitExam();
    }
});
