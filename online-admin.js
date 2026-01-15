// Online Admin JavaScript
// Backend Integration for Online Batch Management

const BACKEND_URL = 'http://localhost:3000/api/online-config';
let currentConfig = null;

// ==================
// UTILITY FUNCTIONS
// ==================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-medium animate-slide-in`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <span>${message}</span>
    `;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================
// FETCH CONFIGURATION
// ==================

async function fetchConfig() {
    try {
        const response = await fetch(BACKEND_URL);
        const result = await response.json();

        if (result.success) {
            currentConfig = result.data;
            updateUI(currentConfig);
        } else {
            showToast('Failed to load configuration', 'error');
        }
    } catch (error) {
        console.error('Error fetching config:', error);
        showToast('Backend server not running', 'error');
    }
}

function updateUI(data) {
    // Update statistics
    document.getElementById('stat-courses').textContent = data.courses?.length || 0;
    document.getElementById('stat-batches').textContent = data.batches?.length || 0;
    document.getElementById('stat-fee').textContent = `₹${(data.price || 0).toLocaleString('en-IN')}`;
    document.getElementById('stat-requests').textContent = '0'; // Will be updated when requests API is ready

    // Update access fee editor
    document.getElementById('fee-title').value = data.title || '';
    document.getElementById('fee-description').value = data.description || '';
    document.getElementById('fee-price').value = data.price || 0;
    document.getElementById('fee-period').value = data.period || 'month';

    // Render courses
    renderCourses(data.courses || []);

    // Render batches
    renderBatches(data.courses || [], data.batches || []);

    // Populate course dropdown in add batch modal
    populateCourseDropdown(data.courses || []);
}

// ==================
// ACCESS FEE MANAGEMENT
// ==================

async function saveAccessFee() {
    const title = document.getElementById('fee-title').value;
    const description = document.getElementById('fee-description').value;
    const price = parseInt(document.getElementById('fee-price').value);
    const period = document.getElementById('fee-period').value;

    if (!title || !description || !price) {
        showToast('Please fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/accessfee`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, price, period })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Access fee updated successfully!');
            fetchConfig();
        } else {
            showToast('Failed to update access fee', 'error');
        }
    } catch (error) {
        console.error('Error saving access fee:', error);
        showToast('Backend server not running', 'error');
    }
}

// ==================
// COURSE MANAGEMENT
// ==================

