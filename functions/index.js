// functions/index.js
// Forcing a full redeployment - 20 Aug 2025


const functions = require("firebase-functions");
const admin = require("firebase-admin");
const moment = require("moment-timezone");

// v2 SDK Imports
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { FieldValue } = require("firebase-admin/firestore");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");

// Tells the Admin SDK to use the local Auth Emulator if present
if (process.env.FUNCTIONS_EMULATOR) {
   process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
}


// Initialize the Admin SDK ONCE at the top of the file
admin.initializeApp();
const db = admin.firestore();


/**
 * Gets a list of users who have a specific role.
 */

const getUsersByRole = async (role) => {
    const snapshot = await db.collection('users').where('roles', 'array-contains', role).where('status', '==', 'active').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { name: data.name, email: data.email };
    });

};


// =================================================================================
// HTTPS CALLABLE FUNCTION 1: getSupportAssignableUsers (CONVERTED TO V2)
// =================================================================================
// Find and replace this entire function in functions/index.js

exports.getSupportAssignableUsers = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const requesterEmail = request.auth.token.email;
    if (!requesterEmail) {
        throw new HttpsError('invalid-argument', 'Could not determine the requesting user from the token.');
    }

    try {
        const userDoc = await db.collection('users').doc(requesterEmail).get();
        if (!userDoc.exists) {
            throw new HttpsError("not-found", "Requesting user not found in Firestore: " + requesterEmail);
        }

        const userData = userDoc.data();
        const userRoles = userData.roles || [];
        const userMap = new Map();
        const addUser = (user) => {
            if (user && user.email && user.email !== requesterEmail && !userMap.has(user.email)) {
                userMap.set(user.email, { name: user.name, email: user.email });
            }
        };

        // Director, HR, Finance, and Admin can see all other active users
        if (userRoles.includes('Director') || userRoles.includes('HR') || userRoles.includes('Finance') || userRoles.includes('Admin')) {
            const allUsersSnapshot = await db.collection('users').where('status', '==', 'active').get();
            allUsersSnapshot.docs.forEach(doc => addUser(doc.data()));
        } 

        // Regional Directors can see users in their departments plus other key roles
        else if (userRoles.includes('RegionalDirector')) {
            const managedDepts = userData.managedDepartments || [];
            if (managedDepts.length > 0) {
               const regionalUsersSnapshot = await db.collection('users').where('primaryDepartment', 'in', managedDepts).where('status', '==', 'active').get();
                regionalUsersSnapshot.docs.forEach(doc => addUser(doc.data()));

            }

            // MODIFIED: Added 'IT' to this list
            const otherRoles = ['Finance', 'Purchaser', 'Director', 'HR', 'Admin', 'RespiteManager', 'IT'];
            for (const role of otherRoles) {
                const roleUsers = await getUsersByRole(role);
                roleUsers.forEach(user => addUser(user));
            }
        } 

        // Department Managers see users in their department plus central roles
        else if (userRoles.includes('DepartmentManager')) {
            const managedDepts = userData.managedDepartments || [];
            if (managedDepts.length > 0) {
                const staffSnapshot = await db.collection('users').where('primaryDepartment', 'in', managedDepts).where('status', '==', 'active').get();
                staffSnapshot.docs.forEach(doc => addUser(doc.data()));
            }

            // MODIFIED: Added 'IT' to this list
            const centralRoles = ['Director', 'RegionalDirector', 'Finance', 'HR', 'Purchaser', 'Admin', 'IT'];
            for (const role of centralRoles) {
                const roleUsers = await getUsersByRole(role);
                roleUsers.forEach(user => addUser(user));
            }
        } 

        // Standard staff see their managers and central roles
        else {
            const department = userData.primaryDepartment;
            if (department) {
                const managersSnapshot = await db.collection('users').where('managedDepartments', 'array-contains', department).where('status', '==', 'active').get();
                managersSnapshot.docs.forEach(doc => addUser(doc.data()));
            }

            // MODIFIED: Added 'IT' to this list

            const centralRoles = ['Director', 'RegionalDirector', 'Finance', 'HR', 'Purchaser', 'Admin', 'IT'];
            for (const role of centralRoles) {
                const roleUsers = await getUsersByRole(role);
                roleUsers.forEach(user => addUser(user));
            }
        }

        const assignableUsers = Array.from(userMap.values());
        assignableUsers.sort((a, b) => a.name.localeCompare(b.name));

     
        return assignableUsers;
    } catch (error) {
        console.error("!!! FUNCTION CRASHED !!!", error);
        if (error instanceof HttpsError) { throw error; }
        throw new HttpsError("internal", error.message, error);
    }

});


// Add this entire new function to functions/index.js
// =================================================================================
// HTTPS CALLABLE FUNCTION: generatePayrollReport (NEW)
// =================================================================================

exports.generatePayrollReport = onCall({

    timeoutSeconds: 60,
}, async (request) => {
    // 1. --- AUTHENTICATION & PERMISSION CHECK ---
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const requesterEmail = request.auth.token.email;
    const requesterRoles = request.auth.token.roles || [];
    if (!requesterRoles.includes('Director') && !requesterRoles.includes('HR')) {
        throw new HttpsError('permission-denied', 'You do not have permission to generate this report.');
    }

    // 2. --- INPUT VALIDATION ---
    const { year, month, userIds } = request.data;
    if (!year || !month || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new HttpsError('invalid-argument', 'The function must be called with a year, month, and a list of user IDs.');
    }

    if (userIds.length > 30) {
        throw new HttpsError('invalid-argument', 'Cannot process more than 30 users at a time.');
    }

    // 3. --- BLOCKER: CHECK FOR PENDING EXCEPTIONS ---
    const startDateStr = moment.tz({ year, month: month - 1, day: 1 }, 'Asia/Kuala_Lumpur').startOf('month').format('YYYY-MM-DD');
    const endDateStr = moment.tz({ year, month: month - 1, day: 1 }, 'Asia/Kuala_Lumpur').endOf('month').format('YYYY-MM-DD');
    const exceptionsQuery = await db.collection('attendanceExceptions')
        .where('status', '==', 'Pending')
        .where('userId', 'in', userIds)
        .where('date', '>=', startDateStr)
        .where('date', '<=', endDateStr)
       .limit(1)
        .get();


    if (!exceptionsQuery.empty) {
        throw new HttpsError('failed-precondition', 'Cannot generate report. There are unresolved attendance exceptions for the selected period. Please resolve them first.');
    }

    // 4. --- DATA FETCHING ---
    try {
        const endOfMonthQueryString = endDateStr + 'T23:59:59';
        const [configSnap, usersSnap, requestsSnap, claimsSnap, attendanceSnap] = await Promise.all([
            db.doc('configuration/main').get(),
            db.collection('users').where('email', 'in', userIds).get(),
            db.collection('requests').where('userId', 'in', userIds).where('status', '==', 'Approved').where('startDate', '>=', startDateStr).where('startDate', '<=', endOfMonthQueryString).get(),
            db.collection('claims').where('userId', 'in', userIds).where('status', 'in', ['Approved', 'Paid']).where('expenseDate', '>=', startDateStr).where('expenseDate', '<=', endDateStr).get(),
            db.collection('attendance').where('userId', 'in', userIds).where('date', '>=', startDateStr).where('date', '<=', endDateStr).get()
        ]);

        const appConfig = configSnap.data();
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allRequests = requestsSnap.docs.map(doc => doc.data());
        const allClaims = claimsSnap.docs.map(doc => doc.data());
        const allAttendance = attendanceSnap.docs.map(doc => doc.data());
        const crossDeptOtTypes = appConfig.requestTypes
            .filter(rt => rt.isCrossDepartmental)
            .map(rt => rt.name);

        const payrollData = [];

        // 5. --- DATA AGGREGATION ---
        for (const user of usersData) {
            let totalWorkdays = 0;
            let totalAttendDays = 0;
            let paidLeaveHours = 0;
            let unpaidLeaveHours = 0;
            let ownDeptOtHours = 0;
            let totalClaims = 0;

  
            const dynamicOtHours = {};
            crossDeptOtTypes.forEach(typeName => {
                dynamicOtHours[`${typeName} (Hrs)`] = 0;
            });


            // A. Calculate Total Workdays
            const monthStart = moment.tz({ year, month: month - 1, day: 1 }, 'Asia/Kuala_Lumpur');
            const daysInMonth = monthStart.daysInMonth();
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = moment.tz({ year, month: month - 1, day }, 'Asia/Kuala_Lumpur');
                const dayOfWeek = currentDate.format('dddd');
                if (user.workSchedule && user.workSchedule[dayOfWeek] && user.workSchedule[dayOfWeek].active) {
                    totalWorkdays++;
                }
            }

           

            // B. Calculate Total Attendance Days
            const userAttendance = allAttendance.filter(att => att.userId === user.email);
            totalAttendDays = userAttendance.length;


            // C. Aggregate Leave and OT Requests
            const userRequests = allRequests.filter(req => req.userId === user.email);
            for (const req of userRequests) {
                const reqTypeConfig = appConfig.requestTypes.find(rt => rt.name === req.type);
                if (!reqTypeConfig) continue;


               if (req.type.toLowerCase().includes('overtime')) {
                   if (req.department === user.primaryDepartment) {
                        ownDeptOtHours += req.hours;
                    } else if (reqTypeConfig.isCrossDepartmental) {
                        dynamicOtHours[`${req.type} (Hrs)`] += req.hours;
                    }
                } else {
                    if (reqTypeConfig.isPaidLeave) {
                       paidLeaveHours += req.hours;
                    } else {
                      unpaidLeaveHours += req.hours;
                    }
                }
            }

            
            // D. Aggregate Claims
            const userClaims = allClaims.filter(claim => claim.userId === user.email);
            totalClaims = userClaims.reduce((sum, claim) => sum + claim.amount, 0);
            // E. Assemble the final object for this user
            payrollData.push({
                Name: user.name,
                Department: user.primaryDepartment,
                TotalWorkdays: totalWorkdays,
                TotalAttendDays: totalAttendDays,
                'Paid Leave (Hours)': paidLeaveHours,
               'Unpaid Leave (Hours)': unpaidLeaveHours,
                'Own Department OT (Hours)': ownDeptOtHours,
                ...dynamicOtHours,
                'Total Approved Claims ($)': parseFloat(totalClaims.toFixed(2))
            });
        }

        // 6. --- RETURN DATA ---
        return payrollData;
    } catch (error) {
        console.error("Error generating payroll report:", error);
        throw new HttpsError("internal", "An unexpected error occurred while generating the report.", error);
    }
});


// --- HELPER FUNCTION containing the core logic (Unchanged) ---
// --- HELPER FUNCTION containing the core logic (Upgraded) ---
const runAttendanceCheckLogic = async () => {
    console.log('--- Running Daily Attendance Check Logic ---');
    const today = moment().tz('Asia/Kuala_Lumpur');
    const todayStr = today.format('YYYY-MM-DD');
    const dayOfWeek = today.format('dddd');
    try {
        // --- START OF NEW CALENDAR LOGIC ---
        // 1. Check for any non-working day rules for today.
        const holidayRef = db.collection('companyCalendar').doc(todayStr);
        const holidayDoc = await holidayRef.get();
        let holidayDepts = [];
        let isGlobalHoliday = false;

        if (holidayDoc.exists) {
            const holidayData = holidayDoc.data();
           // Check if it's a holiday for ALL departments
            if (holidayData.appliesTo && holidayData.appliesTo.includes('__ALL__')) {
                isGlobalHoliday = true;
                console.log(`Today (${todayStr}) is a global non-working day. Reason: ${holidayData.description}. Skipping all attendance checks.`);
                return; // Exit the function early if it's a holiday for everyone.
            } else if (holidayData.appliesTo) {
                // Otherwise, store the list of departments that have the day off
                holidayDepts = holidayData.appliesTo;
               console.log(`Today (${todayStr}) is a non-working day for depts: ${holidayDepts.join(', ')}`);
            }
        }

        // --- END OF NEW CALENDAR LOGIC ---


        const usersSnapshot = await db.collection('users')
            .where('status', '==', 'active')
            .where(`workSchedule.${dayOfWeek}.active`, '==', true)
            .get();

         
        if (usersSnapshot.empty) {
            console.log('No users scheduled to work today. Exiting.');
            return;
        }

        const attendanceSnapshot = await db.collection('attendance').where('date', '==', todayStr).get();
        const leaveSnapshot = await db.collection('requests').where('status', '==', 'Approved').get();

        const attendanceMap = new Map();
        attendanceSnapshot.forEach(doc => attendanceMap.set(doc.data().userId, doc.data()));
    
        const leaveMap = new Map();
        leaveSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.startDate && request.endDate) {
                const startDate = moment(request.startDate).tz('Asia/Kuala_Lumpur');
                const endDate = moment(request.endDate).tz('Asia/Kuala_Lumpur');
                if (today.isBetween(startDate, endDate, 'day', '[]')) {
                    leaveMap.set(request.userId, request);
                }
            }
        });

        const batch = db.batch();
        let absentCount = 0, lateCount = 0, missedCheckoutCount = 0;
        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            const userId = user.email;

            // --- START OF NEW CHECK INSIDE THE LOOP ---
            // 2. Skip this user if it's a designated non-working day for their department.
            if (holidayDepts.includes(user.primaryDepartment)) {
                console.log(`Skipping attendance check for ${user.name} because it is a designated non-working day for the ${user.primaryDepartment} department.`);
                continue; // Go to the next user
            }
            // --- END OF NEW CHECK INSIDE THE LOOP ---


            const attendanceRecord = attendanceMap.get(userId);
            const leaveRecord = leaveMap.get(userId);

            if (leaveRecord) continue;
           
            if (!attendanceRecord) {
                const exceptionRef = db.collection('attendanceExceptions').doc();
                batch.set(exceptionRef, {
                    date: todayStr, userId: userId, userName: user.name, department: user.primaryDepartment,
                   type: 'Absent', details: 'No check-in record and no approved leave.', status: 'Pending'
                });
                const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
                batch.set(notificationRef, {
                    type: 'AttendanceAlert', message: `You were marked as absent on ${todayStr}. Please apply for leave or contact your manager.`,
                   createdAt: FieldValue.serverTimestamp(), read: false
                });
                absentCount++;
                continue;
            }

             const schedule = user.workSchedule[dayOfWeek];

             if (schedule && schedule.checkIn) {
                const checkInTime = moment(attendanceRecord.checkInTime.toDate()).tz('Asia/Kuala_Lumpur');
                const expectedCheckInTime = moment(`${todayStr} ${schedule.checkIn}`, 'YYYY-MM-DD HH:mm').tz('Asia/Kuala_Lumpur');
                if (checkInTime.isAfter(expectedCheckInTime)) {
                    const exceptionRef = db.collection('attendanceExceptions').doc();
                    batch.set(exceptionRef, {
                        date: todayStr, userId: userId, userName: user.name, department: user.primaryDepartment,
                        type: 'Late', details: `Checked in at ${checkInTime.format('HH:mm')} instead of ${schedule.checkIn}.`, status: 'Pending'
                    });
                    lateCount++;
                }
            }
            if (!attendanceRecord.checkOutTime) {
                const exceptionRef = db.collection('attendanceExceptions').doc();
                batch.set(exceptionRef, {
                    date: todayStr, userId: userId, userName: user.name, department: user.primaryDepartment,
                    type: 'MissedCheckout', details: 'User checked in but did not check out.', status: 'Pending'
                });
                const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
                batch.set(notificationRef, {
                    type: 'AttendanceAlert', message: `You missed your check-out on ${todayStr}. Please remember to check out.`,
                    createdAt: FieldValue.serverTimestamp(), read: false
                });
                missedCheckoutCount++;
            }
        }
        console.log(`Run Summary: ${absentCount} Absent, ${lateCount} Late, ${missedCheckoutCount} Missed Checkouts.`);
        await batch.commit();
        console.log('Successfully processed daily attendance.');
    } catch (error) {
        console.error('Error processing daily attendance:', error);
    }
};

