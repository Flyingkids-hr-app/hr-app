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
        const requesterEmail = "staff@example.com"; // Testing as staff
        console.log(`Step 1: Running as test user: ${requesterEmail}`);

        const userDoc = await db.collection('users').doc(requesterEmail).get();
        if (!userDoc.exists) {
            console.error("Error: Requester document not found in Firestore.");
            throw new functions.https.HttpsError("not-found", "Requesting user not found in Firestore: " + requesterEmail);
        }
        const userData = userDoc.data();
        const userRoles = userData.roles || [];
        console.log(`Step 2: Found requester. Roles: [${userRoles.join(', ')}], Department: ${userData.primaryDepartment}`);

        const userMap = new Map();
        const addUser = (user) => {
            console.log(" -> Attempting to add user:", JSON.stringify(user));
            if (user && user.email && !userMap.has(user.email)) {
                userMap.set(user.email, { name: user.name, email: user.email });
                console.log(`    --> SUCCESS: Added ${user.email} to the map.`);
            } else {
                console.log(`    --> SKIPPED: User was invalid, had no email, or was already in the map.`);
            }
        };

        // --- Logic for Staff ---
        console.log("Step 3: Executing STAFF logic.");
        const department = userData.primaryDepartment;
        if (department) {
            console.log(`Step 4: Searching for managers of department: '${department}'`);
            const managersSnapshot = await db.collection('users')
                .where('managedDepartments', 'array-contains', department)
                .where('status', '==', 'active').get();
            console.log(`Step 5: Found ${managersSnapshot.size} manager(s).`); // This will tell us if the query worked
            managersSnapshot.docs.forEach(doc => addUser(doc.data()));
        }

        const centralRoles = ['Director', 'RegionalDirector', 'Finance', 'HR', 'Purchaser', 'Admin'];
        console.log("Step 6: Searching for central roles...");
        for (const role of centralRoles) {
            const roleUsers = await getUsersByRole(role);
            if (roleUsers.length > 0) {
                console.log(` -> Found ${roleUsers.length} user(s) with role '${role}'.`);
            }
            roleUsers.forEach(user => addUser(user));
        }

        const assignableUsers = Array.from(userMap.values());
        console.log(`Step 7: Final list contains ${assignableUsers.length} user(s).`);
        console.log("--- Function finished ---\n");
        return assignableUsers;

    } catch (error) {
        console.error("!!! FUNCTION CRASHED !!!", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});