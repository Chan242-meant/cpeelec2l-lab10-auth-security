require("dotenv/config");

const prisma = require("../src/prisma");

async function main() {
  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Santos",
      email: "alice@example.com",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Reyes",
      email: "bob@example.com",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Set up Prisma ORM",
        description: "Configure Prisma with MySQL.",
        status: "DONE",
        userId: user1.id,
      },
      {
        title: "Create database migration",
        description: "Apply the initial Prisma migration.",
        status: "DONE",
        userId: user1.id,
      },
      {
        title: "Implement Create operation",
        description: "Add functionality for creating tasks.",
        status: "IN_PROGRESS",
        userId: user2.id,
      },
      {
        title: "Implement Read operation",
        description: "Add functionality for viewing tasks.",
        status: "TODO",
        userId: user2.id,
      },
      {
        title: "Test CRUD operations",
        description: "Verify create, read, update, and delete behavior.",
        status: "TODO",
        userId: user1.id,
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log("Users created/verified: 2");
  console.log("Tasks created: 5");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });