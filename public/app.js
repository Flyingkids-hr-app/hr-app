// --- Firebase Initialization ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, getIdToken, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, limit, orderBy, addDoc, runTransaction, deleteDoc, documentId } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
// Add these to the bottom of the Modal Elements section
const correctAttendanceModal = document.getElementById('correct-attendance-modal');
const correctAttendanceForm = document.getElementById('correct-attendance-form');
const correctAttendanceModalCloseButton = document.getElementById('correct-attendance-modal-close-button');
const correctAttendanceModalCancelButton = document.getElementById('correct-attendance-modal-cancel-button');
const resolveExceptionModal = document.getElementById('resolve-exception-modal');
const resolveExceptionForm = document.getElementById('resolve-exception-form');
const resolveExceptionModalCloseButton = document.getElementById('resolve-exception-modal-close-button');
const resolveExceptionModalCancelButton = document.getElementById('resolve-exception-modal-cancel-button');
const announcementModal = document.getElementById('announcement-modal');
const announcementForm = document.getElementById('announcement-form');
const announcementModalCloseButton = document.getElementById('announcement-modal-close-button');
const announcementModalCancelButton = document.getElementById('announcement-modal-cancel-button');
const viewAcknowledgementsModal = document.getElementById('view-acknowledgements-modal');
const viewAcknowledgementsModalCloseButton = document.getElementById('view-acknowledgements-modal-close-button');
const viewAcknowledgementsModalCancelButton = document.getElementById('view-acknowledgements-modal-cancel-button');
const completePurchaseModal = document.getElementById('complete-purchase-modal');
const completePurchaseForm = document.getElementById('complete-purchase-form');
const completePurchaseModalCloseButton = document.getElementById('complete-purchase-modal-close-button');
const completePurchaseModalCancelButton = document.getElementById('complete-purchase-modal-cancel-button');
// ... at the end of the Modal Elements section ...
const billPaymentModal = document.getElementById('bill-payment-modal');
const billPaymentForm = document.getElementById('bill-payment-form');
const billPaymentModalCloseButton = document.getElementById('bill-payment-modal-close-button');
const billPaymentModalCancelButton = document.getElementById('bill-payment-modal-cancel-button');


// --- Global State ---
let currentUser = null;
let userData = null;
let appConfig = null;
let allUsers = [];
let userLeaveQuota = null;
let myJobs = []; // Store the jobs for the current user

// --- Navigation Items ---
// Replace the entire navItems array with this
// in app.js
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-house', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser', 'Admin', 'IT', 'HR Head'] },
    { id: 'my-documents', label: 'My Documents', icon: 'fa-solid fa-folder-open', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser', 'Admin', 'IT', 'HR Head'] },
    { id: 'announcements-history', label: 'Announcements', icon: 'fa-solid fa-bullhorn', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser', 'Admin', 'IT', 'HR Head'] },
    { id: 'attendance', label: 'Attendance', icon: 'fa-solid fa-clock', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'HR Head'] },
    { id: 'leave-ot', label: 'Leave / OT', icon: 'fa-solid fa-plane-departure', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'RespiteManager', 'HR Head'] },
    { id: 'claims', label: 'Claims', icon: 'fa-solid fa-file-invoice-dollar', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'Finance'] },
    { id: 'purchasing', label: 'Purchasing', icon: 'fa-solid fa-cart-shopping', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'Purchaser'] },
    { id: 'my-job', label: 'My Job', icon: 'fa-solid fa-list-check', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser', 'Admin', 'IT', 'HR Head'] },
    { id: 'support', label: 'Support Requests', icon: 'fa-solid fa-headset', requiredRoles: ['Staff', 'DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser', 'Admin', 'IT', 'HR Head'] },
    { id: 'bill-payments', label: 'Bill Payments', icon: 'fa-solid fa-file-invoice-dollar', requiredRoles: ['DepartmentManager', 'RegionalDirector', 'Director', 'Finance'] },
    { id: 'approvals', label: 'Approvals', icon: 'fa-solid fa-thumbs-up', requiredRoles: ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'RespiteManager', 'Purchaser', 'HR Head'] },
    // MODIFIED LINE: Added 'HR Head', 'Admin', and 'IT' to this list
    { id: 'reports', label: 'Reports', icon: 'fa-solid fa-chart-line', requiredRoles: ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Finance', 'Purchaser', 'HR Head', 'Admin', 'IT'] },
    { id: 'user-management', label: 'User Management', icon: 'fa-solid fa-users-cog', requiredRoles: ['Director', 'HR', 'HR Head', 'RegionalDirector', 'Finance'] },
    { id: 'system-health', label: 'System Health', icon: 'fa-solid fa-heart-pulse', requiredRoles: ['Director'] },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-cog', requiredRoles: ['Director', 'RegionalDirector', 'HR Head'] },
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

// --- ADD THIS NEW HELPER FUNCTION ---
const formatDateForCSV = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Handle both Firestore Timestamp objects and standard Date strings/objects
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
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

// This is a new helper function for the dashboard
const updateDashboardLeaveBalances = async (year) => {
    const container = document.getElementById('dashboard-leave-balances-list');
    if (!container) return; // Exit if the container isn't on the page

    container.innerHTML = '<p class="text-gray-500">Loading balances...</p>';

    try {
        const quotaRef = doc(db, 'users', currentUser.email, 'leaveQuotas', String(year));
        const quotaDoc = await getDoc(quotaRef);
        const leaveBalances = quotaDoc.exists() ? quotaDoc.data() : {};

        let leaveHtml = '';
        const quotaTypes = appConfig.requestTypes.filter(type => type.hasQuota);

        if (quotaTypes.length === 0) {
            leaveHtml = '<p class="text-gray-500">No leave quotas set.</p>';
        } else {
            quotaTypes.forEach(type => {
                const quotaKey = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
                const takenKey = `${quotaKey}-taken`;
                const total = leaveBalances[quotaKey] || 0;
                const taken = leaveBalances[takenKey] || 0;
                const balance = total - taken;
                leaveHtml += `
                    <div class="flex justify-between items-center py-2 border-b">
                        <span class="text-gray-700">${type.name}</span>
                        <span class="font-semibold text-gray-900">${balance} / ${total} hours</span>
                    </div>`;
            });
        }
        container.innerHTML = leaveHtml;
    } catch (error) {
        console.error(`Error fetching leave balances for year ${year}:`, error);
        container.innerHTML = '<p class="text-red-500">Could not load balances.</p>';
    }
};

const handleAcknowledgeException = async (e) => {
    const button = e.currentTarget;
    const exceptionId = button.dataset.id;
    const banner = document.getElementById(`banner-${exceptionId}`);

    button.disabled = true;
    button.textContent = 'Acknowledging...';

    try {
        const exceptionRef = doc(db, 'attendanceExceptions', exceptionId);
        await updateDoc(exceptionRef, {
            acknowledged: true
        });

        // Remove the banner from the screen after successful acknowledgment
        if (banner) {
            banner.remove();
        }

    } catch (error) {
        console.error("Error acknowledging exception:", error);
        alert("Failed to acknowledge the notification. Please try again.");
        button.disabled = false;
        button.textContent = 'Acknowledge';
    }
};

// in app.js
const handleAcknowledgeAnnouncement = async (e) => {
    const button = e.currentTarget;
    const announcementId = button.dataset.id;
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const ackRef = doc(db, 'announcements', announcementId, 'acknowledgements', currentUser.email);
        await setDoc(ackRef, {
            timestamp: serverTimestamp(),
            userName: userData.name
        });

        // --- START: NEW TRANSFORMATION LOGIC ---
        // Instead of removing the banner, we find it and change its appearance.
        const banner = document.getElementById(`announcement-${announcementId}`);
        if (banner) {
            const buttonContainer = button.parentElement; // The button's parent div
            if(buttonContainer){
                // Replace the button with a static "Acknowledged" status
                buttonContainer.innerHTML = `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check mr-2"></i>Acknowledged</span>`;
            }

            // De-emphasize the banner style
            banner.classList.remove('bg-blue-100', 'border-blue-500');
            banner.classList.add('bg-gray-100', 'border-gray-300');
        }
        // --- END: NEW TRANSFORMATION LOGIC ---

    } catch (error) {
        console.error("Error acknowledging announcement:", error);
        alert("Failed to acknowledge the announcement. Please try again.");
        button.disabled = false;
        button.innerHTML = 'Acknowledge';
    }
};

const handleAcknowledgeAlert = async (e) => {
    const button = e.currentTarget;
    const alertId = button.dataset.id;
    const banner = document.getElementById(`banner-${alertId}`);

    button.disabled = true;
    button.textContent = 'Acknowledging...';

    try {
        const alertRef = doc(db, 'userAlerts', alertId);
        await updateDoc(alertRef, { acknowledged: true });
        if (banner) banner.remove();
    } catch (error) {
        console.error("Error acknowledging alert:", error);
        alert("Failed to acknowledge the notification. Please try again.");
        button.disabled = false;
        button.textContent = 'Acknowledge';
    }
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
// in app.js
const renderDashboard = async () => {
    pageTitle.textContent = 'Dashboard';
    contentArea.innerHTML = `<div class="p-6">Loading Dashboard...</div>`;

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
        snapshots.forEach(snapshot => { totalPending += snapshot.size; });
        return totalPending;
    };
    const getFinanceClaims = async () => {
        const claimsRef = collection(db, 'claims');
        let q = query(claimsRef, where('status', '==', 'Approved'));

        if (!userData.roles.includes('Director')) {
            const deptsToView = userData.managedDepartments || [];
            if (deptsToView.length > 0) {
                q = query(q, where('department', 'in', deptsToView));
            } else {
                return [];
            }
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    };

const getPurchaserApprovals = async () => {
    const purchaseRef = collection(db, 'purchaseRequests');
    const requiredStatuses = ['Approved', 'Processing'];

    if (userData.roles.includes('Director')) {
        const q = query(purchaseRef, where('status', 'in', requiredStatuses));
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    const deptsToView = userData.managedDepartments || [];
    if (deptsToView.length === 0) {
        return 0;
    }

    // Chunk the departments array into pieces of 30 or less
    const CHUNK_SIZE = 30;
    const deptChunks = [];
    for (let i = 0; i < deptsToView.length; i += CHUNK_SIZE) {
        deptChunks.push(deptsToView.slice(i, i + CHUNK_SIZE));
    }

    const queryPromises = deptChunks.map(chunk => {
        const q = query(purchaseRef, where('department', 'in', chunk));
        return getDocs(q);
    });

    const querySnapshots = await Promise.all(queryPromises);
    
    let totalPending = 0;
    querySnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
            if (requiredStatuses.includes(doc.data().status)) {
                totalPending++;
            }
        });
    });
    
    return totalPending;
};

    const getMyAssignedJobs = async () => {
        const supportRef = collection(db, 'supportRequests');
        const q = query(supportRef, where('assigneeId', '==', currentUser.email), where('status', '!=', 'Closed'));
        const snapshot = await getDocs(q);
        return snapshot.docs;
    };
    const getMyUnacknowledgedExceptions = async () => {
        const q = query(collection(db, 'attendanceExceptions'), where('userId', '==', currentUser.email), where('acknowledged', '==', false));
        return await getDocs(q);
    };

    const getMyUnacknowledgedAlerts = async () => {
        const q = query(collection(db, 'userAlerts'), where('userId', '==', currentUser.email), where('acknowledged', '==', false));
        return await getDocs(q);
    };

    const fetchAndRenderAnnouncements = async () => {
        const container = document.getElementById('dashboard-announcements-container');
        if (!container) return;

        try {
            const announcementsQuery = query(
                collection(db, 'announcements'),
                where('targetDepartments', 'array-contains-any', [userData.primaryDepartment, '__ALL__']),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(announcementsQuery);

            if (snapshot.empty) {
                container.innerHTML = '';
                return;
            }

            let announcementsHtml = '';
            const unacknowledgedAnnouncements = [];

            for (const docSnap of snapshot.docs) {
                const announcement = { id: docSnap.id, ...docSnap.data() };
                const ackRef = doc(db, 'announcements', announcement.id, 'acknowledgements', currentUser.email);
                const ackDoc = await getDoc(ackRef);
                if (!ackDoc.exists()) {
                    unacknowledgedAnnouncements.push(announcement);
                }
            }

            unacknowledgedAnnouncements.forEach(announcement => {
                const isAcknowledged = false; // By definition, these are unacknowledged
                const bannerStyle = 'bg-blue-100 border-blue-500';
                const buttonHtml = `<button data-id="${announcement.id}" class="acknowledge-announcement-btn px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-md hover:bg-blue-600">Acknowledge</button>`;

                announcementsHtml += `
                    <div id="announcement-${announcement.id}" class="bg-white p-4 rounded-lg shadow border-l-4 ${bannerStyle}">
                        <div class="flex justify-between items-start space-x-4">
                            <div class="flex-grow min-w-0">
                                <p class="font-bold text-gray-800">${announcement.title}</p>
                                ${announcement.imageUrl ? `<img src="${announcement.imageUrl}" alt="Announcement Image" class="mt-3 rounded-lg max-h-60 w-auto border">` : ''}
                                <p class="text-sm mt-3 break-all whitespace-pre-wrap text-gray-700">${announcement.content}</p>
                                <div class="flex items-center space-x-4 mt-3">
    ${announcement.videoUrl ? `
        <a href="${announcement.videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-block bg-white text-blue-600 font-semibold py-1 px-3 border border-blue-300 rounded-md hover:bg-blue-50 text-sm">
            <i class="fas fa-video mr-2"></i>Watch Video
        </a>
    ` : ''}
    ${announcement.attachmentFileUrl ? `
        <a href="${announcement.attachmentFileUrl}" target="_blank" rel="noopener noreferrer" class="inline-block bg-white text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            <i class="fas fa-paperclip mr-2"></i>${announcement.attachmentFileName}
        </a>
    ` : ''}
</div>
<p class="text-xs text-gray-500 mt-3">Posted by ${announcement.creatorName} on ${formatDate(announcement.createdAt)}</p>
                            </div>
                            <div class="flex-shrink-0">${buttonHtml}</div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = announcementsHtml;

        } catch (error) {
            console.error("Error fetching announcements:", error);
            container.innerHTML = '<p class="text-red-500">Could not load announcements.</p>';
        }
    };

    try {
        // --- DIAGNOSTIC CODE HAS BEEN REMOVED FROM THIS SECTION ---
        const managerApprovalsCount = (userData.roles.includes('DepartmentManager') || userData.roles.includes('RespiteManager') || userData.roles.includes('RegionalDirector')) ? await getManagerApprovalsCount() : 0;
        const financeClaims = userData.roles.includes('Finance') ? await getFinanceClaims() : [];
        const myAssignedJobs = await getMyAssignedJobs();
        const purchaserApprovalsCount = userData.roles.includes('Purchaser') ? await getPurchaserApprovals() : 0;
        const exceptionsSnapshot = await getMyUnacknowledgedExceptions();
        const alertsSnapshot = await getMyUnacknowledgedAlerts();
        // --- END OF CLEANUP ---

        let alertsHtml = '';
        if (!exceptionsSnapshot.empty) {
            exceptionsSnapshot.forEach(doc => {
                const exception = { id: doc.id, ...doc.data() };
                alertsHtml += `
                    <div id="banner-${exception.id}" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md flex justify-between items-center">
                        <div>
                            <p class="font-bold">Attendance Alert (${formatDate(exception.date)})</p>
                            <p class="text-sm">${exception.details}</p>
                        </div>
                        <button data-id="${exception.id}" class="acknowledge-btn ml-4 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-md hover:bg-red-600">Acknowledge</button>
                    </div>`;
            });
        }
        
        alertsSnapshot.forEach(doc => {
            const alert = { id: doc.id, ...doc.data() };
            alertsHtml += `<div id="banner-${alert.id}" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md shadow-md flex justify-between items-center"><p class="font-bold">${alert.message}</p><button data-id="${alert.id}" class="acknowledge-alert-btn ml-4 px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-md hover:bg-yellow-600">Acknowledge</button></div>`;
        });

        const currentYear = new Date().getFullYear();
        const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('');

        const canAnnounceRoles = ['Director', 'HR Head', 'DepartmentManager', 'HR', 'Finance', 'Purchaser', 'Admin', 'RegionalDirector', 'IT', 'RespiteManager'];
        const canAnnounce = userData.roles.some(role => canAnnounceRoles.includes(role));

        let dashboardHtml = `
            <div id="dashboard-announcements-container" class="space-y-4 mb-6"></div>
            <div id="dashboard-alerts-container" class="space-y-4 mb-6">${alertsHtml}</div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-3 bg-white p-6 rounded-lg shadow">
                    <h2 class="text-2xl font-bold text-gray-800">Welcome back, ${userData.name}!</h2>
                    <p class="text-gray-600">Here's your summary for today, ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">My Leave Balances</h3>
                        <select id="dashboard-leave-year-selector" class="py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm">${yearOptions}</select>
                    </div>
                    <div id="dashboard-leave-balances-list" class="space-y-2"></div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 gap-4">
                        ${canAnnounce ? '<button id="open-announcement-modal-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700">Make Announcement</button>' : ''}
                        <button onclick="navigateTo('leave-ot')" class="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700">New Leave/OT Request</button>
                        <button onclick="navigateTo('claims')" class="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700">New Expense Claim</button>
                        <button onclick="navigateTo('attendance')" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700">Record Attendance</button>
                    </div>
                </div>`;
        
        if (userData.roles.includes('DepartmentManager') || userData.roles.includes('RespiteManager') || userData.roles.includes('RegionalDirector')) {
            dashboardHtml += `<div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('approvals')"><h3 class="text-lg font-semibold text-gray-800">Pending Approvals</h3><p class="text-5xl font-bold text-blue-600 mt-4">${managerApprovalsCount}</p><p class="text-gray-500">items need your attention.</p></div>`;
        }
        if (userData.roles.includes('Finance')) {
            const totalAmount = financeClaims.reduce((sum, claim) => sum + claim.amount, 0);
            dashboardHtml += `
                <div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('approvals')">
                    <h3 class="text-lg font-semibold text-gray-800">Claims Awaiting Payout</h3>
                    <p class="text-5xl font-bold text-red-600 mt-4">${financeClaims.length}</p>
                    <p class="text-gray-600 font-semibold">Totaling RM${totalAmount.toFixed(2)}</p>
                </div>`;
        }
        if (userData.roles.includes('Purchaser')) {
            dashboardHtml += `<div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('approvals')"><h3 class="text-lg font-semibold text-gray-800">Purchase Requests to Process</h3><p class="text-5xl font-bold text-cyan-600 mt-4">${purchaserApprovalsCount}</p><p class="text-gray-500">items are waiting for processing.</p></div>`;
        }
        if (myAssignedJobs.length > 0) {
            dashboardHtml += `<div class="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50" onclick="navigateTo('my-job')"><h3 class="text-lg font-semibold text-gray-800">My Assigned Jobs</h3><p class="text-5xl font-bold text-teal-600 mt-4">${myAssignedJobs.length}</p><p class="text-gray-500">open support tickets require your action.</p></div>`;
        }
        dashboardHtml += '</div>';

        contentArea.innerHTML = dashboardHtml;
        
        await fetchAndRenderAnnouncements();

        const yearSelector = document.getElementById('dashboard-leave-year-selector');
        yearSelector.addEventListener('change', (e) => updateDashboardLeaveBalances(e.target.value));
        updateDashboardLeaveBalances(currentYear);

        document.querySelectorAll('.acknowledge-btn').forEach(btn => {
            btn.addEventListener('click', handleAcknowledgeException);
        });

        document.querySelectorAll('.acknowledge-announcement-btn').forEach(btn => {
            btn.addEventListener('click', handleAcknowledgeAnnouncement);
        });
        document.querySelectorAll('.acknowledge-alert-btn').forEach(btn => {
            btn.addEventListener('click', handleAcknowledgeAlert);
        });
        if (canAnnounce) {
            document.getElementById('open-announcement-modal-btn').addEventListener('click', openAnnouncementModal);
        }

    } catch (error) {
        console.error("Error building dashboard:", error);
        contentArea.innerHTML = `<div class="p-6 bg-red-100 text-red-700 rounded-lg">Failed to load dashboard. ${error.message}</div>`;
    }
};

// in app.js
const renderAnnouncementsPage = async () => {
    pageTitle.textContent = 'All Announcements';
    contentArea.innerHTML = `<div class="p-6">Loading all announcements...</div>`;

    try {
        // 1. Get all announcements relevant to the user, with no limit
        const announcementsQuery = query(
            collection(db, 'announcements'),
            where('targetDepartments', 'array-contains-any', [userData.primaryDepartment, '__ALL__']),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(announcementsQuery);

        if (snapshot.empty) {
            contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No announcements found for you.</div>`;
            return;
        }

        // 2. Prepare HTML and find which ones are already acknowledged
        let announcementsHtml = '<div class="space-y-4">';
        const acknowledgementChecks = [];
        const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Create a list of promises to check the acknowledgement status for each announcement
        for (const announcement of announcements) {
            const ackRef = doc(db, 'announcements', announcement.id, 'acknowledgements', currentUser.email);
            acknowledgementChecks.push(getDoc(ackRef));
        }
        
        const acknowledgementSnapshots = await Promise.all(acknowledgementChecks);
        const acknowledgedIds = new Set();
        acknowledgementSnapshots.forEach(ackDoc => {
            if (ackDoc.exists()) {
                // The document ID is the announcementId
                acknowledgedIds.add(ackDoc.ref.parent.parent.id);
            }
        });

        // 3. Build the final HTML for each announcement
        announcements.forEach(announcement => {
            const isAcknowledged = acknowledgedIds.has(announcement.id);
            const bannerStyle = isAcknowledged 
                ? 'bg-gray-100 border-gray-300' 
                : 'bg-blue-100 border-blue-500';
            
            const buttonHtml = isAcknowledged
                ? `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check mr-2"></i>Acknowledged</span>`
                : `<button data-id="${announcement.id}" class="acknowledge-announcement-btn px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-md hover:bg-blue-600">Acknowledge</button>`;

            announcementsHtml += `
                <div id="announcement-${announcement.id}" class="bg-white p-4 rounded-lg shadow border-l-4 ${bannerStyle}">
                    <div class="flex justify-between items-start space-x-4">
                        <div class="flex-grow min-w-0">
                            <p class="font-bold text-gray-800">${announcement.title}</p>
                            ${announcement.imageUrl ? `<img src="${announcement.imageUrl}" alt="Announcement Image" class="mt-3 rounded-lg max-h-60 w-auto border">` : ''}
                            <p class="text-sm mt-3 break-all whitespace-pre-wrap text-gray-700">${announcement.content}</p>
                            <div class="flex items-center space-x-4 mt-3">
    ${announcement.videoUrl ? `
        <a href="${announcement.videoUrl}" target="_blank" rel="noopener noreferrer" class="inline-block bg-white text-blue-600 font-semibold py-1 px-3 border border-blue-300 rounded-md hover:bg-blue-50 text-sm">
            <i class="fas fa-video mr-2"></i>Watch Video
        </a>
    ` : ''}
    ${announcement.attachmentFileUrl ? `
        <a href="${announcement.attachmentFileUrl}" target="_blank" rel="noopener noreferrer" class="inline-block bg-white text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            <i class="fas fa-paperclip mr-2"></i>${announcement.attachmentFileName}
        </a>
    ` : ''}
</div>
<p class="text-xs text-gray-500 mt-3">Posted by ${announcement.creatorName} on ${formatDate(announcement.createdAt)}</p>
                        </div>
                        <div class="flex-shrink-0">${buttonHtml}</div>
                    </div>
                </div>
            `;
        });
        announcementsHtml += '</div>';
        contentArea.innerHTML = announcementsHtml;

        // 4. Attach event listeners to any unacknowledged announcements
        document.querySelectorAll('.acknowledge-announcement-btn').forEach(btn => {
            btn.addEventListener('click', handleAcknowledgeAnnouncement);
        });

    } catch (error) {
        console.error("Error fetching announcements page:", error);
        contentArea.innerHTML = '<p class="text-red-500">Could not load announcements.</p>';
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

// --- ADD THIS ENTIRE NEW FUNCTION ---

const renderBillPayments = async () => {
    pageTitle.textContent = 'Bill Payments';
    contentArea.innerHTML = `
        <div class="flex justify-end mb-4">
            <button id="open-bill-payment-modal-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded">
                <i class="fas fa-plus mr-2"></i>New Payment Request
            </button>
        </div>
        <div id="bill-payments-container" class="space-y-4">Loading payment requests...</div>
    `;
    try {
        // We query for requests created by the user OR requests for their department (if they are a manager)
        const userQuery = query(collection(db, 'paymentRequests'), where('userId', '==', currentUser.email), orderBy('createdAt', 'desc'));
        const deptQuery = query(collection(db, 'paymentRequests'), where('department', 'in', userData.managedDepartments || ['_']), orderBy('createdAt', 'desc'));

        const [userSnap, deptSnap] = await Promise.all([getDocs(userQuery), getDocs(deptQuery)]);
        
        const requestsMap = new Map();
        userSnap.docs.forEach(doc => requestsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        deptSnap.docs.forEach(doc => requestsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        const requests = Array.from(requestsMap.values()).sort((a, b) => b.createdAt - a.createdAt);

        const container = document.getElementById('bill-payments-container');
        if (requests.length === 0) {
            container.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No bill payment requests found.</div>`;
        } else {
            container.innerHTML = requests.map(req => {
                const statusColor = {
                  'Pending Approval': 'bg-yellow-100 text-yellow-800',
                  'Pending Finance': 'bg-blue-100 text-blue-800',
                  'Paid': 'bg-green-100 text-green-800',
                  'Rejected': 'bg-red-100 text-red-800'
                }[req.status] || 'bg-gray-100 text-gray-800';

                return `
                    <div class="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div>
                            <p class="font-bold text-gray-800">${req.vendorName}</p>
                            <p class="text-sm text-gray-600">Dept: ${req.department} | Amount: RM${req.amount.toFixed(2)}</p>
                            <p class="text-xs text-gray-500">Billing Date: ${formatDate(req.billingDate)} | Submitted by: ${req.userName}</p>
                       </div>
                        <div class="flex items-center space-x-4">
                            <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span>
                            <button class="view-details-button text-indigo-600 hover:text-indigo-900" data-id="${req.id}" data-type="paymentRequests">View Details</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('open-bill-payment-modal-button').addEventListener('click', openBillPaymentModal);
        document.querySelectorAll('.view-details-button').forEach(btn => btn.addEventListener('click', (e) => openRequestDetailsModal(e.target.dataset.id, e.target.dataset.type)));

    } catch (error) {
        console.error("Error fetching bill payments:", error);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading bill payments.</div>`;
    }
};

// --- END OF NEW FUNCTION ---

const renderAttendance = async () => {
    pageTitle.textContent = 'Attendance';
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow">Loading attendance...</div>`;
    const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
const day = String(today.getDate()).padStart(2, '0');
const todayStr = `${year}-${month}-${day}`;
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
        // --- NEW: Role-based data fetching ---
        const isDirector = userData.roles.includes('Director');
        const isHrOrHrHead = userData.roles.includes('HR') || userData.roles.includes('HR Head');
        
        const departmentsToView = isDirector 
            ? appConfig.availableDepartments 
            : (userData.managedDepartments || []);

        if (departmentsToView.length === 0 && !isDirector) {
            contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center">You are not assigned to manage any departments.</div>`;
            return;
        }
        
        const usersQuery = query(
            collection(db, 'users'), 
            where('primaryDepartment', 'in', departmentsToView),
            orderBy('name')
        );
        const userSnapshot = await getDocs(usersQuery);
        const visibleUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // --- NEW: UI for filters and actions ---
        const departmentOptions = departmentsToView.map(dept => `<option value="${dept}">${dept}</option>`).join('');

        const createUserButtonHTML = (isDirector || isHrOrHrHead || userData.roles.includes('RegionalDirector')) 
            ? `<button id="open-create-user-modal-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap"><i class="fas fa-plus mr-2"></i>Create User</button>`
            : '';

        let pageHTML = `
            <div class="bg-white p-6 rounded-lg shadow">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div class="md:col-span-2">
                        <label for="user-search-input" class="block text-sm font-medium text-gray-700">Search by Name/Email</label>
                        <input type="text" id="user-search-input" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md" placeholder="Start typing to search...">
                    </div>
                    <div>
                        <label for="user-dept-filter" class="block text-sm font-medium text-gray-700">Filter by Department</label>
                        <select id="user-dept-filter" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                            <option value="">All My Departments</option>
                            ${departmentOptions}
                        </select>
                    </div>
                    <div class="flex items-end space-x-2">
                        <button id="export-users-csv-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap"><i class="fas fa-file-csv mr-2"></i>Export CSV</button>
                        ${createUserButtonHTML}
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody id="user-table-body" class="bg-white divide-y divide-gray-200">
                            </tbody>
                    </table>
                </div>
            </div>
        `;
        contentArea.innerHTML = pageHTML;

        const userTableBody = document.getElementById('user-table-body');
        let currentlyDisplayedUsers = [];

        const renderTableRows = (usersToRender) => {
            currentlyDisplayedUsers = usersToRender; // Keep track for CSV export
            if (usersToRender.length === 0) {
                userTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">No users found.</td></tr>`;
                return;
            }
            userTableBody.innerHTML = usersToRender.map(user => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10"><img class="h-10 w-10 rounded-full" src="${user.photoURL || 'https://placehold.co/40x40/E2E8F0/333333?text=?'}" alt=""></div>
                            <div class="ml-4"><div class="text-sm font-medium text-gray-900">${user.name}</div><div class="text-sm text-gray-500">${user.email}</div></div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.primaryDepartment}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.roles.join(', ')}</td>
                    <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${user.status}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button class="text-indigo-600 hover:text-indigo-900 edit-user-button" data-user-id="${user.id}">Edit</button></td>
                </tr>
            `).join('');
            document.querySelectorAll('.edit-user-button').forEach(button => button.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.userId)));
        };

        const applyFilters = () => {
            const searchTerm = document.getElementById('user-search-input').value.toLowerCase();
            const selectedDept = document.getElementById('user-dept-filter').value;
            
            let filteredUsers = visibleUsers;

            if (searchTerm) {
                filteredUsers = filteredUsers.filter(user => 
                    user.name.toLowerCase().includes(searchTerm) || 
                    user.email.toLowerCase().includes(searchTerm)
                );
            }

            if (selectedDept) {
                filteredUsers = filteredUsers.filter(user => user.primaryDepartment === selectedDept);
            }
            
            renderTableRows(filteredUsers);
        };

        // Initial render
        renderTableRows(visibleUsers);

        // Add event listeners for new controls
        if (document.getElementById('open-create-user-modal-button')) {
             document.getElementById('open-create-user-modal-button').addEventListener('click', openCreateModal);
        }
        document.getElementById('user-search-input').addEventListener('input', applyFilters);
        document.getElementById('user-dept-filter').addEventListener('change', applyFilters);
        document.getElementById('export-users-csv-btn').addEventListener('click', () => {
             const dataToExport = currentlyDisplayedUsers.map(({ photoURL, ...rest }) => rest); // Exclude photoURL
             exportToCSV(dataToExport, 'user_management_export');
        });
        
        allUsers = visibleUsers; // Update global allUsers to be the scoped list for the edit modal

    } catch (e) {
        console.error("Error fetching users:", e);
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading users.</div>`;
    }
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
                            <p class="font-bold text-gray-800">${claim.claimType} - RM${claim.amount.toFixed(2)}</p>
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
                            <p class="text-sm text-gray-600">Est. Cost: RM${req.estimatedCost.toFixed(2)}</p>
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

// --- REPLACE THE ENTIRE renderApprovals FUNCTION WITH THIS ---
// --- REPLACE THE ENTIRE renderApprovals FUNCTION WITH THIS ---
const renderApprovals = async () => {
    pageTitle.textContent = 'Approvals';
    contentArea.innerHTML = `<div id="approvals-container" class="space-y-8">Loading approvals...</div>`;

    try {
        const sections = {
            requests: { title: 'Leave / OT Requests', items: [] },
            claims: { title: 'Expense Claims', items: [] },
            purchaseRequests: { title: 'Purchase Requests', items: [] },
            paymentRequests: { title: 'Bill Payments', items: [] },
        };

        const roles = userData.roles || [];
        const managedDepts = userData.managedDepartments || [];
        
        // --- 1. DEFINE CAPABILITIES ---
        const isDirector = roles.includes('Director');
        const isGeneralManager = roles.includes('DepartmentManager') || roles.includes('RegionalDirector') || roles.includes('HR Head') || isDirector;
        const isFinance = roles.includes('Finance') || isDirector;
        const isPurchaser = roles.includes('Purchaser') || isDirector;

        // --- 2. DEFINE SCOPE ---
        const targetDepts = isDirector ? null : managedDepts;

        if (!isDirector && targetDepts.length === 0) {
             document.getElementById('approvals-container').innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">You have no managed departments assigned to view approvals.</div>`;
             return;
        }

        // --- HELPER: Fetch Docs with Dynamic Chunking (THE FIX) ---
        const fetchScopedDocs = async (collectionName, statusCondition) => {
            let q = collection(db, collectionName);
            const isStatusArray = Array.isArray(statusCondition);

            // 1. Apply Status Filter
            if (isStatusArray) {
                q = query(q, where('status', 'in', statusCondition));
            } else {
                q = query(q, where('status', '==', statusCondition));
            }

            // 2. Apply Department Filter
            if (isDirector) {
                return await getDocs(q);
            } else {
                // CALCULATE SAFE CHUNK SIZE
                // Formula: 30 (Max Limit) / Number of Statuses
                // Example: If checking 2 statuses ('Approved', 'Processing'), chunk size must be 15.
                const statusCount = isStatusArray ? statusCondition.length : 1;
                const safeChunkSize = Math.floor(30 / statusCount);

                const snapshots = [];
                for (let i = 0; i < targetDepts.length; i += safeChunkSize) {
                    const chunk = targetDepts.slice(i, i + safeChunkSize);
                    // Only run query if chunk has items
                    if (chunk.length > 0) {
                        const chunkQuery = query(q, where('department', 'in', chunk));
                        snapshots.push(await getDocs(chunkQuery));
                    }
                }
                return snapshots;
            }
        };

        // Helper to process results
        const processResults = (results, sectionKey) => {
            const docs = Array.isArray(results) ? results.flatMap(snap => snap.docs) : results.docs;
            docs.forEach(doc => {
                if (!sections[sectionKey].items.some(item => item.id === doc.id)) {
                    sections[sectionKey].items.push({ id: doc.id, ...doc.data() });
                }
            });
        };

        const promises = [];

        // --- 3. EXECUTE QUERIES ---

        // A. LEAVE REQUESTS (1 Status: 'Pending' -> Chunk Size 30)
        if (isGeneralManager) {
            promises.push(fetchScopedDocs('requests', 'Pending')
                .then(res => processResults(res, 'requests')));
        }

        // B. CLAIMS
        if (isGeneralManager) {
            promises.push(fetchScopedDocs('claims', 'Pending')
                .then(res => processResults(res, 'claims')));
        }
        if (isFinance) {
            promises.push(fetchScopedDocs('claims', 'Approved')
                .then(res => processResults(res, 'claims')));
        }

        // C. PURCHASE REQUESTS
        if (isGeneralManager) {
            promises.push(fetchScopedDocs('purchaseRequests', 'Pending')
                .then(res => processResults(res, 'purchaseRequests')));
        }
        // Level 2: Purchasers (2 Statuses: 'Approved', 'Processing' -> Chunk Size 15)
        if (isPurchaser) {
            promises.push(fetchScopedDocs('purchaseRequests', ['Approved', 'Processing'])
                .then(res => processResults(res, 'purchaseRequests')));
        }

        // D. BILL PAYMENTS
        if (isGeneralManager) {
            promises.push(fetchScopedDocs('paymentRequests', 'Pending Approval')
                .then(res => processResults(res, 'paymentRequests')));
        }
        if (isFinance) {
            promises.push(fetchScopedDocs('paymentRequests', 'Pending Finance')
                .then(res => processResults(res, 'paymentRequests')));
        }

        await Promise.all(promises);

// --- 4. RENDER HTML ---
        let finalHtml = '';
        for (const key in sections) {
            const section = sections[key];
            if (section.items.length > 0) {
                finalHtml += `<div class="bg-white p-6 rounded-lg shadow"><h3 class="text-xl font-semibold mb-4">${section.title}</h3><div class="space-y-4">`;
                
                // --- START: CUSTOM SORTING LOGIC ---
                if (key === 'purchaseRequests') {
                    // SPECIAL LOGIC FOR PURCHASERS
                    // Layer 1: Status (Approved on top, Processing below)
                    // Layer 2: Date (Oldest on top / Ascending)
                    section.items.sort((a, b) => {
                        // 1. Define Weight: Approved = 1, Processing = 2, Others = 3
                        const getWeight = (status) => {
                            if (status === 'Approved') return 1;
                            if (status === 'Processing') return 2;
                            return 3;
                        };

                        const weightA = getWeight(a.status);
                        const weightB = getWeight(b.status);

                        if (weightA !== weightB) {
                            return weightA - weightB; // Lower weight (Approved) comes first
                        }

                        // 2. If Status is the same, sort by Date ASCENDING (Oldest first)
                        return a.createdAt - b.createdAt;
                    });

                } else {
                    // STANDARD LOGIC FOR EVERYONE ELSE (HR, Finance, Managers)
                    // Sort by Date DESCENDING (Newest first) so they see fresh requests immediately
                    section.items.sort((a, b) => b.createdAt - a.createdAt);
                }
                // --- END: CUSTOM SORTING LOGIC ---

                section.items.forEach(item => {
                    let summary = '';
                    if (key === 'requests') summary = `${item.type} for ${item.hours} hours`;
                    if (key === 'claims') summary = `${item.claimType} for RM${item.amount.toFixed(2)}`;
                    if (key === 'purchaseRequests') summary = `${item.itemDescription}`;
                    if (key === 'paymentRequests') summary = `${item.vendorName} for RM${item.amount.toFixed(2)}`;
                    
                    // Optional: Add the date display like we discussed, or keep it simple. 
                    // Let's add the Submitted Date text for clarity since we are sorting by it.
                    const submittedDate = item.createdAt ? formatDate(item.createdAt) : 'N/A';

                    finalHtml += `
                        <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div>
                                <p class="font-bold text-gray-800">${item.userName}</p>
                                <p class="text-sm text-gray-900 font-medium">${summary}</p>
                                <div class="text-xs text-gray-500 mt-1">
                                    <span>${item.department}</span> • 
                                    <span class="${item.status === 'Approved' ? 'text-green-600 font-bold' : 'text-purple-600 font-bold'}">${item.status}</span>
                                    <span class="ml-2 text-gray-400">(${submittedDate})</span>
                                </div>
                            </div>
                            <button class="view-details-button bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 shadow-sm whitespace-nowrap ml-4" data-id="${item.id}" data-type="${key}">View</button>
                        </div>
                    `;
                });
                finalHtml += `</div></div>`;
            }
        }
        if (finalHtml === '') {
            finalHtml = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">No pending approvals found for your roles.</div>`;
        }

        document.getElementById('approvals-container').innerHTML = finalHtml;
        document.querySelectorAll('.view-details-button').forEach(btn => btn.addEventListener('click', (e) => openRequestDetailsModal(e.target.dataset.id, e.target.dataset.type, true)));

    } catch (error) {
        console.error("Error fetching approvals:", error);
        document.getElementById('approvals-container').innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error loading approvals: ${error.message}</div>`;
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

// Find and replace this entire function in app.js
// in app.js
const renderSettings = async () => {
    pageTitle.textContent = 'Settings';

    // --- START: MODIFIED PERMISSION CHECK ---
    // The list of roles now matches the navItems array for consistency.
    const canViewSettings = userData.roles.includes('Director') || userData.roles.includes('RegionalDirector') || userData.roles.includes('HR Head');
    if (!userData || !canViewSettings) {
        contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">You do not have permission to view this page.</div>`;
        return;
    }
    // --- END: MODIFIED PERMISSION CHECK ---

    if (!appConfig) {
        await fetchAppConfig();
    }

    const isDirector = userData.roles.includes('Director');

    const calendarCardHTML = `
        <div class="md:col-span-3 bg-white p-6 rounded-lg shadow">
            <h3 class="text-xl font-semibold mb-4 border-b pb-2">Manage Company Calendar</h3>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div class="md:col-span-3">
                    <h4 class="font-medium text-gray-800 mb-2">Add a Non-Working Day</h4>
                    <div class="p-4 bg-gray-50 rounded-lg space-y-4">
                        <div><label for="cal-date" class="block text-sm font-medium text-gray-700">Date</label><input type="date" id="cal-date" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm"></div>
                        <div><label for="cal-desc" class="block text-sm font-medium text-gray-700">Description</label><input type="text" id="cal-desc" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Company Anniversary"></div>
                        <div><label for="cal-depts" class="block text-sm font-medium text-gray-700">Applies To</label><select id="cal-depts" multiple class="mt-1 block w-full h-32 py-2 px-3 border border-gray-300 rounded-md shadow-sm"></select></div>
                        <div class="text-right"><button id="add-holiday-btn" class="bg-teal-600 text-white font-bold py-2 px-4 rounded hover:bg-teal-700">Add Non-Working Day</button></div>
                    </div>
                </div>
                <div class="md:col-span-2">
                    <h4 class="font-medium text-gray-800 mb-2">Upcoming Non-Working Days</h4>
                    <div id="calendar-list" class="space-y-2 max-h-96 overflow-y-auto border p-2 rounded-lg"><p class="text-gray-500 text-center p-4">Loading...</p></div>
                </div>
            </div>
        </div>
    `;

    let globalSettingsHTML = '';
    if (isDirector) {
        globalSettingsHTML = `
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4 border-b pb-2">Manage Departments</h3>
                <div id="departments-list" class="space-y-2 mb-4 max-h-96 overflow-y-auto"></div>
                <div class="flex space-x-2 border-t pt-4"><input type="text" id="new-department-name" class="flex-grow py-2 px-3 border border-gray-300 rounded-md" placeholder="New Department Name"><button id="add-dept-btn" class="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Add</button></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4 border-b pb-2">Manage Request Types</h3>
                <div id="request-types-list" class="space-y-2 mb-4 max-h-96 overflow-y-auto"></div>
                <div class="border-t pt-4 space-y-3"><input type="text" id="new-req-type-name" class="w-full py-2 px-3 border border-gray-300 rounded-md" placeholder="New Request Type Name"><div class="space-y-2 pl-2"><label class="flex items-center space-x-2"><input type="checkbox" id="new-req-type-quota" class="form-checkbox h-5 w-5 text-indigo-600"><span class="text-gray-700">Has Quota (deducts from balance)</span></label><label class="flex items-center space-x-2"><input type="checkbox" id="new-req-type-paid" class="form-checkbox h-5 w-5 text-indigo-600"><span class="text-gray-700">Is Paid Leave (for Payroll)</span></label></div><button id="add-req-type-btn" class="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Add</button></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4 border-b pb-2">Manage Claim Types</h3>
                <div id="claim-types-list" class="space-y-2 mb-4 max-h-96 overflow-y-auto"></div>
                <div class="border-t pt-4 space-y-3"><input type="text" id="new-claim-type-name" class="w-full py-2 px-3 border border-gray-300 rounded-md" placeholder="New Claim Type Name"><label for="new-claim-type-category" class="block text-sm font-medium text-gray-700">Category</label><select id="new-claim-type-category" class="w-full py-2 px-3 border border-gray-300 rounded-md"><option value="Reimbursement">Reimbursement</option><option value="Allowance">Allowance</option></select><button id="add-claim-type-btn" class="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600">Add</button></div>
            </div>
        `;
    }

    contentArea.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${calendarCardHTML}
            ${globalSettingsHTML}
        </div>
        ${isDirector ? `
            <div class="mt-6 flex justify-end">
                <button id="save-settings-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg">
                    <i class="fas fa-save mr-2"></i>Save All Changes
                </button>
            </div>
        ` : ''}
    `;

    const calDeptsSelect = document.getElementById('cal-depts');
    const calListContainer = document.getElementById('calendar-list');
    const departmentsForCalendar = isDirector ? appConfig.availableDepartments : (userData.managedDepartments || []);
    calDeptsSelect.innerHTML = (isDirector ? '<option value="__ALL__">All Departments (Global)</option>' : '') + departmentsForCalendar.map(dept => `<option value="${dept}">${dept}</option>`).join('');

    const renderCalendarList = async () => {
        calListContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Loading...</p>';
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const q = query(collection(db, 'companyCalendar'), where(documentId(), '>=', todayStr), orderBy(documentId()));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                calListContainer.innerHTML = '<p class="text-gray-500 text-center p-4">No upcoming non-working days.</p>';
                return;
            }
            let listHTML = snapshot.docs.map(doc => {
                const holiday = doc.data();
                const appliesToStr = holiday.appliesTo.includes('__ALL__') ? 'All Departments' : holiday.appliesTo.join(', ');
                return `<div class="p-2 bg-gray-50 rounded group flex justify-between items-center"><div><p class="font-medium text-gray-900">${formatDate(doc.id)} - ${holiday.description}</p><p class="text-xs text-gray-600">Applies to: ${appliesToStr}</p></div><button class="delete-holiday-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${doc.id}"><i class="fas fa-trash-alt"></i></button></div>`;
            }).join('');
            calListContainer.innerHTML = listHTML;
            document.querySelectorAll('.delete-holiday-btn').forEach(btn => btn.addEventListener('click', handleDeleteHoliday));
        } catch (error) {
            console.error("Error fetching calendar events:", error);
            calListContainer.innerHTML = '<p class="text-red-500 text-center p-4">Could not load list.</p>';
        }
    };

    const handleDeleteHoliday = async (e) => {
        const holidayId = e.currentTarget.dataset.id;
        if (!confirm(`Are you sure you want to delete the non-working day for ${holidayId}?`)) return;
        try {
            await deleteDoc(doc(db, 'companyCalendar', holidayId));
            await renderCalendarList();
        } catch (error) {
            console.error("Error deleting holiday:", error);
            alert(`Failed to delete holiday: ${error.message}`);
        }
    };

    document.getElementById('add-holiday-btn').addEventListener('click', async (e) => {
        const button = e.currentTarget;
        const date = document.getElementById('cal-date').value;
        const description = document.getElementById('cal-desc').value.trim();
        const selectedDepts = Array.from(document.getElementById('cal-depts').selectedOptions).map(opt => opt.value);
        if (!date || !description || selectedDepts.length === 0) {
            alert("Please fill in all fields: Date, Description, and Applies To.");
            return;
        }
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            const holidayRef = doc(db, 'companyCalendar', date);
            await setDoc(holidayRef, { description, appliesTo: selectedDepts, createdBy: currentUser.email, createdAt: serverTimestamp() });
            document.getElementById('cal-date').value = '';
            document.getElementById('cal-desc').value = '';
            await renderCalendarList();
        } catch (error) {
            console.error("Error adding holiday:", error);
            alert(`Failed to add non-working day: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Add Non-Working Day';
        }
    });

    if (isDirector) {
        let currentDepartments = JSON.parse(JSON.stringify(appConfig.availableDepartments || []));
        let currentRequestTypes = JSON.parse(JSON.stringify(appConfig.requestTypes || []));
        let currentClaimTypes = JSON.parse(JSON.stringify(appConfig.claimTypes || []));
        const updateDeptList = () => {
            const listEl = document.getElementById('departments-list');
            listEl.innerHTML = currentDepartments.map(dept => `<div class="flex justify-between items-center p-2 bg-gray-50 rounded group"><span class="text-gray-800">${dept}</span><button class="delete-dept-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-dept="${dept}"><i class="fas fa-trash-alt"></i></button></div>`).join('') || '<p class="text-gray-500 text-center p-4">No departments configured.</p>';
            document.querySelectorAll('.delete-dept-btn').forEach(btn => btn.addEventListener('click', handleDeleteDept));
        };
        const handleDeleteDept = (e) => {
            const deptToDelete = e.currentTarget.dataset.dept;
            if (confirm(`Are you sure you want to delete the department "${deptToDelete}"?`)) {
                currentDepartments = currentDepartments.filter(d => d !== deptToDelete);
                updateDeptList();
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
            } else if (newDept) { alert('This department already exists.'); }
        });
        const updateReqTypeList = () => {
            const listEl = document.getElementById('request-types-list');
            listEl.innerHTML = currentRequestTypes.map((type, index) => {
                let tagsHtml = '';
                if (type.hasQuota) {
                    tagsHtml += `<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Has Quota</span>`;
                }
                if (type.isPaidLeave) {
                    tagsHtml += `<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Is Paid</span>`;
                }
                return `
                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded group">
                        <div>
                            <span class="font-medium">${type.name}</span>
                            <div class="flex space-x-2 mt-1">${tagsHtml}</div>
                        </div>
                        <button class="delete-req-type-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            }).join('') || '<p class="text-gray-500 text-center p-4">No request types configured.</p>';
            document.querySelectorAll('.delete-req-type-btn').forEach(btn => btn.addEventListener('click', handleDeleteReqType));
        };
        const handleDeleteReqType = (e) => {
            const indexToDelete = parseInt(e.currentTarget.dataset.index, 10);
            const typeName = currentRequestTypes[indexToDelete].name;
            if (confirm(`Are you sure you want to delete the request type "${typeName}"?`)) {
                currentRequestTypes.splice(indexToDelete, 1);
                updateReqTypeList();
            }
        };
        document.getElementById('add-req-type-btn').addEventListener('click', () => {
            const nameInput = document.getElementById('new-req-type-name');
            const quotaInput = document.getElementById('new-req-type-quota');
            const paidInput = document.getElementById('new-req-type-paid');
            const newName = nameInput.value.trim();
            if (newName && !currentRequestTypes.some(rt => rt.name.toLowerCase() === newName.toLowerCase())) {
                currentRequestTypes.push({ name: newName, hasQuota: quotaInput.checked, isPaidLeave: paidInput.checked });
                currentRequestTypes.sort((a, b) => a.name.localeCompare(b.name));
                nameInput.value = '';
                quotaInput.checked = paidInput.checked = false;
                updateReqTypeList();
            } else if (newName) { alert('This request type already exists.'); }
        });
        const updateClaimTypeList = () => {
            const listEl = document.getElementById('claim-types-list');
            listEl.innerHTML = currentClaimTypes.map((type, index) => `<div class="flex justify-between items-center p-2 bg-gray-50 rounded group"><div><span class="font-medium">${type.name}</span><span class="text-xs font-semibold px-2 py-1 rounded-full ml-2 ${type.category === 'Allowance' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${type.category}</span></div><button class="delete-claim-type-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}"><i class="fas fa-trash-alt"></i></button></div>`).join('') || '<p class="text-gray-500 text-center p-4">No claim types configured.</p>';
            document.querySelectorAll('.delete-claim-type-btn').forEach(btn => btn.addEventListener('click', handleDeleteClaimType));
        };
        const handleDeleteClaimType = (e) => {
            const indexToDelete = parseInt(e.currentTarget.dataset.index, 10);
            const typeName = currentClaimTypes[indexToDelete].name;
            if (confirm(`Are you sure you want to delete the claim type "${typeName}"?`)) {
                currentClaimTypes.splice(indexToDelete, 1);
                updateClaimTypeList();
            }
        };
        document.getElementById('add-claim-type-btn').addEventListener('click', () => {
            const nameInput = document.getElementById('new-claim-type-name');
            const categoryInput = document.getElementById('new-claim-type-category');
            const newName = nameInput.value.trim();
            if (newName && !currentClaimTypes.some(ct => ct.name.toLowerCase() === newName.toLowerCase())) {
                currentClaimTypes.push({ name: newName, category: categoryInput.value });
                currentClaimTypes.sort((a, b) => a.name.localeCompare(b.name));
                nameInput.value = '';
                updateClaimTypeList();
            } else if (newName) { alert('This claim type already exists.'); }
        });
        document.getElementById('save-settings-btn').addEventListener('click', async (e) => {
            const button = e.currentTarget;
            if (!confirm("Are you sure you want to save these changes to the application configuration? This may affect all users.")) return;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
            try {
                const configRef = doc(db, 'configuration', 'main');
                await updateDoc(configRef, { availableDepartments: currentDepartments, requestTypes: currentRequestTypes, claimTypes: currentClaimTypes });
                alert('Settings updated successfully!');
                appConfig = await fetchAppConfig();
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
        updateClaimTypeList();
    }
    renderCalendarList();
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
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    const dataRows = data.map(row => {
        return headers.map(header => {
            const cell = row[header] === null || row[header] === undefined ? '' : row[header];
            let cellString = String(cell);
            if (cellString.includes('"') || cellString.includes(',') || cellString.includes('\n')) {
                cellString = '"' + cellString.replace(/"/g, '""') + '"';
            }
            return cellString;
        }).join(',');
    });
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

// in app.js
const renderReportFilters = (container, options) => {
    const { showDateRange, showStatus, showDepartment, onApply, onExport } = options;

    // --- START: NEW DYNAMIC FILTER LOGIC ---
    const isDirector = userData.roles.includes('Director');
    const isMultiDeptManager = userData.managedDepartments && userData.managedDepartments.length > 1;

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
    
    // Show department filter for Directors OR managers of multiple departments
    if (showDepartment && (isDirector || isMultiDeptManager)) {
        const deptsForFilter = isDirector ? appConfig.availableDepartments : userData.managedDepartments;
        const defaultOptionText = isDirector ? "All Departments" : "All My Departments";
        let deptOptions = deptsForFilter.map(d => `<option value="${d}">${d}</option>`).join('');

        filtersHTML += `
            <div>
                <label for="report-department" class="block text-sm font-medium text-gray-700">Department</label>
                <select id="report-department" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                    <option value="">${defaultOptionText}</option>
                    ${deptOptions}
                </select>
            </div>
        `;
    } else {
        // Leave a placeholder div to keep the grid alignment consistent
        filtersHTML += '<div></div>';
    }

    filtersHTML += `
        <div class="flex items-end space-x-2">
            <button id="apply-filters-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Apply Filters</button>
            <button id="export-csv-btn" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">
                <i class="fas fa-file-csv mr-2"></i>Export
            </button>
        </div>
    `;
    filtersHTML += '</div>';

    container.innerHTML = filtersHTML;
    document.getElementById('apply-filters-btn').addEventListener('click', onApply);
    document.getElementById('export-csv-btn').addEventListener('click', onExport);
    // --- END: NEW DYNAMIC FILTER LOGIC ---
};

// Add this entire new function to app.js
const renderLiveStatusReport = () => {
    const contentContainer = document.getElementById('report-content-container');
    const statusColors = {
        'Present': 'bg-green-100 text-green-800',
        'Late': 'bg-yellow-100 text-yellow-800',
        'On Leave': 'bg-blue-100 text-blue-800',
        'Absent': 'bg-red-100 text-red-800',
        'Not Scheduled': 'bg-gray-100 text-gray-800',
        'Pending Check-in': 'bg-purple-100 text-purple-800'
    };

    const fetchLiveStatus = async () => {
        const dataContainer = document.getElementById('report-data-container');
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching live team status...</p>`;

        try {
            const getLiveTeamStatus = httpsCallable(functions, 'getLiveTeamStatus');
            const result = await getLiveTeamStatus();
            const statusList = result.data;

            let tableHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (statusList.length === 0) {
                tableHTML += `<tr><td colspan="4" class="p-4 text-center text-gray-500">No team members found in your managed departments.</td></tr>`;
            } else {
                statusList.forEach(item => {
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${item.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[item.status] || 'bg-gray-100'}">
                                    ${item.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">${item.details}</td>
                        </tr>
                    `;
                });
            }
            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

        } catch (error) {
            console.error("Error fetching live status:", error);
            dataContainer.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg"><strong>Error:</strong> ${error.message}</div>`;
        }
    };

    contentContainer.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <p class="text-gray-600">Real-time attendance status for your managed departments as of today.</p>
            <button id="refresh-status-btn" class="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                <i class="fas fa-sync-alt mr-2"></i>Refresh Status
            </button>
        </div>
        <div id="report-data-container"></div>
    `;

    document.getElementById('refresh-status-btn').addEventListener('click', fetchLiveStatus);
    fetchLiveStatus(); // Load data initially
};


// =================================================================================
// START: REPORTS PAGE FUNCTIONS
// (find the renderPayrollReport function in this section and replace it)
// =================================================================================

// Replace the entire existing renderPayrollReport function with this one
const renderPayrollReport = async () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let payrollReportData = [];

    dataContainer.innerHTML = `<p class="text-center p-4">Please select filters and generate a report.</p>`;

    try {
        // --- NEW ROLE-AWARE LOGIC START ---
        const isDirector = userData.roles.includes('Director');
        
        // 1. Determine which departments the user is allowed to see.
        const departmentsToDisplay = isDirector 
            ? appConfig.availableDepartments 
            : (userData.managedDepartments || []);

        if (departmentsToDisplay.length === 0) {
            filtersContainer.innerHTML = `<p class="text-center p-4 text-gray-600">You are not assigned to any departments to generate a report for.</p>`;
            dataContainer.innerHTML = '';
            return;
        }

        // 2. Fetch ONLY the active users from the allowed departments. This is more efficient and secure.
        const usersQuery = query(
            collection(db, 'users'), 
            where('status', '==', 'active'), 
            where('primaryDepartment', 'in', departmentsToDisplay),
            orderBy('name')
        );
        const usersSnapshot = await getDocs(usersQuery);
        const visibleUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // --- NEW ROLE-AWARE LOGIC END ---


        // --- UI Rendering (mostly unchanged, but now uses our filtered data) ---
        filtersContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 p-4 border rounded-lg bg-gray-50">
                <div class="md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-2">1. Select Departments</label>
                    <div id="payroll-departments-list" class="bg-white p-2 border border-gray-300 rounded-md h-48 overflow-y-auto space-y-2">
                        </div>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">2. Select Employees</label>
                    <div id="payroll-employees-list" class="bg-gray-100 p-2 border border-gray-300 rounded-md h-48 overflow-y-auto space-y-2">
                        <p class="text-gray-500 text-sm p-2">Select one or more departments to populate this list.</p>
                    </div>
                </div>
                <div class="md:col-span-1 space-y-4">
                    <div>
                        <label for="payroll-month" class="block text-sm font-medium text-gray-700">3. Select Month</label>
                        <input type="month" id="payroll-month" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm">
                    </div>
                    <div id="payroll-actions-container" class="flex flex-col space-y-2 pt-5">
                         <button id="generate-payroll-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 shadow">
                             <i class="fas fa-cogs mr-2"></i>Generate Report
                         </button>
                    </div>
                </div>
            </div>
        `;

        const deptListContainer = document.getElementById('payroll-departments-list');
        const empListContainer = document.getElementById('payroll-employees-list');
        const actionsContainer = document.getElementById('payroll-actions-container');

        // Function to render the (now filtered) department list
        const renderDepartments = () => {
            let deptHtml = `
                <div class="border-b pb-2 mb-2">
                    <label class="flex items-center space-x-2 px-1">
                        <input type="checkbox" id="dept-select-all" class="form-checkbox h-4 w-4 text-indigo-600">
                        <span class="font-semibold text-gray-700">Select All</span>
                    </label>
                </div>`;
            // THIS IS THE KEY CHANGE: Use the role-aware 'departmentsToDisplay' list
            departmentsToDisplay.forEach(dept => {
                deptHtml += `
                    <label class="flex items-center space-x-2 px-1 rounded hover:bg-gray-100">
                        <input type="checkbox" class="form-checkbox h-4 w-4 text-indigo-600 dept-checkbox" value="${dept}">
                        <span class="text-sm text-gray-800">${dept}</span>
                    </label>`;
            });
            deptListContainer.innerHTML = deptHtml;
        };

        // Function to update the employee list (now uses our pre-filtered user list)
        const updateEmployeeList = () => {
            const selectedDepts = Array.from(deptListContainer.querySelectorAll('.dept-checkbox:checked')).map(cb => cb.value);
            
            if (selectedDepts.length === 0) {
                empListContainer.innerHTML = '<p class="text-gray-500 text-sm p-2">Select one or more departments to populate this list.</p>';
                empListContainer.classList.add('bg-gray-100');
                return;
            }

            empListContainer.classList.remove('bg-gray-100');
            // THIS IS THE KEY CHANGE: Use the role-aware 'visibleUsers' list
            const filteredUsers = visibleUsers.filter(user => selectedDepts.includes(user.primaryDepartment));

            let empHtml = `
                <div class="border-b pb-2 mb-2">
                    <label class="flex items-center space-x-2 px-1">
                        <input type="checkbox" id="emp-select-all" class="form-checkbox h-4 w-4 text-indigo-600" checked>
                        <span class="font-semibold text-gray-700">Select All</span>
                    </label>
                </div>`;

            if (filteredUsers.length > 0) {
                filteredUsers.forEach(user => {
                    empHtml += `
                        <label class="flex items-center space-x-2 px-1 rounded hover:bg-gray-100">
                            <input type="checkbox" class="form-checkbox h-4 w-4 text-indigo-600 emp-checkbox" value="${user.email}" checked>
                            <span class="text-sm text-gray-800">${user.name} (${user.primaryDepartment})</span>
                        </label>`;
                });
            } else {
                empHtml += '<p class="text-gray-500 text-sm p-2">No employees found in the selected department(s).</p>';
            }
            empListContainer.innerHTML = empHtml;
        };
        
        // Initial render and event listeners (unchanged)
        renderDepartments();
        deptListContainer.addEventListener('change', (e) => {
            if (e.target.matches('#dept-select-all')) {
                const isChecked = e.target.checked;
                deptListContainer.querySelectorAll('.dept-checkbox').forEach(cb => cb.checked = isChecked);
            }
            updateEmployeeList();
        });
        empListContainer.addEventListener('change', (e) => {
            if (e.target.matches('#emp-select-all')) {
                const isChecked = e.target.checked;
                empListContainer.querySelectorAll('.emp-checkbox').forEach(cb => cb.checked = isChecked);
            }
        });
        
        document.getElementById('generate-payroll-btn').addEventListener('click', async () => {
            const generateBtn = document.getElementById('generate-payroll-btn');
            const selectedUsers = Array.from(empListContainer.querySelectorAll('.emp-checkbox:checked')).map(cb => cb.value);
            const monthValue = document.getElementById('payroll-month').value;

            if (selectedUsers.length === 0 || !monthValue) {
                alert('Please select at least one employee and a month.');
                return;
            }
            
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
            
            dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Generating payroll data...</p>`;
            const oldExportBtn = document.getElementById('export-payroll-csv-btn');
            if (oldExportBtn) {
                oldExportBtn.remove();
            }

            const [year, month] = monthValue.split('-');
            const payload = { userIds: selectedUsers, year: parseInt(year), month: parseInt(month) };

            try {
                const generatePayrollReportFunc = httpsCallable(functions, 'generatePayrollReport');
                const result = await generatePayrollReportFunc(payload);
                payrollReportData = result.data;

                if (!payrollReportData || payrollReportData.length === 0) {
                    dataContainer.innerHTML = `<p class="text-center p-4">No data returned for the selected criteria.</p>`;
                    return;
                }

                const headers = Object.keys(payrollReportData[0]);
                const tableHTML = `
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>${headers.map(h => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${h.replace(/_/g, ' ')}</th>`).join('')}</tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${payrollReportData.map(row => `
                                    <tr>
                                        ${headers.map(header => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row[header] === null || row[header] === undefined ? '' : row[header]}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`;
                dataContainer.innerHTML = tableHTML;

                const exportButton = document.createElement('button');
                exportButton.id = 'export-payroll-csv-btn';
                exportButton.className = 'w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 shadow-sm';
                exportButton.innerHTML = `<i class="fas fa-file-csv mr-2"></i>Export CSV`;
                actionsContainer.appendChild(exportButton);
                
                exportButton.addEventListener('click', () => {
                    exportToCSV(payrollReportData, `payroll-summary-${monthValue}`);
                });

            } catch (error) {
                console.error("Error calling generatePayrollReport:", error);
                dataContainer.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded-lg"><strong>Error:</strong> ${error.message}</div>`;
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>Generate Report';
            }
        });

    } catch (error) {
        console.error("Error rendering payroll report page:", error);
        filtersContainer.innerHTML = `<p class="text-red-600">Could not load data for filters.</p>`;
    }
};



// Replace the entire renderExceptionsReport function with this new version
const renderExceptionsReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let currentExceptionsData = [];
    let dataForExport = []; // Variable to hold cleaned data for CSV export

    const hasGlobalAccess = userData.roles.includes('Director') || userData.roles.includes('HR');

    const fetchData = async () => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching exceptions...</p>`;
        const status = document.getElementById('report-status')?.value || 'Pending';
        const department = document.getElementById('report-department')?.value;
        let q = query(collection(db, 'attendanceExceptions'), where('status', '==', status), orderBy('date', 'desc'));
        if (department) {
            q = query(q, where('department', '==', department));
        } else if (!hasGlobalAccess && userData.managedDepartments?.length > 0) {
            q = query(q, where('department', 'in', userData.managedDepartments));
        }

        try {
            const querySnapshot = await getDocs(q);
            const exceptions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            currentExceptionsData = exceptions;

            // Prepare data for CSV export
            dataForExport = exceptions.map(ex => ({
                Date: ex.date,
                Employee: ex.userName,
                Department: ex.department,
                Type: ex.type,
                Details: ex.details,
                Status: ex.status,
                CorrectedBy: ex.correctedBy || 'N/A',
                CorrectionRemarks: ex.correctionRemarks || 'N/A',
                ResolvedBy: ex.resolvedBy || 'N/A',
                ResolutionNotes: ex.resolutionNotes || 'N/A'
            }));

            let tableHTML = `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
            if (exceptions.length === 0) {
                tableHTML += `<tr><td colspan="6" class="p-4 text-center text-gray-500">No exceptions found.</td></tr>`;
            } else {
                exceptions.forEach(ex => {
                    let details = ex.details;
                    if (ex.status === 'Resolved' && ex.resolutionNotes) { details += `<br><strong class="text-green-700">Resolution:</strong> ${ex.resolutionNotes}`; } 
                    else if (ex.status === 'Corrected' && ex.correctionRemarks) { details += `<br><strong class="text-blue-700">Correction:</strong> ${ex.correctionRemarks}`; }
                    let actionButtons = '';
                    if (ex.status === 'Pending') { actionButtons = `<button class="correct-btn text-blue-600 hover:text-blue-900 font-medium" data-id="${ex.id}">Correct Time</button> <span class="mx-1 text-gray-300">|</span> <button class="resolve-btn text-green-600 hover:text-green-900 font-medium" data-id="${ex.id}">Resolve</button>`; } 
                    else if (ex.status === 'Corrected') { actionButtons = `<button class="resolve-btn text-green-600 hover:text-green-900 font-medium" data-id="${ex.id}">Resolve</button>`; }
                    tableHTML += `<tr><td class="px-6 py-4 whitespace-nowrap">${formatDate(ex.date)}</td><td class="px-6 py-4 whitespace-nowrap">${ex.userName}</td><td class="px-6 py-4 whitespace-nowrap">${ex.department}</td><td class="px-6 py-4 whitespace-nowrap"><span class="font-semibold">${ex.type}</span></td><td class="px-6 py-4 text-sm text-gray-600">${details}</td><td class="px-6 py-4 whitespace-nowrap text-sm">${actionButtons}</td></tr>`;
                });
            }
            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

            document.querySelectorAll('.correct-btn').forEach(btn => { btn.addEventListener('click', (e) => { const ex = currentExceptionsData.find(ex => ex.id === e.currentTarget.dataset.id); if (ex) openCorrectAttendanceModal(ex); }); });
            document.querySelectorAll('.resolve-btn').forEach(btn => { btn.addEventListener('click', (e) => { const ex = currentExceptionsData.find(ex => ex.id === e.currentTarget.dataset.id); if (ex) openResolveExceptionModal(ex); }); });
        } catch (error) {
            console.error("Error fetching attendance exceptions:", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading data.</p>`;
        }
    };

    let deptOptions = hasGlobalAccess ? appConfig.availableDepartments.map(d => `<option value="${d}">${d}</option>`).join('') : '';
    filtersContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
                <label for="report-status" class="block text-sm font-medium text-gray-700">Status</label>
                <select id="report-status" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md">
                    <option value="Pending" selected>Pending</option>
                    <option value="Corrected">Corrected</option>
                    <option value="Resolved">Resolved</option>
                </select>
            </div>
            ${hasGlobalAccess ? `<div><label for="report-department" class="block text-sm font-medium text-gray-700">Department</label><select id="report-department" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"><option value="">All Departments</option>${deptOptions}</select></div>` : ''}
            <div class="flex items-end"><button id="apply-filters-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Apply Filters</button></div>
            <div class="flex items-end"><button id="export-csv-btn" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700"><i class="fas fa-file-csv mr-2"></i>Export CSV</button></div>
        </div>`;
    document.getElementById('apply-filters-btn').addEventListener('click', fetchData);
    document.getElementById('export-csv-btn').addEventListener('click', () => exportToCSV(dataForExport, 'attendance-exceptions-report'));
    fetchData();
};


// in app.js
const renderSupportTicketsReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];

    const fetchDataAndRender = async (startDateInput, endDateInput) => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching support tickets...</p>`;
        try {
            // This section remains the same, ensuring data is scoped correctly
            const isDirector = userData.roles.includes('Director');
            const managedDepartments = userData.managedDepartments || [];
            
            // 1. Determine the raw date strings (Use arguments if provided, else use DOM or Defaults)
            let startRaw = startDateInput || document.getElementById('report-start-date')?.value;
            let endRaw = endDateInput || document.getElementById('report-end-date')?.value;

            // 2. Convert to Firestore-compatible Date objects
            // If no date is found, default to 1st of current month
            let start = startRaw ? new Date(startRaw) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            let end = endRaw ? new Date(endRaw) : new Date();

            // 3. Set time boundaries (Start of Day vs End of Day)
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            console.log('Querying Firestore with:', start, end); // Debug log

            const startDateObj = start;
            const endDateObj = end;

            // Dynamic limit: 1000 if user provided specific dates (filtered), 50 for initial load
            const isFiltered = startDateInput && endDateInput;
            const queryLimit = isFiltered ? 1000 : 50;

            let ticketsQuery;
            if (isDirector) {
                const constraints = [];
                if (startDateObj) constraints.push(where('createdAt', '>=', startDateObj));
                if (endDateObj) constraints.push(where('createdAt', '<=', endDateObj));
                constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));
                ticketsQuery = query(collection(db, 'supportRequests'), ...constraints);
            } else {
                if (managedDepartments.length === 0) {
                    dataContainer.innerHTML = `<p class="text-center p-4">You are not assigned to manage any departments.</p>`;
                    return;
                }
                const usersInDeptsQuery = query(collection(db, 'users'), where('primaryDepartment', 'in', managedDepartments));
                const usersSnapshot = await getDocs(usersInDeptsQuery);
                const userEmails = usersSnapshot.docs.map(doc => doc.id);
                if (userEmails.length === 0) {
                    dataContainer.innerHTML = `<p class="text-center p-4">No users found in your managed departments.</p>`;
                    return;
                }
                if (userEmails.length > 30) {
                    console.warn("Querying for more than 30 users in support tickets. This may lead to incomplete results.");
                }
                const constraints = [where('requesterId', 'in', userEmails)];
                if (startDateObj) constraints.push(where('createdAt', '>=', startDateObj));
                if (endDateObj) constraints.push(where('createdAt', '<=', endDateObj));
                constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));
                ticketsQuery = query(collection(db, 'supportRequests'), ...constraints);
            }
            const querySnapshot = await getDocs(ticketsQuery);
            const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side filtering for status/assignee only (date is server-side)
            const status = document.getElementById('report-status')?.value;
            const assigneeId = document.getElementById('report-assignee')?.value;

            let filteredTickets = tickets;
            if (status) { filteredTickets = filteredTickets.filter(t => t.status === status); }
            if (assigneeId) { filteredTickets = filteredTickets.filter(t => t.assigneeId === assigneeId); }

            // --- CHANGE 1: Add "CompletedOn" to the CSV export data ---
            dataForExport = filteredTickets.map(ticket => ({
                CreatedOn: formatDate(ticket.createdAt),
                CompletedOn: ticket.completedAt ? formatDate(ticket.completedAt) : 'N/A',
                Subject: ticket.subject,
                Requester: ticket.requesterName,
                Assignee: ticket.assigneeName,
                Status: ticket.status,
                Description: ticket.description
            }));

            // --- CHANGE 2: Add "Completed On" to the table header ---
            let tableHTML = `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created On</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed On</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
            
            if (filteredTickets.length === 0) {
                tableHTML += `<tr><td colspan="7" class="p-4 text-center text-gray-500">No support tickets found for the selected filters.</td></tr>`;
            } else {
                filteredTickets.forEach(ticket => {
                    const statusColor = { 'Open': 'bg-blue-100 text-blue-800', 'In Progress': 'bg-yellow-100 text-yellow-800', 'Completed': 'bg-purple-100 text-purple-800', 'Closed': 'bg-green-100 text-green-800' }[ticket.status] || 'bg-gray-100';
                    // --- CHANGE 3: Add the "Completed On" data to the table row ---
                    tableHTML += `<tr>
                        <td class="px-6 py-4 whitespace-nowrap">${formatDate(ticket.createdAt)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${ticket.completedAt ? formatDate(ticket.completedAt) : 'N/A'}</td>
                        <td class="px-6 py-4">${ticket.subject}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${ticket.requesterName}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${ticket.assigneeName}</td>
                        <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${ticket.status}</span></td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <button class="text-indigo-600 hover:text-indigo-900 view-ticket-btn" data-id="${ticket.id}">View</button>
                        </td>
                    </tr>`;
                });
            }
            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

            // Attach view handlers
            document.querySelectorAll('.view-ticket-btn').forEach(btn => {
                btn.addEventListener('click', () => openViewSupportModal(btn.dataset.id));
            });
        } catch (error) {
            console.error("Error fetching support tickets:", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading support tickets.</p>`;
        }
    };
    
    // The renderFilters part remains unchanged
    const renderFilters = async () => {
        try {
            const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('name')));
            const userOptions = usersSnapshot.docs.map(doc => `<option value="${doc.id}">${doc.data().name}</option>`).join('');
            
            filtersContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                    <div><label for="report-start-date" class="block text-sm font-medium text-gray-700">Start Date</label><input type="date" id="report-start-date" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"></div>
                    <div><label for="report-end-date" class="block text-sm font-medium text-gray-700">End Date</label><input type="date" id="report-end-date" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"></div>
                    <div><label for="report-status" class="block text-sm font-medium text-gray-700">Status</label><select id="report-status" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"><option value="">All</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Closed">Closed</option></select></div>
                    <div><label for="report-assignee" class="block text-sm font-medium text-gray-700">Assignee</label><select id="report-assignee" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"><option value="">All Users</option>${userOptions}</select></div>
                    <div class="flex items-end"><button id="apply-filters-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Apply Filters</button></div>
                    <div class="flex items-end"><button id="export-csv-btn" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700"><i class="fas fa-file-csv mr-2"></i>Export CSV</button></div>
                </div>`;
            document.getElementById('apply-filters-btn').addEventListener('click', () => {
                // Explicitly read DOM values inside the click handler
                const startDateValue = document.getElementById('report-start-date')?.value;
                const endDateValue = document.getElementById('report-end-date')?.value;
                console.log('Applying filter with dates:', startDateValue, endDateValue);
                // Force fetch with the new dates as arguments
                fetchDataAndRender(startDateValue, endDateValue);
            });
            document.getElementById('export-csv-btn').addEventListener('click', () => exportToCSV(dataForExport, 'support-tickets-report'));

            // Set default date range: first of current month to today
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startInput = document.getElementById('report-start-date');
            const endInput = document.getElementById('report-end-date');
            if (startInput) startInput.value = startOfMonth.toISOString().split('T')[0];
            if (endInput) endInput.value = today.toISOString().split('T')[0];
        } catch (error) {
            console.error("Error rendering filters:", error);
            filtersContainer.innerHTML = `<p class="text-red-600">Could not load filters.</p>`;
        }
    };
    
    renderFilters();
    fetchDataAndRender();
};

// in app.js
const renderLeaveReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];
    let userMap = new Map();

    const fetchAllUsersAndRender = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach(doc => userMap.set(doc.id, doc.data().name));
            
            renderReportFilters(filtersContainer, { 
                showDateRange: true, 
                showStatus: true, 
                showDepartment: true, 
                onApply: () => {
                    // Explicitly read DOM values inside the click handler
                    const startDateValue = document.getElementById('report-start-date')?.value;
                    const endDateValue = document.getElementById('report-end-date')?.value;
                    console.log('Applying filter with dates:', startDateValue, endDateValue);
                    // Force fetch with the new dates as arguments
                    fetchData(startDateValue, endDateValue);
                },
                onExport: () => exportToCSV(dataForExport, 'leave-ot-report')
            });

            // Set default date range: first of current month to today
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startInput = document.getElementById('report-start-date');
            const endInput = document.getElementById('report-end-date');
            if (startInput) startInput.value = startOfMonth.toISOString().split('T')[0];
            if (endInput) endInput.value = today.toISOString().split('T')[0];

            fetchData();
        } catch (error) {
            console.error("Error fetching user list for report:", error);
            contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Could not load user data for the report.</div>`;
        }
    };

    const fetchData = async (startDateInput, endDateInput) => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching leave data...</p>`;
        
        const isManager = userData.roles.includes('DepartmentManager') && !userData.roles.includes('Director') && !userData.roles.includes('HR');

        // 1. Determine the raw date strings (Use arguments if provided, else use DOM or Defaults)
        let startRaw = startDateInput || document.getElementById('report-start-date')?.value;
        let endRaw = endDateInput || document.getElementById('report-end-date')?.value;

        // 2. Convert to Firestore-compatible Date objects
        // If no date is found, default to 1st of current month
        let start = startRaw ? new Date(startRaw) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        let end = endRaw ? new Date(endRaw) : new Date();

        // 3. Set time boundaries (Start of Day vs End of Day)
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        console.log('Querying Firestore with:', start, end); // Debug log

        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;

        const startDateObj = start;
        const endDateObj = end;

        // Dynamic limit: 1000 if user provided specific dates (filtered), 50 for initial load
        const isFiltered = startDateInput && endDateInput;
        const queryLimit = isFiltered ? 1000 : 50;

        const constraints = [];

        if (isManager && userData.managedDepartments?.length > 0) {
            constraints.push(where('department', 'in', userData.managedDepartments));
        }
        if (department) constraints.push(where('department', '==', department));
        if (status) constraints.push(where('status', '==', status));
        if (startDateObj) constraints.push(where('createdAt', '>=', startDateObj));
        if (endDateObj) constraints.push(where('createdAt', '<=', endDateObj));

        constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));

        const q = query(collection(db, 'requests'), ...constraints);

        try {
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => doc.data());
            
// --- REPLACE THIS BLOCK IN renderLeaveReport ---
            dataForExport = requests.map(req => ({
                Employee: req.userName,
                Department: req.department,
                Type: req.type,
                // FIX: Use formatDateForCSV for Excel compatibility
                SubmittedOn: formatDateForCSV(req.createdAt), 
                // FIX: Use formatDateForCSV for Start/End dates
                StartDate: formatDateForCSV(req.startDate),
                EndDate: formatDateForCSV(req.endDate),
                Hours_Claimed: req.hours,
                Status: req.status,
                // FIX: Use formatDateForCSV for Processed date
                ProcessedOn: req.processedAt ? formatDateForCSV(req.processedAt) : 'N/A',
                ApprovedBy: userMap.get(req.approvedBy) || req.approvedBy || 'N/A',
                Reason: req.reason,
                DocumentURL: req.documentUrl || 'N/A'
            }));
            // --- END REPLACEMENT ---

            let tableHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted On</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Claimed</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed On</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (requests.length === 0) {
                tableHTML += `<tr><td colspan="8" class="p-4 text-center text-gray-500">No leave data found.</td></tr>`; // Updated colspan to 8
            } else {
                requests.forEach(req => {
                    const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800' }[req.status] || 'bg-gray-100';
                    const approverName = userMap.get(req.approvedBy) || req.approvedBy || 'N/A';
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${req.userName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${req.type}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatDateTime(req.createdAt.toDate())}</td> <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatDateTime(req.startDate)} to ${formatDateTime(req.endDate)}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">${req.hours}</td>
                            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${req.processedAt ? formatDateTime(req.processedAt.toDate()) : 'N/A'}</td> <td class="px-6 py-4 whitespace-nowrap">${approverName}</td>
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
    
    fetchAllUsersAndRender();
};

// in app.js
const renderClaimsReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];
    let userMap = new Map();

    const fetchAllUsersAndRender = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach(doc => userMap.set(doc.id, doc.data().name));

            renderReportFilters(filtersContainer, { 
                showDateRange: true, 
                showStatus: true, 
                showDepartment: true, 
                onApply: () => {
                    // Explicitly read DOM values inside the click handler
                    const startDateValue = document.getElementById('report-start-date')?.value;
                    const endDateValue = document.getElementById('report-end-date')?.value;
                    console.log('Applying filter with dates:', startDateValue, endDateValue);
                    // Force fetch with the new dates as arguments
                    fetchData(startDateValue, endDateValue);
                },
                onExport: () => exportToCSV(dataForExport, 'claims-report')
            });

            // Set default date range: first of current month to today
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startInput = document.getElementById('report-start-date');
            const endInput = document.getElementById('report-end-date');
            if (startInput) startInput.value = startOfMonth.toISOString().split('T')[0];
            if (endInput) endInput.value = today.toISOString().split('T')[0];

            fetchData();
        } catch (error) {
            console.error("Error fetching user list for report:", error);
            contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Could not load user data for the report.</div>`;
        }
    };

    const fetchData = async (startDateInput, endDateInput) => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching claims data...</p>`;

        const isManager = userData.roles.includes('DepartmentManager') && !userData.roles.includes('Director');
        const canSeeAll = userData.roles.includes('Director') || userData.roles.includes('HR');
        
        // 1. Determine the raw date strings (Use arguments if provided, else use DOM or Defaults)
        let startRaw = startDateInput || document.getElementById('report-start-date')?.value;
        let endRaw = endDateInput || document.getElementById('report-end-date')?.value;

        // 2. Convert to Firestore-compatible Date objects
        // If no date is found, default to 1st of current month
        let start = startRaw ? new Date(startRaw) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        let end = endRaw ? new Date(endRaw) : new Date();

        // 3. Set time boundaries (Start of Day vs End of Day)
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        console.log('Querying Firestore with:', start, end); // Debug log

        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;

        const startDateObj = start;
        const endDateObj = end;

        // Dynamic limit: 1000 if user provided specific dates (filtered), 50 for initial load
        const isFiltered = startDateInput && endDateInput;
        const queryLimit = isFiltered ? 1000 : 50;

        const constraints = [];

        if (!canSeeAll) {
            const deptsToView = userData.managedDepartments || [];
            if (deptsToView.length > 0) {
                constraints.push(where('department', 'in', deptsToView));
            } else {
                dataContainer.innerHTML = `<p class="text-center p-4">You are not assigned to any departments.</p>`;
                return;
            }
        }

        if (department) constraints.push(where('department', '==', department));
        if (status) constraints.push(where('status', '==', status));
        if (startDateObj) constraints.push(where('createdAt', '>=', startDateObj));
        if (endDateObj) constraints.push(where('createdAt', '<=', endDateObj));

        constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));

        const q = query(collection(db, 'claims'), ...constraints);
        
        try {
            const querySnapshot = await getDocs(q);
            const claims = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
// --- REPLACE THIS BLOCK IN renderClaimsReport ---
            dataForExport = claims.map(claim => ({
                Employee: claim.userName,
                Department: claim.department,
                // We use the new helper here to fix the Excel date issue:
                SubmittedOn: formatDateForCSV(claim.createdAt), 
                ClaimType: claim.claimType,
                // Expense Date is usually a string YYYY-MM-DD already, but this is safe:
                ExpenseDate: claim.expenseDate, 
                Amount: claim.amount.toFixed(2),
                Status: claim.status,
                // And we use the new helper here:
                ProcessedOn: claim.processedAt ? formatDateForCSV(claim.processedAt) : 'N/A', 
                ApprovedBy: userMap.get(claim.approvedBy) || claim.approvedBy || 'N/A',
                PaidBy: userMap.get(claim.processedBy) || claim.processedBy || 'N/A',
                Description: claim.description,
                ReceiptURL: claim.receiptUrl
            }));
            // --- END REPLACEMENT ---

            let tableHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted On</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed On</th> <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (claims.length === 0) {
                tableHTML += `<tr><td colspan="9" class="p-4 text-center text-gray-500">No claims data found.</td></tr>`;
            } else {
                claims.forEach(claim => {
                    const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-1Player-100 text-green-800', Paid: 'bg-blue-100 text-blue-800', Rejected: 'bg-red-100 text-red-800' }[claim.status] || 'bg-gray-100';
                    const approverName = userMap.get(claim.approvedBy) || claim.approvedBy || 'N/A';
                    const paidByName = userMap.get(claim.processedBy) || claim.processedBy || 'N/A';
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${claim.userName}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatDateTime(claim.createdAt.toDate())}</td> <td class="px-6 py-4 whitespace-nowrap">${claim.claimType}</td>
                            <td class="px-6 py-4 whitespace-nowrap">RM${claim.amount.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${claim.status}</span></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${claim.processedAt ? formatDateTime(claim.processedAt.toDate()) : 'N/A'}</td> <td class="px-6 py-4 whitespace-nowrap">${approverName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${paidByName}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <button class="view-claim-btn text-indigo-600 hover:text-indigo-900" data-id="${claim.id}">View</button>
                            </td>
                        </tr>
                    `;
                });
            }

            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

            // Attach view handlers for auditing
            document.querySelectorAll('.view-claim-btn').forEach(btn => {
                btn.addEventListener('click', () => openRequestDetailsModal(btn.dataset.id, 'claims', false));
            });

        } catch (error) {
            console.error("Error fetching claims report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading claims. A Firestore index may be required.</p>`;
        }
    };

    fetchAllUsersAndRender();
};

const renderPurchasingReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];
    let userMap = new Map(); // To store user emails and names

    // NEW: Fetch all users first to map emails to names for the report
    const fetchAllUsersAndRender = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach(doc => {
                userMap.set(doc.id, doc.data().name);
            });
            // Now that we have the users, render the filters and fetch the report data
            renderReportFilters(filtersContainer, { 
                showDateRange: true, 
                showStatus: true, 
                showDepartment: true, 
                onApply: () => {
                    // Explicitly read DOM values inside the click handler
                    const startDateValue = document.getElementById('report-start-date')?.value;
                    const endDateValue = document.getElementById('report-end-date')?.value;
                    console.log('Applying filter with dates:', startDateValue, endDateValue);
                    // Force fetch with the new dates as arguments
                    fetchData(startDateValue, endDateValue);
                },
                onExport: () => exportToCSV(dataForExport, 'purchasing-report') 
            });

            // Set default date range: first of current month to today
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startInput = document.getElementById('report-start-date');
            const endInput = document.getElementById('report-end-date');
            if (startInput) startInput.value = startOfMonth.toISOString().split('T')[0];
            if (endInput) endInput.value = today.toISOString().split('T')[0];

            fetchData();
        } catch (error) {
            console.error("Error fetching user list for report:", error);
            contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Could not load user data for the report.</div>`;
        }
    };

    const fetchData = async (startDate, endDate) => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching purchasing data...</p>`;

        const isManager = userData.roles.includes('DepartmentManager');
        const canSeeAll = userData.roles.includes('Director') || userData.roles.includes('HR');
        
        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;
        // Use provided dates or fallback to DOM values
        const startDateValue = startDate || document.getElementById('report-start-date')?.value;
        const endDateValue = endDate || document.getElementById('report-end-date')?.value;

        const startDateObj = startDateValue ? new Date(startDateValue) : null;
        const endDateObj = endDateValue ? new Date(endDateValue) : null;
        if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

        const constraints = [];

        if (!canSeeAll) { // This will now correctly scope a Purchaser by their managed departments
            const deptsToView = userData.managedDepartments || [];
            if (deptsToView.length > 0) {
                 constraints.push(where('department', 'in', deptsToView));
            } else {
                 // If a manager/purchaser has no managed departments, they see nothing
                 dataContainer.innerHTML = `<p class="text-center p-4">You are not assigned to any departments.</p>`;
                 return;
            }
        }

        if (department) constraints.push(where('department', '==', department));
        if (status) constraints.push(where('status', '==', status));
        if (startDateObj) constraints.push(where('createdAt', '>=', startDateObj));
        if (endDateObj) constraints.push(where('createdAt', '<=', endDateObj));

        // Dynamic limit: 1000 if user provided specific dates (filtered), 50 for initial load
        const isFiltered = startDate && endDate;
        const queryLimit = isFiltered ? 1000 : 50;

        constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));

        const q = query(collection(db, 'purchaseRequests'), ...constraints);
        
        try {
            const querySnapshot = await getDocs(q);
            let purchases = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
            
            // NEW: Prepare enhanced data for CSV export
            dataForExport = purchases.map(req => {
                const difference = req.actualCost ? (req.actualCost - req.estimatedCost).toFixed(2) : 'N/A';
                return {
                    Employee: req.userName,
                    Department: req.department,
                    Submitted_On: req.createdAt ? formatDateForCSV(req.createdAt) : 'N/A',
                    Item: req.itemDescription,
                    Estimated_Cost: req.estimatedCost.toFixed(2),
                    Actual_Cost: req.actualCost ? req.actualCost.toFixed(2) : 'N/A',
                    Difference: difference,
                    Status: req.status,
                    Approved_By: userMap.get(req.approvedBy) || req.approvedBy || 'N/A',
                    Processed_By: userMap.get(req.processedBy) || req.processedBy || 'N/A',
                    Processed_On: req.processedAt ? formatDateForCSV(req.processedAt) : 'N/A',
                    Notes: req.purchaserNotes || ''
                };
            });

            let tableHTML = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual Cost</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (purchases.length === 0) {
                tableHTML += `<tr><td colspan="8" class="p-4 text-center text-gray-500">No purchasing data found.</td></tr>`;
            } else {
                purchases.forEach(req => {
                    const statusColor = { Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Processing: 'bg-purple-100 text-purple-800', Completed: 'bg-blue-100 text-blue-800' }[req.status] || 'bg-gray-100 text-gray-800';
                    const actualCostText = req.actualCost ? `RM${req.actualCost.toFixed(2)}` : 'N/A';
                    
                    let differenceText = 'N/A';
                    let differenceColor = 'text-gray-500';
                    if (req.actualCost) {
                        const diff = req.actualCost - req.estimatedCost;
                        differenceColor = diff > 0 ? 'text-red-600' : 'text-green-600';
                        differenceText = `RM${diff.toFixed(2)}`;
                    }

                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">${req.userName}</td>
                            <td class="px-6 py-4">${req.itemDescription}</td>
                            <td class="px-6 py-4 whitespace-nowrap">RM${req.estimatedCost.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-medium">${actualCostText}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-bold ${differenceColor}">${differenceText}</td>
                            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${req.status}</span></td>
                            <td class="px-6 py-4 whitespace-nowrap">${userMap.get(req.processedBy) || req.processedBy || 'N/A'}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <button class="view-purchase-btn text-indigo-600 hover:text-indigo-900" data-id="${req.id}">View</button>
                            </td>
                        </tr>
                    `;
                });
            }

            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

            // Attach view handlers for auditing
            document.querySelectorAll('.view-purchase-btn').forEach(btn => {
                btn.addEventListener('click', () => openRequestDetailsModal(btn.dataset.id, 'purchaseRequests', false));
            });

        } catch (error) {
            console.error("Error fetching purchasing report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading purchasing data. A Firestore index may be required.</p>`;
        }
    };

    fetchAllUsersAndRender(); // Start by fetching users, then render the rest
};

// =================================================================================
// START: NEW BILL PAYMENTS REPORT FUNCTION
// =================================================================================

const renderBillPaymentsReport = () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let dataForExport = [];
    let userMap = new Map(); // To store user emails and names

    // 1. Fetch all users first to map emails to names for the report
    const fetchAllUsersAndRender = async () => {
        try {
            // Get all user names to map IDs (like processedBy) to a name
            const usersSnapshot = await getDocs(collection(db, 'users'));
            usersSnapshot.forEach(doc => {
                userMap.set(doc.id, doc.data().name);
            });

            // 2. Render the standard filter bar
            renderReportFilters(filtersContainer, { 
                showDateRange: true, 
                showStatus: true, 
                showDepartment: true, 
                onApply: () => {
                    // Explicitly read DOM values inside the click handler
                    const startDateValue = document.getElementById('report-start-date')?.value;
                    const endDateValue = document.getElementById('report-end-date')?.value;
                    console.log('Applying filter with dates:', startDateValue, endDateValue);
                    // Force fetch with the new dates as arguments
                    fetchData(startDateValue, endDateValue);
                },
                onExport: () => exportToCSV(dataForExport, 'bill-payments-report') 
            });
            
            // Set default date range: first of current month to today
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startInput = document.getElementById('report-start-date');
            const endInput = document.getElementById('report-end-date');
            if (startInput) startInput.value = startOfMonth.toISOString().split('T')[0];
            if (endInput) endInput.value = today.toISOString().split('T')[0];

            // 3. Load the initial data
            fetchData();
        } catch (error) {
            console.error("Error fetching user list for report:", error);
            contentArea.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Could not load user data for the report.</div>`;
        }
    };

    // 4. This function queries and displays the data
    const fetchData = async (startDate, endDate) => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching bill payments data...</p>`;

        // Role-based query logic
        const canSeeAll = userData.roles.includes('Director') || userData.roles.includes('Finance');

        // Use provided dates or fallback to DOM values
        const startDateValue = startDate || document.getElementById('report-start-date')?.value;
        const endDateValue = endDate || document.getElementById('report-end-date')?.value;
        const status = document.getElementById('report-status')?.value;
        const department = document.getElementById('report-department')?.value;

        const startDateObj = startDateValue ? new Date(startDateValue) : null;
        const endDateObj = endDateValue ? new Date(endDateValue) : null;
        if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

        const constraints = [];

        if (!canSeeAll) {
            const deptsToView = userData.managedDepartments || [];
            if (deptsToView.length > 0) {
                constraints.push(where('department', 'in', deptsToView));
            } else {
                dataContainer.innerHTML = `<p class="text-center p-4">You are not assigned to any departments.</p>`;
                return;
            }
        }

        if (department) constraints.push(where('department', '==', department));
        if (status) constraints.push(where('status', '==', status));
        if (startDateObj) constraints.push(where('createdAt', '>=', startDateObj));
        if (endDateObj) constraints.push(where('createdAt', '<=', endDateObj));

        // Dynamic limit: 1000 if user provided specific dates (filtered), 50 for initial load
        const isFiltered = startDate && endDate;
        const queryLimit = isFiltered ? 1000 : 50;

        constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));

        const q = query(collection(db, 'paymentRequests'), ...constraints);
        
        try {
            const querySnapshot = await getDocs(q);
            const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // 5. Prepare data for CSV Export (including new fields)
            dataForExport = payments.map(req => {
                let processedByName = 'N/A';
                if (req.status === 'Pending Finance' || req.status === 'Rejected') {
                    processedByName = userMap.get(req.approvedBy) || req.approvedBy || 'N/A';
                } else if (req.status === 'Paid') {
                    processedByName = userMap.get(req.processedBy) || req.processedBy || 'N/A';
                }

                return {
                    Submitted_By: req.userName,
                    Department: req.department,
                    Submitted_On: req.createdAt ? formatDateForCSV(req.createdAt) : 'N/A',
                    Vendor: req.vendorName,
                    Amount: req.amount.toFixed(2),
                    Billing_Date: formatDate(req.billingDate),
                    Status: req.status,
                    Processed_On: req.processedAt ? formatDateForCSV(req.processedAt) : 'N/A',
                    Processed_By: processedByName,
                    Notes: req.notes || '',
                    Invoice_URL: req.invoiceUrl
                };
            });

            // 6. Render the HTML Table with corrected spacing
            let tableHTML = `
                <div class="mt-6 overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor / Submitted By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Date</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed At / By</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;

            if (payments.length === 0) {
                tableHTML += `<tr><td colspan="8" class="p-4 text-center text-gray-500">No bill payments found.</td></tr>`;
            } else {
                payments.forEach(req => {
                    const statusColor = {
                        'Pending Approval': 'bg-yellow-100 text-yellow-800',
                        'Pending Finance': 'bg-blue-100 text-blue-800',
                        'Paid': 'bg-green-100 text-green-800',
                        'Rejected': 'bg-red-100 text-red-800'
                    }[req.status] || 'bg-gray-100 text-gray-800';

                    let processedByText = 'N/A';
                    if (req.status === 'Pending Finance' || req.status === 'Rejected') {
                        processedByText = userMap.get(req.approvedBy) || req.approvedBy || 'N/A';
                    } else if (req.status === 'Paid') {
                        processedByText = userMap.get(req.processedBy) || req.processedBy || 'N/A';
                    }
                    
                    const processedAtText = req.processedAt ? formatDateTime(req.processedAt.toDate()) : 'N/A';

                    tableHTML += `
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="font-medium text-gray-900">${req.vendorName}</div>
                                <div class="text-xs text-gray-500">by ${req.userName}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${req.department}</td>
                            <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">RM ${req.amount.toFixed(2)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(req.billingDate)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDateTime(req.createdAt.toDate())}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                                    ${req.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">${processedAtText}</div>
                                <div class="text-xs text-gray-500">${processedByText}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <button class="view-payment-btn text-indigo-600 hover:text-indigo-900" data-id="${req.id}">View</button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

            // Attach view handlers for auditing
            document.querySelectorAll('.view-payment-btn').forEach(btn => {
                btn.addEventListener('click', () => openRequestDetailsModal(btn.dataset.id, 'paymentRequests', false));
            });

        } catch (error) {
            console.error("Error fetching bill payments report: ", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading data. A Firestore index may be required. Please check the console.</p>`;
        }
    };

    // Start by fetching users, which will then render filters and data
    fetchAllUsersAndRender();
};

// =================================================================================
// END: NEW BILL PAYMENTS REPORT FUNCTION
// =================================================================================


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


// in app.js
const renderAnnouncementsReport = async () => {
    const contentContainer = document.getElementById('report-content-container');
    contentContainer.innerHTML = `<div id="report-filters"></div><div id="report-data-container"></div>`;
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let currentAnnouncementsData = [];
    let dataForExport = [];

    const openViewAnnouncementDetailModal = (announcementId) => {
        const ann = currentAnnouncementsData.find(a => a.id === announcementId);
        if (!ann) return;
        const modal = document.getElementById('view-announcement-detail-modal');
        const titleEl = document.getElementById('view-announcement-detail-title');
        const creatorEl = document.getElementById('view-announcement-detail-creator');
        const dateEl = document.getElementById('view-announcement-detail-date');
        const deptsEl = document.getElementById('view-announcement-detail-departments');
        const contentEl = document.getElementById('view-announcement-detail-content');
        const imgWrapper = document.getElementById('view-announcement-detail-image-wrapper');
        const imgEl = document.getElementById('view-announcement-detail-image');
        const videoWrapper = document.getElementById('view-announcement-detail-video-wrapper');
        const videoEl = document.getElementById('view-announcement-detail-video');
        const attachWrapper = document.getElementById('view-announcement-detail-attachment-wrapper');
        const attachEl = document.getElementById('view-announcement-detail-attachment');

        titleEl.textContent = ann.title || 'N/A';
        creatorEl.textContent = ann.creatorName || 'N/A';
        dateEl.textContent = ann.createdAt ? formatDateTime(ann.createdAt.toDate()) : 'N/A';
        deptsEl.textContent = ann.targetDepartments?.includes('__ALL__') ? 'All Departments' : (ann.targetDepartments || []).join(', ');
        contentEl.textContent = ann.content || 'N/A';

        if (ann.imageUrl) {
            imgWrapper.classList.remove('hidden');
            imgEl.src = ann.imageUrl;
            imgEl.alt = ann.title || 'Announcement Image';
        } else {
            imgWrapper.classList.add('hidden');
            imgEl.removeAttribute('src');
        }

        if (ann.videoUrl) {
            videoWrapper.classList.remove('hidden');
            videoEl.href = ann.videoUrl;
        } else {
            videoWrapper.classList.add('hidden');
            videoEl.removeAttribute('href');
        }

        if (ann.attachmentFileUrl) {
            attachWrapper.classList.remove('hidden');
            attachEl.href = ann.attachmentFileUrl;
        } else {
            attachWrapper.classList.add('hidden');
            attachEl.removeAttribute('href');
        }

        modal.classList.remove('hidden');
    };

    const closeViewAnnouncementDetailModal = () => {
        const modal = document.getElementById('view-announcement-detail-modal');
        modal.classList.add('hidden');
    };

    const fetchData = async (startDateInput, endDateInput) => {
        dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching announcements...</p>`;
        
        const isDirector = userData.roles.includes('Director');
        const managedDepartments = userData.managedDepartments || [];
        const departmentFilter = document.getElementById('report-department')?.value;
        // Use provided dates if available, otherwise read from DOM
        const startDateValue = startDateInput || document.getElementById('report-start-date')?.value;
        const endDateValue = endDateInput || document.getElementById('report-end-date')?.value;

        const startDateObj = startDateValue ? new Date(startDateValue) : null;
        const endDateObj = endDateValue ? new Date(endDateValue) : null;
        if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

        if (!startDateObj || !endDateObj) {
            dataContainer.innerHTML = `<p class="text-center p-4 text-red-600">Please select a start and end date.</p>`;
            return;
        }

        const constraints = [];

        if (isDirector) {
            if (departmentFilter) constraints.push(where('targetDepartments', 'array-contains', departmentFilter));
        } else {
            if (managedDepartments.length === 0) {
                dataContainer.innerHTML = `<p class="text-center p-4">You are not assigned to manage any departments.</p>`;
                return;
            }
            if (departmentFilter) {
                constraints.push(where('targetDepartments', 'array-contains', departmentFilter));
            } else {
                constraints.push(where('targetDepartments', 'array-contains-any', managedDepartments));
            }
        }

        constraints.push(where('createdAt', '>=', startDateObj));
        constraints.push(where('createdAt', '<=', endDateObj));
        
        // Dynamic limit: 1000 if user provided specific dates (filtered), 50 for initial load
        const isFiltered = startDateInput && endDateInput;
        const queryLimit = isFiltered ? 1000 : 50;
        
        constraints.push(orderBy('createdAt', 'desc'), limit(queryLimit));

        const q = query(collection(db, 'announcements'), ...constraints);

        try {
            const snapshot = await getDocs(q);
            currentAnnouncementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            dataForExport = currentAnnouncementsData.map(ann => ({
                Title: ann.title,
                Created_By: ann.creatorName,
                Submitted_On: ann.createdAt ? formatDateForCSV(ann.createdAt) : 'N/A',
                Departments: ann.targetDepartments?.includes('__ALL__') ? 'All Departments' : (ann.targetDepartments || []).join(', '),
                Content: ann.content || '',
                Image_URL: ann.imageUrl || 'N/A',
                Video_URL: ann.videoUrl || 'N/A',
                Attachment_URL: ann.attachmentFileUrl || 'N/A'
            }));

            let tableHTML = `<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Departments</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">`;
            if (currentAnnouncementsData.length === 0) {
                tableHTML += `<tr><td colspan="5" class="p-4 text-center text-gray-500">No announcements found.</td></tr>`;
            } else {
                currentAnnouncementsData.forEach(ann => {
                    const depts = ann.targetDepartments?.includes('__ALL__') ? 'All Departments' : (ann.targetDepartments || []).join(', ');
                    tableHTML += `<tr>
                        <td class="px-6 py-4 whitespace-nowrap">${ann.createdAt ? formatDate(ann.createdAt) : 'N/A'}</td>
                        <td class="px-6 py-4">${ann.title}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${ann.creatorName}</td>
                        <td class="px-6 py-4">${depts}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <button class="view-acknowledgements-btn text-indigo-600 hover:text-indigo-900" data-id="${ann.id}">View Status</button>
                            <button class="view-details-btn text-indigo-600 hover:text-indigo-900" data-id="${ann.id}">View Details</button>
                        </td>
                    </tr>`;
                });
            }
            tableHTML += `</tbody></table></div>`;
            dataContainer.innerHTML = tableHTML;

            document.querySelectorAll('.view-acknowledgements-btn').forEach(btn => {
                btn.addEventListener('click', (e) => openViewAcknowledgementsModal(e.currentTarget.dataset.id));
            });
            document.querySelectorAll('.view-details-btn').forEach(btn => {
                btn.addEventListener('click', (e) => openViewAnnouncementDetailModal(e.currentTarget.dataset.id));
            });
        } catch (error) {
            console.error("Error fetching announcements report:", error);
            dataContainer.innerHTML = `<p class="text-red-600 text-center p-4">Error loading data.</p>`;
        }
    };
    
    renderReportFilters(filtersContainer, {
        showDateRange: true,
        showDepartment: true,
        onApply: () => {
            // Explicitly read DOM values inside the click handler
            const startDateValue = document.getElementById('report-start-date')?.value;
            const endDateValue = document.getElementById('report-end-date')?.value;
            console.log('Applying filter with dates:', startDateValue, endDateValue);
            // Force fetch with the new dates as arguments
            fetchData(startDateValue, endDateValue);
        },
        onExport: () => exportToCSV(dataForExport, 'announcements-report')
    });

    // Set default dates to current month range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startInput = document.getElementById('report-start-date');
    const endInput = document.getElementById('report-end-date');
    if (startInput) startInput.value = startOfMonth.toISOString().split('T')[0];
    if (endInput) endInput.value = today.toISOString().split('T')[0];
    
    document.getElementById('view-announcement-detail-close-button')?.addEventListener('click', closeViewAnnouncementDetailModal);
    document.getElementById('view-announcement-detail-close-button-footer')?.addEventListener('click', closeViewAnnouncementDetailModal);
    
    fetchData(); // Initial load
};

// =================================================================================
// NEW: Leave Balances Report
// =================================================================================
const renderLeaveBalanceReport = async () => {
    const filtersContainer = document.getElementById('report-filters');
    const dataContainer = document.getElementById('report-data-container');
    let leaveBalanceData = [];

    dataContainer.innerHTML = `<p class="text-center p-4">Please select filters and generate a report.</p>`;

    try {
        // --- ROLE-AWARE LOGIC START ---
        const isDirector = userData.roles.includes('Director');
        
        // 1. Determine which departments the user is allowed to see.
        const departmentsToDisplay = isDirector 
            ? appConfig.availableDepartments 
            : (userData.managedDepartments || []);

        if (departmentsToDisplay.length === 0) {
            filtersContainer.innerHTML = `<p class="text-center p-4 text-gray-600">You are not assigned to any departments to generate a report for.</p>`;
            dataContainer.innerHTML = '';
            return;
        }
        // --- ROLE-AWARE LOGIC END ---

        // Get current year as default
        const currentYear = new Date().getFullYear();

        // --- UI Rendering ---
        filtersContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 border rounded-lg bg-gray-50">
                <div>
                    <label for="leave-balance-year" class="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input type="number" id="leave-balance-year" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm" value="${currentYear}" min="2020" max="2100">
                </div>
                <div>
                    <label for="leave-balance-department" class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select id="leave-balance-department" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm">
                        <option value="">All Departments</option>
                        ${departmentsToDisplay.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
                    </select>
                </div>
                <div class="flex items-end">
                    <button id="generate-leave-balance-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 shadow">
                        <i class="fas fa-cogs mr-2"></i>Generate Report
                    </button>
                </div>
            </div>
        `;

        const generateBtn = document.getElementById('generate-leave-balance-btn');
        const yearInput = document.getElementById('leave-balance-year');
        const departmentSelect = document.getElementById('leave-balance-department');

        const fetchAndRenderData = async () => {
            const selectedYear = yearInput.value || currentYear;
            const selectedDepartment = departmentSelect.value;

            if (!selectedYear) {
                alert('Please select a year.');
                return;
            }

            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
            dataContainer.innerHTML = `<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading leave balances...</p>`;

            try {
                // Build query for active users
                let usersQuery = query(
                    collection(db, 'users'),
                    where('status', '==', 'active'),
                    orderBy('name')
                );

                // If department is selected, filter by it
                if (selectedDepartment) {
                    usersQuery = query(
                        collection(db, 'users'),
                        where('status', '==', 'active'),
                        where('primaryDepartment', '==', selectedDepartment),
                        orderBy('name')
                    );
                } else {
                    // If no department selected, filter by allowed departments
                    if (departmentsToDisplay.length > 0) {
                        usersQuery = query(
                            collection(db, 'users'),
                            where('status', '==', 'active'),
                            where('primaryDepartment', 'in', departmentsToDisplay),
                            orderBy('name')
                        );
                    }
                }

                const usersSnapshot = await getDocs(usersQuery);
                const users = usersSnapshot.docs.map(doc => ({ id: doc.id, email: doc.id, ...doc.data() }));

                if (users.length === 0) {
                    dataContainer.innerHTML = `<p class="text-center p-4 text-gray-500">No active users found for the selected criteria.</p>`;
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>Generate Report';
                    return;
                }

                // Fetch leave quotas for all users
                leaveBalanceData = [];
                const quotaPromises = users.map(async (user) => {
                    try {
                        const quotaRef = doc(db, 'users', user.email, 'leaveQuotas', String(selectedYear));
                        const quotaDoc = await getDoc(quotaRef);
                        const quotaData = quotaDoc.exists() ? quotaDoc.data() : {};

                        // Parse all quota types dynamically
                        const quotaTypes = appConfig.requestTypes.filter(type => type.hasQuota);
                        const balanceRow = {
                            Name: user.name || 'N/A',
                            Department: user.primaryDepartment || 'N/A'
                        };

                        // For each quota type, calculate balance
                        quotaTypes.forEach(type => {
                            const quotaKey = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
                            const takenKey = `${quotaKey}-taken`;
                            const total = quotaData[quotaKey] || 0;
                            const taken = quotaData[takenKey] || 0;
                            const balance = total - taken;
                            
                            // Add columns for this quota type
                            balanceRow[`${type.name} Total`] = total;
                            balanceRow[`${type.name} Used`] = taken;
                            balanceRow[`${type.name} Balance`] = balance;
                        });

                        // Also check for any other keys starting with 'edit-' that might not be in requestTypes
                        Object.keys(quotaData).forEach(key => {
                            if (key.startsWith('edit-') && !key.endsWith('-taken')) {
                                const takenKey = `${key}-taken`;
                                const total = quotaData[key] || 0;
                                const taken = quotaData[takenKey] || 0;
                                const balance = total - taken;
                                
                                // Convert key to readable name (e.g., 'edit-annual-leave' -> 'Annual Leave')
                                const readableName = key.replace('edit-', '').split('-').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ');
                                
                                // Only add if not already added by requestTypes
                                if (!balanceRow[`${readableName} Total`]) {
                                    balanceRow[`${readableName} Total`] = total;
                                    balanceRow[`${readableName} Used`] = taken;
                                    balanceRow[`${readableName} Balance`] = balance;
                                }
                            }
                        });

                        return balanceRow;
                    } catch (error) {
                        console.error(`Error fetching quota for user ${user.email}:`, error);
                        return {
                            Name: user.name || 'N/A',
                            Department: user.primaryDepartment || 'N/A',
                            Error: 'Failed to load quota'
                        };
                    }
                });

                const balanceRows = await Promise.all(quotaPromises);
                leaveBalanceData = balanceRows;

                // Generate table headers dynamically
                const headers = leaveBalanceData.length > 0 ? Object.keys(leaveBalanceData[0]) : ['Name', 'Department'];

                // Render table
                let tableHTML = `
                    <div class="overflow-x-auto mb-4">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    ${headers.map(h => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${h}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                `;

                if (leaveBalanceData.length === 0) {
                    tableHTML += `<tr><td colspan="${headers.length}" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No leave balance data found.</td></tr>`;
                } else {
                    leaveBalanceData.forEach(row => {
                        tableHTML += `<tr>`;
                        headers.forEach(header => {
                            const value = row[header] !== undefined && row[header] !== null ? row[header] : 'N/A';
                            const cellClass = header.includes('Balance') && typeof value === 'number' && value < 0 
                                ? 'px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold' 
                                : 'px-6 py-4 whitespace-nowrap text-sm text-gray-700';
                            tableHTML += `<td class="${cellClass}">${value}</td>`;
                        });
                        tableHTML += `</tr>`;
                    });
                }

                tableHTML += `
                            </tbody>
                        </table>
                    </div>
                `;

                dataContainer.innerHTML = tableHTML;

                // Remove old export button container if exists
                const oldExportContainer = filtersContainer.querySelector('#leave-balance-export-container');
                if (oldExportContainer) {
                    oldExportContainer.remove();
                }
                
                // Add Export CSV button
                const exportBtn = document.createElement('button');
                exportBtn.id = 'export-leave-balance-csv-btn';
                exportBtn.className = 'w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 shadow-sm';
                exportBtn.innerHTML = `<i class="fas fa-file-csv mr-2"></i>Export CSV`;
                exportBtn.addEventListener('click', () => {
                    exportToCSV(leaveBalanceData, `leave-balances-${selectedYear}${selectedDepartment ? '-' + selectedDepartment.replace(/ /g, '_') : ''}`);
                });
                
                // Append export button to filters container
                const exportContainer = document.createElement('div');
                exportContainer.id = 'leave-balance-export-container';
                exportContainer.className = 'mt-4';
                exportContainer.appendChild(exportBtn);
                filtersContainer.appendChild(exportContainer);

            } catch (error) {
                console.error('Error fetching leave balances:', error);
                dataContainer.innerHTML = `<p class="text-center p-4 text-red-600">Error loading leave balances: ${error.message}</p>`;
            } finally {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-cogs mr-2"></i>Generate Report';
            }
        };

        // Event listeners
        generateBtn.addEventListener('click', fetchAndRenderData);
        
        // Auto-generate on initial load
        fetchAndRenderData();

    } catch (error) {
        console.error('Error initializing leave balance report:', error);
        filtersContainer.innerHTML = `<p class="text-center p-4 text-red-600">Error initializing report: ${error.message}</p>`;
        dataContainer.innerHTML = '';
    }
};

// --- And then REPLACE the existing loadReport and renderReports functions ---
const loadReport = (reportType) => {
    const contentContainer = document.getElementById('report-content-container');
    contentContainer.innerHTML = `<div id="report-filters"></div><div id="report-data-container"></div>`;
    
    switch (reportType) {
        case 'livestatus':
            renderLiveStatusReport();
            break;
        case 'payroll':
            renderPayrollReport();
            break;
        case 'exceptions':
            renderExceptionsReport();
            break;
        case 'support':
            renderSupportTicketsReport();
            break;
        case 'leave':
            renderLeaveReport();
            break;
        case 'leave-balances':
            renderLeaveBalanceReport();
            break;
        case 'claims':
            renderClaimsReport();
            break;
        case 'purchasing':
            renderPurchasingReport();
            break;
        case 'bill-payments':
            renderBillPaymentsReport();
            break;
        case 'attendance':
            renderAttendanceReport();
            break;
        case 'announcements':
             renderAnnouncementsReport();
             break;
        default:
            document.getElementById('report-data-container').innerHTML = '<p class="text-center p-4">Select a report type.</p>';
    }
};

// in app.js
const renderReports = async () => {
    pageTitle.textContent = 'Reports';

    // --- START: NEW ROLE-BASED TAB PERMISSION LOGIC ---
    const allTabs = [
        { id: 'livestatus', label: 'Live Status' },
        { id: 'payroll', label: 'Payroll Summary' },
        { id: 'exceptions', label: 'Attendance Exceptions' },
        { id: 'support', label: 'Support Tickets' },
        { id: 'leave', label: 'Leave / OT' },
        { id: 'leave-balances', label: 'Leave Balances' },
        { id: 'claims', label: 'Claims' },
        { id: 'purchasing', label: 'Purchasing' },
        { id: 'bill-payments', label: 'Bill Payments' },
        { id: 'attendance', label: 'Attendance History' },
        { id: 'announcements', label: 'Announcements' }
    ];

    const userRoles = new Set(userData.roles);
    const visibleTabIds = new Set();

    // 1. Grant permissions for roles that see all or most tabs
    if (userRoles.has('Director') || userRoles.has('RegionalDirector') || userRoles.has('DepartmentManager')) {
        allTabs.forEach(tab => visibleTabIds.add(tab.id));
    }
    if (userRoles.has('HR') || userRoles.has('HR Head')) {
        // HR and HR Head see all tabs EXCEPT Claims and Purchasing
        allTabs.forEach(tab => {
            if (tab.id !== 'claims' && tab.id !== 'purchasing') {
                visibleTabIds.add(tab.id);
            }
        });
    }

    // 2. Grant permissions for roles with very specific tab access
    if (userRoles.has('Purchaser')) {
        visibleTabIds.add('purchasing');
        visibleTabIds.add('announcements');
    }
    if (userRoles.has('Finance')) {
        visibleTabIds.add('claims');
        visibleTabIds.add('purchasing');
        visibleTabIds.add('bill-payments');
        visibleTabIds.add('announcements');
    }
    if (userRoles.has('Admin') || userRoles.has('IT')) {
        visibleTabIds.add('announcements');
    }
    
    // 3. Render the UI based on the final list of visible tabs
    const visibleTabs = allTabs.filter(tab => visibleTabIds.has(tab.id));
    
    if (visibleTabs.length === 0) {
        contentArea.innerHTML = `<div class="bg-white p-6 rounded-lg shadow text-center text-gray-500">You do not have permission to view any reports.</div>`;
        return;
    }

    const defaultReport = visibleTabs[0].id;
    
    const tabsHTML = visibleTabs.map((tab, index) => {
        const isActive = index === 0;
        const activeClasses = 'border-indigo-500 text-indigo-600';
        const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
        return `<button class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${isActive ? activeClasses : inactiveClasses}" data-report="${tab.id}">${tab.label}</button>`;
    }).join('');

    contentArea.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="mb-4 border-b border-gray-200">
                <nav class="-mb-px flex space-x-8 overflow-x-auto" id="report-tabs">
                    ${tabsHTML}
                </nav>
            </div>
            <div id="report-content-container"></div>
        </div>
    `;
    // --- END: NEW ROLE-BASED TAB PERMISSION LOGIC ---

    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(t => {
                t.classList.remove('border-indigo-500', 'text-indigo-600');
                t.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            e.currentTarget.classList.add('border-indigo-500', 'text-indigo-600');
            e.currentTarget.classList.remove('border-transparent', 'text-gray-500');
            loadReport(e.currentTarget.dataset.report);
        });
    });

    loadReport(defaultReport);
};

// =================================================================================
// END: REPORTS PAGE FUNCTIONS
// =================================================================================


// --- UI & Modal Logic ---

// =================================================================================
// START: NEW FUNCTIONS FOR ATTENDANCE EXCEPTION WORKFLOW
// =================================================================================

const openCorrectAttendanceModal = async (exception) => {
    correctAttendanceForm.reset();
    
    // Populate the modal with data from the exception object
    document.getElementById('correct-exception-id').value = exception.id;
    document.getElementById('correct-user-id').value = exception.userId;
    document.getElementById('correct-date').value = exception.date;
    document.getElementById('correct-employee-name').textContent = exception.userName;
    document.getElementById('correct-exception-date').textContent = formatDate(exception.date);

    // Find the original attendance record to pre-fill times
    const attendanceQuery = query(
        collection(db, 'attendance'), 
        where('userId', '==', exception.userId), 
        where('date', '==', exception.date), 
        limit(1)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    if (!attendanceSnapshot.empty) {
        const attendanceRecord = attendanceSnapshot.docs[0].data();
        document.getElementById('correct-attendance-doc-id').value = attendanceSnapshot.docs[0].id;
        if (attendanceRecord.checkInTime) {
            document.getElementById('correct-check-in').value = new Date(attendanceRecord.checkInTime.seconds * 1000).toTimeString().substring(0,5);
        }
        if (attendanceRecord.checkOutTime) {
            document.getElementById('correct-check-out').value = new Date(attendanceRecord.checkOutTime.seconds * 1000).toTimeString().substring(0,5);
        }
    } else {
        // If no record exists (e.g., for 'Absent'), clear the doc ID
        document.getElementById('correct-attendance-doc-id').value = '';
    }

    correctAttendanceModal.classList.remove('hidden');
};

const closeCorrectAttendanceModal = () => correctAttendanceModal.classList.add('hidden');

const handleCorrectAttendanceSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    const payload = {
        exceptionId: document.getElementById('correct-exception-id').value,
        attendanceDocId: document.getElementById('correct-attendance-doc-id').value, // Can be empty
        userId: document.getElementById('correct-user-id').value,
        date: document.getElementById('correct-date').value,
        checkIn: document.getElementById('correct-check-in').value,
        checkOut: document.getElementById('correct-check-out').value,
        remarks: document.getElementById('correct-remarks').value,
        correctedBy: currentUser.email
    };

    try {
        // We will create this Cloud Function in the next step
        const correctAttendanceRecord = httpsCallable(functions, 'correctAttendanceRecord');
        const result = await correctAttendanceRecord(payload);
        
        alert(result.data.message);
        closeCorrectAttendanceModal();
        loadReport('exceptions'); // Refresh the report view
    } catch (error) {
        console.error("Error correcting attendance record:", error);
        alert(`Failed to save correction: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Correction';
    }
};

const openResolveExceptionModal = (exception) => {
    resolveExceptionForm.reset();
    document.getElementById('resolve-exception-id').value = exception.id;
    document.getElementById('resolve-employee-name').textContent = exception.userName;
    document.getElementById('resolve-exception-date').textContent = formatDate(exception.date);
    document.getElementById('resolve-exception-type').textContent = exception.type;
    resolveExceptionModal.classList.remove('hidden');
};

const closeResolveExceptionModal = () => resolveExceptionModal.classList.add('hidden');

const handleResolveExceptionSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    const exceptionId = document.getElementById('resolve-exception-id').value;
    const notes = document.getElementById('resolve-notes').value;

    try {
        const exceptionRef = doc(db, 'attendanceExceptions', exceptionId);
        await updateDoc(exceptionRef, {
            status: 'Resolved',
            resolutionNotes: notes,
            resolvedBy: currentUser.email,
            resolvedAt: serverTimestamp()
        });
        
        alert('Exception has been successfully resolved.');
        closeResolveExceptionModal();
        loadReport('exceptions'); // Refresh the report view
    } catch (error) {
        console.error("Error resolving exception:", error);
        alert(`Failed to resolve exception: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Mark as Resolved';
    }
};

// =================================================================================
// END: NEW FUNCTIONS FOR ATTENDANCE EXCEPTION WORKFLOW
// =================================================================================


// in app.js
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
        
        // --- This is the new line we are adding. It works for all request types. ---
        const processedAtHtml = data.processedAt ? `<p><strong>Processed On:</strong> ${formatDateTime(data.processedAt.toDate())}</p>` : '';

        switch(collectionName) {
            case 'requests':
                modalTitle.textContent = 'Leave / OT Request Details';
                bodyHtml += `
                    <p><strong>Applicant:</strong> ${data.userName}</p>
                    <p><strong>Submitted On:</strong> ${formatDateTime(data.createdAt.toDate())}</p>
                    ${processedAtHtml} <p><strong>Type:</strong> ${data.type}</p>
                    <p><strong>Dates:</strong> ${formatDateTime(data.startDate)} to ${formatDateTime(data.endDate)}</p>
                    <p><strong>Hours Claimed:</strong> ${data.hours}</p>
                    <p><strong>Reason:</strong><br><span class="pl-2">${data.reason}</span></p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    ${data.documentUrl ? `<p><strong>Document:</strong> <a href="${data.documentUrl}" target="_blank" class="text-indigo-600 hover:underline">View Document</a></p>` : ''}
                `;
                if (isApproval && data.status === 'Pending') { footerHtml += `<button class="reject-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button><button class="approve-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}" data-user-id="${data.userId}" data-type="${data.type}" data-hours="${data.hours}" data-start-date="${data.startDate}">Approve</button>`; }
                break;
            case 'claims':
                modalTitle.textContent = 'Expense Claim Details';
                bodyHtml += `
                    <p><strong>Applicant:</strong> ${data.userName}</p>
                    <p><strong>Submitted On:</strong> ${formatDateTime(data.createdAt.toDate())}</p>
                    ${processedAtHtml} <p><strong>Claim Type:</strong> ${data.claimType}</p>
                    <p><strong>Expense Date:</strong> ${formatDate(data.expenseDate)}</p>
                    <p><strong>Amount:</strong> RM${data.amount.toFixed(2)}</p>
                    <p><strong>Description:</strong><br><span class="pl-2">${data.description}</span></p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    ${data.receiptUrl ? `<p><strong>Receipt:</strong> <a href="${data.receiptUrl}" target="_blank" class="text-indigo-600 hover:underline">View Receipt</a></p>` : '<p><strong>Receipt:</strong> No receipt was uploaded.</p>'}
                `;
                if (data.status === 'Rejected' && data.rejectionReason) {
                    bodyHtml += `<div class="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md"><p class="font-bold">Rejection Details</p><p class="text-sm"><strong>Rejected By:</strong> ${data.rejectedBy || 'N/A'}</p><p class="text-sm"><strong>Reason:</strong> ${data.rejectionReason}</p></div>`;
                }
                if (isApproval) {
                    if (data.status === 'Pending' && !userData.roles.includes('Finance')) {
                        footerHtml += `<button class="reject-claim-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button><button class="approve-claim-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Approve</button>`;
                    } else if (data.status === 'Approved' && userData.roles.includes('Finance')) {
                        footerHtml += `<button class="reject-claim-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button><button class="paid-claim-button bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Mark as Paid</button>`;
                    }
                }
                break;
            case 'purchaseRequests':
                modalTitle.textContent = 'Purchase Request Details';
                bodyHtml += `
                    <p><strong>Applicant:</strong> ${data.userName}</p>
                    <p><strong>Submitted On:</strong> ${formatDateTime(data.createdAt.toDate())}</p>
                    ${processedAtHtml} 
                    <p><strong>Item:</strong> ${data.itemDescription}</p>
                    <p><strong>Quantity:</strong> ${data.quantity}</p>
                    <p><strong>Estimated Cost:</strong> RM${data.estimatedCost.toFixed(2)}</p>
                    <p><strong>Justification:</strong><br><span class="pl-2">${data.justification}</span></p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    ${data.productLink ? `<p><strong>Product Link:</strong> <a href="${data.productLink}" target="_blank" class="text-indigo-600 hover:underline">View Product</a></p>` : ''}
                `;
                if (isApproval && data.status === 'Pending') { footerHtml += `<button class="reject-purchase-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button><button class="approve-purchase-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Approve</button>`; }
                else if (isApproval && data.status === 'Approved' && userData.roles.includes('Purchaser')) { footerHtml += `<button class="process-purchase-button bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Start Processing</button>`; }
                else if (isApproval && data.status === 'Processing' && userData.roles.includes('Purchaser')) { footerHtml += `<button class="open-complete-purchase-modal-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md ml-2">Complete Purchase</button>`; }
                break;
        
case 'paymentRequests':
                modalTitle.textContent = 'Bill Payment Details';
                bodyHtml += `
                    <p><strong>Submitted By:</strong> ${data.userName}</p>
               <p><strong>Submitted On:</strong> ${formatDateTime(data.createdAt.toDate())}</p>
                    <p><strong>Department:</strong> ${data.department}</p>
                    <p><strong>Vendor Name:</strong> ${data.vendorName}</p>
                    <p><strong>Amount Due:</strong> RM${data.amount.toFixed(2)}</p>
                    <p><strong>Billing Date:</strong> ${formatDate(data.billingDate)}</p>
                    <p><strong>Notes:</strong><br><span class="pl-2">${data.notes || 'N/A'}</span></p>
                    <p><strong>Invoice:</strong> <a href="${data.invoiceUrl}" target="_blank" class="text-indigo-600 hover:underline">View Invoice</a></p>
                    <p><strong>Status:</strong> ${data.status}</p>
                `;
                if (isApproval) {
               if (data.status === 'Pending Approval') {
                        footerHtml += `<button class="reject-payment-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button><button class="approve-payment-button bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Approve</button>`;
                    } else if (data.status === 'Pending Finance' && userData.roles.includes('Finance')) {
                        footerHtml += `<button class="reject-payment-button bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md ml-2" data-id="${requestId}">Reject</button><button class="paid-payment-button bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md" data-id="${requestId}">Mark as Paid</button>`;
                    }
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
        if (document.querySelector('.open-complete-purchase-modal-btn')) document.querySelector('.open-complete-purchase-modal-btn').addEventListener('click', () => openCompletePurchaseModal(requestId));
if (document.querySelector('.approve-payment-button')) document.querySelector('.approve-payment-button').addEventListener('click', (e) => handleBillPaymentUpdate(e.target.dataset.id, 'Pending Finance', 'approvedBy'));
        if (document.querySelector('.reject-payment-button')) document.querySelector('.reject-payment-button').addEventListener('click', (e) => handleBillPaymentUpdate(e.target.dataset.id, 'Rejected', 'processedBy'));
        if (document.querySelector('.paid-payment-button')) document.querySelector('.paid-payment-button').addEventListener('click', (e) => handleBillPaymentUpdate(e.target.dataset.id, 'Paid', 'processedBy'));
        
    } catch (error) {
        console.error("Error opening request details:", error);
        modalBody.innerHTML = 'Failed to load request details.';
    }
};

const closeRequestDetailsModal = () => {
    const modal = document.getElementById('view-request-modal');
    modal.classList.add('hidden');
};

// in app.js
const handleApproveRequest = async (e) => {
    const button = e.target;
    const requestId = button.dataset.id;
    const requestUserId = button.dataset.userId;
    const requestType = button.dataset.type;
    const requestHours = parseInt(button.dataset.hours, 10);
    const requestStartDate = button.dataset.startDate;
    if (!confirm("Are you sure you want to approve this request?")) return;
    const requestRef = doc(db, 'requests', requestId);
    const requestTypeConfig = appConfig.requestTypes.find(rt => rt.name === requestType);

    // --- START: ADDED processedAt ---
    const updateData = {
        status: 'Approved',
        approvedBy: currentUser.email,
        processedAt: serverTimestamp() // This is the new field
    };
    // --- END: ADDED processedAt ---

    try {
        if (requestTypeConfig && requestTypeConfig.hasQuota) {
            await runTransaction(db, async (transaction) => {
                const quotaYear = requestStartDate ? new Date(requestStartDate).getFullYear() : new Date().getFullYear();
                const quotaRef = doc(db, 'users', requestUserId, 'leaveQuotas', String(quotaYear));
                const quotaDoc = await transaction.get(quotaRef);
                if (!quotaDoc.exists()) throw "Leave quota for this user has not been set for the current year.";
                const quotaData = quotaDoc.data();
                const quotaField = `edit-${requestType.toLowerCase().replace(/ /g, '-')}`;
                const takenField = `${quotaField}-taken`;
                const currentTaken = quotaData[takenField] || 0;
                const newTaken = currentTaken + requestHours;
                transaction.update(quotaRef, { [takenField]: newTaken });
                transaction.update(requestRef, updateData); // Use the new updateData object
            });
        } else {
            await updateDoc(requestRef, updateData); // Use the new updateData object
        }
        alert('Request approved successfully!');
        closeRequestDetailsModal();
        // Remove the item from the list without reloading the page to preserve scroll
        const viewButton = document.querySelector(`button[data-id="${requestId}"]`);
        if (viewButton) {
            const listItem = viewButton.closest('.bg-gray-50');
            if (listItem) listItem.remove();
        }
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
        // --- START: ADDED processedAt ---
        await updateDoc(requestRef, {
            status: 'Rejected',
            approvedBy: currentUser.email,
            processedAt: serverTimestamp() // This is the new field
        });
        // --- END: ADDED processedAt ---
        alert('Request rejected.');
        closeRequestDetailsModal();
        // Remove the item from the list without reloading the page to preserve scroll
        const viewButton = document.querySelector(`button[data-id="${requestId}"]`);
        if (viewButton) {
            const listItem = viewButton.closest('.bg-gray-50');
            if (listItem) listItem.remove();
        }
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert("Failed to reject request.");
    }
};

// in app.js
const handleApproveClaim = async (e) => {
    const claimId = e.target.dataset.id;
    if (!confirm("Are you sure you want to approve this claim?")) return;
    try {
        const claimRef = doc(db, 'claims', claimId);
        await updateDoc(claimRef, {
            status: 'Approved',
            approvedBy: currentUser.email,
            processedAt: serverTimestamp() // ADDED THIS LINE
        });
        alert('Claim approved.');
        closeRequestDetailsModal();
        // Remove the item from the list without reloading the page to preserve scroll
        const viewButton = document.querySelector(`button[data-id="${claimId}"]`);
        if (viewButton) {
            const listItem = viewButton.closest('.bg-gray-50');
            if (listItem) listItem.remove();
        }
    } catch (error) {
        console.error("Error approving claim:", error);
        alert("Failed to approve claim.");
    }
};

// in app.js
const handleRejectClaim = async (e) => {
    const claimId = e.target.dataset.id;
    
    const reason = prompt("Please provide a reason for rejecting this claim:");
    if (reason === null) {
        return; 
    }
    if (!reason.trim()) {
        alert("A reason is required to reject a claim.");
        return;
    }

    try {
        const claimRef = doc(db, 'claims', claimId);
        await updateDoc(claimRef, { 
            status: 'Rejected', 
            rejectionReason: reason,
            rejectedBy: currentUser.email,
            processedAt: serverTimestamp() // ADDED THIS LINE
        });

        alert('Claim rejected.');
        closeRequestDetailsModal();
        // Remove the item from the list without reloading the page to preserve scroll
        const viewButton = document.querySelector(`button[data-id="${claimId}"]`);
        if (viewButton) {
            const listItem = viewButton.closest('.bg-gray-50');
            if (listItem) listItem.remove();
        }
    } catch (error) {
        console.error("Error rejecting claim:", error);
        alert("Failed to reject claim.");
    }
};

// in app.js
const handleMarkAsPaid = async (e) => {
    const claimId = e.target.dataset.id;
    if (!confirm("Are you sure you want to mark this claim as paid? This action cannot be undone.")) return;
    try {
        const claimRef = doc(db, 'claims', claimId);
        await updateDoc(claimRef, {
            status: 'Paid',
            processedBy: currentUser.email,
            processedAt: serverTimestamp() // ADDED THIS LINE
        });
        alert('Claim marked as paid.');
        closeRequestDetailsModal();
        navigateTo('approvals');
    } catch (error) {
        console.error("Error marking claim as paid:", error);
        alert("Failed to update claim status.");
    }
};

// in app.js
const handlePurchaseUpdate = async (requestId, newStatus, userField) => {
    if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;
    try {
        const requestRef = doc(db, 'purchaseRequests', requestId);
        await updateDoc(requestRef, {
            status: newStatus,
            [userField]: currentUser.email,
            processedAt: serverTimestamp() // <-- ADDED THIS LINE
        });
        alert(`Request marked as ${newStatus}.`);
        closeRequestDetailsModal();
        // Remove the item from the list without reloading the page to preserve scroll
        const viewButton = document.querySelector(`button[data-id="${requestId}"]`);
        if (viewButton) {
            const listItem = viewButton.closest('.bg-gray-50');
            if (listItem) listItem.remove();
        }
    } catch (error) {
        console.error(`Error updating purchase request to ${newStatus}:`, error);
        alert(`Failed to update request.`);
    }
};

// in app.js
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

    // --- START: NEW LOGIC ---
    // Find the target user in our list to get their department
    const targetUser = allUsers.find(user => user.id === userId);
    if (!targetUser) {
        alert("Could not find the target user to verify department. Aborting upload.");
        return;
    }
    const targetUserDepartment = targetUser.primaryDepartment;

    // Create file metadata to send with the upload
    const metadata = {
        customMetadata: {
            'targetUserDepartment': targetUserDepartment
        }
    };
    // --- END: NEW LOGIC ---

    uploadButton.disabled = true;
    uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const storagePath = `user-documents/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    // Pass the metadata with the upload task
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

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



// in app.js
const openEditModal = async (userId) => {
    const userToEdit = allUsers.find(user => user.id === userId);
    if (!userToEdit) { alert("User not found!"); return; }

    document.getElementById('edit-user-form').reset();
    
    const isDirector = userData.roles.includes('Director');
    const isHrHead = userData.roles.includes('HR Head');
    const isHr = userData.roles.includes('HR');
    const isFinance = userData.roles.includes('Finance');

    document.getElementById('edit-user-id').value = userToEdit.id;
    document.getElementById('edit-name').textContent = userToEdit.name;
    document.getElementById('edit-email').textContent = userToEdit.email;
    document.getElementById('edit-status').value = userToEdit.status;
    
    const deptSelect = document.getElementById('edit-department');
    const rolesContainer = document.getElementById('edit-roles');
    const managedDeptsContainer = document.getElementById('edit-managed-departments');
    const statusSelect = document.getElementById('edit-status');
    const quotaContainer = document.getElementById('edit-leave-quotas-container');
    const scheduleContainer = document.getElementById('edit-work-schedule-container');
    const saveButton = document.querySelector('#edit-user-form button[type="submit"]');
    const cancelButton = document.getElementById('modal-cancel-button');

    const assignableDepts = isDirector ? appConfig.availableDepartments : (userData.managedDepartments || []);
    deptSelect.innerHTML = assignableDepts.map(dept => `<option value="${dept}" ${dept === userToEdit.primaryDepartment ? 'selected' : ''}>${dept}</option>`).join('');

    let assignableRoles = appConfig.availableRoles;
    if (isHrHead || userData.roles.includes('RegionalDirector')) {
        assignableRoles = appConfig.availableRoles.filter(role => role !== 'Director');
    }
    rolesContainer.innerHTML = assignableRoles.map(role => {
        const isChecked = userToEdit.roles.includes(role);
        return `<label class="flex items-center"><input type="checkbox" class="form-checkbox h-5 w-5 text-indigo-600" value="${role}" ${isChecked ? 'checked' : ''}><span class="ml-2 text-gray-700">${role}</span></label>`
    }).join('');

    managedDeptsContainer.innerHTML = assignableDepts.map(dept => {
        const isChecked = userToEdit.managedDepartments && userToEdit.managedDepartments.includes(dept);
        return `<label class="flex items-center"><input type="checkbox" class="form-checkbox h-5 w-5 text-indigo-600" value="${dept}" ${isChecked ? 'checked' : ''}><span class="ml-2 text-gray-700">${dept}</span></label>`
    }).join('');

    const isStandardHr = isHr && !isHrHead && !isDirector;

    // Reset all fields to enabled by default
    deptSelect.disabled = false;
    rolesContainer.querySelectorAll('input').forEach(input => input.disabled = false);
    managedDeptsContainer.querySelectorAll('input').forEach(input => input.disabled = false);
    statusSelect.disabled = false;
    scheduleContainer.querySelectorAll('input').forEach(input => input.disabled = false);
    
    // --- START: IMPROVED UI LOGIC ---
    // Reset buttons to default state
    saveButton.classList.remove('hidden');
    cancelButton.textContent = 'Cancel';

    if (isStandardHr) {
        deptSelect.disabled = true;
        rolesContainer.querySelectorAll('input').forEach(input => input.disabled = true);
        managedDeptsContainer.querySelectorAll('input').forEach(input => input.disabled = true);
    } else if (isFinance) {
        deptSelect.disabled = true;
        rolesContainer.querySelectorAll('input').forEach(input => input.disabled = true);
        managedDeptsContainer.querySelectorAll('input').forEach(input => input.disabled = true);
        statusSelect.disabled = true;
        scheduleContainer.querySelectorAll('input').forEach(input => input.disabled = true);
        
        // Hide Save button and rename Cancel to Close for Finance role
        saveButton.classList.add('hidden');
        cancelButton.textContent = 'Close';
    }
    // --- END: IMPROVED UI LOGIC ---

    const year1 = new Date().getFullYear();
    const years = [year1, year1 + 1, year1 + 2];
    const quotaRefs = years.map(year => doc(db, 'users', userId, 'leaveQuotas', String(year)));
    const quotaDocs = await Promise.all(quotaRefs.map(ref => getDoc(ref)));
    const quotaData = {
        [years[0]]: quotaDocs[0].exists() ? quotaDocs[0].data() : {},
        [years[1]]: quotaDocs[1].exists() ? quotaDocs[1].data() : {},
        [years[2]]: quotaDocs[2].exists() ? quotaDocs[2].data() : {}
    };
    
    quotaContainer.innerHTML = '';
    const yearOptionsHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
    quotaContainer.innerHTML += `<div class="md:col-span-2 mb-4"><label for="quota-year-selector" class="block text-sm font-medium text-gray-700">Select Year to Edit</label><select id="quota-year-selector" class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">${yearOptionsHTML}</select></div>`;
    years.forEach((year, index) => {
        let inputsHTML = '';
        appConfig.requestTypes.forEach(type => {
            if (type.hasQuota) {
                const inputId = `quota-${year}-${type.name.toLowerCase().replace(/ /g, '-')}`;
                const firestoreFieldName = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
                const quotaValue = quotaData[year][firestoreFieldName] || '';
                inputsHTML += `<div><label for="${inputId}" class="block text-sm font-medium text-gray-600">${type.name} Quota</label><input type="number" id="${inputId}" class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm sm:text-sm" value="${quotaValue}" placeholder="e.g., 112"></div>`;
            }
        });
        quotaContainer.innerHTML += `<div id="quota-content-${year}" class="year-content-panel md:col-span-2 grid grid-cols-2 gap-4 ${index > 0 ? 'hidden' : ''}">${inputsHTML}</div>`;
    });
    document.getElementById('quota-year-selector').addEventListener('change', (e) => {
        const selectedYear = e.target.value;
        document.querySelectorAll('.year-content-panel').forEach(panel => {
            panel.id === `quota-content-${selectedYear}` ? panel.classList.remove('hidden') : panel.classList.add('hidden');
        });
    });
    
    if (isFinance) {
        quotaContainer.querySelectorAll('input, select').forEach(input => input.disabled = true);
    }

    scheduleContainer.innerHTML = '';
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const userSchedule = userToEdit.workSchedule || {};
    daysOfWeek.forEach(day => {
        const dayData = userSchedule[day] || { active: false, checkIn: '', checkOut: '' };
        scheduleContainer.innerHTML += `<div class="grid grid-cols-6 gap-3 items-center"><label class="flex items-center col-span-2"><input type="checkbox" id="sch-active-${day}" class="form-checkbox h-5 w-5 text-indigo-600" ${dayData.active ? 'checked' : ''}><span class="ml-2 text-gray-800 font-medium">${day}</span></label><div class="col-span-2"><label for="sch-in-${day}" class="text-xs text-gray-500">Check-in</label><input type="time" id="sch-in-${day}" value="${dayData.checkIn || ''}" class="mt-1 block w-full py-1 px-2 border border-gray-300 rounded-md text-sm"></div><div class="col-span-2"><label for="sch-out-${day}" class="text-xs text-gray-500">Check-out</label><input type="time" id="sch-out-${day}" value="${dayData.checkOut || ''}" class="mt-1 block w-full py-1 px-2 border border-gray-300 rounded-md text-sm"></div></div>`;
    });

    const docsListEl = document.getElementById('existing-docs-list');
    const renderDocs = async () => {
        try {
            const docsQuery = query(collection(db, 'users', userId, 'documents'), orderBy('uploadTimestamp', 'desc'));
            const docsSnapshot = await getDocs(docsQuery);
            if (docsSnapshot.empty) {
                docsListEl.innerHTML = '<p class="text-gray-500 text-center">No documents found.</p>';
                return;
            }
            docsListEl.innerHTML = docsSnapshot.docs.map(docSnap => {
                const docData = docSnap.data();
                return `<div class="flex justify-between items-center bg-white p-2 rounded-md border"><div class="truncate"><i class="fas fa-file-alt text-gray-500 mr-2"></i><a href="${docData.storageUrl}" target="_blank" class="text-sm text-indigo-600 hover:underline" title="${docData.fileName}">${docData.fileName}</a></div><button type="button" class="delete-doc-btn text-red-500 hover:text-red-700 ml-2" data-doc-id="${docSnap.id}" data-storage-path="${docData.storagePath}"><i class="fas fa-trash"></i></button></div>`;
            }).join('');
            document.querySelectorAll('.delete-doc-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const currentBtn = e.currentTarget;
                    handleDocumentDelete(userId, currentBtn.dataset.docId, currentBtn.dataset.storagePath, renderDocs);
                });
            });
        } catch (error) {
            console.error("Error rendering documents:", error);
            docsListEl.innerHTML = '<p class="text-red-500 text-center">Error loading documents.</p>';
        }
    };
    await renderDocs();
    document.getElementById('upload-doc-button').onclick = () => handleDocumentUpload(userId, renderDocs);

    document.getElementById('modal-close-button').addEventListener('click', closeEditModal);
    document.getElementById('modal-cancel-button').addEventListener('click', closeEditModal);
    
    editUserModal.classList.remove('hidden');
};

