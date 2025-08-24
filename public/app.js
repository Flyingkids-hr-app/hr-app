// --- Firebase Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, getIdToken, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, limit, orderBy, addDoc, runTransaction, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";


const firebaseConfig = {
    apiKey: "AIzaSyA9ZPpK9LQ-39oSHake8nz-_ZwfATZ1dVI",
    authDomain: "flying-kids-hr-management.firebaseapp.com",
    projectId: "flying-kids-hr-management",
    storageBucket: "flying-kids-hr-management.firebasestorage.app",
    messagingSenderId: "696451060132",
    appId: "1:696451060132:web:9a718d5bf1bd7303387131",
    measurementId: "G-1Y63FDP83Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to all emulators when running locally
if (window.location.hostname === "localhost") {
  console.log("Localhost detected, connecting to emulators...");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
}

// --- DOM Elements ---
const appLoader = document.getElementById('app-loader');
const loginScreen = document.getElementById('login-screen');
const loginButton = document.getElementById('login-button');
const mainApp = document.getElementById('main-app');
const pageTitle = document.getElementById('page-title');
const contentArea = document.getElementById('content-area');
const hamburgerButton = document.getElementById('hamburger-button');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Modal Elements
const editUserModal = document.getElementById('edit-user-modal');
const editUserForm = document.getElementById('edit-user-form');
const modalCloseButton = document.getElementById('modal-close-button');
const modalCancelButton = document.getElementById('modal-cancel-button');
const createUserModal = document.getElementById('create-user-modal');
const createUserForm = document.getElementById('create-user-form');
const createModalCloseButton = document.getElementById('create-modal-close-button');
const createModalCancelButton = document.getElementById('create-modal-cancel-button');
const requestModal = document.getElementById('request-modal');
const requestForm = document.getElementById('request-form');
const requestModalCloseButton = document.getElementById('request-modal-close-button');
const requestModalCancelButton = document.getElementById('request-modal-cancel-button');
const supportModal = document.getElementById('support-modal');
const supportForm = document.getElementById('support-form');
const supportModalCloseButton = document.getElementById('support-modal-close-button');
const supportModalCancelButton = document.getElementById('support-modal-cancel-button');
const viewSupportModal = document.getElementById('view-support-modal');
const viewSupportForm = document.getElementById('view-support-form');
const viewSupportModalCloseButton = document.getElementById('view-support-modal-close-button');
const viewSupportModalCancelButton = document.getElementById('view-support-modal-cancel-button');
const claimModal = document.getElementById('claim-modal');
const claimForm = document.getElementById('claim-form');
const claimModalCloseButton = document.getElementById('claim-modal-close-button');
const claimModalCancelButton = document.getElementById('claim-modal-cancel-button');
const purchaseRequestModal = document.getElementById('purchase-request-modal');
const purchaseRequestForm = document.getElementById('purchase-request-form');
const purchaseRequestModalCloseButton = document.getElementById('purchase-request-modal-close-button');
const purchaseRequestModalCancelButton = document.getElementById('purchase-request-modal-cancel-button');
const viewRequestModal = document.getElementById('view-request-modal');


// --- Global State ---
let currentUser = null;
let userData = null;
let appConfig = null;
let allUsers = [];
let userLeaveQuota = null;
let myJobs = []; // Store the jobs for the current user

// --- Navigation Items ---
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-house', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser'] },
    { id: 'my-documents', label: 'My Documents', icon: 'fa-solid fa-folder-open', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser'] },
    { id: 'attendance', label: 'Attendance', icon: 'fa-solid fa-clock', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR'] },
    { id: 'leave-ot', label: 'Leave / OT', icon: 'fa-solid fa-plane-departure', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'RespiteManager'] },
    { id: 'claims', label: 'Claims', icon: 'fa-solid fa-file-invoice-dollar', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'Finance'] },
    { id: 'purchasing', label: 'Purchasing', icon: 'fa-solid fa-cart-shopping', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'Purchaser'] },
    { id: 'my-job', label: 'My Job', icon: 'fa-solid fa-list-check', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser'] },
    { id: 'support', label: 'Support Requests', icon: 'fa-solid fa-headset', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser'] },
    { id: 'approvals', label: 'Approvals', icon: 'fa-solid fa-thumbs-up', requiredRoles: ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser'] },
    { id: 'reports', label: 'Reports', icon: 'fa-solid fa-chart-line', requiredRoles: ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance'] },
    { id: 'user-management', label: 'User Management', icon: 'fa-solid fa-users-cog', requiredRoles: ['Director', 'HR'] },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-cog', requiredRoles: ['Director'] },
    { id: 'system-health', label: 'System Health', icon: 'fa-solid fa-heart-pulse', requiredRoles: ['Director'] },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-cog', requiredRoles: ['Director'] },
];

// --- Helper Functions ---
const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Handles both date strings and Firebase timestamp objects
    const date = dateString.seconds ? new Date(dateString.seconds * 1000) : new Date(dateString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate) || endDate < startDate) {
        return 'Invalid date range';
    }

    let diffMs = endDate - startDate;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diffMs / (1000 * 60));

    let result = [];
    if (days > 0) result.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

    return result.length > 0 ? result.join(', ') : 'Less than a minute';
};


const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

const formatLocation = (location) => {
    if (!location || !location.latitude || !location.longitude) return 'N/A';
    const { latitude, longitude } = location;
    return `<a href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 hover:underline">View Map</a>`;
};

const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation is not supported by your browser.'));
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access was denied. Please enable it in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
                reject(new Error(errorMessage));
            }
        );
    });
};


// --- Data & Auth ---
const handleSignIn = async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { console.error(e); } };
const handleSignOut = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };
const checkAndCreateUserDocument = async (user) => {
    const userRef = doc(db, "users", user.email);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) return userDoc.data();
    const newUser = { name: user.displayName, email: user.email, photoURL: user.photoURL, createdAt: serverTimestamp(), status: "active", primaryDepartment: "Unassigned", roles: ["Staff"], managedDepartments: [] };
    await setDoc(userRef, newUser);
    return newUser;
};
const fetchAppConfig = async () => {
    try {
        const configRef = doc(db, 'configuration', 'main');
        const configDoc = await getDoc(configRef);
        if (configDoc.exists()) {
            const configData = configDoc.data();
            if (!configData.claimTypes) {
                configData.claimTypes = ["Transport", "Meals", "Office Supplies", "Medical"];
            }
            if (configData.availableRoles && !configData.availableRoles.includes('Purchaser')) {
                configData.availableRoles.push('Purchaser');
                await updateDoc(configRef, { availableRoles: configData.availableRoles });
            }
            // Return the fetched data
            return configData;
        } else {
            // Throw an error if the config is missing
            throw new Error("Application configuration is missing.");
        }
    } catch (e) {
        console.error("Error fetching config:", e);
        // Re-throw the error to be caught by the calling function
        throw e;
    }
};

const fetchUserLeaveQuota = async (userId) => {
    const currentYear = new Date().getFullYear();
    const quotaRef = doc(db, 'users', userId, 'leaveQuotas', String(currentYear));
    const quotaDoc = await getDoc(quotaRef);
    userLeaveQuota = quotaDoc.exists() ? quotaDoc.data() : {};
};

// --- Page Rendering ---