function renderCourses(courses) {
    const container = document.getElementById('courses-container');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-slate-400 py-8">No courses available. Add your first course!</p>';
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-primary transition-colors">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="size-10 rounded-lg bg-${course.color}-100 dark:bg-${course.color}-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-${course.color}-600 dark:text-${course.color}-400">${course.icon || 'school'}</span>
                    </div>
                    <div>
                        <input type="text" id="name-${course.id}" value="${course.name}" 
                            class="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-primary focus:outline-none px-1">
                        <p class="text-xs text-slate-400">${course.batchCount || 0} batches</p>
                    </div>
                </div>
            </div>
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs text-slate-400">Price (₹)</label>
                        <input type="number" id="price-${course.id}" value="${course.price}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-slate-400">Duration</label>
                        <input type="text" id="duration-${course.id}" value="${course.duration}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-xs text-slate-400">Icon</label>
                        <input type="text" id="icon-${course.id}" value="${course.icon || 'school'}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-slate-400">Color</label>
                        <select id="color-${course.id}" 
                            class="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:border-primary focus:outline-none">
                            <option value="blue" ${course.color === 'blue' ? 'selected' : ''}>Blue</option>
                            <option value="orange" ${course.color === 'orange' ? 'selected' : ''}>Orange</option>
                            <option value="green" ${course.color === 'green' ? 'selected' : ''}>Green</option>
                            <option value="purple" ${course.color === 'purple' ? 'selected' : ''}>Purple</option>
                            <option value="red" ${course.color === 'red' ? 'selected' : ''}>Red</option>
                            <option value="yellow" ${course.color === 'yellow' ? 'selected' : ''}>Yellow</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="flex gap-2 mt-3">
                <button onclick="saveCourse('${course.id}')" 
                    class="flex-1 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded transition-colors text-sm">
                    Save
                </button>
                <button onclick="deleteCourse('${course.id}')" 
                    class="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

async function saveCourse(courseId) {
    const name = document.getElementById(`name-${courseId}`).value;
    const price = parseInt(document.getElementById(`price-${courseId}`).value);
    const duration = document.getElementById(`duration-${courseId}`).value;
    const icon = document.getElementById(`icon-${courseId}`).value;
    const color = document.getElementById(`color-${courseId}`).value;

    try {
        const response = await fetch(`${BACKEND_URL}/course/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, duration, icon, color })
        });

        const result = await response.json();
        if (result.success) {
            showToast(`${name} updated successfully!`);
            fetchConfig();
        } else {
            showToast('Failed to update course', 'error');
        }
    } catch (error) {
        console.error('Error saving course:', error);
        showToast('Backend server not running', 'error');
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also delete all associated batches.')) {
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/course/${courseId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            showToast('Course deleted successfully!');
            fetchConfig();
        } else {
            showToast('Failed to delete course', 'error');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showToast('Backend server not running', 'error');
    }
}

// Add Course Modal
function showAddCourseModal() {
    document.getElementById('addCourseModal').classList.remove('hidden');
    document.getElementById('addCourseModal').classList.add('flex');
}

function closeAddCourseModal() {
    document.getElementById('addCourseModal').classList.add('hidden');
    document.getElementById('addCourseModal').classList.remove('flex');
}

async function addCourse() {
    const name = document.getElementById('course-name').value.trim();
    const price = parseInt(document.getElementById('course-price').value);
    const duration = document.getElementById('course-duration').value;
    const icon = document.getElementById('course-icon').value;
    const color = document.getElementById('course-color').value;

    if (!name) {
        showToast('Course name is required', 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, duration, icon, color })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Course added successfully!');
            closeAddCourseModal();
            fetchConfig();
        } else {
            showToast(result.message || 'Failed to add course', 'error');
        }
    } catch (error) {
        console.error('Error adding course:', error);
        showToast('Backend server not running', 'error');
    }
}

// ==================
// BATCH MANAGEMENT
// ==================

function renderBatches(courses, batches) {
    const container = document.getElementById('batches-container');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 py-8">Add courses first to create batches</p>';
        return;
    }

    const groupedBatches = {};
    courses.forEach(course => {
        groupedBatches[course.id] = batches.filter(b => b.courseId === course.id);
    });

    container.innerHTML = courses.map(course => {
        const courseBatches = groupedBatches[course.id] || [];
        return `
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <div class="size-8 rounded-lg bg-${course.color}-100 dark:bg-${course.color}-900/30 flex items-center justify-center">
                            <span class="material-symbols-outlined text-${course.color}-600 dark:text-${course.color}-400 text-[20px]">${course.icon || 'school'}</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-white">${course.name}</h4>
                            <p class="text-xs text-slate-400">${courseBatches.length} batches</p>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-7 gap-2">
                    ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
            const dayBatches = courseBatches.filter(b => b.day === day);
            return `
                            <div class="text-center">
                                <p class="text-xs text-slate-400 mb-1">${day}</p>
                                ${dayBatches.map(batch => `
                                    <div class="bg-slate-900 rounded p-2 mb-1 hover:bg-slate-700 cursor-pointer transition-colors" onclick="editBatch('${batch.id}')">
                                        <p class="text-xs font-semibold text-white">${batch.startTime}</p>
                                        <p class="text-[10px] text-slate-400">${batch.faculty}</p>
                                    </div>
                                `).join('') || '<div class="h-12 bg-slate-900/30 rounded border border-dashed border-slate-700"></div>'}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function populateCourseDropdown(courses) {
    const select = document.getElementById('batch-course');
    select.innerHTML = '<option value="">Select Course</option>' +
        courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function showAddBatchModal() {
    document.getElementById('addBatchModal').classList.remove('hidden');
    document.getElementById('addBatchModal').classList.add('flex');
}

function closeAddBatchModal() {
    document.getElementById('addBatchModal').classList.add('hidden');
    document.getElementById('addBatchModal').classList.remove('flex');
}

async function addBatch() {
    const courseId = document.getElementById('batch-course').value;
    const faculty = document.getElementById('batch-faculty').value.trim();
    const day = document.getElementById('batch-day').value;
    const startTime = document.getElementById('batch-start').value;
    const endTime = document.getElementById('batch-end').value;
    const duration = document.getElementById('batch-duration').value;

    if (!courseId || !faculty || !startTime || !endTime) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId,
                faculty,
                day,
                startTime,
                endTime,
                duration: `${duration} Hours`
            })
        });

        const result = await response.json();
        if (result.success) {
            showToast('Batch added successfully!');
            closeAddBatchModal();
            fetchConfig();
        } else {
            showToast(result.message || 'Failed to add batch', 'error');
        }
    } catch (error) {
        console.error('Error adding batch:', error);
        showToast('Backend server not running', 'error');
    }
}

function editBatch(batchId) {
    // TODO: Implement edit batch functionality
    showToast('Edit batch feature coming soon!', 'error');
}

// ==================
// CUSTOM BATCH REQUESTS
// ==================

function refreshRequests() {
    // TODO: Implement when backend API is ready
    showToast('Requests feature coming soon!', 'error');
}

// ==================
// INITIALIZATION
// ==================

document.addEventListener('DOMContentLoaded', () => {
    fetchConfig();
});