const closeEditModal = () => editUserModal.classList.add('hidden');


// in app.js
// in app.js
const handleUpdateUser = async (e) => {
    e.preventDefault();
    const userId = document.getElementById('edit-user-id').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    const isDirector = userData.roles.includes('Director');

    let mainUpdateData = {
        primaryDepartment: document.getElementById('edit-department').value,
        status: document.getElementById('edit-status').value,
        roles: Array.from(document.querySelectorAll('#edit-roles input:checked')).map(i => i.value),
        managedDepartments: Array.from(document.querySelectorAll('#edit-managed-departments input:checked')).map(i => i.value),
        workSchedule: {}
    };
    
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    daysOfWeek.forEach(day => {
        const isActive = document.getElementById(`sch-active-${day}`).checked;
        mainUpdateData.workSchedule[day] = {
            active: isActive,
            checkIn: isActive ? document.getElementById(`sch-in-${day}`).value : '',
            checkOut: isActive ? document.getElementById(`sch-out-${day}`).value : ''
        };
    });

    const year1 = new Date().getFullYear();
    const years = [year1, year1 + 1, year1 + 2];
    const quotaUpdatePromises = years.map(year => {
        const updatedQuotaData = {};
        appConfig.requestTypes.forEach(type => {
            if (type.hasQuota) {
                const quotaInputId = `quota-${year}-${type.name.toLowerCase().replace(/ /g, '-')}`;
                const quotaValue = document.getElementById(quotaInputId)?.value;
                if (quotaValue) {
                    const firestoreFieldName = `edit-${type.name.toLowerCase().replace(/ /g, '-')}`;
                    updatedQuotaData[firestoreFieldName] = parseInt(quotaValue, 10) || 0;
                }
            }
        });
        const quotaRef = doc(db, 'users', userId, 'leaveQuotas', String(year));
        return setDoc(quotaRef, updatedQuotaData, { merge: true });
    });

    try {
        let mainUpdatePromise;
        
        // --- START: CORRECTED LOGIC FOR RESTRICTED ROLES ---
        const isStandardHr = userData.roles.includes('HR') && !userData.roles.includes('HR Head') && !userData.roles.includes('Director');
        const isFinance = userData.roles.includes('Finance');

        // Check if the user has a restricted role (standard HR or Finance)
        if (isStandardHr || isFinance) {
            // If they do, we only send the fields they are allowed to modify.
            const allowedUpdates = {
                status: mainUpdateData.status,
                workSchedule: mainUpdateData.workSchedule
            };
            mainUpdateData = allowedUpdates; 
        }
        // --- END: CORRECTED LOGIC FOR RESTRICTED ROLES ---

        if (isDirector) {
            console.log("Director performing direct update...");
            mainUpdatePromise = updateDoc(doc(db, 'users', userId), mainUpdateData);
        } else {
            // This log message is now more accurate.
            console.log("Manager (HR/RD/Finance) calling secure updateUserByManager function...");
            const updateUserByManager = httpsCallable(functions, 'updateUserByManager');
            mainUpdatePromise = updateUserByManager({ 
                targetUserEmail: userId, 
                updates: mainUpdateData 
            });
        }

        await Promise.all([mainUpdatePromise, ...quotaUpdatePromises]);

        alert('User updated successfully!');
        closeEditModal();
        await navigateTo('user-management');

    } catch (e) {
        console.error("Error updating user:", e);
        alert(`Failed to update user: ${e.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save Changes';
    }
};

const openCreateModal = () => {
    createUserForm.reset();

    // 1. Determine which departments the creator can assign a new user to
    const isDirector = userData.roles.includes('Director');
    const assignableDepts = isDirector ? appConfig.availableDepartments : (userData.managedDepartments || []);

    // 2. Populate the new department dropdown
    const deptSelect = document.getElementById('create-department');
    deptSelect.innerHTML = '<option value="">Select a department...</option>'; // Add a placeholder
    assignableDepts.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });

    createUserModal.classList.remove('hidden');
};
const closeCreateModal = () => createUserModal.classList.add('hidden');
const handleCreateUser = async (e) => {
    e.preventDefault();
    const name = document.getElementById('create-name').value.trim();
    const email = document.getElementById('create-email').value.trim().toLowerCase();
    const department = document.getElementById('create-department').value; // Read from the new dropdown

    if (!name || !email || !department) { // Add validation for the department field
        alert("Please fill in all fields, including the department.");
        return;
    }

    try {
        const userRef = doc(db, "users", email);
        if ((await getDoc(userRef)).exists()) {
            alert("A user with this email already exists.");
            return;
        }
        const newUser = {
            name: name,
            email: email,
            photoURL: null,
            createdAt: serverTimestamp(),
            status: "active",
            primaryDepartment: department, // Use the selected department
            roles: ["Staff"],
            managedDepartments: []
        };
        await setDoc(userRef, newUser);
        alert("User created successfully!");
        closeCreateModal();
        navigateTo('user-management'); // Refresh the user list
    } catch (e) {
        console.error("Error creating user:", e);
        alert("Failed to create user.");
    }
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
    document.getElementById('leave-balance-display').textContent = '';
    requestModal.classList.remove('hidden');
};

const closeRequestModal = () => requestModal.classList.add('hidden');

// in app.js
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
    
    const documentFile = document.getElementById('request-document').files[0];

    if (!type || !startDate || !endDate || !reason || !hours) {
        alert("Please fill out all required fields.");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Request';
        return;
    }
    
    const selectedTypeConfig = appConfig.requestTypes.find(rt => rt.name === type);
    if (selectedTypeConfig && selectedTypeConfig.hasQuota) {
        const requestYear = new Date(startDate).getFullYear();
        const quotaRef = doc(db, 'users', currentUser.email, 'leaveQuotas', String(requestYear));
        const quotaDoc = await getDoc(quotaRef);
        const quotaDataForYear = quotaDoc.exists() ? quotaDoc.data() : {};
        const quotaKey = `edit-${type.toLowerCase().replace(/ /g, '-')}`;
        const takenKey = `${quotaKey}-taken`;
        const quota = quotaDataForYear[quotaKey] || 0;
        const taken = quotaDataForYear[takenKey] || 0;
        const balance = quota - taken;

        if (parseInt(hours, 10) > balance) {
            alert(`Submission Failed for year ${requestYear}: You cannot apply for ${hours} hours. Your remaining balance for this leave type is only ${balance} hours.`);
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request';
            return;
        }
    }

    const newRequest = {
        userId: currentUser.email, userName: userData.name, type: type,
        startDate: startDate, endDate: endDate, hours: parseInt(hours, 10),
        reason: reason, status: 'Pending', createdAt: serverTimestamp(),
        department: userData.primaryDepartment,
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
                // --- START: FIX ---
                // Reset button state after a successful upload and save
                submitButton.disabled = false;
                submitButton.innerHTML = 'Submit Request';
                // --- END: FIX ---
            }
        );
    } else {
        await saveRequest();
        // --- START: FIX ---
        // Reset button state after a successful save without an upload
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Request';
        // --- END: FIX ---
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

// in app.js
const handleSupportSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
    const progressIndicator = document.getElementById('support-upload-progress');
    progressIndicator.textContent = '';

    try {
        const assigneeEmail = document.getElementById('support-assign-to').value;
        const subject = document.getElementById('support-subject').value.trim();
        const description = document.getElementById('support-description').value.trim();
        const attachmentLink = document.getElementById('support-link').value.trim();
        const files = document.getElementById('support-file').files; // This is now a FileList

        if (!assigneeEmail || !subject || !description) {
            alert("Please fill out all required fields.");
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
            return;
        }
        
        const assignee = allUsers.find(user => user.email === assigneeEmail);
        const newSupportRequest = {
            requesterId: currentUser.email,
            requesterName: userData.name,
            department: userData.primaryDepartment,
            assigneeId: assignee.email,
            assigneeName: assignee.name,
            subject: subject,
            description: description,
            attachmentLink: attachmentLink || null,
            fileAttachments: [], // We will save files here as an array of objects
            status: 'Open',
            createdAt: serverTimestamp()
        };

        // --- NEW: Multi-file upload logic ---
        if (files.length > 0) {
            const uploadPromises = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const storagePath = `support-ticket-attachments/${currentUser.uid}/${Date.now()}-${file.name}`;
                const storageRef = ref(storage, storagePath);
                
                progressIndicator.textContent = `Uploading file ${i + 1} of ${files.length}...`;
                
                // Create a promise for each upload
                const uploadPromise = uploadBytesResumable(storageRef, file).then(async (snapshot) => {
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    return { fileName: file.name, fileUrl: downloadURL };
                });
                
                uploadPromises.push(uploadPromise);
            }
            
            // Wait for all uploads to complete
            const uploadedFiles = await Promise.all(uploadPromises);
            newSupportRequest.fileAttachments = uploadedFiles;
            progressIndicator.textContent = 'Uploads complete!';
        }
        // --- END: New logic ---

        await addDoc(collection(db, 'supportRequests'), newSupportRequest);
        alert('Support request submitted successfully!');
        closeSupportModal();
        navigateTo('support');

    } catch (error) {
        console.error("Error in handleSupportSubmit:", error);
        alert("An error occurred: " + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Request';
        progressIndicator.textContent = '';
    }
};

// in app.js
const openViewSupportModal = async (taskId) => {
    try {
        const taskRef = doc(db, 'supportRequests', taskId);
        const taskDoc = await getDoc(taskRef);

        if (!taskDoc.exists()) {
            alert("Support ticket not found!");
            return;
        }
        const task = taskDoc.data();
        let attachmentsHtml = '';

        // --- START: MODIFIED ATTACHMENT LOGIC ---

        // 1. Handle the old, single attachment link
        if (task.attachmentLink) {
            attachmentsHtml += `
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700">Attachment Link</label>
                    <a href="${task.attachmentLink}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline break-all">${task.attachmentLink}</a>
                </div>
            `;
        }

        // 2. Handle the old, single file upload
        if (task.fileUrl) {
            attachmentsHtml += `
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700">Attached File</label>
                    <a href="${task.fileUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">
                        <i class="fas fa-paperclip mr-2"></i>View Attached File
                    </a>
                </div>
            `;
        }
        
        // 3. Handle the NEW multiple file attachments
        if (task.fileAttachments && task.fileAttachments.length > 0) {
            attachmentsHtml += `<div class="mt-4"><label class="block text-sm font-medium text-gray-700">Attached Files</label><ul class="list-none space-y-1 mt-1">`;
            task.fileAttachments.forEach(file => {
                attachmentsHtml += `
                    <li>
                        <a href="${file.fileUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">
                            <i class="fas fa-paperclip mr-2"></i>${file.fileName}
                        </a>
                    </li>
                `;
            });
            attachmentsHtml += `</ul></div>`;
        }
        // --- END: MODIFIED ATTACHMENT LOGIC ---

        document.getElementById('view-support-id').value = taskId;
        document.getElementById('view-support-subject').textContent = task.subject;
        document.getElementById('view-support-requester').textContent = task.requesterName;
        document.getElementById('view-support-description').textContent = task.description;
        document.getElementById('view-support-attachments').innerHTML = attachmentsHtml;
        document.getElementById('view-support-status').value = task.status;
        
        viewSupportModal.classList.remove('hidden');
    } catch (error) {
        console.error("Error opening support ticket:", error);
        alert("Could not load support ticket details.");
    }
};

const closeViewSupportModal = () => viewSupportModal.classList.add('hidden');

// in app.js
const handleUpdateSupportStatus = async (e) => {
    e.preventDefault();
    const taskId = document.getElementById('view-support-id').value;
    const newStatus = document.getElementById('view-support-status').value;

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    try {
        const taskRef = doc(db, 'supportRequests', taskId);
        
        const taskDoc = await getDoc(taskRef);
        if (!taskDoc.exists()) {
            throw new Error("Ticket not found.");
        }
        const existingTaskData = taskDoc.data();

        const updateData = { status: newStatus };

        if ((newStatus === 'Completed' || newStatus === 'Closed') && !existingTaskData.completedAt) {
            updateData.completedAt = serverTimestamp();
        }

        await updateDoc(taskRef, updateData);
        alert('Support ticket status updated!');
        closeViewSupportModal();
        navigateTo('my-job');
    } catch (error) {
        console.error("Error updating support status:", error);
        alert("Failed to update status.");
    } finally {
        // This block ensures the button is ALWAYS reset.
        submitButton.disabled = false;
        submitButton.textContent = 'Save Status';
    }
};

// Replace the entire openClaimModal function with this new version
const openClaimModal = () => {
    claimForm.reset();
    const claimTypeSelect = document.getElementById('claim-type');
    const deptContainer = document.getElementById('claim-department-container');
    const deptSelect = document.getElementById('claim-department');
    const receiptInput = document.getElementById('claim-receipt');
    const receiptLabel = document.querySelector('label[for="claim-receipt"]');

    // Populate the claim types dropdown
    claimTypeSelect.innerHTML = '<option value="">Select a type...</option>';
    (appConfig.claimTypes || []).forEach(type => {
        const option = document.createElement('option');
        option.value = type.name;
        option.textContent = type.name;
        option.dataset.category = type.category; 
        claimTypeSelect.appendChild(option);
    });
    
    // Populate the departments dropdown once
    deptSelect.innerHTML = '<option value="">Select a department...</option>';
    (appConfig.availableDepartments || []).forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });

    const updateFormVisibility = () => {
        const selectedOption = claimTypeSelect.options[claimTypeSelect.selectedIndex];
        const category = selectedOption.dataset.category;

        if (category === 'Allowance') {
            deptContainer.classList.remove('hidden');
            deptSelect.required = true;
            receiptInput.required = false;
            if (receiptLabel) receiptLabel.innerHTML = 'Receipt (Optional)';
        } else { // Default for Reimbursement and other types
            deptContainer.classList.add('hidden');
            deptSelect.required = false;
            receiptInput.required = true;
            if (receiptLabel) receiptLabel.innerHTML = 'Receipt <span class="text-red-500">*</span>';
        }
    };
    
    claimTypeSelect.addEventListener('change', updateFormVisibility);
    
    document.getElementById('upload-progress').textContent = '';
    claimModal.classList.remove('hidden');
    updateFormVisibility();
};

const closeClaimModal = () => claimModal.classList.add('hidden');

// Replace the entire handleClaimSubmit function with this new version
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
    
    const selectedOption = document.getElementById('claim-type').options[document.getElementById('claim-type').selectedIndex];
    const category = selectedOption.dataset.category;

    let claimDepartment;
    if (category === 'Allowance') {
        claimDepartment = document.getElementById('claim-department').value;
    } else {
        claimDepartment = userData.primaryDepartment;
    }

    if (!claimType || !expenseDate || !amount || !description || (category === 'Allowance' && !claimDepartment)) {
        alert("Please fill out all required fields.");
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Claim';
        return;
    }
    if (category !== 'Allowance' && !receiptFile) {
        alert('A receipt is required for Reimbursement claims.');
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Claim';
        return;
    }

    const newClaim = {
        userId: currentUser.email,
        userName: userData.name,
        department: claimDepartment,
        claimType: claimType,
        expenseDate: expenseDate,
        amount: amount,
        description: description,
        receiptUrl: null,
        status: 'Pending',
        createdAt: serverTimestamp(),
        approvedBy: null
    };

    const saveClaim = async () => {
        try {
            await addDoc(collection(db, 'claims'), newClaim);
            alert('Claim submitted successfully!');
            closeClaimModal();
            navigateTo('claims');
        } catch (error) {
            console.error("Error submitting claim:", error);
            alert("Failed to submit claim.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Claim';
        }
    };

    if (receiptFile) {
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
                newClaim.receiptUrl = await getDownloadURL(uploadTask.snapshot.ref);
                await saveClaim();
            }
        );
    } else {
        await saveClaim();
    }
};

const openPurchaseRequestModal = () => {
    purchaseRequestForm.reset();
    purchaseRequestModal.classList.remove('hidden');
};

const closePurchaseRequestModal = () => purchaseRequestModal.classList.add('hidden');

// in app.js
const handlePurchaseRequestSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

    try {
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

        await addDoc(collection(db, 'purchaseRequests'), newPurchaseRequest);
        alert('Purchase request submitted successfully!');
        closePurchaseRequestModal();
        navigateTo('purchasing');
    } catch (error) {
        console.error("Error submitting purchase request:", error);
        alert("Failed to submit purchase request.");
    } finally {
        // This block ensures the button is ALWAYS reset.
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Request';
    }
};

const openCompletePurchaseModal = (requestId) => {
    completePurchaseForm.reset();
    document.getElementById('complete-purchase-request-id').value = requestId;
    document.getElementById('purchase-upload-progress').textContent = '';
    
    // NEW: This line moves the modal to the end of the body, ensuring it's on top
    document.body.appendChild(completePurchaseModal);
    
    completePurchaseModal.classList.remove('hidden');
};

const closeCompletePurchaseModal = () => {
    completePurchaseModal.classList.add('hidden');
};

// in app.js
const handleCompletePurchaseSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

    try {
        const requestId = document.getElementById('complete-purchase-request-id').value;
        const receiptFile = document.getElementById('purchase-receipt-upload').files[0];
        const updateData = {
            actualCost: parseFloat(document.getElementById('purchase-actual-cost').value),
            purchaserNotes: document.getElementById('purchaser-notes').value,
            status: 'Completed',
            processedBy: currentUser.email,
            processedAt: serverTimestamp() // <-- ADDED THIS LINE
        };

        if (!updateData.actualCost || !receiptFile || !updateData.purchaserNotes) {
            alert("Please fill out all fields and upload a receipt.");
            submitButton.disabled = false;
            submitButton.innerHTML = 'Save & Complete Purchase';
            return;
        }

        const progressIndicator = document.getElementById('purchase-upload-progress');
        const filePath = `purchase-receipts/${currentUser.uid}/${Date.now()}_${receiptFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, receiptFile);

        await new Promise((resolve, reject) => {
             uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressIndicator.textContent = `Upload is ${progress.toFixed(0)}% done`;
                },
                (error) => {
                    console.error("Upload failed:", error);
                    alert("Receipt upload failed. Please try again.");
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        updateData.purchaseReceiptUrl = downloadURL;
                        const requestRef = doc(db, 'purchaseRequests', requestId);
                        await updateDoc(requestRef, updateData); // This now includes processedAt

                        alert('Purchase request completed successfully!');
                        closeCompletePurchaseModal();
                        closeRequestDetailsModal();
                        navigateTo('approvals');
                        resolve();
                    } catch (dbError) {
                        console.error("Error saving purchase completion data:", dbError);
                        alert("Failed to save purchase details.");
                        reject(dbError);
                    }
                }
            );
        });
    } catch (error) {
        console.error("Error in handleCompletePurchaseSubmit:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Save & Complete Purchase';
    }
};

