const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma", "Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel", "Raymond", "Catherine", "Patrick", "Carolyn", "Alexander", "Janet", "Jack", "Ruth", "Dennis", "Maria"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Product", "Customer Support"];

async function main() {
  console.log('Clearing old data...');
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.salaryHead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.department.deleteMany();
  
  // Due to relation constraints, we must delete manager relationships before deleting users
  await prisma.user.updateMany({ data: { managerId: null }});
  await prisma.user.deleteMany();

  console.log('Seeding Supabase/Neon Live Database...');

  // 1. Create Departments
  for (const name of departments) {
    await prisma.department.create({
      data: { name, budget: Math.floor(Math.random() * 2000000) + 500000 }
    });
  }

  // 2. Create the System Admin (CEO)
  const adminId = "cmri3jxi700041mmgjct8xyss"; // Same ID used in auth client for ease
  const admin = await prisma.user.create({
    data: {
      id: adminId,
      name: "Nazmul Admin",
      email: "nazmulhas36@gmail.com",
      role: "Admin",
      department: "Executive",
      designation: "CEO",
      status: "active"
    }
  });

  // 3. Create Directors for each department
  const headIds = [];
  for (let idx = 0; idx < departments.length; idx++) {
    const dept = departments[idx];
    const user = await prisma.user.create({
      data: {
        id: `head_${idx}`,
        name: `${firstNames[idx % firstNames.length]} ${lastNames[idx % lastNames.length]}`,
        email: `head${idx}@company.com`,
        role: "Manager",
        department: dept,
        designation: `VP of ${dept}`,
        managerId: adminId,
        status: "active"
      }
    });
    headIds.push(user.id);
  }

  // 4. Create 90 Employees
  const usersToCreate = [];
  for (let i = 0; i < 90; i++) {
    const deptIdx = Math.floor(Math.random() * departments.length);
    const dept = departments[deptIdx];
    const isManager = i % 10 === 0;
    let managerId = headIds[deptIdx];
    
    // Some logic to assign intermediate managers
    if (!isManager && i > 10 && (Math.random() > 0.5)) {
      managerId = `emp_${Math.floor(i/10) * 10}`;
    }

    const id = `emp_${i}`;
    usersToCreate.push({
      id,
      name: `${firstNames[(i + departments.length) % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      email: `emp${i}@company.com`,
      role: isManager ? "Manager" : "Employee",
      department: dept,
      designation: isManager ? `${dept} Manager` : `Senior ${dept} Specialist`,
      managerId: managerId,
      status: "active"
    });
  }

  // Since we have self-relations, we create users first without managerId, then link them
  await prisma.user.createMany({
    data: usersToCreate.map(({ managerId, ...rest }) => rest)
  });

  for (const user of usersToCreate) {
    if (user.managerId && user.managerId !== user.id) { // Avoid self-referencing issues
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { managerId: user.managerId }
        });
      } catch (e) {
        // manager might not exist if created later in loop, fallback to dept head
      }
    }
  }

  // Create Salary Heads
  await prisma.salaryHead.createMany({
    data: [
      { name: 'Basic Salary', type: 'EARNING' },
      { name: 'House Rent Allowance', type: 'EARNING' },
      { name: 'Income Tax', type: 'DEDUCTION' },
      { name: 'Health Insurance', type: 'DEDUCTION' }
    ]
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
