// Global state for authentication
const authState = {
    isAuthenticated: false,
    token: null,
    user: null
  };
  
  // Check for existing auth token on page load
  document.addEventListener("DOMContentLoaded", () => {
    // Check localStorage for token
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      authState.isAuthenticated = true;
      authState.token = token;
      authState.user = JSON.parse(userData);
      updateUIForAuthenticatedUser();
    }
    
    // Load filter data
    fetch("http://localhost:5000/api/filters")
      .then(res => res.json())
      .then(data => {
        populateDropdown("cityDropdown", data.cities);
        populateDropdown("typeDropdown", data.propertyTypes);
        populateDropdown("priceDropdown", data.priceRanges);
      })
      .catch(err => console.error("Failed to load filters:", err));
      
    // Setup auth modal events
    setupAuthModals();
  });
  
  function populateDropdown(id, items) {
    const dropdown = document.getElementById(id);
    dropdown.innerHTML = "";
    items.forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      dropdown.appendChild(option);
    });
  }
  
  function handleSearch() {
    const city = document.getElementById("cityDropdown").value;
    const type = document.getElementById("typeDropdown").value;
    const priceRange = document.getElementById("priceDropdown").value;
  
    fetch(`http://localhost:5000/api/search?city=${city}&type=${type}&priceRange=${encodeURIComponent(priceRange)}`)
      .then(res => res.json())
      .then(data => {
        displayResults(data);
      })
      .catch(err => console.error("Search failed:", err));
  }
  
  function displayResults(properties) {
    const resultsSection = document.createElement("section");
    resultsSection.className = "featured";
    resultsSection.innerHTML = `
      <h2>Search Results</h2>
      <div class="properties">
        ${properties.length === 0 ? "<p>No results found.</p>" : properties.map(p => `
          <div class="property-card">
            <img src="https://via.placeholder.com/300x200" alt="${p.title}">
            <h3>${p.title}</h3>
            <p>${p.city} • ${p.type}</p>
            <p>${p.price}</p>
            <p>${p.bedrooms} Bed • ${p.bathrooms} Bath • ${p.sqft} sqft</p>
            <button>View Details</button>
            <button class="ar-btn" onclick="openARTour('${p.id}', '${p.title}')">AR Tour</button>
          </div>
        `).join("")}
      </div>
    `;
  
    const oldResults = document.querySelector(".search-results");
    if (oldResults) oldResults.remove();
    resultsSection.classList.add("search-results");
  
    document.body.appendChild(resultsSection);
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Authentication functions
  function setupAuthModals() {
    // Get the sign-in button
    const signInBtn = document.querySelector('.signin-btn');
    signInBtn.addEventListener('click', openAuthModal);
    
    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Modal switch links
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('registerModal').style.display = 'none';
      document.getElementById('loginModal').style.display = 'block';
    });
    
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginModal').style.display = 'none';
      document.getElementById('registerModal').style.display = 'block';
    });
    
    // Close buttons
    document.querySelectorAll('.auth-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('registerModal').style.display = 'none';
      });
    });
    
    // Setup logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  }
  
  function openAuthModal() {
    if (authState.isAuthenticated) {
      // Show user menu if already logged in
      const userMenu = document.getElementById('userMenu');
      userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    } else {
      // Show login modal
      document.getElementById('loginModal').style.display = 'block';
    }
  }
  
  async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save auth data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Update auth state
        authState.isAuthenticated = true;
        authState.token = data.token;
        authState.user = data.user;
        
        // Update UI
        updateUIForAuthenticatedUser();
        
        // Close modal
        document.getElementById('registerModal').style.display = 'none';
        
        // Show success message
        showNotification('Registration successful! Welcome to Realty Horizon.');
      } else {
        showNotification(data.error || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      showNotification('An error occurred. Please try again later.', 'error');
    }
  }
  
  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Save auth data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Update auth state
        authState.isAuthenticated = true;
        authState.token = data.token;
        authState.user = data.user;
        
        // Update UI
        updateUIForAuthenticatedUser();
        
        // Close modal
        document.getElementById('loginModal').style.display = 'none';
        
        // Show success message
        showNotification('Login successful! Welcome back.');
      } else {
        showNotification(data.error || 'Login failed. Please check your credentials.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('An error occurred. Please try again later.', 'error');
    }
  }
  
  function handleLogout() {
    // Clear auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Reset auth state
    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
    
    // Update UI
    updateUIForLoggedOutUser();
    
    // Close user menu
    document.getElementById('userMenu').style.display = 'none';
    
    // Show message
    showNotification('You have been logged out successfully.');
  }
  
  function updateUIForAuthenticatedUser() {
    // Update signin button to show username
    const signInBtn = document.querySelector('.signin-btn');
    signInBtn.textContent = authState.user.username;
    
    // Hide regular nav links for non-authenticated view
    document.querySelector('.user-menu').style.display = 'block';
  }
  
  function updateUIForLoggedOutUser() {
    // Reset signin button
    const signInBtn = document.querySelector('.signin-btn');
    signInBtn.textContent = 'Sign In';
    
    // Show regular nav links
    document.querySelector('.user-menu').style.display = 'none';
  }
  
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }
  
  // AR functionality
  function openARTour(propertyId, propertyName) {
    // Check if user is authenticated for AR features
    if (!authState.isAuthenticated) {
      showNotification('Please sign in to view AR tours', 'error');
      openAuthModal();
      return;
    }
    
    const modal = document.getElementById("arModal");
    const title = document.getElementById("arTitle");
    const arContainer = document.getElementById("arContainer");
    
    title.innerText = `${propertyName} - AR Tour`;
    
    // Show loading state
    arContainer.innerHTML = '<div class="ar-loading">Loading 3D model...</div>';
    modal.style.display = "block";
    
    // Fetch AR model data for this property
    fetch(`http://localhost:5000/api/property/${propertyId}/ar`, {
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.arModel) {
        // Initialize 3D viewer with the model
        initThreeJsViewer(arContainer, data.arModel);
      } else {
        arContainer.innerHTML = '<div class="ar-error">3D model not available for this property</div>';
      }
    })
    .catch(err => {
      console.error("Failed to load AR model:", err);
      arContainer.innerHTML = '<div class="ar-error">Failed to load 3D model</div>';
    });
  }
  
  function closeARTour() {
    document.getElementById("arModal").style.display = "none";
    
    // Clean up 3D viewer if exists
    const arContainer = document.getElementById("arContainer");
    arContainer.innerHTML = '';
  }
  
  // ThreeJS viewer for AR models
  function initThreeJsViewer(container, modelPath) {
    // Create a scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Create a renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Add a placeholder cube for now (in real app, you'd load GLB/GLTF models)
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3498db,
      metalness: 0.3,
      roughness: 0.4
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // In a real app, you would load actual 3D models:
    /*
    const loader = new THREE.GLTFLoader();
    loader.load(
      modelPath,
      function(gltf) {
        scene.add(gltf.scene);
      },
      function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      function(error) {
        console.error('An error happened', error);
      }
    );
    */
    
    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate the cube
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    }
    
    animate();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }