// ====================== Signup Functionality ======================
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
        }

        const result = await response.json();
        showToast(result.message, 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    } catch (error) {
        console.error('Signup error:', error);
        showToast(error.message || 'Failed to connect to server', 'error');
    }
});

// Rest of your script.js remains the same...
// [Keep all other functions exactly as you had them]

// ====================== Login Functionality ======================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const userData = { email, password };

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        localStorage.setItem('user_id', result.user_id);
        localStorage.setItem('isLoggedIn', 'true');

        showToast(result.message, 'success');
        setTimeout(() => window.location.href = 'index.html', 1500);
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'An error occurred during login.', 'error');
    }
});

// ====================== List Pet for Adoption ======================
document.getElementById('openModalBtn')?.addEventListener('click', () => openModal());

document.getElementById('listPetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('petName').value);
    formData.append('type', document.getElementById('petType').value);
    formData.append('breed', document.getElementById('petBreed').value);
    formData.append('age', document.getElementById('petAge').value);
    formData.append('description', document.getElementById('petDescription').value);
    formData.append('image', document.getElementById('petImage').files[0]);
    formData.append('user_id', localStorage.getItem('user_id') || 1);

    try {
        const response = await fetch('http://localhost:5000/api/pets', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showToast(result.message, 'success');
        closeModal();
        loadAvailablePets(); // Refresh the pets list
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'An error occurred while listing the pet.', 'error');
    }
});

// ====================== Adoption Functionality ======================
document.getElementById('adoptionForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pet_id = document.getElementById('adoptionPetId').value;
    const adopter_name = document.getElementById('adopterName').value;
    const adopter_email = document.getElementById('adopterEmail').value;
    const adopter_phone = document.getElementById('adopterPhone').value;
    const adoption_date = document.getElementById('adoptionDate').value;
    const user_id = localStorage.getItem('user_id');

    try {
        const response = await fetch('http://localhost:5000/api/adoptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pet_id, 
                adopter_name, 
                adopter_email, 
                adopter_phone, 
                adoption_date,
                user_id 
            }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showToast(result.message, 'success');
        document.getElementById('adoptionForm').reset();
        closeAdoptionModal();
        loadAvailablePets(); // Refresh the pets list
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Failed to process adoption request.', 'error');
    }
});

// ====================== Pet Supplies Functionality ======================
document.getElementById('suppliesForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pet_type = document.getElementById('suppliesPetType').value;
    const items = Array.from(document.getElementById('suppliesItems').selectedOptions)
                      .map(option => option.value);
    const delivery_date = document.getElementById('suppliesDeliveryDate').value;
    const user_id = localStorage.getItem('user_id');

    try {
        const response = await fetch('http://localhost:5000/api/supplies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_type, items, delivery_date, user_id }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showToast(result.message, 'success');
        document.getElementById('suppliesForm').reset();
        closeSuppliesModal();
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Failed to place order.', 'error');
    }
});

// ====================== Vet Visit Functionality ======================
document.getElementById('vetForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pet_id = document.getElementById('vetPetId').value;
    const date = document.getElementById('vetVisitDate').value;
    const reason = document.getElementById('vetVisitReason').value;
    const user_id = localStorage.getItem('user_id');

    try {
        const response = await fetch('http://localhost:5000/api/vet-visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_id, date, reason, user_id }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        showToast(result.message, 'success');
        document.getElementById('vetForm').reset();
        closeVetModal();
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Failed to schedule vet visit.', 'error');
    }
});

// ====================== Load Available Pets ======================
async function loadAvailablePets() {
    try {
        const response = await fetch('http://localhost:5000/api/pets');
        const pets = await response.json();
        
        const petsGrid = document.querySelector('.pets-grid');
        if (petsGrid) {
            petsGrid.innerHTML = '';
            
            pets.forEach(pet => {
                const petCard = document.createElement('div');
                petCard.className = 'pet-card';
                petCard.innerHTML = `
                    <img src="${pet.image_url || 'https://via.placeholder.com/150'}" alt="${pet.name}">
                    <h3>${pet.name}</h3>
                    <p><strong>Type:</strong> ${pet.type}</p>
                    <p><strong>Breed:</strong> ${pet.breed || 'Unknown'}</p>
                    <p><strong>Age:</strong> ${pet.age || 'Unknown'} years</p>
                    <p>${pet.description}</p>
                    <button class="btn primary-btn" onclick="openAdoptionModalWithPet('${pet.id}')">Adopt Me</button>
                `;
                petsGrid.appendChild(petCard);
            });
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

function openAdoptionModalWithPet(petId) {
    const modal = document.getElementById('adoptionModal');
    if (modal) {
        document.getElementById('adoptionPetId').value = petId;
        modal.style.display = 'block';
    }
}

// ====================== Modal Functions ======================
function openModal() {
    const modal = document.getElementById('listPetModal');
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('listPetModal');
    if (modal) modal.style.display = 'none';
}

function openAdoptionModal() {
    const modal = document.getElementById('adoptionModal');
    if (modal) modal.style.display = 'block';
}

function closeAdoptionModal() {
    const modal = document.getElementById('adoptionModal');
    if (modal) modal.style.display = 'none';
}

function openSuppliesModal() {
    const modal = document.getElementById('suppliesModal');
    if (modal) modal.style.display = 'block';
}

function closeSuppliesModal() {
    const modal = document.getElementById('suppliesModal');
    if (modal) modal.style.display = 'none';
}

function openVetModal() {
    const modal = document.getElementById('vetModal');
    if (modal) modal.style.display = 'block';
}

function closeVetModal() {
    const modal = document.getElementById('vetModal');
    if (modal) modal.style.display = 'none';
}

// ====================== Auth State Management ======================
document.addEventListener('DOMContentLoaded', () => {
    // Load available pets when page loads
    loadAvailablePets();

    // Theme management
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const themeToggleBtn = document.querySelector('.theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // Auth state management
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const authButtons = document.querySelector('.auth-buttons');

    if (isLoggedIn === 'true') {
        const loginBtn = document.querySelector('.login-btn');
        const signupBtn = document.querySelector('.signup-btn');

        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = "Logout";
        logoutBtn.className = "btn logout-btn";
        logoutBtn.onclick = () => {
            localStorage.clear();
            location.reload();
        };

        authButtons.appendChild(logoutBtn);
    }
});

// ====================== Helper Functions ======================
function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}