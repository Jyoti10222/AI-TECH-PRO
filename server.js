const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Config file paths for each payment page
const configPaths = {
    'pay': path.join(__dirname, 'config-pay.json'),
    'pay1': path.join(__dirname, 'config-pay1.json'),
    'pay2': path.join(__dirname, 'config-pay2.json'),
    'online': path.join(__dirname, 'config-online.json')
};

// AI Learning config path
const aiLearningConfigPath = path.join(__dirname, 'config-ailearning.json');

// Helper function to read config
const readConfig = (pageId) => {
    try {
        const configPath = configPaths[pageId];
        if (!configPath) return null;
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading config for ${pageId}:`, error);
        return null;
    }
};

// Helper function to write config
const writeConfig = (pageId, config) => {
    try {
        const configPath = configPaths[pageId];
        if (!configPath) return false;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing config for ${pageId}:`, error);
        return false;
    }
};

// =====================
// PAYMENT CONFIG ROUTES
// =====================

// GET - Retrieve payment config for a specific page
app.get('/api/payment-config/:pageId', (req, res) => {
    const { pageId } = req.params;

    if (!configPaths[pageId]) {
        return res.status(400).json({
            success: false,
            message: `Invalid page ID. Use: pay, pay1, pay2, or online`
        });
    }

    const config = readConfig(pageId);
    if (config) {
        res.json({
            success: true,
            pageId,
            data: config
        });
    } else {
        res.status(500).json({
            success: false,
            message: `Failed to read payment configuration for ${pageId}`
        });
    }
});

// GET - Retrieve all payment configs
app.get('/api/payment-config', (req, res) => {
    const allConfigs = {};
    for (const pageId of Object.keys(configPaths)) {
        allConfigs[pageId] = readConfig(pageId);
    }
    res.json({
        success: true,
        data: allConfigs
    });
});

// PUT - Update payment config for a specific page
app.put('/api/payment-config/:pageId', (req, res) => {
    const { pageId } = req.params;

    if (!configPaths[pageId]) {
        return res.status(400).json({
            success: false,
            message: `Invalid page ID. Use: pay, pay1, pay2, or online`
        });
    }

    // Handle both one-time payment and subscription models
    const { originalPrice, discount, totalAmount, discountLabel, courseName, courseDuration, price, period, description, title } = req.body;

    const currentConfig = readConfig(pageId);
    if (!currentConfig) {
        return res.status(500).json({
            success: false,
            message: `Failed to read current configuration for ${pageId}`
        });
    }

    let updatedConfig;
    if (pageId === 'online') {
        // Subscription model for Online.html
        updatedConfig = {
            ...currentConfig,
            ...(price !== undefined && { price }),
            ...(period !== undefined && { period }),
            ...(description !== undefined && { description }),
            ...(title !== undefined && { title })
        };
    } else {
        // One-time payment model for Pay, Pay1, Pay2
        updatedConfig = {
            ...currentConfig,
            ...(originalPrice !== undefined && { originalPrice }),
            ...(discount !== undefined && { discount }),
            ...(totalAmount !== undefined && { totalAmount }),
            ...(discountLabel !== undefined && { discountLabel }),
            ...(courseName !== undefined && { courseName }),
            ...(courseDuration !== undefined && { courseDuration })
        };
    }

    if (writeConfig(pageId, updatedConfig)) {
        res.json({
            success: true,
            message: `Payment configuration for ${pageId} updated successfully`,
            data: updatedConfig
        });
    } else {
        res.status(500).json({
            success: false,
            message: `Failed to update payment configuration for ${pageId}`
        });
    }
});

// ========================
// AI LEARNING CONFIG ROUTES
// ========================

// GET - Retrieve AI Learning config
app.get('/api/ailearning-config', (req, res) => {
    try {
        const data = fs.readFileSync(aiLearningConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading AI learning config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read AI learning configuration'
        });
    }
});

