document.addEventListener("DOMContentLoaded", () => {
  // Navigation and UI elements
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".main-nav a");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const header = document.querySelector(".header");
  const logo = document.querySelector(".logo");

  // Chat elements
  const typingIndicator = document.getElementById("typing-indicator");
  const voiceInputBtn = document.getElementById("voice-input-btn");
  const textToSpeechBtn = document.getElementById("text-to-speech-btn");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const chatBox = document.getElementById("chat-box");

  // Lesson elements
  const lessonLevel = document.getElementById("lesson-level");
  const saveLessonBtn = document.getElementById("save-lesson-btn");
  const shareLessonBtn = document.getElementById("share-lesson-btn");
  const speakLessonBtn = document.getElementById("speak-lesson-btn");
  const lessonLanguage = document.getElementById("lesson-language");
  const lessonTopic = document.getElementById("lesson-topic");
  const generateLessonBtn = document.getElementById("generate-lesson-btn");
  const lessonResult = document.getElementById("lesson-result");
  const lessonTitle = document.getElementById("lesson-title");
  const lessonContent = document.getElementById("lesson-content");

  // Audio elements
  const messageSound = document.getElementById("message-sound");
  const notificationSound = document.getElementById("notification-sound");

  // Toast container
  const toastContainer = document.getElementById("toast-container");

  // Mock data for chat responses
  const mockBotResponses = {
      hello: "Hello! How can I help you with your language learning today?",
      hi: "Hi there! Ready to practice some language skills?",
      "how are you": "I'm doing great! More importantly, how is your language learning going?",
      help: "I can help you practice conversations, answer language questions, or suggest learning resources. What would you like to do?",
      goodbye: "Goodbye! Don't forget to practice a little each day. See you next time!",
      "thank you": "You're welcome! Is there anything else you'd like to practice?",
      default: "That's interesting! Would you like to know how to say that in another language?",
  };



  const API_BASE_URL = window.location.origin && window.location.origin.startsWith("http")
      ? window.location.origin
      : "http://127.0.0.1:8000";

  // Send message to chatbot API
  async function sendMessage() {
      const message = chatInput.value.trim();
      if (message === "") return;

      addMessageToChat("user", message);
      chatInput.value = "";
      showTypingIndicator();

      try {
          const response = await fetch(`${API_BASE_URL}/chat/?prompt=${encodeURIComponent(message)}`);
          const data = await response.json();
          hideTypingIndicator();
          addMessageToChat("bot", data.response);
          fetchProgress();
      } catch (error) {
          hideTypingIndicator();
          addMessageToChat("bot", "Error: Unable to reach the chatbot.");
      }
  }

  // Initialize the app
  function init() {
      // Set up event listeners
      setupEventListeners();

      // Check for saved theme preference
      checkThemePreference();

      // Show the home section by default
      showSection("home");
      
      // Fetch initial progress stats
      fetchProgress();

      // Show welcome toast
      showToast("Welcome to TalkEase!", "success");
  }

  // Set up event listeners
  function setupEventListeners() {
      // Logo click
      logo.addEventListener("click", function() {
          showSection("home");
      });
      
      // Navigation links
      navLinks.forEach((link) => {
          link.addEventListener("click", function (e) {
              e.preventDefault();
              const section = this.getAttribute("href").substring(1);
              showSection(section);
              
              // Close mobile menu if open
              if (header.classList.contains("menu-open")) {
                  header.classList.remove("menu-open");
              }
          });
      });

      // Mobile menu toggle
      if (mobileMenuBtn) {
          mobileMenuBtn.addEventListener("click", toggleMobileMenu);
      }

      // Theme toggle
      if (themeToggleBtn) {
          themeToggleBtn.addEventListener("click", toggleTheme);
      }

      // Chat functionality
      if (sendBtn) {
          sendBtn.addEventListener("click", sendMessage);
      }

      if (chatInput) {
          chatInput.addEventListener("keypress", (e) => {
              if (e.key === "Enter") {
                  sendMessage();
              }
          });
      }

      // Voice input
      if (voiceInputBtn) {
          setupSpeechRecognition();
      }

      // Text to speech
      if (textToSpeechBtn) {
          setupTextToSpeech();
      }

      // Lesson generator
      if (generateLessonBtn) {
          generateLessonBtn.addEventListener("click", generateLesson);
      }

      // Lesson actions
      if (saveLessonBtn) {
          saveLessonBtn.addEventListener("click", saveLesson);
      }

      if (shareLessonBtn) {
          shareLessonBtn.addEventListener("click", shareLesson);
      }

      if (speakLessonBtn) {
          speakLessonBtn.addEventListener("click", speakLesson);
      }

      // Feature card buttons
      document.querySelectorAll('.feature-card').forEach(card => {
          card.addEventListener('click', function() {
              const target = this.getAttribute('data-target');
              if (target) {
                  showSection(target);
              }
          });
          
          // Prevent button click from triggering card click
          const button = card.querySelector('.btn-primary');
          if (button) {
              button.addEventListener('click', function(e) {
                  e.stopPropagation();
                  const target = card.getAttribute('data-target');
                  if (target) {
                      showSection(target);
                  }
              });
          }
      });
      
      // Make badge icons interactive
      document.querySelectorAll('.badge-icon:not(.active)').forEach(badge => {
          badge.addEventListener('click', function() {
              showToast("Keep learning to unlock this badge!", "warning");
          });
      });
      
      // Make leaderboard items interactive
      document.querySelectorAll('.leaderboard-item').forEach(item => {
          item.addEventListener('click', function() {
              const userName = this.querySelector('.user-name').textContent;
              const points = this.querySelector('.points').textContent;
              showToast(`${userName} has earned ${points}`, "info");
          });
      });
  }

  // Show section and update navigation
  function showSection(sectionId) {
      // Hide all sections
      sections.forEach((section) => {
          section.classList.remove("active");
      });

      // Show the selected section
      const selectedSection = document.getElementById(sectionId);
      if (selectedSection) {
          selectedSection.classList.add("active");

          // Update navigation
          navLinks.forEach((link) => {
              link.classList.remove("active");
              if (link.getAttribute("href").substring(1) === sectionId) {
                  link.classList.add("active");
              }
          });

          // Close mobile menu if open
          header.classList.remove("menu-open");

          // Play sound
          playSound("message-sound");
          
          // Show section-specific toast
          if (sectionId === "chat") {
              showToast("Chat with our AI language tutor!", "info");
          } else if (sectionId === "lesson") {
              showToast("Create a custom language lesson!", "info");
          } else if (sectionId === "progress") {
              showToast("Track your learning progress!", "info");
              fetchProgress();
          } else if (sectionId === "quiz") {
              showToast("Ready for your language quiz!", "info");
              if (window.loadQuizForCurrentLesson) {
                  window.loadQuizForCurrentLesson(true);
              }
          }
      }
  }

  // Toggle mobile menu
  function toggleMobileMenu() {
      header.classList.toggle("menu-open");
      playSound("message-sound");
  }

  // Toggle theme
  function toggleTheme() {
      document.documentElement.classList.toggle("dark-mode");

      // Update icon
      const themeIcon = themeToggleBtn.querySelector("i");
      if (document.documentElement.classList.contains("dark-mode")) {
          themeIcon.className = "fas fa-sun";
          localStorage.setItem("theme", "dark");
          showToast("Dark mode enabled", "info");
      } else {
          themeIcon.className = "fas fa-moon";
          localStorage.setItem("theme", "light");
          showToast("Light mode enabled", "info");
      }

      // Play sound
      playSound("message-sound");
  }

  // Check for saved theme preference
  function checkThemePreference() {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
          document.documentElement.classList.add("dark-mode");
          themeToggleBtn.querySelector("i").className = "fas fa-sun";
      }
  }

    function sanitizeText(text) {
        if (!text) return "";
    
        // Remove Markdown-style strikethrough (~~text~~)
        text = text.replace(/~~(.*?)~~/g, "$1");
    
        // Remove bold (**bold**) and italics (*italic*)
        text = text.replace(/\*\*(.*?)\*\*/g, "$1");
        text = text.replace(/\*(.*?)\*/g, "$1");
        text = text.replace(/__(.*?)__/g, "$1");
        text = text.replace(/_(.*?)_/g, "$1");
    
        // Remove HTML tags (if chatbot sends HTML-formatted text)
        text = text.replace(/<\/?[^>]+(>|$)/g, "");
    
        // Remove unwanted special characters
        text = text.replace(/[<>]/g, "");
    
        return text.trim();
    }

  // Add message to chat
  function addMessageToChat(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${sender}-message`;

    const timestamp = getCurrentTimestamp();

    // Create a new paragraph element (Prevents formatting issues)
    const messageText = document.createElement("p");
    messageText.textContent = sanitizeText(message); // Force plain text

    if (sender === "bot") {
        messageElement.innerHTML = `
            <div class="avatar">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bot-avatar.jpg-ZJd6kTjzi2T9wNduoG1Mc6Gl6ykmhU.jpeg" alt="Bot Avatar">
            </div>
            <div class="message-content">
                <span class="timestamp">${timestamp}</span>
            </div>
        `;
        messageElement.querySelector(".message-content").prepend(messageText);
    } else {
        messageElement.innerHTML = `
            <div class="message-content">
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="avatar">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user-avatar.jpg-ZLgxbA78cQsPQYH1AACzexODM64bHY.jpeg" alt="User Avatar">
            </div>
        `;
        messageElement.querySelector(".message-content").prepend(messageText);
    }

      chatBox.appendChild(messageElement);

      // Add ripple effect to new message
      messageElement.classList.add("new-message");
      setTimeout(() => {
          messageElement.classList.remove("new-message");
      }, 500);

      // Scroll to bottom of chat
      chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Show typing indicator
  function showTypingIndicator() {
      typingIndicator.classList.remove("hidden");
      chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Hide typing indicator
  function hideTypingIndicator() {
      typingIndicator.classList.add("hidden");
  }

  // Get bot response (mock)
  function getBotResponse(message) {
      message = message.toLowerCase();

      // Check for exact matches
      for (const key in mockBotResponses) {
          if (message.includes(key)) {
              return mockBotResponses[key];
          }
      }

      // Default response
      return mockBotResponses.default;
  }

  // Get current timestamp
  function getCurrentTimestamp() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      return `Today, ${hours}:${minutes} ${ampm}`;
  }

  // Speech recognition for voice input
  function setupSpeechRecognition() {
      if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();

          recognition.lang = "en-US";
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onstart = () => {
              voiceInputBtn.classList.add("active");
              showToast("Listening...", "info");
          };

          recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              chatInput.value = transcript;
              showToast("Voice captured!", "success");
          };

          recognition.onend = () => {
              voiceInputBtn.classList.remove("active");
          };

          recognition.onerror = (event) => {
              showToast("Voice recognition error: " + event.error, "error");
              voiceInputBtn.classList.remove("active");
          };

          voiceInputBtn.addEventListener("click", () => {
              recognition.start();
              playSound("message-sound");
          });
      } else {
          voiceInputBtn.style.display = "none";
          showToast("Voice recognition not supported in this browser", "warning");
      }
  }

  // Text to speech functionality
  function setupTextToSpeech() {
      if ("speechSynthesis" in window) {
          textToSpeechBtn.addEventListener("click", () => {
              // Get the last bot message
              const botMessages = document.querySelectorAll(".bot-message .message-content p");
              if (botMessages.length > 0) {
                  const lastMessage = botMessages[botMessages.length - 1].textContent;
                  speakText(lastMessage);
                  playSound("message-sound");
                  showToast("Speaking text...", "info");
              } else {
                  showToast("No message to speak", "warning");
              }
          });
      } else {
          textToSpeechBtn.style.display = "none";
          showToast("Text-to-speech not supported in this browser", "warning");
      }
  }

  // Speak text function
  function speakText(text) {
      if ("speechSynthesis" in window) {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Get available voices
          const voices = window.speechSynthesis.getVoices();
          
          // Try to find a female English voice
          const englishVoice = voices.find(voice => 
              voice.lang.includes('en') && voice.name.includes('Female')
          ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
          
          if (englishVoice) {
              utterance.voice = englishVoice;
          }
          
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          
          window.speechSynthesis.speak(utterance);
      }
  }
    // // Generate Lesson from FastAPI
    // async function generateLesson() {
    //     const language = lessonLanguage.value;
    //     const topic = lessonTopic.value;

    //     if (!language || !topic) {
    //         showToast("Please select a language and a topic!", "warning");
    //         return;
    //     }

    //     // Show loading animation
    //     const spinner = document.querySelector(".spinner");
    //     const btnText = document.querySelector(".btn-text");

    //     spinner.classList.remove("hidden");
    //     btnText.textContent = "Generating...";

    //     playSound("message-sound");

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/generate_lesson/`, {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ language, topic }),
    //         });

    //         const data = await response.json();

    //         // Hide loading animation
    //         spinner.classList.add("hidden");
    //         btnText.textContent = "Generate Lesson";
    //         document.getElementById("lesson-title").textContent = `Lesson: ${topic} in ${language}`;
    //         document.getElementById("lesson-content").textContent = data.lesson;
    //         document.getElementById("lesson-result").classList.remove("hidden");

    //         playSound("notification-sound");
    //         showToast("Lesson generated successfully!", "success");

    //         lessonResult.scrollIntoView({ behavior: "smooth" });
    //     } catch (error) {
    //         document.getElementById("lesson-title").textContent = "Error";
    //         document.getElementById("lesson-content").textContent = "Could not generate lesson. Try again later.";
    //         document.getElementById("lesson-result").classList.remove("hidden");

    //         playSound("notification-sound");
    //         showToast("Error fetching lesson!", "error");
    //     }
    // }
  // Generate Lesson from FastAPI
async function generateLesson() {
    const language = lessonLanguage.value;
    const topic = lessonTopic.value;

    if (!language || !topic) {
        showToast("Please select a language and a topic!", "warning");
        return;
    }

    // Show loading animation on generate button
    const spinner = generateLessonBtn ? generateLessonBtn.querySelector(".spinner") : null;
    const btnText = generateLessonBtn ? generateLessonBtn.querySelector(".btn-text") : null;

    if (spinner) spinner.classList.remove("hidden");
    if (btnText) btnText.textContent = "Generating...";
    if (generateLessonBtn) generateLessonBtn.disabled = true;

    playSound("message-sound");

    try {
        const response = await fetch(`${API_BASE_URL}/generate_lesson/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language, topic }),
        });

        const data = await response.json();

        if (response.ok) {
            // Hide loading animation
            if (spinner) spinner.classList.add("hidden");
            if (btnText) btnText.textContent = "Generate Lesson";
            if (generateLessonBtn) generateLessonBtn.disabled = false;
            
            // Update lesson title and content
            document.getElementById("lesson-title").textContent = `Lesson: ${topic} in ${language}`;
            
            // Parse lesson content with marked.js to convert markdown to HTML
            if (typeof marked !== "undefined") {
                document.getElementById("lesson-content").innerHTML = marked.parse(data.lesson);
            } else {
                document.getElementById("lesson-content").innerHTML = `<pre>${data.lesson}</pre>`;
            }

            // Display the lesson result
            document.getElementById("lesson-result").classList.remove("hidden");

            // Scroll to the lesson result smoothly
            const lessonResult = document.getElementById("lesson-result");
            if (lessonResult) {
                lessonResult.scrollIntoView({ behavior: "smooth" });
            }

            playSound("notification-sound");
            showToast("Lesson generated successfully!", "success");
            fetchProgress();
        } else {
            throw new Error("Failed to generate lesson.");
        }
    } catch (error) {
        if (spinner) spinner.classList.add("hidden");
        if (btnText) btnText.textContent = "Generate Lesson";
        if (generateLessonBtn) generateLessonBtn.disabled = false;

        document.getElementById("lesson-title").textContent = "Error";
        document.getElementById("lesson-content").textContent = "Could not generate lesson. Try again later.";
        document.getElementById("lesson-result").classList.remove("hidden");

        playSound("notification-sound");
        showToast("Error fetching lesson!", "error");
        console.error("Error fetching lesson:", error);
    }
}


    // Speak Lesson Function
    function speakLesson() {
        const lessonContentText = lessonContent.textContent;
        if (!lessonContentText) {
            showToast("No lesson content to speak!", "warning");
            return;
        }
        speakText(lessonContentText);
        playSound("message-sound");
        showToast("Speaking lesson content...", "info");
    }

    // Save Lesson Function (Mock)
    function saveLesson() {
        showToast("Lesson saved to your account!", "success");
        playSound("notification-sound");
    }

    // Share Lesson Function
    function shareLesson() {
        const shareOptions = document.createElement("div");
        shareOptions.className = "share-options";
        shareOptions.innerHTML = `
            <div class="share-overlay">
                <div class="share-modal">
                    <h4>Share Lesson</h4>
                    <div class="share-buttons">
                        <button class="share-btn facebook"><i class="fab fa-facebook-f"></i> Facebook</button>
                        <button class="share-btn twitter"><i class="fab fa-twitter"></i> Twitter</button>
                        <button class="share-btn whatsapp"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                        <button class="share-btn email"><i class="fas fa-envelope"></i> Email</button>
                    </div>
                    <button class="close-share">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(shareOptions);

        // Add event listeners to share buttons
        shareOptions.querySelectorAll(".share-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                const platform = this.classList[1];
                showToast(`Sharing to ${platform}...`, "success");
                setTimeout(() => {
                    document.body.removeChild(shareOptions);
                }, 1000);
            });
        });

        // Close share modal
        shareOptions.querySelector(".close-share").addEventListener("click", () => {
            document.body.removeChild(shareOptions);
        });

        playSound("notification-sound");
    }

    // Helper: Capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Play UI sounds
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch((err) => console.log("Audio playback error:", err));
        }
    }

    // Show toast notification
    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        let icon = "fa-info-circle";
        if (type === "success") icon = "fa-check-circle";
        if (type === "warning") icon = "fa-exclamation-triangle";
        if (type === "error") icon = "fa-times-circle";

        toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toastContainer.removeChild(toast);
            }
        }, 3000);
    }


  // // Feature card click event listener
  //   document.querySelectorAll(".feature-card").forEach((card) => {
  //       card.addEventListener("click", function () {
  //         const target = this.getAttribute("data-target")
  //         if (target === "quiz") {
  //           // Redirect to quiz.html for quiz target
  //           window.location.href = "quiz.html"
  //         } else if (target) {
  //           showSection(target)
  //         }
  //       })
  
    // Fetch and render real-time progress data
    async function fetchProgress() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/progress/`);
            if (!response.ok) return;
            const data = await response.json();

            // Update Stats
            const chatSessionsEl = document.getElementById("stats-chat-sessions");
            if (chatSessionsEl) chatSessionsEl.textContent = data.chat_sessions || 0;

            const lessonsCompletedEl = document.getElementById("stats-lessons-completed");
            if (lessonsCompletedEl) lessonsCompletedEl.textContent = data.lessons_completed || 0;

            const streakEl = document.getElementById("stats-streak");
            if (streakEl) streakEl.textContent = `${data.streak_days || 1} ${data.streak_days === 1 ? 'day' : 'days'}`;

            const pointsEl = document.getElementById("stats-points");
            if (pointsEl) pointsEl.textContent = `${data.user_points || 0} pts`;

            // Update Badges
            const badgesContainer = document.getElementById("badges-container");
            if (badgesContainer && Array.isArray(data.badges)) {
                badgesContainer.innerHTML = "";
                data.badges.forEach((badge) => {
                    const badgeDiv = document.createElement("div");
                    badgeDiv.className = "badge";
                    badgeDiv.title = badge.description || badge.name;

                    const iconDiv = document.createElement("div");
                    iconDiv.className = `badge-icon ${badge.active ? "active" : ""}`;
                    iconDiv.innerHTML = `<i class="fas ${badge.icon}"></i>`;

                    const nameP = document.createElement("p");
                    nameP.textContent = badge.name;

                    badgeDiv.appendChild(iconDiv);
                    badgeDiv.appendChild(nameP);
                    badgesContainer.appendChild(badgeDiv);
                });
            }

            // Update Leaderboard
            const leaderboardContainer = document.getElementById("leaderboard-container");
            if (leaderboardContainer && Array.isArray(data.leaderboard)) {
                leaderboardContainer.innerHTML = "";
                data.leaderboard.forEach((entry) => {
                    const itemDiv = document.createElement("div");
                    itemDiv.className = `leaderboard-item ${entry.tier || ""} ${entry.is_user ? "current-user" : ""}`;

                    itemDiv.innerHTML = `
                        <div class="rank">${entry.rank}</div>
                        <div class="user-avatar">
                            <img src="${entry.avatar}" alt="${entry.name}">
                        </div>
                        <div class="user-info">
                            <p class="user-name">${entry.name} ${entry.is_user ? "<strong>(You)</strong>" : ""}</p>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${entry.progress_pct}%"></div>
                            </div>
                        </div>
                        <div class="points">${entry.points} pts</div>
                    `;
                    leaderboardContainer.appendChild(itemDiv);
                });
            }
        } catch (err) {
            console.log("Could not load progress data:", err);
        }
    }

    init();
});