// --- ADD THESE 3 ENTIRE NEW FUNCTIONS ---

const openBillPaymentModal = () => {
    billPaymentForm.reset();
    document.getElementById('payment-upload-progress').textContent = '';
    const deptContainer = document.getElementById('payment-department-container');
    const deptSelect = document.getElementById('payment-department');

    if (userData.roles.includes('Finance')) {
        // Finance must select a department
        deptContainer.classList.remove('hidden');
       deptSelect.required = true;
        deptSelect.innerHTML = '<option value="">Select a department...</option>';
        appConfig.availableDepartments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        });
    } else {
        // Managers are submitting for their own department
        deptContainer.classList.add('hidden');
        deptSelect.required = false;
    }

    billPaymentModal.classList.remove('hidden');
};

const closeBillPaymentModal = () => billPaymentModal.classList.add('hidden');

const handleBillPaymentSubmit = async (e) => {
   e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

    const invoiceFile = document.getElementById('payment-invoice-upload').files[0];
    const isFinanceSubmitter = userData.roles.includes('Finance');
    const selectedDept = document.getElementById('payment-department').value;

    let department, status;

    if (isFinanceSubmitter) {
        if (!selectedDept) {
            alert("Finance must select a department for this bill.");
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit for Approval';
            return;
        }
        department = selectedDept;
        status = 'Pending Approval'; // Manager must approve it
 } else {
        department = userData.primaryDepartment;
        status = 'Pending Finance'; // Goes straight to Finance
    }

    if (!invoiceFile) {
        alert("You must upload an invoice or bill.");
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit for Approval';
        return;
    }

    const newPaymentRequest = {
        userId: currentUser.email,
        userName: userData.name,
        department: department,
        vendorName: document.getElementById('payment-vendor').value,
        amount: parseFloat(document.getElementById('payment-amount').value),
        billingDate: document.getElementById('payment-billing-date').value,
        notes: document.getElementById('payment-notes').value,
        invoiceUrl: null,
        status: status,
        createdAt: serverTimestamp(),
        approvedBy: null,
        processedBy: null
    };

    const saveRequest = async () => {
        try {
            await addDoc(collection(db, 'paymentRequests'), newPaymentRequest);
            alert('Payment request submitted successfully!');
            closeBillPaymentModal();
            navigateTo('bill-payments');
      } catch (error) {
            console.error("Error submitting payment request:", error);
            alert("Failed to submit request.");
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit for Approval';
        }
    };

    // Upload the invoice
    const progressIndicator = document.getElementById('payment-upload-progress');
    const filePath = `payment-invoices/${currentUser.uid}/${Date.now()}_${invoiceFile.name}`;
   const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, invoiceFile);

    uploadTask.on('state_changed',
        (snapshot) => {
           const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressIndicator.textContent = `Upload is ${progress.toFixed(0)}% done`;
        },
        (error) => {
            console.error("Upload failed:", error);
            alert("Invoice upload failed. Please try again.");
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit for Approval';
     },
        async () => {
            newPaymentRequest.invoiceUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await saveRequest();
        }
    );
};

