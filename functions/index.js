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
// HTTPS CALLABLE FUNCTION 1: getSupportAssignableUsers (ENHANCED LOGIC)
// =================================================================================
exports.getSupportAssignableUsers = onCall(async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const requesterEmail = request.auth.token.email;
    if (!requesterEmail) {
        throw new HttpsError('invalid-argument', 'Could not determine the requesting user from the token.');
    }

    try {
        // 2. Fetch the Requester's complete profile
        const userDoc = await db.collection('users').doc(requesterEmail).get();
        if (!userDoc.exists) {
            throw new HttpsError("not-found", "Requesting user not found in Firestore: " + requesterEmail);
        }
        const userData = userDoc.data();
        const userDepartment = userData.primaryDepartment;
        const userRoles = userData.roles || [];
        const managedDepartments = userData.managedDepartments || [];

        if (!userDepartment) {
            throw new HttpsError("failed-precondition", "User does not have a primary department assigned.");
        }

        // --- NEW LOGIC START ---

        // 3. Define Specialist Roles that get an expanded view.
        // You can add or remove roles from this list as needed.
        const specialistRoles = [
            'Finance',
            'Admin',
            'HR',
            'Purchaser',
            'HRHead', // Assuming 'HR Head' is a role
            'DepartmentManager',
            'RegionalDirector',
            'IT',
            'HR Head'
        ];

        // 4. Build our list of queries to run. Start with the baseline for everyone.
        const queryPromises = [
            // Query 1: Colleagues in the same department
            db.collection('users').where('primaryDepartment', '==', userDepartment).where('status', '==', 'active').get(),
            // Query 2: Their own managers
            db.collection('users').where('managedDepartments', 'array-contains', userDepartment).where('status', '==', 'active').get(),
            // Query 3: All Directors
            db.collection('users').where('roles', 'array-contains', 'Director').where('status', '==', 'active').get()
        ];

        // 5. Conditionally add a query for Specialist Roles
        const isSpecialist = specialistRoles.some(role => userRoles.includes(role));
        if (isSpecialist && managedDepartments.length > 0) {
            console.log(`User ${requesterEmail} is a specialist. Expanding search to their ${managedDepartments.length} managed departments.`);
            // Query 4 (Conditional): All users from the departments this specialist manages
            queryPromises.push(
                db.collection('users').where('primaryDepartment', 'in', managedDepartments).where('status', '==', 'active').get()
            );
        }

        // --- NEW LOGIC END ---

        // Execute all queries in parallel (will be 3 for staff, or 4 for specialists)
        const allSnapshots = await Promise.all(queryPromises);

        // 6. Combine and De-duplicate all results
        const userMap = new Map();
        const processSnapshot = (snapshot) => {
            snapshot.forEach(doc => {
                const docData = doc.data();
                if (docData.email && docData.email !== requesterEmail && !userMap.has(docData.email)) {
                    userMap.set(docData.email, { name: docData.name, email: docData.email });
                }
            });
        };
        allSnapshots.forEach(processSnapshot); // Process all snapshots returned from Promise.all

        // 7. Format and Return the final list
        const assignableUsers = Array.from(userMap.values());
        assignableUsers.sort((a, b) => a.name.localeCompare(b.name));

        return assignableUsers;

    } catch (error) {
        console.error("Error in getSupportAssignableUsers:", error);
        if (error instanceof HttpsError) { throw error; }
        throw new HttpsError("internal", "An error occurred while fetching the user list.", error);
    }
});

// Add this entire new function to functions/index.js
// =================================================================================
// HTTPS CALLABLE FUNCTION: getLiveTeamStatus
// =================================================================================
exports.getLiveTeamStatus = onCall({
    timeoutSeconds: 60,
}, async (request) => {
    // 1. Authentication & Permission Check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const managerEmail = request.auth.token.email;
    const managerRoles = request.auth.token.roles || [];

    const isAuthorized = managerRoles.some(role =>
        ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'HR Head'].includes(role)
    );

    if (!isAuthorized) {
        throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }

    try {
        // 2. Get Manager's Data and Current Time Info
        const managerDoc = await db.collection('users').doc(managerEmail).get();
        if (!managerDoc.exists) {
            throw new HttpsError("not-found", "Manager profile not found.");
        }
        const managerData = managerDoc.data();
        const managedDepts = managerData.managedDepartments || [];

        const now = moment().tz('Asia/Kuala_Lumpur');
        const todayStr = now.format('YYYY-MM-DD');
        const dayOfWeek = now.format('dddd');

        // 3. Fetch all necessary data in parallel
        const teamMembersQuery = db.collection('users')
            .where('status', '==', 'active')
            .where('primaryDepartment', 'in', managedDepts.length > 0 ? managedDepts : ['null']) // Avoid empty 'in' query
            .get();
            
        const attendanceQuery = db.collection('attendance')
            .where('date', '==', todayStr)
            .where('department', 'in', managedDepts.length > 0 ? managedDepts : ['null'])
            .get();

        const leaveQuery = db.collection('requests')
            .where('status', '==', 'Approved')
            .where('department', 'in', managedDepts.length > 0 ? managedDepts : ['null'])
            .get();

        const [teamMembersSnap, attendanceSnap, leaveSnap] = await Promise.all([
            teamMembersQuery,
            attendanceQuery,
            leaveQuery
        ]);

        if (teamMembersSnap.empty) {
            return []; // No team members to report on
        }

        // 4. Process data into easy-to-use Maps
        const attendanceMap = new Map(attendanceSnap.docs.map(doc => [doc.data().userId, doc.data()]));
        const leaveMap = new Map();
        leaveSnap.docs.forEach(doc => {
            const req = doc.data();
            const start = moment(req.startDate).tz('Asia/Kuala_Lumpur');
            const end = moment(req.endDate).tz('Asia/Kuala_Lumpur');
            if (now.isBetween(start, end, 'day', '[]')) {
                leaveMap.set(req.userId, req);
            }
        });

        // 5. Determine status for each team member
        const teamStatusList = teamMembersSnap.docs.map(doc => {
            const user = doc.data();
            const schedule = user.workSchedule ? user.workSchedule[dayOfWeek] : null;

            // Check 1: Is the user on leave?
            if (leaveMap.has(user.email)) {
                return { name: user.name, department: user.primaryDepartment, status: 'On Leave', details: leaveMap.get(user.email).type };
            }

            // Check 2: Is the user scheduled to work today?
            if (!schedule || !schedule.active) {
                return { name: user.name, department: user.primaryDepartment, status: 'Not Scheduled', details: 'Not scheduled to work today.' };
            }

            // Check 3: Has the user checked in?
            const attendanceRecord = attendanceMap.get(user.email);
            if (!attendanceRecord) {
                const expectedCheckInTime = moment.tz(`${todayStr} ${schedule.checkIn}`, 'YYYY-MM-DD HH:mm', 'Asia/Kuala_Lumpur');
                if (now.isAfter(expectedCheckInTime)) {
                     return { name: user.name, department: user.primaryDepartment, status: 'Absent', details: `Was expected at ${schedule.checkIn}` };
                } else {
                     return { name: user.name, department: user.primaryDepartment, status: 'Pending Check-in', details: `Scheduled for ${schedule.checkIn}` };
                }
            }

            // Check 4: If checked in, were they late?
            const checkInTime = moment(attendanceRecord.checkInTime.toDate()).tz('Asia/Kuala_Lumpur');
            const expectedCheckInTime = moment.tz(`${todayStr} ${schedule.checkIn}`, 'YYYY-MM-DD HH:mm', 'Asia/Kuala_Lumpur');
            if (checkInTime.isAfter(expectedCheckInTime)) {
                return { name: user.name, department: user.primaryDepartment, status: 'Late', details: `Checked in at ${checkInTime.format('HH:mm')}` };
            }
            
            // If none of the above, they are present
            return { name: user.name, department: user.primaryDepartment, status: 'Present', details: `Checked in at ${checkInTime.format('HH:mm')}` };
        });

        return teamStatusList.sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error("Error in getLiveTeamStatus:", error);
        throw new HttpsError("internal", "An unexpected error occurred.", error);
    }
});

// =================================================================================
// HTTPS CALLABLE FUNCTION: correctAttendanceRecord (NEW)
// =================================================================================
exports.correctAttendanceRecord = onCall({
    timeoutSeconds: 60,
}, async (request) => {
    // 1. --- AUTHENTICATION & PERMISSION CHECK ---
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const managerEmail = request.auth.token.email;
    const managerRoles = request.auth.token.roles || [];
    const isAuthorized = managerRoles.some(role => 
        ['DepartmentManager', 'RegionalDirector', 'Director', 'HR', 'Admin'].includes(role)
    );
    if (!isAuthorized) {
        throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }

    // 2. --- INPUT VALIDATION ---
    const { exceptionId, attendanceDocId, userId, date, checkIn, checkOut, remarks } = request.data;
    if (!exceptionId || !userId || !date || !remarks) {
        throw new HttpsError('invalid-argument', 'Missing required data for correction.');
    }

    try {
        // 3. --- FIRESTORE TRANSACTION ---
        // A transaction ensures both the attendance and the exception are updated together, or not at all.
        await db.runTransaction(async (transaction) => {
            const exceptionRef = db.collection('attendanceExceptions').doc(exceptionId);
            const exceptionDoc = await transaction.get(exceptionRef);

            if (!exceptionDoc.exists) {
                throw new HttpsError('not-found', 'The specified exception does not exist.');
            }
            if (exceptionDoc.data().status !== 'Pending') {
                 throw new HttpsError('failed-precondition', 'This exception is no longer pending and cannot be corrected.');
            }

            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'The employee profile could not be found.');
            }
            const userData = userDoc.data();

            // Prepare the data for the attendance record
            const attendanceData = {
                userId: userId,
                userName: userData.name,
                department: userData.primaryDepartment,
                date: date,
            };

            // Convert HH:mm time strings to full Firestore Timestamps
            if (checkIn) {
                attendanceData.checkInTime = admin.firestore.Timestamp.fromDate(moment.tz(`${date} ${checkIn}`, 'YYYY-MM-DD HH:mm', 'Asia/Kuala_Lumpur').toDate());
            } else {
                attendanceData.checkInTime = null;
            }
            if (checkOut) {
                attendanceData.checkOutTime = admin.firestore.Timestamp.fromDate(moment.tz(`${date} ${checkOut}`, 'YYYY-MM-DD HH:mm', 'Asia/Kuala_Lumpur').toDate());
            } else {
                attendanceData.checkOutTime = null;
            }

            // If an attendance doc already exists (e.g., for 'Late' or 'Missed Checkout'), update it.
            // If it doesn't exist (e.g., for 'Absent'), create a new one.
            if (attendanceDocId) {
                const attendanceRef = db.collection('attendance').doc(attendanceDocId);
                transaction.update(attendanceRef, attendanceData);
            } else {
                const newAttendanceRef = db.collection('attendance').doc(); // Create a new doc
                transaction.set(newAttendanceRef, attendanceData);
            }

            // Finally, update the exception itself to mark it as 'Corrected'.
            transaction.update(exceptionRef, {
                status: 'Corrected',
                correctionRemarks: remarks,
                correctedBy: managerEmail,
                correctedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        console.log(`Attendance for ${userId} on ${date} successfully corrected by ${managerEmail}.`);
        return { success: true, message: "Attendance record corrected successfully." };

    } catch (error) {
        console.error("Error in correctAttendanceRecord transaction:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "An unexpected error occurred while saving the correction.", error);
    }
});


// =================================================================================
// HTTPS CALLABLE FUNCTION: generatePayrollReport (NEW)
// =================================================================================
// Replace the entire generatePayrollReport function with this new version
exports.generatePayrollReport = onCall({
    timeoutSeconds: 60,
}, async (request) => {
    // 1. --- AUTHENTICATION & PERMISSION CHECK ---
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const requesterRoles = request.auth.token.roles || [];
    if (!requesterRoles.includes('Director') && !requesterRoles.includes('HR')) {
        throw new HttpsError('permission-denied', 'You do not have permission to generate this report.');
    }

    // 2. --- INPUT VALIDATION ---
    const { year, month, userIds } = request.data;
    if (!year || !month || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new HttpsError('invalid-argument', 'The function must be called with a year, month, and a list of user IDs.');
    }
    if (userIds.length > 50) { // Increased limit slightly
        throw new HttpsError('invalid-argument', 'Cannot process more than 50 users at a time.');
    }

    // 3. --- BLOCKER: CHECK FOR PENDING EXCEPTIONS ---
    const startDateStr = moment.tz({ year, month: month - 1, day: 1 }, 'Asia/Kuala_Lumpur').startOf('month').format('YYYY-MM-DD');
    const endDateStr = moment.tz({ year, month: month - 1, day: 1 }, 'Asia/Kuala_Lumpur').endOf('month').format('YYYY-MM-DD');
    
    const exceptionsQuery = await db.collection('attendanceExceptions')
        .where('status', 'in', ['Pending', 'Corrected']) // Block if pending OR corrected but not yet resolved
        .where('userId', 'in', userIds)
        .where('date', '>=', startDateStr)
        .where('date', '<=', endDateStr)
        .limit(1)
        .get();

    if (!exceptionsQuery.empty) {
        const pendingException = exceptionsQuery.docs[0].data();
        throw new HttpsError('failed-precondition', `Cannot generate report. At least one unresolved attendance exception exists for ${pendingException.userName} on ${pendingException.date}. Please resolve all exceptions in the 'Attendance Exceptions' report first.`);
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

        const payrollData = [];

        // --- Identify all unique allowance types used this period ---
        const claimTypesConfig = appConfig.claimTypes || [];
        const usedAllowanceTypes = new Set();
        allClaims.forEach(claim => {
            const claimTypeInfo = claimTypesConfig.find(ct => ct.name === claim.claimType);
            if (claimTypeInfo && claimTypeInfo.category === 'Allowance') {
                usedAllowanceTypes.add(claim.claimType);
            }
        });
        const sortedAllowanceTypes = Array.from(usedAllowanceTypes).sort();


        // 5. --- DATA AGGREGATION ---
        for (const user of usersData) {
            let totalWorkdays = 0;
            let totalAttendDays = 0;
            let paidLeaveHours = 0;
            let unpaidLeaveHours = 0;
            let ownDeptOtHours = 0;
            let totalAllowances = 0;
            let totalReimbursements = 0;
            
            // Create an object to hold the breakdown for each allowance type
            const allowanceDetails = {};
            sortedAllowanceTypes.forEach(typeName => {
                allowanceDetails[`${typeName} (RM)`] = 0;
            });

            // A. Calculate Total Workdays based on schedule
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
                const reqTypeConfig = (appConfig.requestTypes || []).find(rt => rt.name === req.type);
                if (!reqTypeConfig) continue;

                if (req.type.toLowerCase().includes('overtime')) {
                    ownDeptOtHours += req.hours; // All OT is now considered Own Dept OT
                } else {
                    if (reqTypeConfig.isPaidLeave) { paidLeaveHours += req.hours; } 
                    else { unpaidLeaveHours += req.hours; }
                }
            }
            
            // D. Aggregate Claims and populate the allowance breakdown
            const userClaims = allClaims.filter(claim => claim.userId === user.email);
            for (const claim of userClaims) {
                const claimTypeInfo = claimTypesConfig.find(ct => ct.name === claim.claimType);
                if (claimTypeInfo && claimTypeInfo.category === 'Allowance') {
                    totalAllowances += claim.amount;
                    // Add the amount to the specific allowance column
                    allowanceDetails[`${claim.claimType} (RM)`] += claim.amount;
                } else { // This includes Reimbursements and any legacy types
                    totalReimbursements += claim.amount;
                }
            }

            // E. Assemble the final object for this user
            payrollData.push({
                Name: user.name,
                Department: user.primaryDepartment,
                Total_Workdays: totalWorkdays,
                Total_Attend_Days: totalAttendDays,
                'Paid_Leave_Hours': paidLeaveHours,
                'Unpaid_Leave_Hours': unpaidLeaveHours,
                'Own_Dept_OT_Hours': ownDeptOtHours,
                ...allowanceDetails, // Add the dynamic allowance columns
                'Total_Allowances_RM': parseFloat(totalAllowances.toFixed(2)),
                'Total_Reimbursements_RM': parseFloat(totalReimbursements.toFixed(2))
            });
        }

        // 6. --- RETURN DATA ---
        return payrollData;
    } catch (error) {
        console.error("Error generating payroll report:", error);
        throw new HttpsError("internal", "An unexpected error occurred while generating the report.", error.message);
    }
});

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

        if (holidayDoc.exists) {
            const holidayData = holidayDoc.data();
            // Check if it's a holiday for ALL departments
            if (holidayData.appliesTo && holidayData.appliesTo.includes('__ALL__')) {
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

            // --- NEW CHECK INSIDE THE LOOP ---
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
                    type: 'Absent', details: 'No check-in record and no approved leave.', status: 'Pending',
                    acknowledged: false
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
                        type: 'Late', details: `Checked in at ${checkInTime.format('HH:mm')} instead of ${schedule.checkIn}.`, status: 'Pending',
                        acknowledged: false
                    });
                    lateCount++;
                }
            }
            if (!attendanceRecord.checkOutTime) {
                const exceptionRef = db.collection('attendanceExceptions').doc();
                batch.set(exceptionRef, {
                    date: todayStr, userId: userId, userName: user.name, department: user.primaryDepartment,
                    type: 'MissedCheckout', details: 'User checked in but did not check out.', status: 'Pending',
                    acknowledged: false
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
    //     throw new HttpsError('unauthenticated', 'Authentication required.');
    // }
    console.log("--- Manually triggering Daily Attendance Check for testing ---");
    await runAttendanceCheckLogic();
    console.log("--- Manual trigger finished ---");
    return { status: "complete" };
});

// =================================================================================
// FIRESTORE TRIGGER: onUserUpdated (NEW)
// This function automatically syncs a user's roles from their Firestore
// document to their Auth token as custom claims. This is CRITICAL for
// security rules to work correctly.
// =================================================================================
exports.onUserUpdated = onDocumentUpdated("users/{userEmail}", async (event) => {
    console.log(`User document updated for: ${event.params.userEmail}`);
    const afterData = event.data.after.data();
    console.log(`Syncing custom claims for ${afterData.email}.`);
    try {
       const user = await admin.auth().getUserByEmail(afterData.email);
        // --- THIS IS THE KEY CHANGE ---
        // Convert the managedDepartments array into a Map object for security rules.
        // FROM: ['Sales', 'Support']
        // TO:   { Sales: true, Support: true }
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