// PUT - Update subscription
app.put('/api/ailearning-config/subscription', (req, res) => {
    try {
        const data = fs.readFileSync(aiLearningConfigPath, 'utf8');
        const config = JSON.parse(data);

        const { price, period } = req.body;
        if (price !== undefined) config.subscription.price = price;
        if (period !== undefined) config.subscription.period = period;

        fs.writeFileSync(aiLearningConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: config.subscription
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to update subscription' });
    }
});

// PUT - Update a specific course
app.put('/api/ailearning-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(aiLearningConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;

        const courseIndex = config.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: `Course '${courseId}' not found` });
        }

        const { name, category, description, price, duration, link } = req.body;
        if (name !== undefined) config.courses[courseIndex].name = name;
        if (category !== undefined) config.courses[courseIndex].category = category;
        if (description !== undefined) config.courses[courseIndex].description = description;
        if (price !== undefined) config.courses[courseIndex].price = price;
        if (duration !== undefined) config.courses[courseIndex].duration = duration;
        if (link !== undefined) config.courses[courseIndex].link = link;

        fs.writeFileSync(aiLearningConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: `Course '${courseId}' updated successfully`,
            data: config.courses[courseIndex]
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// ========================
// ONLINE COURSES CONFIG ROUTES
// ========================
const onlineConfigPath = path.join(__dirname, 'config-online.json');

// GET - Retrieve Online courses config
app.get('/api/online-config', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error reading online config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read online configuration'
        });
    }
});

// PUT - Update Batch List (for Faculty Grid)
app.put('/api/online-config/batches', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { batches } = req.body;

        if (!Array.isArray(batches)) {
            return res.status(400).json({ success: false, message: 'Batches must be an array' });
        }

        config.batches = batches;
        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batches updated successfully', data: config.batches });
    } catch (error) {
        console.error('Error updating batches:', error);
        res.status(500).json({ success: false, message: 'Failed to update batches' });
    }
});

// PUT - Update access fee
app.put('/api/online-config/accessfee', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);

        const { price, period, description } = req.body;
        if (price !== undefined) config.accessFee.price = price;
        if (period !== undefined) config.accessFee.period = period;
        if (description !== undefined) config.accessFee.description = description;

        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: 'Access fee updated successfully',
            data: config.accessFee
        });
    } catch (error) {
        console.error('Error updating access fee:', error);
        res.status(500).json({ success: false, message: 'Failed to update access fee' });
    }
});

// PUT - Update a specific online course
app.put('/api/online-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;

        const courseIndex = config.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: `Course '${courseId}' not found` });
        }

        const { name, price, duration, batchCount, icon, color } = req.body;
        if (name !== undefined) config.courses[courseIndex].name = name;
        if (price !== undefined) config.courses[courseIndex].price = price;
        if (duration !== undefined) config.courses[courseIndex].duration = duration;
        if (batchCount !== undefined) config.courses[courseIndex].batchCount = batchCount;
        if (icon !== undefined) config.courses[courseIndex].icon = icon;
        if (color !== undefined) config.courses[courseIndex].color = color;

        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({
            success: true,
            message: `Course '${courseId}' updated successfully`,
            data: config.courses[courseIndex]
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// ========================
// OFFLINE BATCH CONFIG ROUTES
// ========================
const offlineConfigPath = path.join(__dirname, 'config-offline.json');

// GET - Retrieve Offline batch config
app.get('/api/offline-config', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error reading offline config:', error);
        res.status(500).json({ success: false, message: 'Failed to read offline configuration' });
    }
});

// PUT - Update batch fee
app.put('/api/offline-config/batchfee', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { price, currency } = req.body;
        if (price !== undefined) config.batchFee.price = price;
        if (currency !== undefined) config.batchFee.currency = currency;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batch fee updated', data: config.batchFee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update batch fee' });
    }
});

// PUT - Update stats
app.put('/api/offline-config/stats', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { available, fastFilling } = req.body;
        if (available !== undefined) config.stats.available = available;
        if (fastFilling !== undefined) config.stats.fastFilling = fastFilling;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Stats updated', data: config.stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update stats' });
    }
});

// PUT - Update a specific offline course
app.put('/api/offline-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;
        const courseIndex = config.courses.findIndex(c => c.id === courseId);
        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: `Course '${courseId}' not found` });
        }
        const { name, category, room, price, totalSeats, enrolledSeats, duration, instructor } = req.body;
        if (name !== undefined) config.courses[courseIndex].name = name;
        if (category !== undefined) config.courses[courseIndex].category = category;
        if (room !== undefined) config.courses[courseIndex].room = room;
        if (price !== undefined) config.courses[courseIndex].price = price;
        if (totalSeats !== undefined) config.courses[courseIndex].totalSeats = totalSeats;
        if (enrolledSeats !== undefined) config.courses[courseIndex].enrolledSeats = enrolledSeats;
        if (duration !== undefined) config.courses[courseIndex].duration = duration;
        if (instructor !== undefined) config.courses[courseIndex].instructor = instructor;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: `Course updated`, data: config.courses[courseIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// ========================
// HYBRID BATCH CONFIG ROUTES
// ========================
const hybridConfigPath = path.join(__dirname, 'config-hybrid.json');

// GET - Retrieve Hybrid batch config
app.get('/api/hybrid-config', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error reading hybrid config:', error);
        res.status(500).json({ success: false, message: 'Failed to read hybrid configuration' });
    }
});