// =================================================================================
// SCHEDULED FUNCTION 2: processDailyAttendance (This was already v2)
// =================================================================================
exports.processDailyAttendance = onSchedule({
    schedule: 'every day 23:00',
    timeZone: 'Asia/Kuala_Lumpur',
}, async (event) => {
    await runAttendanceCheckLogic();
    return null;
});

// =================================================================================
// TEMPORARY TEST FUNCTION (CONVERTED TO V2)
// =================================================================================

exports.testDailyAttendance = onCall(async (request) => {
    // Optional: Add an auth check if you only want admins to run this.
    // if (!request.auth) {
    //     throw new HttpsError('unauthenticated', 'Authentication required.');
    // }
    console.log("--- Manually triggering Daily Attendance Check for testing ---");
    await runAttendanceCheckLogic();
    console.log("--- Manual trigger finished ---");
    return { status: "complete" };
});

// --- ADD THIS ENTIRE NEW FUNCTION TO THE END OF functions/index.js ---

// =================================================================================
// FIRESTORE TRIGGER: onUserUpdated (NEW)
// This function automatically syncs a user's roles from their Firestore
// document to their Auth token as custom claims. This is CRITICAL for
// security rules to work correctly.
// =================================================================================
// Find and replace this entire function in functions/index.js
exports.onUserUpdated = onDocumentUpdated("users/{userEmail}", async (event) => {
    console.log(`User document updated for: ${event.params.userEmail}`);
    const afterData = event.data.after.data();
    console.log(`Syncing custom claims for ${afterData.email}.`);
    try {
       const user = await admin.auth().getUserByEmail(afterData.email);
        // --- THIS IS THE KEY CHANGE ---
        // Convert the managedDepartments array into a Map object for security rules.
        // FROM: ['Sales', 'Support']
        // TO:   { Sales: true, Support: true }
        const managedDeptsArray = afterData.managedDepartments || [];
        const managedDeptsMap = {};
        managedDeptsArray.forEach(dept => {
            managedDeptsMap[dept] = true;
        });

        const claims = {
            roles: afterData.roles || [],
            managedDepartments: managedDeptsMap // Use the new Map object here
        };

        await admin.auth().setCustomUserClaims(user.uid, claims);
        console.log(`Successfully set custom claims for ${user.email}:`, claims);
        return { result: `Custom claims set for ${user.email}` };

    } catch (error) {
        console.error(`Error setting custom claims for ${afterData.email}:`, error);
        return null;
    }
});

