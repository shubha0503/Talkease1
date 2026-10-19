document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const quizIntro = document.getElementById("quiz-intro")
    const quizContainer = document.getElementById("quiz-container")
    const quizResults = document.getElementById("quiz-results")
    const questionContainer = document.getElementById("question-container")
  
    // Quiz Info Elements
    const quizTopic = document.getElementById("quiz-topic")
    const quizLanguage = document.getElementById("quiz-language")
    const quizQuestionCount = document.getElementById("quiz-question-count")
  
    // Quiz Progress Elements
    const currentQuestionElem = document.getElementById("current-question")
    const totalQuestionsElem = document.getElementById("total-questions")
    const totalQuestionsResultElem = document.getElementById("total-questions-result")
    const quizProgressBar = document.getElementById("quiz-progress-bar")
    const quizTimerDisplay = document.getElementById("quiz-timer-display")
  
    // Quiz Result Elements
    const resultPercentage = document.getElementById("result-percentage")
    const correctAnswers = document.getElementById("correct-answers")
    const resultsBreakdown = document.getElementById("results-breakdown")
  
    // Buttons
    const startQuizBtn = document.getElementById("start-quiz-btn")
    const prevQuestionBtn = document.getElementById("prev-question-btn")
    const nextQuestionBtn = document.getElementById("next-question-btn")
    const submitQuizBtn = document.getElementById("submit-quiz-btn")
    const reviewAnswersBtn = document.getElementById("review-answers-btn")
    const retryQuizBtn = document.getElementById("retry-quiz-btn")
    const newQuizBtn = document.getElementById("new-quiz-btn")
  
    // Sounds
    const messageSound = document.getElementById("message-sound")
    const notificationSound = document.getElementById("notification-sound")
    const correctSound = document.getElementById("correct-sound")
    const wrongSound = document.getElementById("wrong-sound")
    const completeSound = document.getElementById("complete-sound")
  
    // API URL - auto detect origin or fallback
    const API_BASE_URL = window.location.origin && window.location.origin.startsWith("http")
      ? window.location.origin
      : "http://127.0.0.1:8000"
  
    // Quiz State
    let quizData = null
    let currentQuestion = 0
    let userAnswers = []
    let timerInterval = null
    let quizStartTime = null
    let quizDuration = 0 // in seconds
    let useDemoData = false
    const isStandaloneQuiz = window.location.pathname.endsWith("quiz.html")
  
    // Initialize the quiz page
    function init() {
      setupEventListeners()
      if (isStandaloneQuiz) {
        fetchLatestLesson(false)
        checkThemePreference()
      }
    }
  
    // Setup event listeners
    function setupEventListeners() {
      // Start quiz button
      if (startQuizBtn) {
        startQuizBtn.addEventListener("click", startQuiz)
      }
  
      // Question navigation
      if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener("click", goToPreviousQuestion)
      }
  
      if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener("click", goToNextQuestion)
      }
  
      // Submit quiz
      if (submitQuizBtn) {
        submitQuizBtn.addEventListener("click", submitQuiz)
      }
  
      // Results actions
      if (reviewAnswersBtn) {
        reviewAnswersBtn.addEventListener("click", reviewAnswers)
      }
  
      if (retryQuizBtn) {
        retryQuizBtn.addEventListener("click", retryQuiz)
      }
  
      if (newQuizBtn) {
        newQuizBtn.addEventListener("click", () => fetchLatestLesson(false))
      }
  
      // Mobile menu & Theme toggle only if standalone quiz page
      if (isStandaloneQuiz) {
        const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
        if (mobileMenuBtn) {
          mobileMenuBtn.addEventListener("click", toggleMobileMenu)
        }
    
        const themeToggleBtn = document.getElementById("theme-toggle-btn")
        if (themeToggleBtn) {
          themeToggleBtn.addEventListener("click", toggleTheme)
        }
      }
    }
  
    // Toggle mobile menu
    function toggleMobileMenu() {
      const header = document.querySelector(".header")
      header.classList.toggle("menu-open")
      playSound("message-sound")
    }
  
    // Toggle theme
    function toggleTheme() {
      document.documentElement.classList.toggle("dark-mode")
  
      // Update icon
      const themeIcon = document.getElementById("theme-toggle-btn").querySelector("i")
      if (document.documentElement.classList.contains("dark-mode")) {
        themeIcon.className = "fas fa-sun"
        localStorage.setItem("theme", "dark")
        showToast("Dark mode enabled", "info")
      } else {
        themeIcon.className = "fas fa-moon"
        localStorage.setItem("theme", "light")
        showToast("Light mode enabled", "info")
      }
  
      playSound("message-sound")
    }
  
    // Check for saved theme preference
    function checkThemePreference() {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-mode")
        const themeIcon = document.getElementById("theme-toggle-btn").querySelector("i")
        themeIcon.className = "fas fa-sun"
      }
    }
  
    // Fetch latest lesson to create a quiz
    async function fetchLatestLesson(silent = false) {
      if (!startQuizBtn) return;
      // Show loading state
      const btnText = startQuizBtn.querySelector(".btn-text")
      const spinner = startQuizBtn.querySelector(".spinner")
      if (btnText) btnText.textContent = "Loading..."
      if (spinner) spinner.classList.remove("hidden")
      startQuizBtn.disabled = true
  
      try {
        // Call the API to generate a quiz
        const response = await fetch(`${API_BASE_URL}/generate_quiz/`)
        const data = await response.json()
  
        // Update quiz data and UI
        quizData = data
        updateQuizInfo(data)
        useDemoData = false
  
        // Reset loading state
        if (btnText) btnText.textContent = "Start Quiz"
        if (spinner) spinner.classList.add("hidden")
        startQuizBtn.disabled = false
  
        if (!silent) {
          showToast("Quiz ready! Click Start Quiz to begin.", "success")
          playSound("notification-sound")
        }
  
        // Show quiz intro, hide other sections
        if (quizIntro) quizIntro.classList.remove("hidden")
        if (quizContainer) quizContainer.classList.add("hidden")
        if (quizResults) quizResults.classList.add("hidden")
      } catch (error) {
        console.error("Error fetching quiz:", error)
        if (!silent) {
          showToast("Error loading quiz. Please try again later.", "error")
        }
  
        // Reset loading state
        if (btnText) btnText.textContent = "Try Again"
        if (spinner) spinner.classList.add("hidden")
        startQuizBtn.disabled = false
  
        // Use demo data if API fails
        useDemoData = true
      } finally {
        if (useDemoData) {
          useDemoQuizData()
        }
      }
    }
  
    window.loadQuizForCurrentLesson = fetchLatestLesson;

  
    // Update quiz info from API data
    function updateQuizInfo(data) {
      // Set quiz info in the intro section
      quizTopic.textContent = `Topic: ${data.topic || "General Knowledge"}`
      quizLanguage.textContent = `Language: ${data.language || "English"}`
      quizQuestionCount.textContent = `Questions: ${data.questions ? data.questions.length : 0}`
  
      // Set total questions in the quiz container
      if (data.questions) {
        totalQuestionsElem.textContent = data.questions.length
        totalQuestionsResultElem.textContent = data.questions.length
      }
    }
  
    // Use demo quiz data if API fails
    function useDemoQuizData() {
      const demoData = {
        topic: "Basic Spanish",
        language: "Spanish",
        questions: [
          {
            type: "multiple_choice",
            question: "How do you say 'hello' in Spanish?",
            options: ["Hola", "Adiós", "Gracias", "Por favor"],
            correct_answer: "Hola",
          },
          {
            type: "multiple_choice",
            question: "What is the Spanish word for 'goodbye'?",
            options: ["Buenos días", "Adiós", "Buenas noches", "Hasta luego"],
            correct_answer: "Adiós",
          },
          {
            type: "text_input",
            question: "Translate 'thank you' to Spanish:",
            correct_answer: "gracias",
          },
          {
            type: "multiple_choice",
            question: "How do you ask 'How are you?' in Spanish?",
            options: ["¿Cómo te llamas?", "¿Dónde está?", "¿Cómo estás?", "¿Qué hora es?"],
            correct_answer: "¿Cómo estás?",
          },
          {
            type: "text_input",
            question: "Translate 'Good morning' to Spanish:",
            correct_answer: "buenos días",
          },
        ],
      }
  
      quizData = demoData
      updateQuizInfo(demoData)
    }
  
    // Start the quiz
    function startQuiz() {
      // Reset quiz state
      currentQuestion = 0
      userAnswers = Array(quizData.questions.length).fill(null)
  
      // Hide intro, show quiz container
      quizIntro.classList.add("hidden")
      quizContainer.classList.remove("hidden")
      quizResults.classList.add("hidden")
  
      // Render the first question
      renderQuestion(currentQuestion)
      updateQuizProgress()
  
      // Start timer
      startTimer()
  
      playSound("message-sound")
      showToast("Quiz started! Good luck!", "info")
    }
  
    // Render a question
    function renderQuestion(index) {
      if (!quizData || !quizData.questions || index >= quizData.questions.length) {
        console.error("Invalid question index or quiz data")
        return
      }
  
      const question = quizData.questions[index]
      questionContainer.innerHTML = "" // Clear previous question
  
      const questionElement = document.createElement("div")
      questionElement.className = "question-item active"
      questionElement.dataset.index = index
  
      // Create question text
      const questionText = document.createElement("div")
      questionText.className = "question-text"
      questionText.textContent = `Question ${index + 1}: ${question.question}`
      questionElement.appendChild(questionText)
  
      // Handle different question types
      if (question.type === "multiple_choice") {
        const optionList = document.createElement("div")
        optionList.className = "option-list"
  
        // Create options
        question.options.forEach((option, optionIndex) => {
          const optionItem = document.createElement("div")
          optionItem.className = "option-item"
  
          const optionHtml = `
                      <input type="radio" name="question-${index}" id="option-${index}-${optionIndex}" value="${option}" ${userAnswers[index] === option ? "checked" : ""}>
                      <label for="option-${index}-${optionIndex}">
                          <span class="option-prefix">${String.fromCharCode(65 + optionIndex)}</span>
                          ${option}
                      </label>
                  `
  
          optionItem.innerHTML = optionHtml
          optionList.appendChild(optionItem)
  
          // Add event listener to the option
          optionItem.addEventListener("click", () => {
            const radio = optionItem.querySelector("input[type='radio']")
            radio.checked = true
            userAnswers[index] = option
  
            // Enable next button if this is not the last question
            if (index < quizData.questions.length - 1) {
              nextQuestionBtn.disabled = false
            } else {
              // Show submit button on last question
              nextQuestionBtn.classList.add("hidden")
              submitQuizBtn.classList.remove("hidden")
            }
  
            playSound("message-sound")
          })
        })
  
        questionElement.appendChild(optionList)
      } else if (question.type === "text_input") {
        const textInputQuestion = document.createElement("div")
        textInputQuestion.className = "text-input-question"
  
        const input = document.createElement("input")
        input.type = "text"
        input.placeholder = "Type your answer here..."
        input.value = userAnswers[index] || ""
  
        input.addEventListener("input", () => {
          userAnswers[index] = input.value.trim()
  
          // Enable next button if there's any input and this is not the last question
          if (index < quizData.questions.length - 1) {
            nextQuestionBtn.disabled = false
          } else {
            // Show submit button on last question
            nextQuestionBtn.classList.add("hidden")
            submitQuizBtn.classList.remove("hidden")
          }
        })
  
        const feedbackText = document.createElement("div")
        feedbackText.className = "feedback-text"
  
        textInputQuestion.appendChild(input)
        textInputQuestion.appendChild(feedbackText)
        questionElement.appendChild(textInputQuestion)
      }
  
      questionContainer.appendChild(questionElement)
  
      // Update navigation buttons
      prevQuestionBtn.disabled = index === 0
  
      if (index === quizData.questions.length - 1) {
        nextQuestionBtn.classList.add("hidden")
        submitQuizBtn.classList.remove("hidden")
      } else {
        nextQuestionBtn.classList.remove("hidden")
        submitQuizBtn.classList.add("hidden")
        // Disable next button if no answer has been provided yet
        nextQuestionBtn.disabled = userAnswers[index] === null
      }
    }
  
    // Go to next question
    function goToNextQuestion() {
      if (currentQuestion < quizData.questions.length - 1) {
        currentQuestion++
        renderQuestion(currentQuestion)
        updateQuizProgress()
        playSound("message-sound")
      }
    }
  
    // Go to previous question
    function goToPreviousQuestion() {
      if (currentQuestion > 0) {
        currentQuestion--
        renderQuestion(currentQuestion)
        updateQuizProgress()
        playSound("message-sound")
      }
    }
  
    // Update quiz progress UI
    function updateQuizProgress() {
      currentQuestionElem.textContent = currentQuestion + 1
      const progressPercentage = ((currentQuestion + 1) / quizData.questions.length) * 100
      quizProgressBar.style.width = `${progressPercentage}%`
    }
  
    // Start quiz timer
    function startTimer() {
      quizStartTime = new Date()
      quizDuration = 0
  
      // Update timer every second
      clearInterval(timerInterval)
      timerInterval = setInterval(() => {
        const currentTime = new Date()
        quizDuration = Math.floor((currentTime - quizStartTime) / 1000)
        updateTimerDisplay()
      }, 1000)
  
      updateTimerDisplay()
    }
  
    // Update timer display
    function updateTimerDisplay() {
      const minutes = Math.floor(quizDuration / 60)
      const seconds = quizDuration % 60
      quizTimerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
  
    // Submit quiz for scoring
    function submitQuiz() {
      // Stop timer
      clearInterval(timerInterval)
  
      // Check if all questions have been answered
      const unansweredCount = userAnswers.filter((answer) => answer === null).length
  
      if (unansweredCount > 0) {
        const confirmSubmit = confirm(`You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`)
        if (!confirmSubmit) {
          return
        }
      }
  
      // Score the quiz
      const { score, correctCount } = scoreQuiz()
  
      // Update results UI
      resultPercentage.textContent = `${Math.round(score * 100)}%`
      correctAnswers.textContent = correctCount

      // Send result to Progress API
      try {
        fetch(`${API_BASE_URL}/api/progress/quiz_complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: quizData.topic || "General",
            language: quizData.language || "Spanish",
            score: correctCount,
            total: quizData.questions.length
          })
        }).catch((err) => console.log("Progress sync notice:", err));
      } catch (err) {}
  
      // Generate results breakdown
      generateResultsBreakdown()
  
      // Hide quiz container, show results
      quizContainer.classList.add("hidden")
      quizResults.classList.remove("hidden")
  
      playSound("complete-sound")
      showToast("Quiz completed! Check your results.", "success")
    }
  
    // Score the quiz
    function scoreQuiz() {
      let correctCount = 0
  
      quizData.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index]
        const correctAnswer = question.correct_answer
  
        if (question.type === "multiple_choice") {
          if (userAnswer === correctAnswer) {
            correctCount++
          }
        } else if (question.type === "text_input") {
          // Case-insensitive comparison for text input
          if (userAnswer && userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            correctCount++
          }
        }
      })
  
      const score = correctCount / quizData.questions.length
      return { score, correctCount }
    }
  
    // Generate detailed results breakdown
    function generateResultsBreakdown() {
      resultsBreakdown.innerHTML = ""
  
      quizData.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index]
        const correctAnswer = question.correct_answer
        let isCorrect = false
  
        if (question.type === "multiple_choice") {
          isCorrect = userAnswer === correctAnswer
        } else if (question.type === "text_input") {
          isCorrect = userAnswer && userAnswer.toLowerCase() === correctAnswer.toLowerCase()
        }
  
        const resultItem = document.createElement("div")
        resultItem.className = "result-item"
  
        let resultHTML = `
                  <h4>
                      <i class="fas ${isCorrect ? "fa-check-circle correct" : "fa-times-circle wrong"}"></i>
                      Question ${index + 1}
                  </h4>
                  <div class="result-question">${question.question}</div>
              `
  
        if (question.type === "multiple_choice") {
          resultHTML += `
                      <div class="result-answer">
                          <strong>Your answer:</strong>
                          <span class="${isCorrect ? "correct-answer" : "wrong-answer"}">${userAnswer || "Not answered"}</span>
                          ${!isCorrect ? `<span class="correct-answer">Correct: ${correctAnswer}</span>` : ""}
                      </div>
                  `
        } else if (question.type === "text_input") {
          resultHTML += `
                      <div class="result-answer">
                          <strong>Your answer:</strong>
                          <span class="${isCorrect ? "correct-answer" : "wrong-answer"}">${userAnswer || "Not answered"}</span>
                      </div>
                      ${
                        !isCorrect
                          ? `
                      <div class="result-answer">
                          <strong>Correct answer:</strong>
                          <span class="correct-answer">${correctAnswer}</span>
                      </div>
                      `
                          : ""
                      }
                  `
        }
  
        resultItem.innerHTML = resultHTML
        resultsBreakdown.appendChild(resultItem)
      })
    }
  
    // Review answers
    function reviewAnswers() {
      // Hide results, show quiz container
      quizResults.classList.add("hidden")
      quizContainer.classList.remove("hidden")
  
      // Replace submit button with a "Back to Results" button
      submitQuizBtn.textContent = "Back to Results"
      submitQuizBtn.classList.remove("hidden")
      nextQuestionBtn.classList.add("hidden")
  
      // Temporarily replace submit quiz function
      const originalSubmitFunction = submitQuizBtn.onclick
      submitQuizBtn.onclick = () => {
        // Restore original function and button text
        submitQuizBtn.onclick = originalSubmitFunction
        submitQuizBtn.textContent = "Submit Quiz"
  
        // Hide quiz container, show results
        quizContainer.classList.add("hidden")
        quizResults.classList.remove("hidden")
  
        playSound("message-sound")
      }
  
      // Show correct/wrong feedback for each question
      renderQuestionWithFeedback(currentQuestion)
  
      playSound("message-sound")
      showToast("Reviewing your answers", "info")
    }
  
    // Render question with correct/wrong feedback
    function renderQuestionWithFeedback(index) {
      renderQuestion(index)
  
      const question = quizData.questions[index]
      const userAnswer = userAnswers[index]
      const correctAnswer = question.correct_answer
      let isCorrect = false
  
      if (question.type === "multiple_choice") {
        isCorrect = userAnswer === correctAnswer
  
        // Add visual feedback to options
        const options = document.querySelectorAll(`.option-item`)
        options.forEach((option) => {
          const optionValue = option.querySelector("label").textContent.trim().substring(1) // Remove option prefix (A, B, C, D)
  
          if (optionValue === correctAnswer) {
            option.classList.add("correct")
          } else if (userAnswer === optionValue && userAnswer !== correctAnswer) {
            option.classList.add("wrong")
          }
        })
      } else if (question.type === "text_input") {
        isCorrect = userAnswer && userAnswer.toLowerCase() === correctAnswer.toLowerCase()
  
        const textInputQuestion = document.querySelector(".text-input-question")
        const feedbackText = textInputQuestion.querySelector(".feedback-text")
  
        if (isCorrect) {
          textInputQuestion.classList.add("correct")
          feedbackText.textContent = "Correct!"
          feedbackText.className = "feedback-text correct"
        } else {
          textInputQuestion.classList.add("wrong")
          feedbackText.textContent = `Incorrect. The correct answer is: ${correctAnswer}`
          feedbackText.className = "feedback-text wrong"
        }
      }
  
      // Disable all inputs during review
      const inputs = document.querySelectorAll("input")
      inputs.forEach((input) => {
        input.disabled = true
      })
    }
  
    // Retry the quiz with the same questions
    function retryQuiz() {
      // Reset quiz state
      currentQuestion = 0
      userAnswers = Array(quizData.questions.length).fill(null)
  
      // Hide results, show quiz container
      quizResults.classList.add("hidden")
      quizContainer.classList.remove("hidden")
  
      // Render the first question
      renderQuestion(currentQuestion)
      updateQuizProgress()
  
      // Start timer
      startTimer()
  
      playSound("message-sound")
      showToast("Quiz restarted! Good luck!", "info")
    }
  
    // Show toast notification
    function showToast(message, type = "info") {
      const toastContainer = document.getElementById("toast-container")
      const toast = document.createElement("div")
      toast.className = `toast ${type}`
  
      let icon = "fa-info-circle"
      if (type === "success") icon = "fa-check-circle"
      if (type === "warning") icon = "fa-exclamation-triangle"
      if (type === "error") icon = "fa-times-circle"
  
      toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`
      toastContainer.appendChild(toast)
  
      setTimeout(() => {
        if (toast.parentNode === toastContainer) {
          toastContainer.removeChild(toast)
        }
      }, 3000)
    }
  
    // Play UI sounds
    function playSound(soundId) {
      const sound = document.getElementById(soundId)
      if (sound) {
        sound.currentTime = 0
        sound.play().catch((err) => console.log("Audio playback error:", err))
      }
    }
  
    // Initialize the quiz page
    init()
  })
  