// PUT - Update page info
app.put('/api/hybrid-config/pageinfo', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { title, subtitle } = req.body;
        if (title) config.pageInfo.title = title;
        if (subtitle) config.pageInfo.subtitle = subtitle;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Page info updated', data: config.pageInfo });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update page info' });
    }
});

// PUT - Update a specific hybrid course
app.put('/api/hybrid-config/course/:courseId', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { courseId } = req.params;
        const courseIndex = config.courses.findIndex(c => c.id === courseId);

        if (courseIndex === -1) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Update course fields
        const updates = req.body;
        Object.keys(updates).forEach(key => {
            if (key !== 'id') {
                config.courses[courseIndex][key] = updates[key];
            }
        });

        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: `Course updated`, data: config.courses[courseIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update course' });
    }
});

// POST - Add new online course
app.post('/api/online-config/course', (req, res) => {
    try {
        const data = fs.readFileSync(onlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { name, price, duration, batchCount, icon, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const newCourse = {
            id,
            name,
            icon: icon || 'school',
            color: color || 'blue',
            price: price || 0,
            duration: duration || '3 Months',
            batchCount: batchCount || 1
        };

        config.courses.push(newCourse);
        fs.writeFileSync(onlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Course added', data: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// POST - Add new offline course
app.post('/api/offline-config/course', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { name, category, room, price, totalSeats, duration, instructor } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const newCourse = {
            id,
            name,
            category: category || 'General',
            room: room || 'TBD',
            price: price || 0,
            totalSeats: totalSeats || 30,
            enrolledSeats: 0,
            duration: duration || '3 Months',
            instructor: instructor || 'TBD'
        };

        config.courses.push(newCourse);
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Course added', data: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// POST - Add new hybrid course
app.post('/api/hybrid-config/course', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { name, instructor, level, fee, onlinePercent, offlinePercent, startDate } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Course name is required' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const newCourse = {
            id,
            name,
            instructor: instructor || 'TBD',
            level: level || 'Beginner',
            levelColor: level === 'Advanced' ? 'purple' : 'green',
            startDate: startDate || 'TBD',
            onlinePercent: onlinePercent || 50,
            offlinePercent: offlinePercent || 50,
            fee: fee || 999,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLm39_AyR6rQo5vyxLxJv45wqd9ZwS9l5_Lb3wE4NI-S5Gipje6WYgyAG4fQXMHF3YjsnBk2gGWV_26wyJtwATnwcme11hNMVOQ-nQcx2nGfDGVwu9KNuecm09YEfczzZjIxf9AoAXGIkKCy9TJYE_lD2l8jw55EEdhQcQko_I2CJ7l4vcreo37RXUVdlVpBZGvEi9Fi0yIFxq6E41_My7B-JSbbh4OQJHln_GT-2bYbXMlF2K3jgWNCLlGjMz2OL5ajDIQuYyvCw',
            onlineSchedule: {
                days: 'TBD',
                time: 'TBD',
                description: 'Online Sessions',
                platform: 'Zoom',
                platformNote: 'Recordings available'
            },
            offlineSchedule: {
                days: 'TBD',
                time: 'TBD',
                description: 'Lab Sessions',
                location: 'TBD',
                locationNote: 'Main Campus'
            }
        };

        config.courses.push(newCourse);
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Course added', data: newCourse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add course' });
    }
});

// PUT - Update Offline Batch List (for Faculty Grid)
app.put('/api/offline-config/batches', (req, res) => {
    try {
        const data = fs.readFileSync(offlineConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { batches } = req.body;

        if (!Array.isArray(batches)) {
            return res.status(400).json({ success: false, message: 'Batches must be an array' });
        }

        config.batches = batches;
        fs.writeFileSync(offlineConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batches updated successfully', data: config.batches });
    } catch (error) {
        console.error('Error updating offline batches:', error);
        res.status(500).json({ success: false, message: 'Failed to update batches' });
    }
});

// PUT - Update Hybrid Batch List
app.put('/api/hybrid-config/batches', (req, res) => {
    try {
        const data = fs.readFileSync(hybridConfigPath, 'utf8');
        const config = JSON.parse(data);
        const { batches } = req.body;

        if (!Array.isArray(batches)) {
            return res.status(400).json({ success: false, message: 'Batches must be an array' });
        }

        config.batches = batches;
        fs.writeFileSync(hybridConfigPath, JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Batches updated successfully', data: config.batches });
    } catch (error) {
        console.error('Error updating hybrid batches:', error);
        res.status(500).json({ success: false, message: 'Failed to update batches' });
    }
});

// ========================
// STUDENT MANAGEMENT API
// ========================
const studentsDbPath = path.join(__dirname, 'students.json');

// Helper: Read students from JSON file
function readStudents() {
    try {
        if (!fs.existsSync(studentsDbPath)) {
            fs.writeFileSync(studentsDbPath, JSON.stringify({ students: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(studentsDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading students:', error);
        return { students: [], lastUpdated: null };
    }
}

// Helper: Write students to JSON file
function writeStudents(studentsData) {
    try {
        studentsData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(studentsDbPath, JSON.stringify(studentsData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing students:', error);
        return false;
    }
}

// GET - Retrieve all students
app.get('/api/students', (req, res) => {
    try {
        const data = readStudents();
        res.json({
            success: true,
            count: data.students.length,
            data: data.students
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve students' });
    }
});

// GET - Retrieve specific student by ID
app.get('/api/students/:id', (req, res) => {
    try {
        const data = readStudents();
        const student = data.students.find(s => s.id === req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        res.json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve student' });
    }
});

// POST - Create new student
app.post('/api/students', (req, res) => {
    try {
        const data = readStudents();

        // Generate smart ID: YYMM#### format
        const now = new Date();
        const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month with leading zero
        const yearMonth = year + month; // e.g., "2601" for January 2026

        // Find the highest sequence number for this year-month
        const studentsThisMonth = data.students.filter(s => s.id && s.id.startsWith(yearMonth));
        let maxSequence = 0;

        studentsThisMonth.forEach(student => {
            const sequencePart = student.id.slice(4); // Get last 4 digits
            const sequence = parseInt(sequencePart, 10);
            if (!isNaN(sequence) && sequence > maxSequence) {
                maxSequence = sequence;
            }
        });

        // Increment sequence for new student
        const newSequence = maxSequence + 1;
        const sequenceStr = String(newSequence).padStart(4, '0'); // 4 digits with leading zeros
        const studentId = yearMonth + sequenceStr; // e.g., "26010001"

        const newStudent = {
            id: studentId,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.students.unshift(newStudent); // Add to beginning
        if (writeStudents(data)) {
            res.status(201).json({ success: true, message: 'Student created successfully', data: newStudent });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save student' });
        }
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ success: false, message: 'Failed to create student' });
    }
});

// POST - Migrate students from localStorage to backend
app.post('/api/students/migrate', (req, res) => {
    try {
        const data = readStudents();
        const { students: incomingStudents } = req.body;

        if (!Array.isArray(incomingStudents)) {
            return res.status(400).json({ success: false, message: 'Students must be an array' });
        }

        let migratedCount = 0;

        incomingStudents.forEach(student => {
            // Check if student already exists (by email)
            const exists = data.students.find(s => s.email === student.email);
            if (!exists) {
                // Generate ID based on student's timestamp or current date
                const studentDate = student.timestamp ? new Date(student.timestamp) : new Date();
                const year = String(studentDate.getFullYear()).slice(-2);
                const month = String(studentDate.getMonth() + 1).padStart(2, '0');
                const yearMonth = year + month;

                // Find sequence for this student's month
                const studentsThisMonth = data.students.filter(s => s.id && s.id.startsWith(yearMonth));
                let maxSequence = 0;
                studentsThisMonth.forEach(s => {
                    const seq = parseInt(s.id.slice(4), 10);
                    if (!isNaN(seq) && seq > maxSequence) maxSequence = seq;
                });

                const newSequence = maxSequence + 1;
                const studentId = yearMonth + String(newSequence).padStart(4, '0');

                data.students.push({
                    id: studentId,
                    ...student,
                    createdAt: student.timestamp || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                migratedCount++;
            }
        });

        if (writeStudents(data)) {
            res.json({
                success: true,
                message: `Migrated ${migratedCount} students successfully`,
                migratedCount,
                totalStudents: data.students.length
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save migrated students' });
        }
    } catch (error) {
        console.error('Error migrating students:', error);
        res.status(500).json({ success: false, message: 'Failed to migrate students' });
    }
});

// PUT - Update student
app.put('/api/students/:id', (req, res) => {
    try {
        const data = readStudents();
        const index = data.students.findIndex(s => s.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        data.students[index] = {
            ...data.students[index],
            ...req.body,
            id: req.params.id, // Preserve ID
            updatedAt: new Date().toISOString()
        };
        if (writeStudents(data)) {
            res.json({ success: true, message: 'Student updated successfully', data: data.students[index] });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update student' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update student' });
    }
});

// DELETE - Remove student
app.delete('/api/students/:id', (req, res) => {
    try {
        const data = readStudents();
        const index = data.students.findIndex(s => s.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const deleted = data.students.splice(index, 1)[0];
        if (writeStudents(data)) {
            res.json({ success: true, message: 'Student deleted successfully', data: deleted });
        } else {
            res.status(500).json({ success: false, message: 'Failed to delete student' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
});

// GET - Dashboard statistics
app.get('/api/students/stats/dashboard', (req, res) => {
    try {
        const data = readStudents();
        const students = data.students;

        // Calculate statistics
        const totalStudents = students.length;
        const uniqueCourses = new Set(students.map(s => s.desiredCourse).filter(c => c));
        const activeCourses = uniqueCourses.size;

        // Calculate average completion (mock based on enrollment)
        const baseCompletion = 68;
        const variance = totalStudents > 0 ? Math.min(Math.floor(totalStudents / 20), 7) : 0;
        const avgCompletion = Math.min(baseCompletion + variance, 85);

        // Calculate course rating
        const baseRating = 4.6;
        const ratingBoost = totalStudents > 0 ? Math.min(totalStudents / 1000, 0.3) : 0;
        const courseRating = Math.min(baseRating + ratingBoost, 5.0);

        // Reviews count
        const reviewCount = Math.floor(totalStudents * 0.27);

        res.json({
            success: true,
            data: {
                totalStudents,
                activeCourses,
                avgCompletion,
                courseRating: parseFloat(courseRating.toFixed(1)),
                reviewCount,
                trendPercent: totalStudents > 0 ? Math.min(Math.round((totalStudents / 100) * 12), 25) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to calculate statistics' });
    }
});

// ========================
// USER AUTHENTICATION API WITH EMAIL VERIFICATION
// ========================
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Load email configuration
let emailConfig;
try {
    emailConfig = require('./email-config.js');
} catch (error) {
    console.warn('⚠️  Email configuration not found. Email features will be disabled.');
    emailConfig = null;
}

const usersDbPath = path.join(__dirname, 'users.json');

// Helper: Read users from JSON file
function readUsers() {
    try {
        if (!fs.existsSync(usersDbPath)) {
            fs.writeFileSync(usersDbPath, JSON.stringify({ users: [], lastUpdated: null }, null, 2));
        }
        const data = fs.readFileSync(usersDbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return { users: [], lastUpdated: null };
    }
}

// Helper: Write users to JSON file
function writeUsers(usersData) {
    try {
        usersData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(usersDbPath, JSON.stringify(usersData, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}

// Create email transporter
let transporter = null;
if (emailConfig && emailConfig.email) {
    try {
        transporter = nodemailer.createTransport({
            service: emailConfig.email.service,
            auth: emailConfig.email.auth
        });
        console.log('✅ Email service configured successfully');
    } catch (error) {
        console.error('❌ Failed to configure email service:', error.message);
    }
}

// Helper: Generate verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper: Send verification email
async function sendVerificationEmail(email, firstName, verificationToken) {
    if (!transporter) {
        console.warn('⚠️  Email service not configured. Skipping email send.');
        return false;
    }

    const verificationLink = `${emailConfig.appUrl}/A3Login.html?verified=true&email=${encodeURIComponent(email)}`;

    const mailOptions = {
        from: `"${emailConfig.email.from.name}" <${emailConfig.email.from.address}>`,
        to: email,
        subject: '🎓 Welcome to TECH-PRO AI - Verify Your Email',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    <!-- Header with gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
                            <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">
                                    🚀 TECH-PRO AI
                                </h1>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 28px; font-weight: 700;">
                                Welcome, ${firstName}! 👋
                            </h2>
                            <p style="margin: 0 0 25px; color: #475569; font-size: 16px; line-height: 1.6;">
                                Thank you for joining <strong>TECH-PRO AI</strong>, your gateway to cutting-edge technology education powered by artificial intelligence.
                            </p>
                            <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.6;">
                                Your account has been successfully created! You can now log in and start your learning journey.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationLink}" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); transition: all 0.3s;">
                                            ✨ Login to Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <p style="margin: 0 0 10px; color: #1e40af; font-weight: 700; font-size: 14px;">
                                    📧 Your Account Details
                                </p>
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    <strong>Email:</strong> ${email}<br>
                                    <strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            
                            <!-- What's Next -->
                            <div style="margin: 30px 0;">
                                <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 20px; font-weight: 700;">
                                    🎯 What's Next?
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                                    <li>Complete your profile to personalize your experience</li>
                                    <li>Take our AI-powered skill assessment (5 minutes)</li>
                                    <li>Get a customized learning path based on your goals</li>
                                    <li>Start learning with our expert instructors</li>
                                </ul>
                            </div>
                            
                            <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                If you didn't create this account, please ignore this email or contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 15px; color: #64748b; font-size: 13px; text-align: center;">
                                Need help? Contact us at <a href="mailto:support@techproai.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">support@techproai.com</a>
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © ${new Date().getFullYear()} TECH-PRO AI Inc. All rights reserved.<br>
                                Empowering the next generation of tech professionals.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send verification email:', error.message);
        return false;
    }
}

// POST - User Signup with Email Verification
app.post('/api/users/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).text('MISSING_FIELDS');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).text('INVALID_EMAIL');
        }

        const data = readUsers();

        // Check if user already exists
        const existingUser = data.users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).text('ALREADY_REGISTERED');
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            firstName,
            lastName,
            email,
            password, // In production, this should be hashed!
            verificationToken,
            isVerified: false, // User needs to verify email
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.users.push(newUser);

        if (writeUsers(data)) {
            console.log(`✅ New user registered: ${email}`);

            // Send verification email
            const emailSent = await sendVerificationEmail(email, firstName, verificationToken);

            if (emailSent) {
                res.status(201).text('SIGNUP_SUCCESS_EMAIL_SENT');
            } else {
                // User created but email failed - still allow signup
                res.status(201).text('SIGNUP_SUCCESS');
            }
        } else {
            res.status(500).text('SERVER_ERROR');
        }
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).text('SERVER_ERROR');
    }
});

// GET - Verify Email (optional endpoint if you want to verify via link click)
app.get('/api/users/verify/:token', (req, res) => {
    try {
        const { token } = req.params;
        const data = readUsers();

        const user = data.users.find(u => u.verificationToken === token);

        if (!user) {
            return res.status(404).send('Invalid verification token');
        }

        if (user.isVerified) {
            return res.send('Email already verified. You can now log in.');
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationToken = null;
        user.verifiedAt = new Date().toISOString();

        if (writeUsers(data)) {
            console.log(`✅ User verified: ${user.email}`);
            // Redirect to login page
            res.redirect('/A3Login.html?verified=true');
        } else {
            res.status(500).send('Failed to verify email');
        }
    } catch (error) {
        console.error('Error in email verification:', error);
        res.status(500).send('Server error');
    }
});

// POST - User Login
app.post('/api/users/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).text('MISSING_FIELDS');
        }

        const data = readUsers();

        // Find user by email
        const user = data.users.find(u => u.email === email);

        if (!user) {
            return res.status(401).text('INVALID_CREDENTIALS');
        }

        // Check password
        if (user.password !== password) {
            return res.status(401).text('INVALID_CREDENTIALS');
        }

        // Login successful
        console.log(`✅ User logged in: ${email}`);
        res.status(200).text('LOGIN_SUCCESS');
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).text('SERVER_ERROR');
    }
});

// GET - Retrieve all users (for admin purposes)
app.get('/api/users', (req, res) => {
    try {
        const data = readUsers();
        // Don't send passwords in response
        const usersWithoutPasswords = data.users.map(({ password, ...user }) => user);
        res.json({
            success: true,
            count: data.users.length,
            data: usersWithoutPasswords
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve users' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════════════════╗`);
    console.log(`║   Tech-Pro AI Backend Server                           ║`);
    console.log(`║   Port: ${PORT}                                           ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║   APIs: users, payment, ailearning, online, offline   ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
});