const renderDashboard = async () => {
    pageTitle.textContent = 'Dashboard';
    contentArea.innerHTML = `<div class="p-6">Loading Dashboard...</div>`;

    const getMyLeaveBalances = async () => {
        const currentYear = new Date().getFullYear();
        const quotaRef = doc(db, 'users', currentUser.email, 'leaveQuotas', String(currentYear));
        const quotaDoc = await getDoc(quotaRef);
        return quotaDoc.exists() ? quotaDoc.data() : {};
    };

    const getManagerApprovalsCount = async () => {
        if (!userData.managedDepartments || userData.managedDepartments.length === 0) return 0;

        const collectionsToQuery = ['requests', 'claims', 'purchaseRequests'];
        let totalPending = 0;

        const queryPromises = collectionsToQuery.map(coll => {
            const collRef = collection(db, coll);
            const q = query(collRef, where('status', '==', 'Pending'), where('department', 'in', userData.managedDepartments));
            return getDocs(q);
        });

        const snapshots = await Promise.all(queryPromises);
        snapshots.forEach(snapshot => {
            totalPending += snapshot.size;
        });

        return totalPending;
    };

    const getFinanceClaims = async () => {
        const claimsRef = collection(db, 'claims');
        const q = query(claimsRef, where('status', '==', 'Approved'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    };
    
    // *** NEW FUNCTION for Purchaser Dashboard Widget ***
    const getPurchaserApprovals = async () => {
        const purchaseRef = collection(db, 'purchaseRequests');
        const q = query(purchaseRef, where('status', 'in', ['Approved', 'Processing']));
        const snapshot = await getDocs(q);
        return snapshot.size; // Just need the count
    };

    const getMyAssignedJobs = async () => {
        const supportRef = collection(db, 'supportRequests');
        const q = query(supportRef, where('assigneeId', '==', currentUser.email), where('status', '!=', 'Closed'));
        const snapshot = await getDocs(q);
        return snapshot.docs;
    };

    try {
        // *** MODIFICATION: Add purchaserApprovalsCount to Promise.all ***
        const [leaveBalances, managerApprovalsCount, financeClaims, myAssignedJobs, purchaserApprovalsCount] = await Promise.all([
            getMyLeaveBalances(),
            (userData.roles.includes('DepartmentManager') || userData.roles.includes('RespiteManager')) ? getManagerApprovalsCount() : Promise.resolve(0),
            userData.roles.includes('Finance') ? getFinanceClaims() : Promise.resolve([]),
            getMyAssignedJobs(),
            userData.roles.includes('Purchaser') ? getPurchaserApprovals() : Promise.resolve(0)
        ]);

        let dashboardHtml = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';

        dashboardHtml += `
            <div class="lg:col-span-3 bg-white p-6 rounded-lg shadow">
                <h2 class="text-2xl font-bold text-gray-800">Welcome back, ${userData.name}!</h2>
                <p class="text-gray-600">Here's your summary for today, ${new Date().toLocaleDateString()}.</p>
            </div>
        `;

        let leaveHtml = '';
        appConfig.requestTypes.forEach(type => {
            if (type.hasQuota) {
                const quotaKey = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
                const takenKey = `${quotaKey}-taken`;
                const total = leaveBalances[quotaKey] || 0;
                const taken = leaveBalances[takenKey] || 0;
                const balance = total - taken;
                leaveHtml += `<div class="flex justify-between items-center py-2 border-b">
                                        <span class="text-gray-700">${type.name}</span>
                                        <span class="font-semibold text-gray-900">${balance} / ${total} hours</span>
                                    </div>`;
            }
        });
        dashboardHtml += `
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">My Leave Balances</h3>
                <div class="space-y-2">${leaveHtml || '<p class="text-gray-500">No leave quotas set.</p>'}</div>
            </div>
        `;

         dashboardHtml += `
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div class="grid grid-cols-1 gap-4">
                    <button onclick="navigateTo('leave-ot')" class="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">New Leave/OT Request</button>
                    <button onclick="navigateTo('claims')" class="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors">New Expense Claim</button>
                    <button onclick="navigateTo('attendance')" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">Record Attendance</button>
                </div>
            </div>
        `;

        if (userData.roles.includes('DepartmentManager') || userData.roles.includes('RespiteManager')) {
             dashboardHtml += `
                <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('approvals')">
                    <h3 class="text-lg font-semibold text-gray-800">Pending Approvals</h3>
                    <p class="text-5xl font-bold text-blue-600 mt-4">${managerApprovalsCount}</p>
                    <p class="text-gray-500">items need your attention.</p>
                </div>
            `;
        }
        
        if (userData.roles.includes('Finance')) {
            const totalAmount = financeClaims.reduce((sum, claim) => sum + claim.amount, 0);
            dashboardHtml += `
                <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('approvals')">
                    <h3 class="text-lg font-semibold text-gray-800">Claims Awaiting Payout</h3>
                    <p class="text-5xl font-bold text-red-600 mt-4">${financeClaims.length}</p>
                    <p class="text-gray-600 font-semibold">Totaling $${totalAmount.toFixed(2)}</p>
                </div>
            `;
        }

        // *** NEW: Add dashboard card for Purchaser ***
        if (userData.roles.includes('Purchaser')) {
            dashboardHtml += `
                <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('approvals')">
                    <h3 class="text-lg font-semibold text-gray-800">Purchase Requests to Process</h3>
                    <p class="text-5xl font-bold text-cyan-600 mt-4">${purchaserApprovalsCount}</p>
                    <p class="text-gray-500">items are waiting for processing.</p>
                </div>
            `;
        }

        if (myAssignedJobs.length > 0) {
            dashboardHtml += `
                <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('my-job')">
                    <h3 class="text-lg font-semibold text-gray-800">My Assigned Jobs</h3>
                    <p class="text-5xl font-bold text-teal-600 mt-4">${myAssignedJobs.length}</p>
                    <p class="text-gray-500">open support tickets require your action.</p>
                </div>
            `;
        }

        dashboardHtml += '</div>';
        contentArea.innerHTML = dashboardHtml;

    } catch (error) {
        console.error("Error building dashboard:", error);
        contentArea.innerHTML = `<div class="p-6 bg-red-100 text-red-700 rounded-lg">Failed to load dashboard. ${error.message}</div>`;
    }
};


const renderMyDocuments = async () => {
    pageTitle.textContent = 'My Documents';
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow">Loading documents...</div>`;

    try {
        const docsRef = collection(db, 'users', currentUser.email, 'documents');
        const q = query(docsRef, orderBy('uploadTimestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (documents.length === 0) {
            contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">You have no documents.</div>`;
            return;
        }

        const categories = {
            'Employment': [],
            'Compensation': [],
            'Performance': [],
            'Certificate': [],
            'Other': []
        };

        documents.forEach(doc => {
            if (categories[doc.category]) {
                categories[doc.category].push(doc);
            } else {
                categories['Other'].push(doc);
            }
        });

        let html = '<div class="space-y-8">';
        for (const category in categories) {
            if (categories[category].length > 0) {
                html += `
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">${category}</h3>
                        <ul class="space-y-3">
                `;
                categories[category].forEach(doc => {
                    html += `
                            <li class="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                                <div class="flex items-center">
                                    <i class="fas fa-file-alt text-gray-500 mr-4 text-xl"></i>
                                    <div>
                                        <p class="font-medium text-gray-900">${doc.fileName}</p>
                                        <p class="text-xs text-gray-500">Uploaded on: ${new Date(doc.uploadTimestamp.seconds * 1000).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <a href="${doc.storageUrl}" target="_blank" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded text-sm">View</a>
                            </li>
                    `;
                });
                html += '</ul></div>';
            }
        }
        html += '</div>';
        contentArea.innerHTML = html;

    } catch (error) {
        console.error("Error fetching documents:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading your documents.</div>`;
    }
};

const renderAttendance = async () => {
    pageTitle.textContent = 'Attendance';
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow">Loading attendance...</div>`;
    const todayStr = new Date().toISOString().split('T')[0];
    let todayRecord = null;
    let statusHTML = '', actionButtonHTML = '';
    const qToday = query(collection(db, 'attendance'), where('userId', '==', currentUser.email), where('date', '==', todayStr), limit(1));
    const todaySnapshot = await getDocs(qToday);
    if (!todaySnapshot.empty) {
        todayRecord = { id: todaySnapshot.docs[0].id, ...todaySnapshot.docs[0].data() };
        if (todayRecord.checkOutTime) {
            statusHTML = `<p class="text-lg text-green-600">Checked out at ${formatTime(todayRecord.checkOutTime)}</p>`;
            actionButtonHTML = `<button class="bg-gray-400 text-white font-bold py-2 px-4 rounded cursor-not-allowed" disabled>Completed</button>`;
        } else {
            statusHTML = `<p class="text-lg text-blue-600">Checked in at ${formatTime(todayRecord.checkInTime)}</p>`;
            actionButtonHTML = `<button id="checkout-button" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Check Out</button>`;
        }
    } else {
        statusHTML = `<p class="text-lg text-gray-600">You have not checked in today.</p>`;
        actionButtonHTML = `<button id="checkin-button" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Check In</button>`;
    }
    const qHistory = query(collection(db, 'attendance'), where('userId', '==', currentUser.email), orderBy('date', 'desc'), limit(7));
    const historySnapshot = await getDocs(qHistory);
    const historyList = historySnapshot.docs.map(doc => doc.data());
    let historyTableHTML = `<h3 class="text-xl font-semibold mt-8 mb-4">Recent History</h3><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In Location</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out Location</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
    if (historyList.length > 0) {
        historyList.forEach(rec => { 
            historyTableHTML += `<tr>
                <td class="px-6 py-4">${rec.date}</td>
                <td class="px-6 py-4">${formatTime(rec.checkInTime)}</td>
                <td class="px-6 py-4">${formatLocation(rec.checkInLocation)}</td>
                <td class="px-6 py-4">${formatTime(rec.checkOutTime)}</td>
                <td class="px-6 py-4">${formatLocation(rec.checkOutLocation)}</td>
            </tr>`; 
        });
    } else { historyTableHTML += `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No history found.</td></tr>`; }
    historyTableHTML += `</tbody></table></div>`;
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow mb-6"><h2 class="text-2xl font-bold mb-4">Today's Status</h2><div class="flex justify-between items-center">${statusHTML}${actionButtonHTML}</div></div>${historyTableHTML}`;
    
    if (document.getElementById('checkin-button')) {
        document.getElementById('checkin-button').addEventListener('click', async (e) => {
            const button = e.currentTarget;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Capturing Location...';
            try {
                const location = await getCurrentLocation();
                button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
                await addDoc(collection(db, 'attendance'), {
                    userId: currentUser.email,
                    userName: userData.name, 
                    department: userData.primaryDepartment, 
                    date: todayStr,
                    checkInTime: serverTimestamp(),
                    checkInLocation: location
                });
                renderAttendance();
            } catch (error) {
                alert(error.message);
                button.disabled = false;
                button.innerHTML = 'Check In';
            }
        });
    }

    if (document.getElementById('checkout-button')) {
        document.getElementById('checkout-button').addEventListener('click', async (e) => {
            const button = e.currentTarget;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Capturing Location...';
            try {
                const location = await getCurrentLocation();
                button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
                await updateDoc(doc(db, 'attendance', todayRecord.id), {
                    checkOutTime: serverTimestamp(),
                    checkOutLocation: location
                });
                renderAttendance();
            } catch (error) {
                alert(error.message);
                button.disabled = false;
                button.innerHTML = 'Check Out';
            }
        });
    }
};

const renderLeaveOT = async () => {
    pageTitle.textContent = 'Leave / Overtime';
    contentArea.innerHTML = `
        <div class="flex justify-end mb-4">
            <button id="open-request-modal-button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                <i class="fas fa-plus mr-2"></i>New Request
            </button>
        </div>
        <div id="requests-container" class="space-y-4">Loading requests...</div>
    `;
    try {
        const q = query(collection(db, 'requests'), where('userId', '==', currentUser.email), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const container = document.getElementById('requests-container');
        if (requests.length === 0) {
            container.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No requests found.</div>`;
        } else {
            container.innerHTML = requests.map(req => {
                const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' }[req.status] || 'bg-gray-100 text-gray-800';
                return `
                    <div class="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div>
                            <p class="font-bold text-gray-800">${req.type}</p>
                            <p class="text-sm text-gray-600">${formatDateTime(req.startDate)} to ${formatDateTime(req.endDate)}</p>
                        </div>
                        <div class="flex items-center space-x-4">
                             <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span>
                             <button class="view-details-button text-indigo-600 hover:text-indigo-900" data-id="${req.id}" data-type="requests">View Details</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('open-request-modal-button').addEventListener('click', openRequestModal);
        document.querySelectorAll('.view-details-button').forEach(btn => btn.addEventListener('click', (e) => openRequestDetailsModal(e.target.dataset.id, e.target.dataset.type)));

    } catch (error) {
        console.error("Error fetching requests:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading requests.</div>`;
    }
};

const renderUserManagement = async () => {
    pageTitle.textContent = 'User Management';
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow">Loading users...</div>`;
    try {
        const userSnapshot = await getDocs(collection(db, 'users'));
        allUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        let tableHtml = `<div class="bg-white p-6 rounded-lg shadow"><div class="flex justify-end mb-4"><button id="open-create-user-modal-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"><i class="fas fa-plus mr-2"></i>Create User</button></div><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th><th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th scope="col" class="relative px-6 py-3"><span class="sr-only">Edit</span></th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
        allUsers.forEach(user => {
            tableHtml += `<tr><td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="flex-shrink-0 h-10 w-10"><img class="h-10 w-10 rounded-full" src="${user.photoURL || 'https://placehold.co/40x40/E2E8F0/333333?text=?'}" alt=""></div><div class="ml-4"><div class="text-sm font-medium text-gray-900">${user.name}</div></div></div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${user.email}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${user.primaryDepartment}</div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.roles.join(', ')}</td><td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${user.status}</span></td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button class="text-indigo-600 hover:text-indigo-900 edit-user-button" data-user-id="${user.id}">Edit</button></td></tr>`;
        });
        tableHtml += `</tbody></table></div></div>`;
        contentArea.innerHTML = tableHtml;
        document.getElementById('open-create-user-modal-button').addEventListener('click', openCreateModal);
        document.querySelectorAll('.edit-user-button').forEach(button => button.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.userId)));
    } catch (e) { console.error("Error fetching users:", e); contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading users.</div>`; }
};

const renderClaims = async () => {
    pageTitle.textContent = 'Claims';
     contentArea.innerHTML = `
        <div class="flex justify-end mb-4">
            <button id="open-claim-modal-button" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                <i class="fas fa-plus mr-2"></i>New Claim
            </button>
        </div>
        <div id="claims-container" class="space-y-4">Loading claims...</div>
    `;
    try {
        const q = query(collection(db, 'claims'), where('userId', '==', currentUser.email), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const claims = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const container = document.getElementById('claims-container');
        if (claims.length === 0) {
            container.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No claims found.</div>`;
        } else {
            container.innerHTML = claims.map(claim => {
                 const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Paid: 'bg-blue-100 text-blue-800' }[claim.status] || 'bg-gray-100 text-gray-800';
                return `
                    <div class="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div>
                            <p class="font-bold text-gray-800">${claim.claimType} - $${claim.amount.toFixed(2)}</p>
                            <p class="text-sm text-gray-600">Date: ${formatDate(claim.expenseDate)}</p>
                        </div>
                        <div class="flex items-center space-x-4">
                             <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${claim.status}</span>
                             <button class="view-details-button text-indigo-600 hover:text-indigo-900" data-id="${claim.id}" data-type="claims">View Details</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('open-claim-modal-button').addEventListener('click', openClaimModal);
        document.querySelectorAll('.view-details-button').forEach(btn => btn.addEventListener('click', (e) => openRequestDetailsModal(e.target.dataset.id, e.target.dataset.type)));

    } catch (error) {
        console.error("Error fetching claims:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading claims. A Firestore index may be required.</div>`;
    }
};

const renderPurchasing = async () => {
    pageTitle.textContent = 'Purchasing';
    contentArea.innerHTML = `
        <div class="flex justify-end mb-4">
            <button id="open-purchase-request-modal-button" class="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">
                <i class="fas fa-plus mr-2"></i>New Purchase Request
            </button>
        </div>
        <div id="purchasing-container" class="space-y-4">Loading purchase requests...</div>
    `;
    try {
        const q = query(collection(db, 'purchaseRequests'), where('userId', '==', currentUser.email), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const container = document.getElementById('purchasing-container');
        if (requests.length === 0) {
            container.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No purchase requests found.</div>`;
        } else {
            container.innerHTML = requests.map(req => {
                const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Processing: 'bg-purple-100 text-purple-800', Completed: 'bg-blue-100 text-blue-800' }[req.status] || 'bg-gray-100 text-gray-800';
                return `
                    <div class="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div>
                            <p class="font-bold text-gray-800">${req.itemDescription}</p>
                            <p class="text-sm text-gray-600">Est. Cost: $${req.estimatedCost.toFixed(2)}</p>
                        </div>
                        <div class="flex items-center space-x-4">
                             <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span>
                             <button class="view-details-button text-indigo-600 hover:text-indigo-900" data-id="${req.id}" data-type="purchaseRequests">View Details</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('open-purchase-request-modal-button').addEventListener('click', openPurchaseRequestModal);
        document.querySelectorAll('.view-details-button').forEach(btn => btn.addEventListener('click', (e) => openRequestDetailsModal(e.target.dataset.id, e.target.dataset.type)));

    } catch (error) {
        console.error("Error fetching purchase requests:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading purchase requests.</div>`;
    }
};

const renderApprovals = async () => {
    pageTitle.textContent = 'Approvals';
    contentArea.innerHTML = `<div id="approvals-container" class="space-y-8">Loading approvals...</div>`;

    const isFinance = userData.roles.includes('Finance');
    const isPurchaser = userData.roles.includes('Purchaser');
    const isManager = userData.managedDepartments && userData.managedDepartments.length > 0;
    const isDirector = userData.roles.includes('Director');
    
    try {
        let finalHtml = '';
        const approvalPromises = [];

        if (!isPurchaser && !isFinance) {
            let q;
            if (isDirector || userData.roles.includes('HR')) {
                q = query(collection(db, 'requests'), where('status', '==', 'Pending'), orderBy('createdAt', 'desc'));
            } else if (isManager) {
                q = query(collection(db, 'requests'), where('status', '==', 'Pending'), where('department', 'in', userData.managedDepartments), orderBy('createdAt', 'desc'));
            }
            if(q) approvalPromises.push(getDocs(q).then(snapshot => ({type: 'requests', docs: snapshot.docs})));
        }

        if (!isPurchaser) {
            let q;
             if (isFinance) {
                q = query(collection(db, 'claims'), where('status', '==', 'Approved'), orderBy('createdAt', 'desc'));
            } else if (isDirector) {
                 q = query(collection(db, 'claims'), where('status', '==', 'Pending'), orderBy('createdAt', 'desc'));
            } else if (isManager) {
                q = query(collection(db, 'claims'), where('status', '==', 'Pending'), where('department', 'in', userData.managedDepartments), orderBy('createdAt', 'desc'));
            }
            if(q) approvalPromises.push(getDocs(q).then(snapshot => ({type: 'claims', docs: snapshot.docs})));
        }

        if (!isFinance) {
            let q;
            if (isPurchaser) {
                q = query(collection(db, 'purchaseRequests'), where('status', 'in', ['Approved', 'Processing']), orderBy('createdAt', 'desc'));
            } else if (isDirector) {
                q = query(collection(db, 'purchaseRequests'), where('status', '==', 'Pending'), orderBy('createdAt', 'desc'));
            } else if (isManager) {
                q = query(collection(db, 'purchaseRequests'), where('status', '==', 'Pending'), where('department', 'in', userData.managedDepartments), orderBy('createdAt', 'desc'));
            }
            if(q) approvalPromises.push(getDocs(q).then(snapshot => ({type: 'purchaseRequests', docs: snapshot.docs})));
        }

        const results = await Promise.all(approvalPromises);
        
        const sections = {
            requests: { title: 'Leave / OT Requests', items: [] },
            claims: { title: 'Expense Claims', items: [] },
            purchaseRequests: { title: 'Purchase Requests', items: [] },
        };

        results.forEach(result => {
            result.docs.forEach(doc => {
                sections[result.type].items.push({ id: doc.id, ...doc.data() });
            });
        });

        for (const key in sections) {
            const section = sections[key];
            if (section.items.length > 0) {
                finalHtml += `<div class="bg-white p-6 rounded-lg shadow"><h3 class="text-xl font-semibold mb-4">${section.title}</h3><div class="space-y-4">`;
                section.items.forEach(item => {
                    let summary = '';
                    if (key === 'requests') summary = `${item.type} for ${item.hours} hours`;
                    if (key === 'claims') summary = `${item.claimType} for $${item.amount.toFixed(2)}`;
                    if (key === 'purchaseRequests') summary = `${item.itemDescription}`;
                    
                    finalHtml += `
                        <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p class="font-bold text-gray-800">${item.userName}</p>
                                <p class="text-sm text-gray-600">${summary}</p>
                            </div>
                            <button class="view-details-button bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" data-id="${item.id}" data-type="${key}">View Details</button>
                        </div>
                    `;
                });
                finalHtml += `</div></div>`;
            }
        }

        if (finalHtml === '') {
            finalHtml = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No pending approvals.</div>`;
        }

        document.getElementById('approvals-container').innerHTML = finalHtml;
        document.querySelectorAll('.view-details-button').forEach(btn => btn.addEventListener('click', (e) => openRequestDetailsModal(e.target.dataset.id, e.target.dataset.type, true)));

    } catch (error) {
        console.error("Error fetching approvals:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading approvals. A Firestore index may be required.</div>`;
    }
};

const renderSupport = async () => {
    pageTitle.textContent = 'Support Requests';
    contentArea.innerHTML = `
        <div class="flex justify-end mb-4">
            <button id="open-support-modal-button" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
                <i class="fas fa-plus mr-2"></i>New Support Request
            </button>
        </div>
        <div id="support-container" class="space-y-4">Loading support requests...</div>
    `;
    try {
        const q = query(collection(db, 'supportRequests'), where('requesterId', '==', currentUser.email), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const container = document.getElementById('support-container');
        if (requests.length === 0) {
            container.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No support requests found.</div>`;
        } else {
            container.innerHTML = requests.map(req => {
                const statusColor = { 'Open': 'bg-blue-100 text-blue-800', 'In Progress': 'bg-yellow-100 text-yellow-800', 'Completed': 'bg-purple-100 text-purple-800', 'Closed': 'bg-green-100 text-green-800' }[req.status] || 'bg-gray-100 text-gray-800';
                return `
                    <div class="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div>
                            <p class="font-bold text-gray-800">${req.subject}</p>
                            <p class="text-sm text-gray-600">Assigned to: ${req.assigneeName}</p>
                        </div>
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('open-support-modal-button').addEventListener('click', openSupportModal);
    } catch (error) {
        console.error("Error fetching support requests:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading support requests.</div>`;
    }
};

const renderMyJob = async () => {
    pageTitle.textContent = 'My Job';
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow">Loading your assigned tasks...</div>`;
    try {
        const supportRef = collection(db, 'supportRequests');
        const q = query(supportRef, where('assigneeId', '==', currentUser.email), where('status', '!=', 'Closed'), orderBy('createdAt', 'desc'));
        const supportSnapshot = await getDocs(q);

        const jobs = supportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        myJobs = jobs; 

        let tableHtml = `<div class="bg-white p-6 rounded-lg shadow"><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;

        if (jobs.length > 0) {
            jobs.forEach(task => {
                const statusColor = { 'Open': 'bg-blue-100 text-blue-800', 'In Progress': 'bg-yellow-100 text-yellow-800', 'Completed': 'bg-purple-100 text-purple-800'}[task.status] || 'bg-gray-100';
                const action = `<button class="view-support-button text-teal-600 hover:text-teal-900" data-id="${task.id}">View / Update</button>`;
                tableHtml += `<tr>
                                    <td class="px-6 py-4">${task.subject}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${task.requesterName}</td>
                                    <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${task.status}</span></td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${action}</td>
                                  </tr>`;
            });
        } else {
            tableHtml += `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">You have no open support tickets assigned to you.</td></tr>`;
        }
        tableHtml += `</tbody></table></div></div>`;
        contentArea.innerHTML = tableHtml;
        
        document.querySelectorAll('.view-support-button').forEach(btn => btn.addEventListener('click', (e) => openViewSupportModal(e.target.dataset.id)));
    } catch (error) {
        console.error("Error fetching jobs:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading your jobs. A Firestore index may be required.</div>`;
    }
};

const renderSettings = async () => {
    pageTitle.textContent = 'Settings';
    if (!userData || !userData.roles.includes('Director')) {
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">You do not have permission to view this page.</div>`;
        return;
    }
    if (!appConfig) {
        await fetchAppConfig();
    }
    let settingsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4 border-b pb-2">Manage Departments</h3>
                <div id="departments-list" class="space-y-2 mb-4 max-h-96 overflow-y-auto"></div>
                <div class="flex space-x-2 border-t pt-4">
                    <input type="text" id="new-department-name" class="flex-grow py-2 px-3 border border-gray-300 rounded-md" placeholder="New Department Name">
                    <button id="add-dept-btn" class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Add</button>
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4 border-b pb-2">Manage Request Types</h3>
                <div id="request-types-list" class="space-y-2 mb-4 max-h-96 overflow-y-auto"></div>
                <div class="border-t pt-4 space-y-3">
                     <input type="text" id="new-req-type-name" class="w-full py-2 px-3 border border-gray-300 rounded-md" placeholder="New Request Type Name">
                     <label class="flex items-center space-x-2">
                         <input type="checkbox" id="new-req-type-quota" class="form-checkbox h-5 w-5 text-indigo-600">
                         <span class="text-gray-700">Has Quota (deducts from balance)</span>
                    </label>
                    <button id="add-req-type-btn" class="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Add</button>
                </div>
            </div>
        </div>
        <div class="mt-6 flex justify-end">
            <button id="save-settings-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg">
                <i class="fas fa-save mr-2"></i>Save All Changes
            </button>
        </div>
    `;
    contentArea.innerHTML = settingsHTML;
    let currentDepartments = [...appConfig.availableDepartments];
    let currentRequestTypes = JSON.parse(JSON.stringify(appConfig.requestTypes));
    const updateDeptList = () => {
        const listEl = document.getElementById('departments-list');
        listEl.innerHTML = currentDepartments.map(dept => `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded group">
                <span class="text-gray-800">${dept}</span>
                <button class="delete-dept-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-dept="${dept}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('') || '<p class="text-gray-500 text-center p-4">No departments configured.</p>';
        document.querySelectorAll('.delete-dept-btn').forEach(btn => btn.addEventListener('click', handleDeleteDept));
    };
    const updateReqTypeList = () => {
        const listEl = document.getElementById('request-types-list');
        listEl.innerHTML = currentRequestTypes.map((type, index) => `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded group">
                <div>
                    <span class="font-medium">${type.name}</span>
                    <span class="text-xs font-semibold px-2 py-1 rounded-full ml-2 ${type.hasQuota ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}">${type.hasQuota ? 'Has Quota' : 'No Quota'}</span>
                </div>
                <button class="delete-req-type-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('') || '<p class="text-gray-500 text-center p-4">No request types configured.</p>';
        document.querySelectorAll('.delete-req-type-btn').forEach(btn => btn.addEventListener('click', handleDeleteReqType));
    };
    const handleDeleteDept = (e) => {
        const deptToDelete = e.currentTarget.dataset.dept;
        if (confirm(`Are you sure you want to delete the department "${deptToDelete}"?`)) {
            currentDepartments = currentDepartments.filter(d => d !== deptToDelete);
            updateDeptList();
        }
    };
    const handleDeleteReqType = (e) => {
        const indexToDelete = parseInt(e.currentTarget.dataset.index, 10);
        const typeName = currentRequestTypes[indexToDelete].name;
        if (confirm(`Are you sure you want to delete the request type "${typeName}"?`)) {
            currentRequestTypes.splice(indexToDelete, 1);
            updateReqTypeList();
        }
    };
    document.getElementById('add-dept-btn').addEventListener('click', () => {
        const input = document.getElementById('new-department-name');
        const newDept = input.value.trim();
        if (newDept && !currentDepartments.find(d => d.toLowerCase() === newDept.toLowerCase())) {
            currentDepartments.push(newDept);
            currentDepartments.sort();
            input.value = '';
            updateDeptList();
        } else if (newDept) {
            alert('This department already exists.');
        }
    });
    document.getElementById('add-req-type-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('new-req-type-name');
        const quotaInput = document.getElementById('new-req-type-quota');
        const newName = nameInput.value.trim();
        if (newName && !currentRequestTypes.some(rt => rt.name.toLowerCase() === newName.toLowerCase())) {
            currentRequestTypes.push({ name: newName, hasQuota: quotaInput.checked });
            currentRequestTypes.sort((a, b) => a.name.localeCompare(b.name));
            nameInput.value = '';
            quotaInput.checked = false;
            updateReqTypeList();
        } else if (newName) {
            alert('This request type already exists.');
        }
    });
    document.getElementById('save-settings-btn').addEventListener('click', async (e) => {
        const button = e.currentTarget;
        if (!confirm("Are you sure you want to save these changes to the application configuration? This may affect all users.")) return;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        try {
            const configRef = doc(db, 'configuration', 'main');
            await updateDoc(configRef, {
                availableDepartments: currentDepartments,
                requestTypes: currentRequestTypes
            });
            alert('Settings updated successfully!');
            await fetchAppConfig();
            navigateTo('settings');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Please check the console for details.");
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-save mr-2"></i>Save All Changes';
        }
    });
    updateDeptList();
    updateReqTypeList();
};

// Add this entire new function
const renderSystemHealth = async () => {
    pageTitle.textContent = 'System Health';
    contentArea.innerHTML = `<div class="p-6">Loading System Health Dashboard...</div>`;

    try {
        // --- Data Fetching ---
        const getActiveUsersCount = getDocs(query(collection(db, 'users'), where('status', '==', 'active')));
        const getPendingApprovalsCount = getDocs(query(collection(db, 'requests'), where('status', '==', 'Pending')));
        const getOpenTicketsCount = getDocs(query(collection(db, 'supportRequests'), where('status', '!=', 'Closed')));

        const [usersSnapshot, approvalsSnapshot, ticketsSnapshot] = await Promise.all([
            getActiveUsersCount,
            getPendingApprovalsCount,
            getOpenTicketsCount
        ]);

        const activeUsers = usersSnapshot.size;
        const pendingApprovals = approvalsSnapshot.size;
        const openTickets = ticketsSnapshot.size;

        // --- HTML Rendering ---
        const projectId = firebaseConfig.projectId;
        const logsUrl = `https://console.cloud.google.com/logs/viewer?project=${projectId}&pageState=(%22savedSearches%22:(%22insertId%22:%22clgy1y070034g3561a0s0g2f9%22,%22name%22:%22Cloud%20Functions%22,%22query%22:%22resource.type%3D%5C%22cloud_function%5C%22%22))`;


        let healthHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow text-center">
                    <p class="text-5xl font-bold text-blue-600">${activeUsers}</p>
                    <p class="text-gray-500 mt-2">Active Users</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow text-center">
                    <p class="text-5xl font-bold text-yellow-600">${pendingApprovals}</p>
                    <p class="text-gray-500 mt-2">Pending Leave/OT Approvals</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow text-center">
                    <p class="text-5xl font-bold text-red-600">${openTickets}</p>
                    <p class="text-gray-500 mt-2">Open Support Tickets</p>
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4">Admin Actions</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-800">Run Daily Attendance Check</p>
                            <p class="text-sm text-gray-600">Manually trigger the scheduled function that checks for absences and late check-ins.</p>
                        </div>
                        <button id="run-attendance-check-btn" class="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700">Run Now</button>
                    </div>
                     <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p class="font-medium text-gray-800">View Cloud Function Logs</p>
                            <p class="text-sm text-gray-600">Open the Google Cloud Console to view real-time logs and errors from your backend functions.</p>
                        </div>
                        <a href="${logsUrl}" target="_blank" class="bg-gray-600 text-white font-bold py-2 px-4 rounded hover:bg-gray-700">View Logs</a>
                    </div>
                </div>
            </div>
        `;

        contentArea.innerHTML = healthHTML;

        // --- Event Listeners ---
        document.getElementById('run-attendance-check-btn').addEventListener('click', async (e) => {
            const button = e.target;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Running...';
            if (!confirm("Are you sure you want to manually run the daily attendance check? This will generate exceptions for today.")) {
                 button.disabled = false;
                 button.innerHTML = 'Run Now';
                 return;
            }
            try {
                const testDailyAttendance = httpsCallable(functions, 'testDailyAttendance');
                const result = await testDailyAttendance();
                alert("Function executed successfully! Check the Cloud Function logs for details.");
                console.log(result.data);
            } catch (error) {
                console.error("Error running testDailyAttendance function:", error);
                alert("An error occurred while running the function. Check the browser console and Cloud Function logs for details.");
            } finally {
                button.disabled = false;
                button.innerHTML = 'Run Now';
            }
        });

    } catch (error) {
        console.error("Error rendering System Health page:", error);
        contentArea.innerHTML = `<div class="p-6 bg-red-100 text-red-700 rounded-lg">Failed to load system health data.</div>`;
    }
};


// =================================================================================
// START: REPORTS PAGE FUNCTIONS
// =================================================================================

const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }

    // Get headers from the keys of the first object
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');

    // Map data to CSV rows, escaping special characters
    const dataRows = data.map(row => {
        return headers.map(header => {
            const cell = row[header] === null || row[header] === undefined ? '' : row[header];
            let cellString = String(cell);
            // Escape quotes and wrap in quotes if it contains commas, newlines, or quotes
            if (cellString.includes('"') || cellString.includes(',') || cellString.includes('\n')) {
                cellString = '"' + cellString.replace(/"/g, '""') + '"';
            }
            return cellString;
        }).join(',');
    });

    // Combine header and data rows
    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const renderReports = async () => {
    pageTitle.textContent = 'Reports';
    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="mb-4 border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" id="report-tabs">
                    <button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-indigo-500 text-indigo-600" data-report="leave">Leave / OT</button>
                    <button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-report="claims">Claims</button>
                    <button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-report="purchasing">Purchasing</button>
                    <button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-report="attendance">Attendance</button>
                </nav>
            </div>
            <div id="report-filters"></div>
            <div id="report-data-container"></div>
        </div>
    `;

    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(t => {
                t.classList.remove('border-indigo-500', 'text-indigo-600');
                t.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            e.target.classList.add('border-indigo-500', 'text-indigo-600');
            e.target.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            loadReport(e.target.dataset.report);
        });
    });

    loadReport('leave');
};

const loadReport = (reportType) => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');

    filtersContainer.innerHTML = '';
    dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading report...</p>`;

    switch (reportType) {
        case 'leave':
            renderLeaveReport();
            break;
        case 'claims':
            renderClaimsReport();
            break;
        case 'purchasing':
            renderPurchasingReport();
            break;
        case 'attendance':
            renderAttendanceReport();
            break;
        default:
            dataContainer.innerHTML = '<p class="text-center p-4">Select a report type.</p>';
    }
};

const renderReportFilters = (container, options) => {
    const { showDateRange, showStatus, showDepartment, onApply, onExport } = options;
    const hasGlobalAccess = userData.roles.includes('Director') || userData.roles.includes('HR') || userData.roles.includes('Finance');
    const isManager = userData.roles.some(r => ['DepartmentManager', 'Director', 'HR', 'Finance', 'Purchaser'].includes(r));


    let filtersHTML = '<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">';

    if (showDateRange) {
        filtersHTML += `
            <div>
                <label for="report-start-date" class="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="report-start-date" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
            </div>
            <div>
                <label for="report-end-date" class="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" id="report-end-date" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
            </div>
        `;
    }

    if (showStatus) {
        filtersHTML += `
            <div>
                <label for="report-status" class="block text-sm font-medium text-gray-700">Status</label>
                <select id="report-status" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
        `;
    }

    if (showDepartment && hasGlobalAccess) {
        let deptOptions = '<option value="">All Departments</option>';
        appConfig.availableDepartments.forEach(dept => {
            deptOptions += `<option value="${dept}">${dept}</option>`;
        });
        filtersHTML += `
            <div>
                <label for="report-department" class="block text-sm font-medium text-gray-700">Department</label>
                <select id="report-department" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">${deptOptions}</select>
            </div>
        `;
    } else {
        // Add a placeholder div to maintain grid alignment if some filters are not shown
        filtersHTML += '<div></div>';
    }

    filtersHTML += `
        <div class="flex items-end">
            <button id="apply-filters-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Apply Filters</button>
        </div>
    `;

    if (isManager) {
        filtersHTML += `
            <div class="flex items-end">
                 <button id="export-csv-btn" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">
                    <i class="fas fa-file-csv mr-2"></i>Export CSV
                </button>
            </div>
        `;
    }


    filtersHTML += '</div>';
    container.innerHTML = filtersHTML;

    document.getElementById('apply-filters-btn').addEventListener('click', onApply);
    if(isManager && document.getElementById('export-csv-btn')) {
        document.getElementById('export-csv-btn').addEventListener('click', onExport);
    }
};


const renderLeaveReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];

    const fetchData = async () => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching leave data...</p>`;

        const isManager = userData.roles.includes('DepartmentManager') && !userData.roles.includes('Director') && !userData.roles.includes('HR');
        let q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));

        if (isManager && userData.managedDepartments?.length > 0) {
            q = query(q, where('department', 'in', userData.managedDepartments));
        }

        const startDate = document.getElementById('report-start-date')?.value;
        const endDate = document.getElementById('report-end-date')?.value;
        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;

        if (startDate) q = query(q, where('startDate', '>=', startDate));
        if (endDate) q = query(q, where('startDate', '<=', endDate));
        if (status) q = query(q, where('status', '==', status));
        if (department) q = query(q, where('department', '==', department));

        try {
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => doc.data());
            
            // Prepare data for CSV export
            dataForExport = requests.map(req => ({
                Employee: req.userName,
                Department: req.department,
                Type: req.type,
                StartDate: formatDateTime(req.startDate),
                EndDate: formatDateTime(req.endDate),
                Hours: req.hours,
                Status: req.status,
                ApprovedBy: req.approvedBy || 'N/A',
                Reason: req.reason,
                DocumentURL: req.documentUrl || 'N/A'
            }));


            let tableHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (requests.length === 0) {
                tableHTML += `<tr><td colspan="7" class="p-4 text-center text-gray-500">No leave data found.</td></tr>`;
            } else {
                requests.forEach(req => {
                    const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' }[req.status] || 'bg-gray-100';
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${req.userName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.type}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${formatDateTime(req.startDate)} to ${formatDateTime(req.endDate)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.hours}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.approvedBy || 'N/A'}</td>
                        </tr>
                    `;
                });
            }

            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error("Error fetching leave report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading leave data. A Firestore index may be required.</p>`;
        }
    };
    
    renderReportFilters(filtersContainer, { 
        showDateRange: true, 
        showStatus: true, 
        showDepartment: true, 
        onApply: fetchData,
        onExport: () => exportToCSV(dataForExport, 'leave-ot-report')
    });
    fetchData();
};

const renderClaimsReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];

    const fetchData = async () => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching claims data...</p>`;

        const isManager = userData.roles.includes('DepartmentManager') && !userData.roles.includes('Director');
        const canSeeAll = userData.roles.includes('Director') || userData.roles.includes('Finance') || userData.roles.includes('HR');
        
        let q = query(collection(db, 'claims'), orderBy('createdAt', 'desc'));

        if (!canSeeAll && isManager && userData.managedDepartments?.length > 0) {
            q = query(q, where('department', 'in', userData.managedDepartments));
        }

        const startDate = document.getElementById('report-start-date')?.value;
        const endDate = document.getElementById('report-end-date')?.value;
        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;

        if (startDate) q = query(q, where('expenseDate', '>=', startDate));
        if (endDate) q = query(q, where('expenseDate', '<=', endDate));
        if (status) q = query(q, where('status', '==', status));
        if (department) q = query(q, where('department', '==', department));
        
        try {
            const querySnapshot = await getDocs(q);
            const claims = querySnapshot.docs.map(doc => doc.data());
            
            // Prepare data for CSV export
            dataForExport = claims.map(claim => ({
                Employee: claim.userName,
                Department: claim.department,
                ClaimType: claim.claimType,
                ExpenseDate: formatDate(claim.expenseDate),
                Amount: claim.amount.toFixed(2),
                Status: claim.status,
                ApprovedBy: claim.approvedBy || 'N/A',
                PaidBy: claim.processedBy || 'N/A', // Corrected field name
                Description: claim.description,
                ReceiptURL: claim.receiptUrl
            }));

            let tableHTML = `
                <h3 class="text-xl font-semibold mb-4 mt-6">Claims Report</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid By</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (claims.length === 0) {
                tableHTML += `<tr><td colspan="7" class="p-4 text-center text-gray-500">No claims data found.</td></tr>`;
            } else {
                claims.forEach(claim => {
                    const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Paid: 'bg-blue-100 text-blue-800', Rejected: 'bg-red-100 text-red-800' }[claim.status] || 'bg-gray-100';
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${claim.userName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${claim.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${claim.claimType}</td>
                            <td class="px-6 py-4 whitespace-nowrap">$${claim.amount.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${claim.status}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">${claim.approvedBy || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${claim.processedBy || 'N/A'}</td>
                        </tr>
                    `;
                });
            }

            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error("Error fetching claims report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading claims. A Firestore index may be required.</p>`;
        }
    };

    renderReportFilters(filtersContainer, { 
        showDateRange: true, 
        showStatus: true, 
        showDepartment: true, 
        onApply: fetchData,
        onExport: () => exportToCSV(dataForExport, 'claims-report')
    });
    fetchData();
};

const renderPurchasingReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];

    const fetchData = async () => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching purchasing data...</p>`;

        const isManager = userData.roles.includes('DepartmentManager') && !userData.roles.includes('Director');
        const canSeeAll = userData.roles.includes('Director') || userData.roles.includes('Finance') || userData.roles.includes('HR') || userData.roles.includes('Purchaser');
        
        let q = query(collection(db, 'purchaseRequests'), orderBy('createdAt', 'desc'));

        if (!canSeeAll && isManager && userData.managedDepartments?.length > 0) {
            q = query(q, where('department', 'in', userData.managedDepartments));
        }

        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;
        const startDate = document.getElementById('report-start-date')?.value;
        const endDate = document.getElementById('report-end-date')?.value;

        if (status) q = query(q, where('status', '==', status));
        if (department) q = query(q, where('department', '==', department));
        
        try {
            const querySnapshot = await getDocs(q);
            let purchases = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

            if (startDate) {
                purchases = purchases.filter(p => p.createdAt.toDate() >= new Date(startDate));
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the whole end day
                purchases = purchases.filter(p => p.createdAt.toDate() <= end);
            }
            
            // Prepare data for CSV export
            dataForExport = purchases.map(req => ({
                Employee: req.userName,
                Department: req.department,
                Item: req.itemDescription,
                Quantity: req.quantity,
                EstimatedCost: req.estimatedCost.toFixed(2),
                Status: req.status,
                ApprovedBy: req.approvedBy || 'N/A',
                ProcessedBy: req.processedBy || 'N/A',
                Justification: req.justification,
                ProductLink: req.productLink || 'N/A'
            }));

            let tableHTML = `
                <h3 class="text-xl font-semibold mb-4 mt-6">Purchasing Report</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (purchases.length === 0) {
                tableHTML += `<tr><td colspan="7" class="p-4 text-center text-gray-500">No purchasing data found.</td></tr>`;
            } else {
                purchases.forEach(req => {
                    const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Processing: 'bg-purple-100 text-purple-800', Completed: 'bg-blue-100 text-blue-800' }[req.status] || 'bg-gray-100 text-gray-800';
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${req.userName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.itemDescription}</td>
                            <td class="px-6 py-4 whitespace-nowrap">$${req.estimatedCost.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.approvedBy || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.processedBy || 'N/A'}</td>
                        </tr>
                    `;
                });
            }

            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error("Error fetching purchasing report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading purchasing data. A Firestore index may be required.</p>`;
        }
    };

    renderReportFilters(filtersContainer, { 
        showDateRange: true, 
        showStatus: true, 
        showDepartment: true, 
        onApply: fetchData,
        onExport: () => exportToCSV(dataForExport, 'purchasing-report') 
    });
    fetchData();
};

const renderAttendanceReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];

    const fetchData = async () => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching attendance data...</p>`;
        
        const startDate = document.getElementById('report-start-date')?.value;
        const endDate = document.getElementById('report-end-date')?.value;
        const department = document.getElementById('report-department')?.value;
        
        if (!startDate || !endDate) {
            dataContainer.innerHTML = `<p class="text-center p-4 text-red-600">Please select a start and end date.</p>`;
            return;
        }

        const isManager = userData.roles.includes('DepartmentManager') && !userData.roles.includes('Director') && !userData.roles.includes('HR');
        
        let q = query(collection(db, 'attendance'), where('date', '>=', startDate), where('date', '<=', endDate));

        if (department) {
            q = query(q, where('department', '==', department));
        } else if (isManager && userData.managedDepartments?.length > 0) {
            q = query(q, where('department', 'in', userData.managedDepartments));
        }
        
        try {
            const querySnapshot = await getDocs(q);
            const attendanceRecords = querySnapshot.docs.map(doc => doc.data());
            
            // Prepare data for CSV export
            dataForExport = attendanceRecords.map(rec => ({
                Date: formatDate(rec.date),
                Employee: rec.userName,
                Department: rec.department,
                CheckInTime: formatTime(rec.checkInTime),
                CheckInLocation: rec.checkInLocation ? `${rec.checkInLocation.latitude}, ${rec.checkInLocation.longitude}` : 'N/A',
                CheckOutTime: formatTime(rec.checkOutTime),
                CheckOutLocation: rec.checkOutLocation ? `${rec.checkOutLocation.latitude}, ${rec.checkOutLocation.longitude}` : 'N/A'
            }));
            
            let tableHTML = `
                <h3 class="text-xl font-semibold mb-4 mt-6">Attendance Report from ${formatDate(startDate)} to ${formatDate(endDate)}</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (attendanceRecords.length === 0) {
                tableHTML += `<tr><td colspan="5" class="p-4 text-center text-gray-500">No attendance records found for this date range.</td></tr>`;
            } else {
                // Sort by date then by user name for better readability
                attendanceRecords.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : (a.userName > b.userName) ? 1 : -1));

                attendanceRecords.forEach(rec => {
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${formatDate(rec.date)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${rec.userName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${rec.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${formatTime(rec.checkInTime)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${formatTime(rec.checkOutTime)}</td>
                        </tr>
                    `;
                });
            }

            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error("Error fetching attendance report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading attendance data. A Firestore index may be required. Check console.</p>`;
        }
    };

    renderReportFilters(filtersContainer, { 
        showDateRange: true, 
        showDepartment: true, 
        onApply: fetchData,
        onExport: () => exportToCSV(dataForExport, 'attendance-report')
    });
    fetchData();
};


// =================================================================================
// END: REPORTS PAGE FUNCTIONS
// =================================================================================


// --- UI & Modal Logic ---

const openRequestDetailsModal = async (requestId, collectionName, isApproval = false) => {
    const modal = document.getElementById('view-request-modal');
    const modalTitle = document.getElementById('view-request-modal-title');
    const modalBody = document.getElementById('view-request-modal-body');
    const modalFooter = document.getElementById('view-request-modal-footer');

    modalBody.innerHTML = 'Loading...';
    modalFooter.innerHTML = '';
    modal.classList.remove('hidden');

    try {
        const docRef = doc(db, collectionName, requestId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            modalBody.innerHTML = 'Request not found.';
            return;
        }

        const data = docSnap.data();
        let bodyHtml = '<div class="space-y-4">';
        let footerHtml = '<button id="view-request-modal-close-button-inner" type="button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>';
        
        switch(collectionName) {
            case 'requests':
                const duration = calculateDuration(data.startDate, data.endDate);

                modalTitle.textContent = 'Leave / OT Request Details';
                bodyHtml += `
                    <p><strong>Applicant:</strong> ${data.userName}</p>
                    <p><strong>Type:</strong> ${data.type}</p>
                    <p><strong>Dates:</strong> ${formatDateTime(data.startDate)} to ${formatDateTime(data.endDate)}</p>
                    <p><strong>Calculated Duration:</strong> ${duration}</p>
                    <p><strong>Hours Claimed:</strong> ${data.hours}</p>
                    <p><strong>Reason:</strong><br><span class="pl-2">${data.reason}</span></p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    ${data.documentUrl ? `<p><strong>Document:</strong> <a href="${data.documentUrl}" target="_blank" class="text-indigo-600 hover:underline">View Document</a></p>` : ''}
                `;
                if (isApproval && data.status === 'Pending') {
                    footerHtml += `
                        <button class="reject-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button>
                        <button class="approve-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}" data-user-id="${data.userId}" data-type="${data.type}" data-hours="${data.hours}">Approve</button>
                    `;
                }
                break;
            case 'claims':
                modalTitle.textContent = 'Expense Claim Details';
                bodyHtml += `
                     <p><strong>Applicant:</strong> ${data.userName}</p>
                     <p><strong>Claim Type:</strong> ${data.claimType}</p>
                     <p><strong>Expense Date:</strong> ${formatDate(data.expenseDate)}</p>
                     <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
                     <p><strong>Description:</strong><br><span class="pl-2">${data.description}</span></p>
                     <p><strong>Status:</strong> ${data.status}</p>
                     <p><strong>Receipt:</strong> <a href="${data.receiptUrl}" target="_blank" class="text-indigo-600 hover:underline">View Receipt</a></p>
                `;
                 if (isApproval && data.status === 'Pending') {
                    footerHtml += `
                        <button class="reject-claim-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button>
                        <button class="approve-claim-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Approve</button>
                    `;
                } else if (isApproval && data.status === 'Approved' && userData.roles.includes('Finance')) {
                     footerHtml += `<button class="paid-claim-button bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Mark as Paid</button>`;
                }
                break;
            case 'purchaseRequests':
                 modalTitle.textContent = 'Purchase Request Details';
                 bodyHtml += `
                    <p><strong>Applicant:</strong> ${data.userName}</p>
                    <p><strong>Item:</strong> ${data.itemDescription}</p>
                    <p><strong>Quantity:</strong> ${data.quantity}</p>
                    <p><strong>Estimated Cost:</strong> $${data.estimatedCost.toFixed(2)}</p>
                    <p><strong>Justification:</strong><br><span class="pl-2">${data.justification}</span></p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    ${data.productLink ? `<p><strong>Product Link:</strong> <a href="${data.productLink}" target="_blank" class="text-indigo-600 hover:underline">View Product</a></p>` : ''}
                `;
                 if (isApproval && data.status === 'Pending') {
                    footerHtml += `
                        <button class="reject-purchase-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button>
                        <button class="approve-purchase-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Approve</button>
                    `;
                } else if (isApproval && data.status === 'Approved' && userData.roles.includes('Purchaser')) {
                    footerHtml += `<button class="process-purchase-button bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Start Processing</button>`;
                } else if (isApproval && data.status === 'Processing' && userData.roles.includes('Purchaser')) {
                    footerHtml += `<button class="complete-purchase-button bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Mark Completed</button>`;
                }
                break;
        }

        bodyHtml += '</div>';
        modalBody.innerHTML = bodyHtml;
        modalFooter.innerHTML = footerHtml;

        document.getElementById('view-request-modal-close-button-inner').addEventListener('click', closeRequestDetailsModal);
        if (document.querySelector('.approve-button')) document.querySelector('.approve-button').addEventListener('click', handleApproveRequest);
        if (document.querySelector('.reject-button')) document.querySelector('.reject-button').addEventListener('click', handleRejectRequest);
        if (document.querySelector('.approve-claim-button')) document.querySelector('.approve-claim-button').addEventListener('click', handleApproveClaim);
        if (document.querySelector('.reject-claim-button')) document.querySelector('.reject-claim-button').addEventListener('click', handleRejectClaim);
        if (document.querySelector('.paid-claim-button')) document.querySelector('.paid-claim-button').addEventListener('click', handleMarkAsPaid);
        if (document.querySelector('.approve-purchase-button')) document.querySelector('.approve-purchase-button').addEventListener('click', (e) => handlePurchaseUpdate(e.target.dataset.id, 'Approved', 'approvedBy'));
        if (document.querySelector('.reject-purchase-button')) document.querySelector('.reject-purchase-button').addEventListener('click', (e) => handlePurchaseUpdate(e.target.dataset.id, 'Rejected', 'approvedBy'));
        if (document.querySelector('.process-purchase-button')) document.querySelector('.process-purchase-button').addEventListener('click', (e) => handlePurchaseUpdate(e.target.dataset.id, 'Processing', 'processedBy'));
        if (document.querySelector('.complete-purchase-button')) document.querySelector('.complete-purchase-button').addEventListener('click', (e) => handlePurchaseUpdate(e.target.dataset.id, 'Completed', 'processedBy'));

    } catch (error) {
        console.error("Error opening request details:", error);
        modalBody.innerHTML = 'Failed to load request details.';
    }
};

const closeRequestDetailsModal = () => {
    const modal = document.getElementById('view-request-modal');
    modal.classList.add('hidden');
};

const handleApproveRequest = async (e) => {
    const button = e.target;
    const requestId = button.dataset.id;
    const requestUserId = button.dataset.userId;
    const requestType = button.dataset.type;
    const requestHours = parseInt(button.dataset.hours, 10);
    if (!confirm("Are you sure you want to approve this request?")) return;
    const requestRef = doc(db, 'requests', requestId);
    const requestTypeConfig = appConfig.requestTypes.find(rt => rt.name === requestType);
    try {
        if (requestTypeConfig && requestTypeConfig.hasQuota) {
            await runTransaction(db, async (transaction) => {
                const currentYear = new Date().getFullYear();
                const quotaRef = doc(db, 'users', requestUserId, 'leaveQuotas', String(currentYear));
                const quotaDoc = await transaction.get(quotaRef);
                if (!quotaDoc.exists()) throw "Leave quota for this user has not been set for the current year.";
                const quotaData = quotaDoc.data();
                const quotaField = `edit-${requestType.toLowerCase().replace(/ /g, '-')}`;
                const takenField = `${quotaField}-taken`;
                const currentTaken = quotaData[takenField] || 0;
                const newTaken = currentTaken + requestHours;
                transaction.update(quotaRef, { [takenField]: newTaken });
                transaction.update(requestRef, { status: 'Approved', approvedBy: currentUser.email });
            });
        } else {
            await updateDoc(requestRef, { status: 'Approved', approvedBy: currentUser.email });
        }
        alert('Request approved successfully!');
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error("Error approving request:", error);
        alert(`Failed to approve request: ${error}`);
    }
};

const handleRejectRequest = async (e) => {
    const requestId = e.target.dataset.id;
    if (!confirm("Are you sure you want to reject this request?")) return;
    try {
        const requestRef = doc(db, 'requests', requestId);
        await updateDoc(requestRef, { status: 'Rejected', approvedBy: currentUser.email });
        alert('Request rejected.');
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject request.");
    }
};

const handleApproveClaim = async (e) => {
    const claimId = e.target.dataset.id;
    if (!confirm("Are you sure you want to approve this claim?")) return;
    try {
        const claimRef = doc(db, 'claims', claimId);
        await updateDoc(claimRef, { status: 'Approved', approvedBy: currentUser.email });
        alert('Claim approved.');
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error("Error approving claim:", error);
        alert("Failed to approve claim.");
    }
};

const handleRejectClaim = async (e) => {
    const claimId = e.target.dataset.id;
    if (!confirm("Are you sure you want to reject this claim?")) return;
    try {
        const claimRef = doc(db, 'claims', claimId);
        await updateDoc(claimRef, { status: 'Rejected', approvedBy: currentUser.email });
        alert('Claim rejected.');
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error("Error rejecting claim:", error);
        alert("Failed to reject claim.");
    }
};

const handleMarkAsPaid = async (e) => {
    const claimId = e.target.dataset.id;
    if (!confirm("Are you sure you want to mark this claim as paid? This action cannot be undone.")) return;
    try {
        const claimRef = doc(db, 'claims', claimId);
        await updateDoc(claimRef, { status: 'Paid', processedBy: currentUser.email });
        alert('Claim marked as paid.');
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error("Error marking claim as paid:", error);
        alert("Failed to update claim status.");
    }
};

const handlePurchaseUpdate = async (requestId, newStatus, userField) => {
    if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;
    try {
        const requestRef = doc(db, 'purchaseRequests', requestId);
        await updateDoc(requestRef, {
            status: newStatus,
            [userField]: currentUser.email
        });
        alert(`Request marked as ${newStatus}.`);
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error(`Error updating purchase request to ${newStatus}:`, error);
        alert(`Failed to update request.`);
    }
};

const handleDocumentUpload = async (userId, callback) => {
    const fileInput = document.getElementById('doc-upload');
    const category = document.getElementById('doc-category').value;
    const progressIndicator = document.getElementById('employee-doc-upload-progress');
    const uploadButton = document.getElementById('upload-doc-button');

    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    uploadButton.disabled = true;
    uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const storagePath = `user-documents/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressIndicator.textContent = `Upload is ${progress.toFixed(0)}% done`;
        },
        (error) => {
            console.error("Upload failed:", error);
            alert("File upload failed. Please try again.");
            progressIndicator.textContent = "Upload failed.";
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload';
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const docData = {
                    fileName: file.name,
                    category: category,
                    storageUrl: downloadURL,
                    storagePath: storagePath,
                    uploadTimestamp: serverTimestamp(),
                    uploadedBy: currentUser.email
                };
                await addDoc(collection(db, 'users', userId, 'documents'), docData);
                
                progressIndicator.textContent = "Upload complete!";
                fileInput.value = ''; 
                
                if (callback) await callback();

            } catch (dbError) {
                console.error("Error saving document metadata:", dbError);
                alert("Failed to save document record.");
                progressIndicator.textContent = "Error saving record.";
            } finally {
                uploadButton.disabled = false;
                uploadButton.textContent = 'Upload';
            }
        }
    );
};

const handleDocumentDelete = async (userId, docId, storagePath, callback) => {
    if (!confirm("Are you sure you want to permanently delete this document? This cannot be undone.")) {
        return;
    }

    try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);

        const docRef = doc(db, 'users', userId, 'documents', docId);
        await deleteDoc(docRef);

        alert("Document deleted successfully.");
        if (callback) await callback();

    } catch (error) {
        console.error("Error deleting document:", error);
        if (error.code === 'storage/object-not-found') {
            alert("Could not find the file in storage, but deleting the record. Please contact support if this persists.");
            const docRef = doc(db, 'users', userId, 'documents', docId);
            await deleteDoc(docRef);
            if (callback) await callback();
        } else {
            alert("Failed to delete document. Please check the console for details.");
        }
    }
};


const openEditModal = async (userId) => {
    const userToEdit = allUsers.find(user => user.id === userId);
    if (!userToEdit) { alert("User not found!"); return; }
    document.getElementById('edit-user-id').value = userToEdit.id;
    document.getElementById('edit-name').textContent = userToEdit.name;
    document.getElementById('edit-email').textContent = userToEdit.email;
    document.getElementById('edit-status').value = userToEdit.status;
    const currentYear = new Date().getFullYear();
    document.getElementById('quota-year').textContent = currentYear;
    const quotaRef = doc(db, 'users', userId, 'leaveQuotas', String(currentYear));
    const quotaDoc = await getDoc(quotaRef);
    const quotaData = quotaDoc.exists() ? quotaDoc.data() : {};
    const quotaContainer = document.getElementById('edit-leave-quotas-container');
    quotaContainer.innerHTML = '';
    appConfig.requestTypes.forEach(type => {
        if (type.hasQuota) {
            const inputId = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
            const quotaValue = quotaData[inputId] || '';
            quotaContainer.innerHTML += `<div><label for="${inputId}" class="block text-xs font-medium text-gray-600">${type.name} Quota</label><input type="number" id="${inputId}" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm sm:text-sm" value="${quotaValue}" placeholder="e.g., 112"></div>`;
        }
    });
    const deptSelect = document.getElementById('edit-department');
    deptSelect.innerHTML = '';
    appConfig.availableDepartments.forEach(dept => { const option = document.createElement('option'); option.value = dept; option.textContent = dept; if (dept === userToEdit.primaryDepartment) option.selected = true; deptSelect.appendChild(option); });
    const rolesContainer = document.getElementById('edit-roles');
    rolesContainer.innerHTML = '';
    appConfig.availableRoles.forEach(role => { const isChecked = userToEdit.roles.includes(role); rolesContainer.innerHTML += `<label class="flex items-center"><input type="checkbox" class="form-checkbox h-5 w-5 text-indigo-600" value="${role}" ${isChecked ? 'checked' : ''}><span class="ml-2 text-gray-700">${role}</span></label>`; });
    const managedDeptsContainer = document.getElementById('edit-managed-departments');
    managedDeptsContainer.innerHTML = '';
    appConfig.availableDepartments.forEach(dept => { const isChecked = userToEdit.managedDepartments && userToEdit.managedDepartments.includes(dept); managedDeptsContainer.innerHTML += `<label class="flex items-center"><input type="checkbox" class="form-checkbox h-5 w-5 text-indigo-600" value="${dept}" ${isChecked ? 'checked' : ''}><span class="ml-2 text-gray-700">${dept}</span></label>`; });
    
    const docsListEl = document.getElementById('existing-docs-list');
    const renderDocs = async () => {
        const docsRef = collection(db, 'users', userId, 'documents');
        const docsSnapshot = await getDocs(query(docsRef, orderBy('uploadTimestamp', 'desc')));
        const docs = docsSnapshot.docs.map(d => ({...d.data(), id: d.id}));

        const canDelete = userData.roles.includes('Director') || 
                          userData.roles.includes('HR') || 
                          userData.roles.includes('DepartmentManager');

        if (docs.length > 0) {
            docsListEl.innerHTML = docs.map(d => `
                <div class="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <a href="${d.storageUrl}" target="_blank" class="text-blue-600 hover:underline">${d.fileName}</a>
                    
                    ${canDelete ? `<button type="button" class="delete-doc-button text-red-500 hover:text-red-700" data-doc-id="${d.id}" data-storage-path="${d.storagePath}">Delete</button>` : ''}

                </div>
            `).join('');
            
            document.querySelectorAll('.delete-doc-button').forEach(btn => btn.addEventListener('click', (e) => handleDocumentDelete(userId, e.currentTarget.dataset.docId, e.currentTarget.dataset.storagePath, renderDocs)));
        } else {
            docsListEl.innerHTML = '<p class="text-gray-500 text-center">No documents found.</p>';
        }
    };
    await renderDocs();

    document.getElementById('upload-doc-button').onclick = () => handleDocumentUpload(userId, renderDocs);

    editUserModal.classList.remove('hidden');
};

const closeEditModal = () => editUserModal.classList.add('hidden');

const handleUpdateUser = async (e) => {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id').value;
    const updatedUserData = {
        primaryDepartment: document.getElementById('edit-department').value,
        status: document.getElementById('edit-status').value,
        roles: Array.from(document.querySelectorAll('#edit-roles input:checked')).map(i => i.value),
        managedDepartments: Array.from(document.querySelectorAll('#edit-managed-departments input:checked')).map(i => i.value)
    };
    try {
        await updateDoc(doc(db, 'users', userId), updatedUserData);
    } catch (e) { console.error("Error updating user:", e); alert("Failed to update user details."); return; }
    const currentYear = new Date().getFullYear();
    const updatedQuotaData = {};
    appConfig.requestTypes.forEach(type => {
        if (type.hasQuota) {
            const inputId = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
            const quotaValue = document.getElementById(inputId).value;
            updatedQuotaData[inputId] = parseInt(quotaValue, 10) || 0;
        }
    });
    try {
        await setDoc(doc(db, 'users', userId, 'leaveQuotas', String(currentYear)), updatedQuotaData, { merge: true });
    } catch (e) { console.error("Error updating quota:", e); alert("Failed to update leave quotas."); return; }
    alert('User updated successfully!');
    closeEditModal();
    navigateTo('user-management');
};

const openCreateModal = () => { createUserForm.reset(); createUserModal.classList.remove('hidden'); };
const closeCreateModal = () => createUserModal.classList.add('hidden');
const handleCreateUser = async (e) => {
    e.preventDefault();
    const name = document.getElementById('create-name').value.trim();
    const email = document.getElementById('create-email').value.trim().toLowerCase();
    if (!name || !email) { alert("Please fill in both name and email."); return; }
    try {
        const userRef = doc(db, "users", email);
        if ((await getDoc(userRef)).exists()) { alert("A user with this email already exists."); return; }
        const newUser = { name, email, photoURL: null, createdAt: serverTimestamp(), status: "active", primaryDepartment: "Unassigned", roles: ["Staff"], managedDepartments: [] };
        await setDoc(userRef, newUser);
        alert("User created successfully!");
        closeCreateModal();
        navigateTo('user-management');
    } catch (e) { console.error("Error creating user:", e); alert("Failed to create user."); }
};

const openRequestModal = () => {
    requestForm.reset();
    document.getElementById('request-upload-progress').textContent = '';
    const requestTypeSelect = document.getElementById('request-type');
    requestTypeSelect.innerHTML = '<option value="">Select a type...</option>';
    appConfig.requestTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.name;
        option.textContent = type.name;
        option.dataset.hasQuota = type.hasQuota;
        requestTypeSelect.appendChild(option);
    });
    const deptSelect = document.getElementById('request-department');
    deptSelect.innerHTML = '';
    appConfig.availableDepartments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });
    deptSelect.disabled = true;
    document.getElementById('leave-balance-display').textContent = '';
    requestModal.classList.remove('hidden');
};

const closeRequestModal = () => requestModal.classList.add('hidden');

const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

    const type = document.getElementById('request-type').value;
    const startDate = document.getElementById('request-start-date').value;
    const endDate = document.getElementById('request-end-date').value;
    const hours = document.getElementById('request-hours').value;
    const reason = document.getElementById('request-reason').value.trim();
    const department = document.getElementById('request-department').value;
    const documentFile = document.getElementById('request-document').files[0];

    if (!type || !startDate || !endDate || !reason || !hours) {
        alert("Please fill out all required fields.");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Request';
        return;
    }
    
    const selectedTypeConfig = appConfig.requestTypes.find(rt => rt.name === type);
    if (selectedTypeConfig && selectedTypeConfig.hasQuota) {
        const quotaKey = `edit-${type.toLowerCase().replace(/ /g, '-')}`;
        const takenKey = `${quotaKey}-taken`;
        const quota = userLeaveQuota[quotaKey] || 0;
        const taken = userLeaveQuota[takenKey] || 0;
        const balance = quota - taken;

        if (parseInt(hours, 10) > balance) {
            alert(`Submission Failed: You cannot apply for ${hours} hours. Your remaining balance for this leave type is only ${balance} hours.`);
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request';
            return; 
        }
    }

    const newRequest = {
        userId: currentUser.email, userName: userData.name, type: type,
        startDate: startDate, endDate: endDate, hours: parseInt(hours, 10),
        reason: reason, status: 'Pending', createdAt: serverTimestamp(),
        department: type.toLowerCase().includes('overtime') ? department : userData.primaryDepartment,
        documentUrl: null
    };

    const saveRequest = async () => {
        try {
            await addDoc(collection(db, 'requests'), newRequest);
            alert('Request submitted successfully!');
            closeRequestModal();
            navigateTo('leave-ot');
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Failed to submit request.");
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request';
        }
    };

    if (documentFile) {
        const progressIndicator = document.getElementById('request-upload-progress');
        const filePath = `leave-documents/${currentUser.uid}/${Date.now()}_${documentFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, documentFile);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressIndicator.textContent = `Upload is ${progress.toFixed(0)}% done`;
            }, 
            (error) => {
                console.error("Upload failed:", error);
                alert("Document upload failed. Please try again.");
                submitButton.disabled = false;
                submitButton.innerHTML = 'Submit Request';
            }, 
            async () => {
                newRequest.documentUrl = await getDownloadURL(uploadTask.snapshot.ref);
                await saveRequest();
            }
        );
    } else {
        await saveRequest();
    }
};

const openSupportModal = async () => {
    supportForm.reset();
    const assignToSelect = document.getElementById('support-assign-to');
    assignToSelect.innerHTML = '<option value="">Loading users...</option>';
    supportModal.classList.remove('hidden');

    try {
        if (!currentUser) {
            throw new Error("Not signed in.");
        }

        // Force a token refresh to ensure it's valid
        const idToken = await getIdToken(currentUser, true);
        
        const getSupportAssignableUsers = httpsCallable(functions, 'getSupportAssignableUsers');
        
        // Pass the token in the data payload
        const result = await getSupportAssignableUsers({ authToken: idToken });
        const assignableUsers = result.data;

        assignToSelect.innerHTML = '<option value="">Select a user...</option>';
        allUsers = assignableUsers;
        
        if (assignableUsers.length > 0) {
            assignableUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = user.name;
                assignToSelect.appendChild(option);
            });
        } else {
            assignToSelect.innerHTML = '<option value="">No users available to assign</option>';
        }

    } catch (error) {
        console.error("Error fetching assignable users via Cloud Function:", error);
        assignToSelect.innerHTML = '<option value="">Could not load users</option>';
        alert("There was an error loading the user list. Please try again later.");
    }
};

const closeSupportModal = () => supportModal.classList.add('hidden');

const handleSupportSubmit = async (e) => {
    e.preventDefault();
    const assigneeEmail = document.getElementById('support-assign-to').value;
    const subject = document.getElementById('support-subject').value.trim();
    const description = document.getElementById('support-description').value.trim();
    if (!assigneeEmail || !subject || !description) {
        alert("Please fill out all fields.");
        return;
    }
    const assignee = allUsers.find(user => user.email === assigneeEmail);
    const newSupportRequest = {
        requesterId: currentUser.email,
        requesterName: userData.name,
        assigneeId: assignee.email,
        assigneeName: assignee.name,
        subject: subject,
        description: description,
        status: 'Open',
        createdAt: serverTimestamp()
    };
    try {
        await addDoc(collection(db, 'supportRequests'), newSupportRequest);
        alert('Support request submitted successfully!');
        closeSupportModal();
        navigateTo('support');
    } catch (error) {
        console.error("Error submitting support request:", error);
        alert("Failed to submit support request.");
    }
};

const openViewSupportModal = async (taskId) => {
    try {
        const taskRef = doc(db, 'supportRequests', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
            alert("Support ticket not found!");
            return;
        }
        const task = taskDoc.data();

        document.getElementById('view-support-id').value = taskId;
        document.getElementById('view-support-subject').textContent = task.subject;
        document.getElementById('view-support-requester').textContent = task.requesterName;
        document.getElementById('view-support-description').textContent = task.description;
        document.getElementById('view-support-status').value = task.status;
        viewSupportModal.classList.remove('hidden');
    } catch (error) {
        console.error("Error opening support ticket:", error);
        alert("Could not load support ticket details.");
    }
};

const closeViewSupportModal = () => viewSupportModal.classList.add('hidden');

const handleUpdateSupportStatus = async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('view-support-id').value;
    const newStatus = document.getElementById('view-support-status').value;
    try {
        const taskRef = doc(db, 'supportRequests', taskId);
        await updateDoc(taskRef, { status: newStatus });
        alert('Support ticket status updated!');
        closeViewSupportModal();
        navigateTo('my-job');
    } catch (error) {
        console.error("Error updating support status:", error);
        alert("Failed to update status.");
    }
};

const openClaimModal = () => {
    claimForm.reset();
    const claimTypeSelect = document.getElementById('claim-type');
    claimTypeSelect.innerHTML = '<option value="">Select a type...</option>';
    appConfig.claimTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        claimTypeSelect.appendChild(option);
    });
    document.getElementById('upload-progress').textContent = '';
    claimModal.classList.remove('hidden');
};

const closeClaimModal = () => claimModal.classList.add('hidden');

const handleClaimSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

    const claimType = document.getElementById('claim-type').value;
    const expenseDate = document.getElementById('claim-date').value;
    const amount = parseFloat(document.getElementById('claim-amount').value);
    const description = document.getElementById('claim-description').value.trim();
    const receiptFile = document.getElementById('claim-receipt').files[0];

    if (!claimType || !expenseDate || !amount || !description || !receiptFile) {
        alert("Please fill out all fields and upload a receipt.");
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Claim';
        return;
    }

    try {
        const progressIndicator = document.getElementById('upload-progress');
        const filePath = `receipts/${currentUser.uid}/${Date.now()}_${receiptFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, receiptFile);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressIndicator.textContent = `Upload is ${progress.toFixed(0)}% done`;
            }, 
            (error) => {
                console.error("Upload failed:", error);
                alert("Receipt upload failed. Please try again.");
                submitButton.disabled = false;
                submitButton.textContent = 'Submit Claim';
            }, 
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                const newClaim = {
                    userId: currentUser.email,
                    userName: userData.name,
                    department: userData.primaryDepartment,
                    claimType: claimType,
                    expenseDate: expenseDate,
                    amount: amount,
                    description: description,
                    receiptUrl: downloadURL,
                    status: 'Pending',
                    createdAt: serverTimestamp(),
                    approvedBy: null
                };

                await addDoc(collection(db, 'claims'), newClaim);
                alert('Claim submitted successfully!');
                closeClaimModal();
                navigateTo('claims');
            }
        );
    } catch (error) {
        console.error("Error submitting claim:", error);
        alert("Failed to submit claim.");
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Claim';
    }
};

const openPurchaseRequestModal = () => {
    purchaseRequestForm.reset();
    purchaseRequestModal.classList.remove('hidden');
};

const closePurchaseRequestModal = () => purchaseRequestModal.classList.add('hidden');

const handlePurchaseRequestSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

    const newPurchaseRequest = {
        userId: currentUser.email,
        userName: userData.name,
        department: userData.primaryDepartment,
        itemDescription: document.getElementById('purchase-item').value,
        quantity: parseInt(document.getElementById('purchase-quantity').value, 10),
        estimatedCost: parseFloat(document.getElementById('purchase-cost').value),
        productLink: document.getElementById('purchase-link').value,
        justification: document.getElementById('purchase-justification').value,
        status: 'Pending',
        createdAt: serverTimestamp(),
        approvedBy: null,
        processedBy: null
    };

    try {
        await addDoc(collection(db, 'purchaseRequests'), newPurchaseRequest);
        alert('Purchase request submitted successfully!');
        closePurchaseRequestModal();
        navigateTo('purchasing');
    } catch (error) {
        console.error("Error submitting purchase request:", error);
        alert("Failed to submit purchase request.");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Request';
    }
};