// Add this entire new function to the end of functions/index.js
// =================================================================================
// FIRESTORE TRIGGER: onLeaveCancelledSendNotification (IMPROVED)
// =================================================================================

exports.onLeaveCancelledSendNotification = onDocumentUpdated("requests/{requestId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    if (beforeData.status !== 'Cancelled' && afterData.status === 'Cancelled') {
        console.log(`Leave request ${event.params.requestId} was cancelled by ${afterData.cancelledBy}. Notifying relevant managers.`);
        const employeeDepartment = afterData.department;
        const employeeName = afterData.userName;
        const message = `${employeeName} has cancelled their approved leave request for '${afterData.type}' from ${moment(afterData.startDate).tz('Asia/Kuala_Lumpur').format('MMM D, YYYY')}.`;
        try {
            const managersQuery = db.collection('users').where('managedDepartments', 'array-contains', employeeDepartment);
            const managersSnapshot = await managersQuery.get();

            if (managersSnapshot.empty) {
               console.log(`No managers found for department: ${employeeDepartment}. No notification sent.`);
                return;
            }

            // --- START OF FIX ---
            // Define which roles should receive this type of notification
            const relevantRoles = ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Admin'];
           const notificationPromises = [];
            managersSnapshot.forEach(doc => {
                const managerData = doc.data();
                const managerRoles = managerData.roles || [];

                // Check if the user has at least one of the relevant management roles
                const isRelevantManager = managerRoles.some(role => relevantRoles.includes(role));
                if (isRelevantManager) {
                    const managerEmail = managerData.email;
                    console.log(`Sending cancellation notification to relevant manager: ${managerEmail}`);
                    const notificationRef = db.collection('users').doc(managerEmail).collection('notifications').doc();
                    notificationPromises.push(
                        notificationRef.set({
                            type: 'LeaveUpdate',
                            message: message,
                            createdAt: FieldValue.serverTimestamp(),
                            read: false
                        })
                    );
                }
            });
            // --- END OF FIX ---

            if (notificationPromises.length > 0) {
                 await Promise.all(notificationPromises);
                 console.log("Successfully sent all relevant manager notifications.");
            } else {
                console.log("No managers with relevant roles found. No notifications sent.");
            }
        } catch (error) {
            console.error("Error sending cancellation notification:", error);
        }
    }
  
    return null;
});

