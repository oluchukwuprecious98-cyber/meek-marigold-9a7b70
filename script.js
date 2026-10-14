/* STUDYHUB - BEGINNER DEMO APP */
const supabaseClient = window.studyHubSupabase;

// Elements
const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const storage = {
  notes: "studyhub_notes",
  tasks: "studyhub_tasks",
  timetable: "studyhub_timetable"
};

// Read saved data safely
function readData(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

let notes = readData(storage.notes);
let tasks = readData(storage.tasks);
let timetable = readData(storage.timetable);

// Save data on this browser/device
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    alert("Could not save data. Check your browser storage.");
  }
}

// Create elements without treating user input as HTML
function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function makeButton(text, className, action) {
  const button = makeElement("button", className, text);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

// REAL SUPABASE AUTHENTICATION

function showLoggedInUser(user) {
  const fullName = user.user_metadata?.full_name;

  document.getElementById("welcomeName").textContent =
    fullName || user.email?.split("@")[0] || "Student";

  loginError.textContent = "";
  loginPage.classList.add("hidden");
  appPage.classList.remove("hidden");

  showSection("dashboard");
  renderAll();
}

function showLoginPage() {
  appPage.classList.add("hidden");
  loginPage.classList.remove("hidden");
}

// LOG IN
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("loginBtn");

  loginError.textContent = "";
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    showLoggedInUser(data.user);
  } catch (error) {
    loginError.textContent =
      error.message || "Login failed. Please try again.";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log In";
  }
});

// CREATE ACCOUNT
document.getElementById("signupBtn").addEventListener(
  "click",
  async function () {
    const fullName =
      document.getElementById("fullName").value.trim();

    const email =
      document.getElementById("email").value.trim();

    const password =
      document.getElementById("password").value;

    const signupBtn = document.getElementById("signupBtn");

    loginError.textContent = "";

    if (!fullName) {
      loginError.textContent =
        "Please enter your full name to register.";
      return;
    }

    if (!email || !password) {
      loginError.textContent =
        "Enter your email and password first.";
      return;
    }

    if (password.length < 8) {
      loginError.textContent =
        "Your password must contain at least 8 characters.";
      return;
    }

    signupBtn.disabled = true;
    signupBtn.textContent = "Creating account...";

    try {
      const { data, error } =
        await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

      if (error) throw error;

      if (data.session && data.user) {
        showLoggedInUser(data.user);
      } else {
        loginError.textContent =
          "Account created! Check your email for a confirmation link, then log in.";
      }
    } catch (error) {
      loginError.textContent =
        error.message || "Registration failed. Please try again.";
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = "Create Account";
    }
  }
);

// RESTORE AN EXISTING SESSION
async function restoreSession() {
  try {
    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data.session?.user) {
      showLoggedInUser(data.session.user);
    } else {
      showLoginPage();
    }
  } catch (error) {
    showLoginPage();
    loginError.textContent =
      "Unable to check your session. Check your connection and reload.";
  }
}

// LOG OUT
document.getElementById("logoutBtn").addEventListener(
  "click",
  async function () {
    const logoutBtn = this;
    logoutBtn.disabled = true;

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      showLoginPage();
      loginForm.reset();
      loginError.textContent = "";
    } catch (error) {
      alert("Could not log out: " + error.message);
    } finally {
      logoutBtn.disabled = false;
    }
  }
);

// Check for an existing login when the app opens
restoreSession();

// NAVIGATION
function showSection(sectionId) {
  document.querySelectorAll(".app-section").forEach(section => {
    section.classList.toggle("hidden", section.id !== sectionId);
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );
  });
}

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    showSection(button.dataset.section);
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    showSection(button.dataset.go);
  });
});

// DASHBOARD COUNTS
function updateStats() {
  document.getElementById("noteCount").textContent = notes.length;

  document.getElementById("taskCount").textContent =
    tasks.filter(task => !task.completed).length;

  document.getElementById("doneCount").textContent =
    tasks.filter(task => task.completed).length;
}

function renderAll() {
  renderNotes();
  renderTasks();
  renderTimetable();
  updateStats();
}

function showEmpty(container, message) {
  container.appendChild(makeElement("p", "empty", message));
}