// --- UI Rendering & Router ---
// Add this entire new function
const setupMobileMenu = () => {
    const closeMenu = () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    };

    const openMenu = () => {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    };

    hamburgerButton.addEventListener('click', openMenu);
    sidebarOverlay.addEventListener('click', closeMenu);

    // Add event listeners to all nav links to close the menu on click
    document.getElementById('sidebar-nav').addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
             // Only close if screen is small (mobile view)
            if (window.innerWidth < 768) {
                closeMenu();
            }
        }
    });
};

const renderSidebar = () => {
    const navContainer = document.getElementById('sidebar-nav');
    navContainer.innerHTML = '';
    navItems.forEach(item => {
        if (userData && userData.roles && item.requiredRoles.some(role => userData.roles.includes(role))) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'block px-4 py-2.5 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200';
            link.innerHTML = `<i class="w-6 ${item.icon} mr-2"></i>${item.label}`;
            link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(item.id); });
            navContainer.appendChild(link);
        }
    });
};
const renderHeader = () => {
    if(userData) document.getElementById('user-name').textContent = userData.name;
    document.getElementById('signout-button').addEventListener('click', handleSignOut);
};

const navigateTo = (pageId) => {
    const pages = {
        'dashboard': renderDashboard, 
        'my-documents': renderMyDocuments,
        'attendance': renderAttendance, 
        'leave-ot': renderLeaveOT,
        'claims': renderClaims, 
        'purchasing': renderPurchasing, 
        'my-job': renderMyJob, 
        'support': renderSupport,
        'approvals': renderApprovals,
        'reports': renderReports,
        'user-management': renderUserManagement, 
        'system-health': renderSystemHealth, // <-- ADD THIS LINE
        'settings': renderSettings
    };
    (pages[pageId] || renderDashboard)();
};

