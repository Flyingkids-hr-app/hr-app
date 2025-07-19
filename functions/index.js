const functions = require("firebase-functions");
const admin = require("firebase-admin");

// This line tells the Admin SDK to use the local Auth Emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

// Initialize the Admin SDK
admin.initializeApp();

// Initialize the Firestore database service
const db = admin.firestore();

/**
 * Gets a list of users who have a specific role.
 * This is a helper function used by the main function.
 * @param {string} role The role to query for.
 * @returns {Array} A list of user objects with that role.
 */
const getUsersByRole = async (role) => {
    const snapshot = await db.collection('users').where('roles', 'array-contains', role).where('status', '==', 'active').get();
    if (snapshot.empty) return [];
    // We only need the name and email for the dropdown
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { name: data.name, email: data.email };
    });
};

exports.getSupportAssignableUsers = functions.https.onCall(async (data, context) => {
    console.log("\n--- Starting getSupportAssignableUsers function ---");

    // --- TEMPORARY WORKAROUND FOR EMULATOR TESTING ---
    /*
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    */
    // --- END OF WORKAROUND ---

    try {
        // =================================================================
        // ## NEW TESTING TOGGLE ##
        // Change this value to "director" or "staff" to test different views.
        const testScenario = "director"; 
        // =================================================================

        let requesterEmail = "";
        if (testScenario === "director") {
            // Make sure you have this user in your Firestore emulator data
            requesterEmail = "director@example.com"; 
        } else {
            requesterEmail = "staff@example.com";
        }

        console.log(`Step 1: Running as test user: ${requesterEmail}`);

        const userDoc = await db.collection('users').doc(requesterEmail).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Requesting user not found in Firestore: " + requesterEmail);
        }
        const userData = userDoc.data();
        const userRoles = userData.roles || [];
        console.log(`Step 2: Found requester. Roles: [${userRoles.join(', ')}]`);

        const userMap = new Map();
        const addUser = (user) => {
            // Make sure the requester doesn't appear in their own assignment list
            if (user && user.email && user.email !== requesterEmail && !userMap.has(user.email)) {
                userMap.set(user.email, { name: user.name, email: user.email });
            }
        };
        
        // --- ROLE-BASED LOGIC ---
        if (userRoles.includes('Director')) {
            // Logic for Director: Can assign to ANYONE
            console.log("Step 3: Executing DIRECTOR logic.");
            const allUsersSnapshot = await db.collection('users').where('status', '==', 'active').get();
            allUsersSnapshot.docs.forEach(doc => addUser(doc.data()));

        } else {
            // Default logic for Staff and other roles
            console.log("Step 3: Executing DEFAULT logic.");
            const department = userData.primaryDepartment;
            if (department) {
                const managersSnapshot = await db.collection('users')
                    .where('managedDepartments', 'array-contains', department)
                    .where('status', '==', 'active').get();
                managersSnapshot.docs.forEach(doc => addUser(doc.data()));
            }
    
            const centralRoles = ['Director', 'RegionalDirector', 'Finance', 'HR', 'Purchaser', 'Admin'];
            for (const role of centralRoles) {
                const roleUsers = await getUsersByRole(role);
                roleUsers.forEach(user => addUser(user));
            }
        }

        const assignableUsers = Array.from(userMap.values());
        console.log(`Final list contains ${assignableUsers.length} user(s).`);
        console.log("--- Function finished ---\n");
        return assignableUsers;

    } catch (error) {
        console.error("!!! FUNCTION CRASHED !!!", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message, error);
    }
});