// Add these two new functions to the end of functions/index.js
// =================================================================================
// FIRESTORE TRIGGER: onClaimRejectedSendNotification (CORRECTED)
// =================================================================================
exports.onClaimRejectedSendNotification = onDocumentUpdated("claims/{claimId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // This triggers when a claim goes from 'Approved' (by a manager) to 'Rejected' (by Finance).
    if (beforeData.status === 'Approved' && afterData.status === 'Rejected') {
        const staffToNotify = afterData.userId;
        const managerToNotify = afterData.approvedBy; // The manager who approved it.
        const rejectorEmail = afterData.rejectedBy;   // The finance user who rejected it.
        
        console.log(`Claim ${event.params.claimId} was rejected by ${rejectorEmail}. Notifying staff ${staffToNotify} and manager ${managerToNotify}.`);
        
        // Fetch the rejector's name to make the message clearer.
        let rejectorName = rejectorEmail;
        try {
            const rejectorDoc = await db.collection('users').doc(rejectorEmail).get();
            if (rejectorDoc.exists) {
                rejectorName = rejectorDoc.data().name;
            }
        } catch (e) {
            console.error("Could not fetch rejector's name, defaulting to email.", e);
        }

        const notificationPromises = [];

        // 1. Create notification for the original staff member.
        const staffMessage = `Your approved claim for '$${afterData.amount.toFixed(2)} (${afterData.claimType})' was rejected by ${rejectorName} (Finance). Reason: ${afterData.rejectionReason}`;
        const staffNotificationRef = db.collection('users').doc(staffToNotify).collection('notifications').doc();
        notificationPromises.push(staffNotificationRef.set({
            type: 'RequestUpdate',
            message: staffMessage,
            createdAt: FieldValue.serverTimestamp(),
            read: false
        }));

        // 2. Create notification for the manager who approved it.
        if (managerToNotify && managerToNotify !== rejectorEmail) {
            const managerMessage = `The claim for '$${afterData.amount.toFixed(2)}' by ${afterData.userName}, which you approved, was subsequently rejected by ${rejectorName} (Finance). Reason: ${afterData.rejectionReason}`;
            const managerNotificationRef = db.collection('users').doc(managerToNotify).collection('notifications').doc();
            notificationPromises.push(managerNotificationRef.set({
                type: 'RequestUpdate',
                message: managerMessage,
                createdAt: FieldValue.serverTimestamp(),
                read: false
            }));
        }
        
        await Promise.all(notificationPromises);
        console.log("Successfully sent rejection notifications for claim.");
    }
    return null;
});