// NOTES
document.getElementById("noteForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const title = document.getElementById("noteTitle").value.trim();
  const body = document.getElementById("noteBody").value.trim();

  if (!title || !body) return;

  notes.unshift({
    id: Date.now() + Math.random(),
    title,
    body
  });

  saveData(storage.notes, notes);
  this.reset();
  renderAll();
});

function renderNotes() {
  const list = document.getElementById("notesList");
  list.replaceChildren();

  if (notes.length === 0) {
    showEmpty(list, "No notes yet. Add your first study note above.");
    return;
  }

  notes.forEach(note => {
    const card = makeElement("article", "item-card");
    card.appendChild(makeElement("h3", "", note.title));
    card.appendChild(makeElement("p", "", note.body));

    const actions = makeElement("div", "item-actions");
    actions.appendChild(makeButton("Delete note", "small-btn delete-btn", () => {
      if (!confirm("Delete this note?")) return;

      notes = notes.filter(item => item.id !== note.id);
      saveData(storage.notes, notes);
      renderAll();
    }));

    card.appendChild(actions);
    list.appendChild(card);
  });
}

// TASKS
document.getElementById("taskForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const date = document.getElementById("taskDate").value;

  if (!title) return;

  tasks.unshift({
    id: Date.now() + Math.random(),
    title,
    date,
    completed: false
  });

  saveData(storage.tasks, tasks);
  this.reset();
  renderAll();
});

function renderTasks() {
  const list = document.getElementById("tasksList");
  list.replaceChildren();

  if (tasks.length === 0) {
    showEmpty(list, "No tasks yet. Add an assignment or study goal.");
    return;
  }

  tasks.forEach(task => {
    const card = makeElement(
      "article",
      task.completed ? "item-card completed" : "item-card"
    );

    card.appendChild(makeElement("h3", "", task.title));

    if (task.date) {
      card.appendChild(makeElement("p", "", "Due: " + task.date));
    }

    card.appendChild(makeElement(
      "p",
      "",
      task.completed ? "Status: Completed" : "Status: Pending"
    ));

    const actions = makeElement("div", "item-actions");

    actions.appendChild(makeButton(
      task.completed ? "Mark pending" : "Mark completed",
      "small-btn",
      () => {
        task.completed = !task.completed;
        saveData(storage.tasks, tasks);
        renderAll();
      }
    ));

    actions.appendChild(makeButton("Delete task", "small-btn delete-btn", () => {
      if (!confirm("Delete this task?")) return;

      tasks = tasks.filter(item => item.id !== task.id);
      saveData(storage.tasks, tasks);
      renderAll();
    }));

    card.appendChild(actions);
    list.appendChild(card);
  });
}

// TIMETABLE
document.getElementById("scheduleForm").addEventListener(
  "submit",
  function (event) {
    event.preventDefault();

    const day = document.getElementById("scheduleDay").value;
    const time = document.getElementById("scheduleTime").value.trim();
    const subject = document.getElementById("scheduleSubject").value.trim();

    if (!time || !subject) return;

    timetable.push({
      id: Date.now() + Math.random(),
      day,
      time,
      subject
    });

    saveData(storage.timetable, timetable);
    this.reset();
    renderTimetable();
  }
);

function renderTimetable() {
  const list = document.getElementById("timetableList");
  list.replaceChildren();

  const dayOrder = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
  ];

  const sorted = [...timetable].sort((a, b) => {
    const dayDifference = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    return dayDifference || a.time.localeCompare(b.time);
  });

  if (sorted.length === 0) {
    showEmpty(list, "Your timetable is empty. Add your first study session.");
    return;
  }

  sorted.forEach(entry => {
    const card = makeElement("article", "item-card");
    card.appendChild(makeElement("h3", "", entry.day));
    card.appendChild(makeElement("p", "", "Time: " + entry.time));
    card.appendChild(makeElement("p", "", "Subject: " + entry.subject));

    card.appendChild(makeButton("Remove", "small-btn delete-btn", () => {
      timetable = timetable.filter(item => item.id !== entry.id);
      saveData(storage.timetable, timetable);
      renderTimetable();
    }));

    list.appendChild(card);
  });
}

