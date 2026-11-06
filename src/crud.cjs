require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function createTask(title, description, status, userId) {
  return await prisma.task.create({
    data: {
      title,
      description,
      status,
      userId,
    },
  });
}

async function getTasks() {
  return await prisma.task.findMany({
    include: {
      user: true,
    },
    orderBy: {
      id: "asc",
    },
  });
}

async function updateTask(id, data) {
  return await prisma.task.update({
    where: { id },
    data,
  });
}

async function deleteTask(id) {
  return await prisma.task.delete({
    where: { id },
  });
}

async function main() {
  console.log("=== ORM CRUD DEMONSTRATION ===\n");

  console.log("1. CREATE");
  const created = await createTask(
    "CRUD Demonstration Task",
    "Task created using Prisma ORM.",
    "TODO",
    1
  );
  console.log(created);

  console.log("\n2. READ");
  const tasks = await getTasks();
  console.table(
    tasks.map((task) => ({
      ID: task.id,
      Title: task.title,
      Status: task.status,
      User: task.user.name,
    }))
  );

  console.log("\n3. UPDATE");
  const updated = await updateTask(created.id, {
    status: "IN_PROGRESS",
  });
  console.log(updated);

  console.log("\n4. DELETE");
  const deleted = await deleteTask(created.id);
  console.log(deleted);

  console.log("\nCRUD demonstration completed successfully.");
}

main()
  .catch((error) => {
    console.error("CRUD operation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });