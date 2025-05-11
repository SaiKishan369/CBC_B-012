const formTitle = document.getElementById('formTitle');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const authForm = document.getElementById('authForm');
const signupFields = document.getElementById('signupFields');
const submitBtn = document.getElementById('submitBtn');
const statusMessage = document.getElementById('statusMessage');

let isSignup = false;

function showStatus(message, type) {
  statusMessage.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
  statusMessage.className = `status-message ${type}`;
  
  // Hide the message after 3 seconds
  setTimeout(() => {
    statusMessage.className = 'status-message';
    statusMessage.innerHTML = '';
  }, 3000);
}

function updateFormState() {
  // Add fade-out animation
  formTitle.style.opacity = '0';
  formTitle.style.transform = 'translateY(-10px)';
  
  setTimeout(() => {
    formTitle.innerText = isSignup ? "Create Account" : "Welcome Back";
    submitBtn.innerHTML = isSignup 
      ? '<span>Create Account</span><i class="fas fa-arrow-right"></i>' 
      : '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
    
    // Add fade-in animation
    formTitle.style.opacity = '1';
    formTitle.style.transform = 'translateY(0)';
  }, 200);

  // Get email field
  const email = document.getElementById("email");

  if (isSignup) {
    signupFields.style.display = 'block';
    signupFields.style.animation = 'slideUp 0.3s ease-out';
    email.disabled = false;
    email.required = true;
  } else {
    signupFields.style.animation = 'slideDown 0.3s ease-out';
    email.disabled = true;
    email.required = false;
    setTimeout(() => {
      signupFields.style.display = 'none';
    }, 300);
  }

  toggleText.innerHTML = isSignup
    ? 'Already have an account? <a href="#" id="toggleBtn">Sign In</a>'
    : 'New to MindCare? <a href="#" id="toggleBtn">Create Account</a>';
  
  // Re-bind the event listener to the new toggle button
  document.getElementById('toggleBtn').addEventListener('click', handleToggle);
}

function handleToggle(e) {
  e.preventDefault();
  isSignup = !isSignup;
  updateFormState();
}

// Add transition styles to form title
formTitle.style.transition = 'all 0.3s ease';

// Initial setup
toggleBtn.addEventListener('click', handleToggle);

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  try {
    if (isSignup) {
      const email = document.getElementById("email").value;
      
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showStatus('Account created successfully!', 'success');
        isSignup = false;
        updateFormState();
        document.getElementById("username").value = '';
        document.getElementById("password").value = '';
      } else {
        showStatus(data.error || 'Error creating account', 'error');
      }
    } else {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Signing in...</span><i class="fas fa-spinner fa-spin"></i>';
      
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
      
      if (response.ok) {
        showStatus(`Welcome back, ${data.user.username}!`, 'success');
        document.getElementById("username").value = '';
        document.getElementById("password").value = '';
        // Redirect to dashboard or main application page
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        showStatus(data.error || 'Invalid credentials', 'error');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('An error occurred. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
  }
});