// QUIZ PRACTICE
const questions = [
  {
    question: "What does HTML stand for?",
    options: [
      "HyperText Markup Language",
      "HighText Machine Language",
      "Hyper Transfer Main Link",
      "Home Tool Markup Language"
    ],
    answer: 0,
    explanation: "HTML stands for HyperText Markup Language."
  },
  {
    question: "Which language is used to style a web page?",
    options: ["Java", "CSS", "SQL", "Python"],
    answer: 1,
    explanation: "CSS controls the appearance and layout of web pages."
  },
  {
    question: "Which HTML tag creates a paragraph?",
    options: ["<h1>", "<img>", "<p>", "<div>"],
    answer: 2,
    explanation: "The <p> tag represents a paragraph."
  },
  {
    question: "Which JavaScript keyword declares a variable that can be reassigned?",
    options: ["const", "fixed", "let", "static"],
    answer: 2,
    explanation: "A variable declared with let can be reassigned."
  },
  {
    question: "Which method displays a message in the browser console?",
    options: [
      "console.log()",
      "print.page()",
      "message.show()",
      "browser.write()"
    ],
    answer: 0,
    explanation: "console.log() writes a message to the developer console."
  }
];

let questionIndex = 0;
let quizScore = 0;
let quizAnswered = false;

function renderQuestion() {
  const question = questions[questionIndex];

  document.getElementById("quizProgress").textContent =
    "QUESTION " + (questionIndex + 1) + " OF " + questions.length;

  document.getElementById("quizQuestion").textContent = question.question;
  document.getElementById("quizFeedback").textContent = "";

  const optionsContainer = document.getElementById("quizOptions");
  optionsContainer.replaceChildren();

  question.options.forEach((option, index) => {
    const button = makeButton(option, "quiz-option", () => {
      answerQuestion(index);
    });

    optionsContainer.appendChild(button);
  });

  quizAnswered = false;
  document.getElementById("nextQuestion").disabled = true;
  document.getElementById("nextQuestion").textContent =
    questionIndex === questions.length - 1 ? "See Results" : "Next Question";
}

function answerQuestion(selectedIndex) {
  if (quizAnswered) return;

  quizAnswered = true;

  const question = questions[questionIndex];
  const buttons = document.querySelectorAll(".quiz-option");

  buttons.forEach((button, index) => {
    button.disabled = true;

    if (index === question.answer) {
      button.classList.add("correct");
    } else if (index === selectedIndex) {
      button.classList.add("wrong");
    }
  });

  const feedback = document.getElementById("quizFeedback");

  if (selectedIndex === question.answer) {
    quizScore++;
    feedback.textContent = "Correct! " + question.explanation;
    feedback.style.color = "#16835b";
  } else {
    feedback.textContent = "Not quite. " + question.explanation;
    feedback.style.color = "#c43d50";
  }

  document.getElementById("nextQuestion").disabled = false;
}

document.getElementById("nextQuestion").addEventListener("click", function () {
  if (!quizAnswered) return;

  if (questionIndex < questions.length - 1) {
    questionIndex++;
    renderQuestion();
  } else {
    showQuizResults();
  }
});

function showQuizResults() {
  document.getElementById("quizProgress").textContent = "QUIZ COMPLETED";
  document.getElementById("quizQuestion").textContent =
    "You scored " + quizScore + " out of " + questions.length + "!";

  document.getElementById("quizOptions").replaceChildren();

  const feedback = document.getElementById("quizFeedback");
  feedback.style.color = "#5030b2";
  feedback.textContent =
    quizScore === questions.length
      ? "Excellent work! You answered every question correctly."
      : "Good effort! Review the explanations and try again.";

  const nextButton = document.getElementById("nextQuestion");
  nextButton.disabled = false;
  nextButton.textContent = "Try Again";

  // Replace the click action for the final results screen.
  nextButton.onclick = function restartQuiz() {
    questionIndex = 0;
    quizScore = 0;
    nextButton.onclick = null;
    renderQuestion();
  };
}

// Prepare the first quiz question
renderQuestion();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .catch((error) => {
                console.error(
                    "Service worker registration failed:",
                    error
                );
            });
    });
}