const handleBillPaymentUpdate = async (requestId, newStatus, userField) => {
    if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;
    try {
        const requestRef = doc(db, 'paymentRequests', requestId);
        await updateDoc(requestRef, {
            status: newStatus,
            [userField]: currentUser.email,
            processedAt: serverTimestamp()
        });
        alert(`Request marked as ${newStatus}.`);
        closeRequestDetailsModal();
        // Remove the item from the list without reloading the page to preserve scroll
        const viewButton = document.querySelector(`button[data-id="${requestId}"]`);
        if (viewButton) {
            const listItem = viewButton.closest('.bg-gray-50');
            if (listItem) listItem.remove();
        }
    } catch (error) {
        console.error(`Error updating bill payment to ${newStatus}:`, error);
        alert(`Failed to update request.`);
    }
};

// --- END OF NEW FUNCTIONS ---

// in app.js
const openAnnouncementModal = () => {
    announcementForm.reset();
    const deptSelect = document.getElementById('announcement-departments');

    const isGlobalAnnouncer = userData.roles.includes('Director');
    const departmentsToShow = isGlobalAnnouncer ? appConfig.availableDepartments : (userData.managedDepartments || []);

    let deptOptionsHTML = '';
    if (isGlobalAnnouncer) {
        deptOptionsHTML += `<option value="__ALL__">All Departments (Global)</option>`;
    }
    departmentsToShow.forEach(dept => {
        deptOptionsHTML += `<option value="${dept}">${dept}</option>`;
    });
    if (departmentsToShow.length === 0 && !isGlobalAnnouncer) {
        deptOptionsHTML = '<option value="" disabled>You are not assigned to manage any departments.</option>';
    }
    deptSelect.innerHTML = deptOptionsHTML;

    // --- CORRECTED AND SAFE-GUARDED CODE BLOCK ---
    const contentInput = document.getElementById('announcement-content');
    const charCounter = document.getElementById('announcement-char-counter');

    // Safety Check: Only run this logic if both the input and counter elements exist.
    if (contentInput && charCounter) {
        const maxLength = contentInput.getAttribute('maxlength');
        
        // Reset counter text when modal is opened
        charCounter.textContent = `${contentInput.value.length} / ${maxLength}`;

        // Add a listener to update the counter as the user types
        contentInput.addEventListener('input', () => {
            const currentLength = contentInput.value.length;
            charCounter.textContent = `${currentLength} / ${maxLength}`;
        });
    }
    // --- END OF CORRECTED BLOCK ---

    announcementModal.classList.remove('hidden');
};
const closeAnnouncementModal = () => announcementModal.classList.add('hidden');