window.navigateTo = navigateTo;

// --- App Initialization ---
const showMainApp = () => {
    appLoader.classList.add('hidden');
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    renderHeader();
    renderSidebar();
    setupMobileMenu(); // <-- ADD THIS LINE
    navigateTo('dashboard');
};

const showLoginScreen = () => {
    appLoader.classList.add('hidden');
    mainApp.classList.add('hidden');
    loginScreen.classList.remove('hidden');
};

// Event Listeners
loginButton.addEventListener('click', handleSignIn);
modalCloseButton.addEventListener('click', closeEditModal);
modalCancelButton.addEventListener('click', closeEditModal);
editUserForm.addEventListener('submit', handleUpdateUser);
createModalCloseButton.addEventListener('click', closeCreateModal);
createModalCancelButton.addEventListener('click', closeCreateModal);
createUserForm.addEventListener('submit', handleCreateUser);
requestModalCloseButton.addEventListener('click', closeRequestModal);
requestModalCancelButton.addEventListener('click', closeRequestModal);
requestForm.addEventListener('submit', handleRequestSubmit);
supportModalCloseButton.addEventListener('click', closeSupportModal);
supportModalCancelButton.addEventListener('click', closeSupportModal);
supportForm.addEventListener('submit', handleSupportSubmit);
viewSupportModalCloseButton.addEventListener('click', closeViewSupportModal);
viewSupportModalCancelButton.addEventListener('click', closeViewSupportModal);
viewSupportForm.addEventListener('submit', handleUpdateSupportStatus);
claimModalCloseButton.addEventListener('click', closeClaimModal);
claimModalCancelButton.addEventListener('click', closeClaimModal);
claimForm.addEventListener('submit', handleClaimSubmit);
purchaseRequestModalCloseButton.addEventListener('click', closePurchaseRequestModal);
purchaseRequestModalCancelButton.addEventListener('click', closePurchaseRequestModal);
purchaseRequestForm.addEventListener('submit', handlePurchaseRequestSubmit);
document.getElementById('view-request-modal-close-button').addEventListener('click', closeRequestDetailsModal);


