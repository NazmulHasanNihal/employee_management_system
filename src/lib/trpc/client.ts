// Infinite Proxy Mock to replace tRPC across the codebase
// Extended to include 100+ simulated employees with proper hierarchy for testing

// --- MOCK DATA GENERATION ---
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma", "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel", "Raymond", "Catherine", "Patrick", "Carolyn", "Alexander", "Janet", "Jack", "Ruth", "Dennis", "Maria"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Product", "Customer Support"];
const roles = ["Employee", "Manager", "Director"];

const generateEmployeeData = () => {
  const objectives = Array.from({ length: 3 }).map((_, i) => ({
    id: `obj_${i}`,
    title: `Objective ${i + 1}`,
    progress: Math.floor(Math.random() * 100)
  }));

  const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent'];
  const attendances = Array.from({ length: 5 }).map((_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    status: attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)]
  }));

  const leaveRequests = Math.random() > 0.8 ? [
    { id: 'leave_1', type: 'Vacation', status: 'Pending', days: Math.floor(Math.random() * 5) + 1 }
  ] : [];

  const liveStatusOptions = ['Online', 'Online', 'In Meeting', 'Offline'];
  const liveStatus = liveStatusOptions[Math.floor(Math.random() * liveStatusOptions.length)];

  return { objectives, attendances, leaveRequests, liveStatus };
};

const generateEmployees = () => {
  const users: any[] = [];
  
  // 1. CEO (Nazmul)
  users.push({
    id: "cmri3jxi700041mmgjct8xyss",
    name: "Nazmul Admin",
    email: "nazmulhas36@gmail.com",
    role: "Admin",
    department: "Executive",
    designation: "CEO",
    managerId: null,
    avatarUrl: null,
    status: 'active',
    ...generateEmployeeData()
  });

  // 2. Department Heads (Directly reporting to CEO)
  const headIds: string[] = [];
  departments.forEach((dept, idx) => {
    const id = `head_${idx}`;
    headIds.push(id);
    users.push({
      id,
      name: `${firstNames[idx % firstNames.length]} ${lastNames[idx % lastNames.length]}`,
      email: `head${idx}@company.com`,
      role: "Director",
      department: dept,
      designation: `VP of ${dept}`,
      managerId: "cmri3jxi700041mmgjct8xyss", // Reports to Nazmul
      avatarUrl: null,
      status: 'active',
      ...generateEmployeeData()
    });
  });

  // 3. Managers & Employees (Reporting to Heads or Managers)
  for (let i = 0; i < 90; i++) {
    const id = `emp_${i}`;
    const deptIdx = Math.floor(Math.random() * departments.length);
    const dept = departments[deptIdx];
    const isManager = i % 10 === 0; // 1 in 10 is a mid-level manager
    
    // If manager, report to VP. If employee, report to VP or a Manager.
    let managerId = headIds[deptIdx]; // Default to VP
    if (!isManager && i > 10) {
      // 50% chance to report to a mid-level manager instead of VP if any exist
      managerId = (Math.random() > 0.5) ? `emp_${Math.floor(i/10) * 10}` : headIds[deptIdx];
    }

    users.push({
      id,
      name: `${firstNames[(i + departments.length) % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      email: `emp${i}@company.com`,
      role: isManager ? "Manager" : "Employee",
      department: dept,
      designation: isManager ? `${dept} Manager` : `Senior ${dept} Specialist`,
      managerId: managerId,
      avatarUrl: null,
      status: 'active',
      ...generateEmployeeData()
    });
  }
  
  return users;
};

const MOCK_USERS = generateEmployees();

// --- PROXY INTERCEPTOR ---
// We keep track of the access path, e.g. ["orgchart", "getOrgData"]
const createDummyHook = (path: string[]) => {
  return {
    useQuery: () => {
      const fullPath = path.join('.');
      
      // Intercept specific routes to return our 100+ fake employees
      if (fullPath === 'orgchart.getOrgData' || fullPath === 'orgchart.getTree') {
        return { data: { users: MOCK_USERS }, isLoading: false, error: null };
      }
      if (fullPath === 'registry.searchEmployees' || fullPath === 'registry.getAll') {
        return { data: MOCK_USERS, isLoading: false, error: null };
      }
      if (fullPath === 'team.getMyTeam') {
        // Return only people reporting to Nazmul
        const directReports = MOCK_USERS.filter(u => u.managerId === "cmri3jxi700041mmgjct8xyss");
        return { data: { teamId: 'team_1', directReports }, isLoading: false, error: null };
      }

      if (fullPath === 'messages.getConversations') {
        // Return top 15 users as recent conversations
        const conversations = MOCK_USERS.slice(0, 15).map(u => ({
          id: u.id,
          name: u.name,
          role: u.designation,
          avatarUrl: u.avatarUrl,
          online: u.liveStatus === 'Online'
        }));
        return { data: conversations, isLoading: false, error: null };
      }

      if (fullPath === 'messages.getMessages') {
        // Return a realistic fake chat history
        const dummyMessages = [
          { id: 'm1', content: 'Hey, do you have a minute to review the latest architecture draft?', senderId: 'other', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 'm2', content: 'Sure thing, give me 5 minutes to wrap up this meeting.', senderId: 'cmri3jxi700041mmgjct8xyss', createdAt: new Date(Date.now() - 3500000).toISOString() },
          { id: 'm3', content: 'Awesome, I left a comment on the database schema section. Need your approval before I merge.', senderId: 'other', createdAt: new Date(Date.now() - 3400000).toISOString() },
          { id: 'm4', content: 'Just looked at it. Looks solid. Go ahead and merge!', senderId: 'cmri3jxi700041mmgjct8xyss', createdAt: new Date(Date.now() - 100000).toISOString() },
          { id: 'm5', content: 'Thanks! Deploying to staging now.', senderId: 'other', createdAt: new Date(Date.now() - 50000).toISOString() }
        ];
        return { data: dummyMessages, isLoading: false, error: null };
      }

      if (fullPath === 'calendar.getEvents') {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // Generate dynamic dates for this month
        const mockEvents = [
          { id: 'e1', title: 'Mid-Month Payroll', description: 'Standard bi-weekly salary distribution.', date: new Date(year, month, 15).toISOString(), type: 'Payroll' },
          { id: 'e2', title: 'End-Month Payroll', description: 'Standard bi-weekly salary distribution.', date: new Date(year, month, 30).toISOString(), type: 'Payroll' },
          { id: 'e3', title: 'Company All-Hands', description: 'Quarterly all-hands meeting.', date: new Date(year, month, 12).toISOString(), type: 'Meeting' },
          { id: 'e4', title: 'Team Lunch', description: 'Catered lunch at the courtyard.', date: new Date(year, month, 8).toISOString(), type: 'Social' },
          { id: 'e5', title: 'National Holiday', description: 'Office is closed.', date: new Date(year, month, 4).toISOString(), type: 'Holiday' }
        ];
        return { data: mockEvents, isLoading: false, error: null };
      }

      if (fullPath === 'shifts.getShifts') {
        const mockShifts = [
          { id: 's1', name: 'Morning Shift', startTime: '08:00', endTime: '16:00' },
          { id: 's2', name: 'Evening Shift', startTime: '16:00', endTime: '00:00' },
          { id: 's3', name: 'Night Shift', startTime: '00:00', endTime: '08:00' }
        ];
        return { data: mockShifts, isLoading: false, error: null };
      }

      if (fullPath === 'shifts.getAssignments') {
        // Distribute top 8 mock users across the shifts
        const mockAssignments = [
          { id: 'a1', shiftId: 's1', userId: MOCK_USERS[0].id, userName: MOCK_USERS[0].name, userRole: MOCK_USERS[0].designation, userAvatar: MOCK_USERS[0].avatarUrl },
          { id: 'a2', shiftId: 's1', userId: MOCK_USERS[1].id, userName: MOCK_USERS[1].name, userRole: MOCK_USERS[1].designation, userAvatar: MOCK_USERS[1].avatarUrl },
          { id: 'a3', shiftId: 's1', userId: MOCK_USERS[2].id, userName: MOCK_USERS[2].name, userRole: MOCK_USERS[2].designation, userAvatar: MOCK_USERS[2].avatarUrl },
          { id: 'a4', shiftId: 's2', userId: MOCK_USERS[3].id, userName: MOCK_USERS[3].name, userRole: MOCK_USERS[3].designation, userAvatar: MOCK_USERS[3].avatarUrl },
          { id: 'a5', shiftId: 's2', userId: MOCK_USERS[4].id, userName: MOCK_USERS[4].name, userRole: MOCK_USERS[4].designation, userAvatar: MOCK_USERS[4].avatarUrl },
          { id: 'a6', shiftId: 's3', userId: MOCK_USERS[5].id, userName: MOCK_USERS[5].name, userRole: MOCK_USERS[5].designation, userAvatar: MOCK_USERS[5].avatarUrl },
          { id: 'a7', shiftId: 's3', userId: MOCK_USERS[6].id, userName: MOCK_USERS[6].name, userRole: MOCK_USERS[6].designation, userAvatar: MOCK_USERS[6].avatarUrl }
        ];
        return { data: mockAssignments, isLoading: false, error: null };
      }

      if (fullPath === 'payroll.getPayrolls') {
        const mockPayrolls = [
          { id: 'p1', month: 'July', year: 2026, status: 'PROCESSED', totalAmount: 42500, user: { name: 'Nazmul Hasan', email: 'nazmul@example.com' } },
          { id: 'p2', month: 'June', year: 2026, status: 'PROCESSED', totalAmount: 42500, user: { name: 'Nazmul Hasan', email: 'nazmul@example.com' } }
        ];
        return { data: mockPayrolls, isLoading: false, error: null };
      }

      if (fullPath === 'payroll.getHeads') {
        const mockHeads = [
          { id: 'h1', name: 'Basic Salary', type: 'EARNING' },
          { id: 'h2', name: 'House Rent Allowance', type: 'EARNING' },
          { id: 'h3', name: 'Income Tax', type: 'DEDUCTION' },
          { id: 'h4', name: 'Health Insurance', type: 'DEDUCTION' }
        ];
        return { data: mockHeads, isLoading: false, error: null };
      }

      if (fullPath === 'payroll.getStructures') {
        const mockStructures = [
          { id: 'st1', name: 'Standard Engineering Package', baseSalary: 120000 },
          { id: 'st2', name: 'Executive Package', baseSalary: 250000 }
        ];
        return { data: mockStructures, isLoading: false, error: null };
      }

      if (fullPath === 'expenses.getAll' || fullPath === 'expenses.getMyExpenses') {
        const mockExpenses = [
          { id: 'exp1', amount: 450.00, category: 'TRAVEL', description: 'Flight to NYC for Tech Conference', status: 'PENDING', isMileage: false, user: { name: 'Alex' } },
          { id: 'exp2', amount: 120.50, category: 'MEALS', description: 'Client Dinner at STK', status: 'APPROVED', isMileage: false, user: { name: 'Sarah' } },
          { id: 'exp3', amount: 2500.00, category: 'EQUIPMENT', description: 'MacBook Pro M3 Max Upgrade', status: 'APPROVED', isMileage: false, user: { name: 'Nazmul Hasan' } }
        ];
        return { data: mockExpenses, isLoading: false, error: null };
      }

      if (fullPath === 'assets.getAssets') {
        const mockAssets = [
          { id: 'ast1', name: 'MacBook Pro 16" M3 Max', status: 'Active', purchasePrice: 3499.00, purchaseDate: '2023-11-01', user: { name: 'Nazmul Hasan' } },
          { id: 'ast2', name: 'Dell UltraSharp 32" 4K', status: 'Active', purchasePrice: 899.00, purchaseDate: '2024-01-15', user: { name: 'Sarah' } },
          { id: 'ast3', name: 'ThinkPad X1 Carbon Gen 11', status: 'Maintenance', purchasePrice: 1899.00, purchaseDate: '2022-06-10', user: { name: 'Alex' } },
          { id: 'ast4', name: 'Keychron Q1 Pro', status: 'Active', purchasePrice: 199.00, purchaseDate: '2024-03-20', user: { name: 'Nazmul Hasan' } }
        ];
        return { data: mockAssets, isLoading: false, error: null };
      }

      if (fullPath === 'performance.getObjectives') {
        const mockObjectives = [
          { id: 'o1', title: 'Ship Q3 Architecture Update', progress: 85, status: 'On Track' },
          { id: 'o2', title: 'Reduce Server Latency by 20%', progress: 40, status: 'At Risk' },
          { id: 'o3', title: 'Complete Security Audit', progress: 100, status: 'Completed' }
        ];
        return { data: mockObjectives, isLoading: false, error: null };
      }

      if (fullPath === 'performance.getReviews') {
        const mockReviews = [
          { id: 'r1', reviewPeriod: 'Q2 2026', rating: 'Exceeds Expectations', comments: 'Excellent leadership shown during the recent product launch.', reviewerName: 'Alex' },
          { id: 'r2', reviewPeriod: 'Q1 2026', rating: 'Meets Expectations', comments: 'Solid performance. Let focus on reducing technical debt next quarter.', reviewerName: 'Sarah' }
        ];
        return { data: mockReviews, isLoading: false, error: null };
      }

      if (fullPath === 'benefits.getEmployeeBenefits') {
        const mockBenefits = [
          { id: 'b1', benefit: { name: 'Premium Health Coverage', description: 'Comprehensive medical, dental, and vision.', provider: 'BlueCross' }, status: 'ENROLLED' },
          { id: 'b2', benefit: { name: 'Gym Membership', description: '$100 monthly fitness stipend.', provider: 'Equinox' }, status: 'ENROLLED' },
          { id: 'b3', benefit: { name: '401k Matching', description: 'Up to 6% company match.', provider: 'Fidelity' }, status: 'ELIGIBLE' }
        ];
        return { data: mockBenefits, isLoading: false, error: null };
      }

      if (fullPath === 'benefits.getEquityGrants') {
        const mockEquity = [
          { id: 'eq1', grantDate: '2023-01-15', totalShares: 10000, vestedShares: 2500, currentStrikePrice: 1.50 }
        ];
        return { data: mockEquity, isLoading: false, error: null };
      }

      if (fullPath === 'benefits.getActiveEnrollmentPeriod') {
        return { data: { name: 'Annual Open Enrollment 2026', endDate: '2026-11-30T00:00:00.000Z' }, isLoading: false, error: null };
      }

      if (fullPath === 'recognition.getRecentKudos') {
        const mockKudos = [
          { id: 'k1', message: 'Huge thanks for stepping in and fixing the auth bug over the weekend!', senderName: 'Sarah', receiverName: 'Nazmul Hasan', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 'k2', message: 'Amazing presentation during the all-hands. Very inspiring!', senderName: 'Nazmul Hasan', receiverName: 'Alex', createdAt: new Date(Date.now() - 172800000).toISOString() }
        ];
        return { data: mockKudos, isLoading: false, error: null };
      }

      if (fullPath === 'feedback.getAllFeedback') {
        const mockFeedback = [
          { id: 'f1', category: 'Suggestion', message: 'We should upgrade the office coffee machine.', isAnonymous: true, status: 'NEW', createdAt: new Date().toISOString() },
          { id: 'f2', category: 'Culture', message: 'The recent team offsite was fantastic. Let\'s do it more often.', isAnonymous: false, status: 'REVIEWED', createdAt: new Date(Date.now() - 86400000).toISOString(), user: { name: 'Alex' } }
        ];
        return { data: mockFeedback, isLoading: false, error: null };
      }

      if (fullPath === 'documents.getDocuments') {
        const mockDocs = [
          { id: 'd1', name: '2026 Non-Disclosure Agreement (NDA)', requiresSignature: true, status: 'PENDING', url: '#', createdAt: new Date().toISOString() },
          { id: 'd2', name: 'Employee Handbook v3.0', requiresSignature: true, status: 'SIGNED', url: '#', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 'd3', name: 'Q3 Tax Withholding Form', requiresSignature: false, status: 'N/A', url: '#', createdAt: new Date(Date.now() - 172800000).toISOString() }
        ];
        return { data: mockDocs, isLoading: false, error: null };
      }

      if (fullPath === 'applications.list') {
        const mockApps = [
          { id: 'app1', type: 'Leave Request', details: 'Annual Vacation - 2 Weeks', status: 'Approved', user: { name: 'Sarah' } },
          { id: 'app2', type: 'Hardware Upgrade', details: 'Requesting new MacBook Pro M3 Max for heavy compute', status: 'Pending', user: { name: 'Nazmul Hasan' } },
          { id: 'app3', type: 'Travel Authorization', details: 'Conference in NYC (Dec 12-14)', status: 'Rejected', user: { name: 'Alex' } }
        ];
        return { data: mockApps, isLoading: false, error: null };
      }

      if (fullPath === 'compliance.getExpiringCertifications') {
        const mockExpiringCerts = [
          { id: 'cert1', name: 'Information Security Training (Annual)', expiryDate: new Date(Date.now() + 864000000).toISOString(), user: { name: 'Alex' } },
          { id: 'cert2', name: 'Anti-Harassment Certification', expiryDate: new Date(Date.now() + 1296000000).toISOString(), user: { name: 'Sarah' } }
        ];
        return { data: mockExpiringCerts, isLoading: false, error: null };
      }

      if (fullPath === 'compliance.getMyCertifications') {
        const mockMyCerts = [
          { id: 'myc1', name: 'SOC2 Compliance Training', expiryDate: new Date(Date.now() + 15552000000).toISOString() }
        ];
        return { data: mockMyCerts, isLoading: false, error: null };
      }

      if (fullPath === 'compliance.getWhistleblowerReports') {
        return { data: [], isLoading: false, error: null };
      }

      if (fullPath === 'helpdesk.getTickets') {
        const mockTickets = [
          { id: 't1', subject: 'Laptop Battery Failing', priority: 'Medium', status: 'In Progress', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 't2', subject: 'Payroll discrepancy on July Payslip', priority: 'High', status: 'Open', createdAt: new Date(Date.now() - 7200000).toISOString() },
          { id: 't3', subject: 'Need access to AWS Staging Environment', priority: 'Low', status: 'Resolved', createdAt: new Date(Date.now() - 86400000).toISOString() }
        ];
        return { data: mockTickets, isLoading: false, error: null };
      }

      if (fullPath === 'recruitment.getJobs') {
        const mockJobs = [
          { id: 'job1', title: 'Senior Full Stack Engineer', department: 'Engineering', location: 'Remote', type: 'Full-Time', status: 'OPEN', requiredSkills: '["React", "Node.js", "TypeScript"]', candidates: [ { id: 'c1', name: 'Alice Chen', status: 'Interviewing', email: 'alice@example.com' }, { id: 'c2', name: 'Bob Smith', status: 'Applied', email: 'bob@example.com' } ] },
          { id: 'job2', title: 'Product Manager', department: 'Product', location: 'New York (Hybrid)', type: 'Full-Time', status: 'OPEN', requiredSkills: '["Agile", "Jira", "User Research"]', candidates: [ { id: 'c3', name: 'Charlie Davis', status: 'Offer Extended', email: 'charlie@example.com' } ] }
        ];
        return { data: mockJobs, isLoading: false, error: null };
      }

      if (fullPath === 'team.getOrgChart') {
        const mockOrgTree = {
          id: 'ceo',
          name: 'Nazmul Hasan',
          designation: 'CEO & Founder',
          department: 'Executive',
          avatar: 'NH',
          children: [
            {
              id: 'cto',
              name: 'Sarah Jenkins',
              designation: 'Chief Technology Officer',
              department: 'Engineering',
              avatar: 'SJ',
              children: [
                {
                  id: 'vp-eng',
                  name: 'David Kim',
                  designation: 'VP of Engineering',
                  department: 'Engineering',
                  avatar: 'DK',
                  children: [
                    { id: 'eng1', name: 'Alice Chen', designation: 'Senior Frontend', department: 'Engineering', avatar: 'AC' },
                    { id: 'eng2', name: 'Bob Smith', designation: 'Backend Lead', department: 'Engineering', avatar: 'BS' }
                  ]
                }
              ]
            },
            {
              id: 'vphr',
              name: 'Alex Carter',
              designation: 'VP of Human Resources',
              department: 'Operations',
              avatar: 'AC',
              children: [
                { id: 'hr1', name: 'Mia Wong', designation: 'HR Business Partner', department: 'Operations', avatar: 'MW' }
              ]
            },
            {
              id: 'cmo',
              name: 'Elena Rodriguez',
              designation: 'Chief Marketing Officer',
              department: 'Marketing',
              avatar: 'ER',
              children: [
                { id: 'mkt1', name: 'James Wilson', designation: 'Director of Growth', department: 'Marketing', avatar: 'JW' }
              ]
            }
          ]
        };
        return { data: mockOrgTree, isLoading: false, error: null };
      }

      if (fullPath === 'departments.getDepartments') {
        const mockDepts = [
          { id: 'dept1', name: 'Engineering', budget: 1500000, head: { name: 'Sarah Jenkins' } },
          { id: 'dept2', name: 'Product', budget: 500000, head: null },
          { id: 'dept3', name: 'Human Resources', budget: 250000, head: { name: 'Alex Carter' } }
        ];
        return { data: mockDepts, isLoading: false, error: null };
      }

      if (fullPath === 'dei.getBiasAudit') {
        const mockAudit = {
          overallAvgSalary: 115000,
          analysis: [
            { group: 'Male', headcount: 45, avgSalary: 118000, biasFlag: false },
            { group: 'Female', headcount: 42, avgSalary: 104000, biasFlag: true },
            { group: 'Non-Binary', headcount: 5, avgSalary: 116000, biasFlag: false }
          ]
        };
        return { data: mockAudit, isLoading: false, error: null };
      }

      if (fullPath === 'audit.getLogs') {
        const mockLogs = [
          { id: 'log1', action: 'SECURITY_BREACH_ATTEMPT', target: 'PAYROLL_DB', user: 'Unknown IP (192.168.1.104)', severity: 'CRITICAL', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
          { id: 'log2', action: 'PERMISSION_ELEVATION', target: 'Alice Chen', user: 'Admin (System)', severity: 'WARNING', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
          { id: 'log3', action: 'PAYROLL_MUTATION', target: 'Salary Structure [Executive]', user: 'HR Manager', severity: 'WARNING', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
          { id: 'log4', action: 'USER_LOGIN', target: 'Bob Smith', user: 'Bob Smith', severity: 'INFO', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
          { id: 'log5', action: 'REPORT_EXPORTED', target: 'DEI_Q3_Metrics.csv', user: 'Admin (System)', severity: 'INFO', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString() }
        ];
        return { data: mockLogs, isLoading: false, error: null };
      }

      // Default empty data
      return { data: null, isLoading: false, error: null };
    },
    useMutation: () => ({ mutate: () => {}, mutateAsync: async () => {}, isLoading: false }),
    useSubscription: () => ({ data: null, error: null })
  };
};

const createProxy = (path: string[] = []): any => {
  const handler: ProxyHandler<any> = {
    get: function(target: any, prop: string | symbol): any {
      if (typeof prop === 'string') {
        if (prop === 'useQuery' || prop === 'useMutation' || prop === 'useSubscription') {
          return createDummyHook(path)[prop as keyof ReturnType<typeof createDummyHook>];
        }
        if (prop === 'useUtils') {
          return () => createProxy([]); // Infinite utils proxy
        }
        if (prop === 'invalidate') {
          return () => {};
        }
        
        // Push the property to the path and return a new proxy
        return createProxy([...path, prop]);
      }
      return target[prop];
    }
  };
  
  return new Proxy(() => {}, handler); // use a function as target so it can be called if needed
};

export const trpc = createProxy();