// in app.js
const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Posting...';

    const imageProgress = document.getElementById('announcement-upload-progress');
    const fileProgress = document.getElementById('announcement-file-upload-progress');
    imageProgress.textContent = '';
    fileProgress.textContent = '';

    try {
        const title = document.getElementById('announcement-title').value.trim();
        const content = document.getElementById('announcement-content').value.trim();
        const videoUrl = document.getElementById('announcement-video-link').value.trim();
        const imageFile = document.getElementById('announcement-image').files[0];
        const attachmentFile = document.getElementById('announcement-file').files[0]; // New file
        const targetDepartments = Array.from(document.getElementById('announcement-departments').selectedOptions).map(opt => opt.value);

        if (!title || !content || targetDepartments.length === 0) {
            alert("Please fill out all required fields.");
            submitButton.disabled = false;
            submitButton.textContent = 'Post Announcement';
            return;
        }

        const newAnnouncement = {
            title: title,
            content: content,
            videoUrl: videoUrl || null,
            imageUrl: null,
            attachmentFileUrl: null, // New field
            attachmentFileName: null, // New field
            targetDepartments: targetDepartments,
            creatorId: currentUser.email,
            creatorName: userData.name,
            createdAt: serverTimestamp()
        };
        
        // Helper function for uploading a file
        const uploadFile = (file, path, progressElement) => {
            return new Promise((resolve, reject) => {
                const storagePath = `${path}/${Date.now()}-${file.name}`;
                const storageRef = ref(storage, storagePath);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressElement.textContent = `Upload: ${progress.toFixed(0)}% done`;
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                        alert(`File upload failed: ${file.name}`);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({ downloadURL, fileName: file.name });
                    }
                );
            });
        };

        // Create upload promises
        const imageUploadPromise = imageFile 
            ? uploadFile(imageFile, 'announcement-images', imageProgress) 
            : Promise.resolve(null);
            
        const attachmentUploadPromise = attachmentFile 
            ? uploadFile(attachmentFile, 'announcement-attachments', fileProgress) 
            : Promise.resolve(null);

        // Wait for both uploads to complete (if they exist)
        const [imageResult, attachmentResult] = await Promise.all([
            imageUploadPromise,
            attachmentUploadPromise
        ]);

        if (imageResult) {
            newAnnouncement.imageUrl = imageResult.downloadURL;
        }
        if (attachmentResult) {
            newAnnouncement.attachmentFileUrl = attachmentResult.downloadURL;
            newAnnouncement.attachmentFileName = attachmentResult.fileName;
        }
        
        // Save the final announcement to Firestore
        await addDoc(collection(db, 'announcements'), newAnnouncement);
        alert('Announcement posted successfully!');
        closeAnnouncementModal();
        navigateTo('dashboard');

    } catch (error) {
        console.error("Error in handleAnnouncementSubmit:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Post Announcement';
    }
};

const closeViewAcknowledgementsModal = () => viewAcknowledgementsModal.classList.add('hidden');

const openViewAcknowledgementsModal = async (announcementId) => {
    const modalTitle = document.getElementById('view-acknowledgements-modal-title');
    const modalBody = document.getElementById('view-acknowledgements-modal-body');
    const modalFooter = document.getElementById('view-acknowledgements-modal-footer');

    modalTitle.textContent = 'Loading Status...';
    modalBody.innerHTML = '<p class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading acknowledgement data...</p>';
    modalFooter.classList.add('hidden'); // Hide footer until data is loaded
    viewAcknowledgementsModal.classList.remove('hidden');

    let dataForExport = [];

    try {
        // Step 1: Fetch the announcement and its acknowledgements in parallel
        const announcementRef = doc(db, 'announcements', announcementId);
        const acknowledgementsRef = collection(db, 'announcements', announcementId, 'acknowledgements');

        const [announcementSnap, acknowledgementsSnap] = await Promise.all([
            getDoc(announcementRef),
            getDocs(acknowledgementsRef)
        ]);

        if (!announcementSnap.exists()) {
            throw new Error("Announcement not found.");
        }

        const announcement = announcementSnap.data();
        modalTitle.textContent = `Status for: "${announcement.title}"`;
        
        const acknowledgementsMap = new Map();
        acknowledgementsSnap.forEach(doc => {
            acknowledgementsMap.set(doc.id, doc.data());
        });

        // Step 2: Determine the list of target users
        const targetDepts = announcement.targetDepartments;
        let usersQuery;
        if (targetDepts.includes('__ALL__')) {
            usersQuery = query(collection(db, 'users'), where('status', '==', 'active'));
        } else {
            usersQuery = query(collection(db, 'users'), where('status', '==', 'active'), where('primaryDepartment', 'in', targetDepts));
        }
        
        const usersSnap = await getDocs(usersQuery);
        const targetUsers = usersSnap.docs.map(doc => doc.data());

        if (targetUsers.length === 0) {
            modalBody.innerHTML = '<p class="text-center p-4">No target users found for this announcement.</p>';
            return;
        }

        // Step 3: Build the status list and prepare data for export
        let statusHTML = '<ul class="divide-y divide-gray-200">';
        let acknowledgedCount = 0;
        
        targetUsers.sort((a, b) => a.name.localeCompare(b.name)).forEach(user => {
            const ackData = acknowledgementsMap.get(user.email);
            const hasAcknowledged = !!ackData;
            if(hasAcknowledged) acknowledgedCount++;

            dataForExport.push({
                Employee: user.name,
                Department: user.primaryDepartment,
                Status: hasAcknowledged ? 'Acknowledged' : 'Not Acknowledged',
                AcknowledgedAt: hasAcknowledged ? formatDate(ackData.timestamp) : 'N/A'
            });

            statusHTML += `
                <li class="py-3 flex justify-between items-center">
                    <div>
                       <p class="text-gray-800">${user.name}</p>
                       <p class="text-xs text-gray-500">${user.primaryDepartment}</p>
                    </div>
                    ${hasAcknowledged
                        ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Acknowledged</span>`
                        : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Not Acknowledged</span>`
                    }
                </li>
            `;
        });
        statusHTML += '</ul>';

        modalBody.innerHTML = `
            <div class="mb-4">
                <p class="font-semibold text-gray-700">Summary: ${acknowledgedCount} of ${targetUsers.length} users have acknowledged.</p>
            </div>
            ${statusHTML}
        `;

        // Step 4: Add Export CSV button to footer
        modalFooter.innerHTML = `
            <button id="export-acknowledgements-csv" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"><i class="fas fa-file-csv mr-2"></i>Export CSV</button>
            <button id="view-acknowledgements-modal-cancel-button-inner" type="button" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
        `;
        modalFooter.classList.remove('hidden');
        document.getElementById('export-acknowledgements-csv').addEventListener('click', () => {
            exportToCSV(dataForExport, `acknowledgement-status-${announcement.title.replace(/ /g, '_')}`);
        });
        document.getElementById('view-acknowledgements-modal-cancel-button-inner').addEventListener('click', closeViewAcknowledgementsModal);


    } catch (error) {
        console.error("Error fetching acknowledgement status:", error);
        modalBody.innerHTML = `<p class="text-red-500 text-center p-4">Error: ${error.message}</p>`;
    }
};


// --- UI Rendering & Router ---
// Add this entire new function
// Find and replace this entire function in app.js
const setupMobileMenu = () => {
    const closeMenu = (e) => {
        // Prevent the event from bubbling up and causing other clicks
        if (e) e.preventDefault();
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    };

    const openMenu = (e) => {
        // Prevent the event from bubbling up
        if (e) e.preventDefault();
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
    };

    // Listen for both click (desktop) and touchstart (mobile)
    hamburgerButton.addEventListener('click', openMenu);
    hamburgerButton.addEventListener('touchstart', openMenu);

    sidebarOverlay.addEventListener('click', closeMenu);
    sidebarOverlay.addEventListener('touchstart', closeMenu);


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
        'announcements-history': renderAnnouncementsPage, // <-- ADD THIS LINE
        'attendance': renderAttendance, 
        'leave-ot': renderLeaveOT,
        'claims': renderClaims, 
        'purchasing': renderPurchasing, 
        'bill-payments': renderBillPayments,
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
// Add these to the bottom of the main Event Listeners section
correctAttendanceModalCloseButton.addEventListener('click', closeCorrectAttendanceModal);
correctAttendanceModalCancelButton.addEventListener('click', closeCorrectAttendanceModal);
correctAttendanceForm.addEventListener('submit', handleCorrectAttendanceSubmit);
resolveExceptionModalCloseButton.addEventListener('click', closeResolveExceptionModal);
resolveExceptionModalCancelButton.addEventListener('click', closeResolveExceptionModal);
resolveExceptionForm.addEventListener('submit', handleResolveExceptionSubmit);
announcementModalCloseButton.addEventListener('click', closeAnnouncementModal);
announcementModalCancelButton.addEventListener('click', closeAnnouncementModal);
announcementForm.addEventListener('submit', handleAnnouncementSubmit);
viewAcknowledgementsModalCloseButton.addEventListener('click', closeViewAcknowledgementsModal);
viewAcknowledgementsModalCancelButton.addEventListener('click', closeViewAcknowledgementsModal);
completePurchaseModalCloseButton.addEventListener('click', closeCompletePurchaseModal);
completePurchaseModalCancelButton.addEventListener('click', closeCompletePurchaseModal);
completePurchaseForm.addEventListener('submit', handleCompletePurchaseSubmit);
billPaymentModalCloseButton.addEventListener('click', closeBillPaymentModal);
billPaymentModalCancelButton.addEventListener('click', closeBillPaymentModal);
billPaymentForm.addEventListener('submit', handleBillPaymentSubmit);

document.getElementById('request-type').addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const leaveBalanceDisplay = document.getElementById('leave-balance-display');
    
    
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