// =================================================================================

// FIRESTORE TRIGGER: onPurchaseRejectedSendNotification (CORRECTED)

// =================================================================================
exports.onPurchaseRejectedSendNotification = onDocumentUpdated("purchaseRequests/{requestId}", async (event) => {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    // This triggers when a request goes from 'Approved' (by a manager) to 'Rejected' (by a Purchaser).
    if (beforeData.status === 'Approved' && afterData.status === 'Rejected') {
        const staffToNotify = afterData.userId;
        const managerToNotify = afterData.approvedBy; // The manager who approved it.
        const rejectorEmail = afterData.rejectedBy;   // The purchaser who rejected it.

        console.log(`Purchase request ${event.params.requestId} was rejected by ${rejectorEmail}. Notifying staff ${staffToNotify} and manager ${managerToNotify}.`);

        // Fetch the rejector's name to make the message clearer.
        let rejectorName = rejectorEmail;
        try {
            const rejectorDoc = await db.collection('users').doc(rejectorEmail).get();
            if (rejectorDoc.exists) {
                rejectorName = rejectorDoc.data().name;
            }
        } catch (e) {
            console.error("Could not fetch rejector's name, defaulting to email.", e);
        }

        const notificationPromises = [];

        // 1. Create notification for the original staff member.
        const staffMessage = `Your approved purchase request for '${afterData.itemDescription}' was rejected by ${rejectorName} (Purchaser). Reason: ${afterData.rejectionReason}`;
        const staffNotificationRef = db.collection('users').doc(staffToNotify).collection('notifications').doc();
        notificationPromises.push(staffNotificationRef.set({
            type: 'RequestUpdate',
            message: staffMessage,
            createdAt: FieldValue.serverTimestamp(),
            read: false
        }));

        // 2. Create notification for the manager who approved it.
        if (managerToNotify && managerToNotify !== rejectorEmail) {
            const managerMessage = `The purchase request for '${afterData.itemDescription}' by ${afterData.userName}, which you approved, was subsequently rejected by ${rejectorName} (Purchaser). Reason: ${afterData.rejectionReason}`;
            const managerNotificationRef = db.collection('users').doc(managerToNotify).collection('notifications').doc();
            notificationPromises.push(managerNotificationRef.set({
                type: 'RequestUpdate',
                message: managerMessage,
                createdAt: FieldValue.serverTimestamp(),
                read: false
            }));
        }
        
        await Promise.all(notificationPromises);
        console.log("Successfully sent rejection notifications for purchase request.");
    }
    return null;
});

// --- TEMPORARY FUNCTION TO SET THE FIRST DIRECTOR ---
// This function will grant the 'Director' role to the person who calls it,
// but ONLY if their email matches the one specified.
exports.setInitialDirector = onCall(async (request) => {

  // CONFIRM THIS IS YOUR DIRECTOR EMAIL ADDRESS
  const directorEmail = 'flyingkids.system@flyingkids-malaysia.com';

  // Security check: only the user with the matching email can run this.
  if (request.auth.token.email !== directorEmail) {
    throw new HttpsError('permission-denied', 'You are not authorized to call this function.');
  }

  try {
    const user = await admin.auth().getUserByEmail(directorEmail);
    await admin.auth().setCustomUserClaims(user.uid, { roles: ['Director'] });
    console.log(`SUCCESS: Director role set for ${directorEmail} via callable function.`);
    return { message: `Success! The Director role has been set for ${directorEmail}.` };

  } catch (error) {
    console.error('setInitialDirector function failed:', error);
    throw new HttpsError('internal', 'An internal error occurred while setting the custom claim.');
  }
})