document.getElementById('request-type').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const leaveBalanceDisplay = document.getElementById('leave-balance-display');
    document.getElementById('request-department').disabled = !e.target.value.toLowerCase().includes('overtime');
    
    if (selectedOption.dataset.hasQuota === 'true') {
        const quotaKey = `edit-${selectedOption.value.toLowerCase().replace(/ /g, '-')}`;
        const takenKey = `${quotaKey}-taken`;
        const quota = userLeaveQuota ? (userLeaveQuota[quotaKey] || 0) : 0;
        const taken = userLeaveQuota ? (userLeaveQuota[takenKey] || 0) : 0;
        leaveBalanceDisplay.textContent = `Balance: ${quota - taken} hours remaining.`;
    } else {
        leaveBalanceDisplay.textContent = '';
    }
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        appLoader.classList.remove('hidden');
        loginScreen.classList.add('hidden');
        mainApp.classList.add('hidden');

        try {
            // Fetch all necessary initial data at the same time
            const [configData, userDoc] = await Promise.all([
                fetchAppConfig(),
                checkAndCreateUserDocument(user)
            ]);

            // **Crucial Check:** Ensure config was loaded successfully
            if (!configData) {
                throw new Error("Application configuration could not be loaded.");
            }

            // Assign the fetched data to the global variables
            appConfig = configData;
            currentUser = user;
            userData = userDoc;

            if (!userData) {
                throw new Error("Error loading user profile.");
            }
            if (userData.status === 'inactive') {
                throw new Error('Your account is inactive.');
            }

            await fetchUserLeaveQuota(currentUser.email);

            // Only show the app after all data is confirmed to be loaded
            showMainApp();

        } catch (error) {
            console.error("Initialization failed:", error);
            alert(error.message || "An error occurred during sign-in.");
            await handleSignOut();
        }

    } else {
        currentUser = null;
        userData = null;
        appConfig = null;
        showLoginScreen();
    }
});