import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.task.deleteMany();
  await db.knowledgeEntry.deleteMany();
  await db.project.deleteMany();
  await db.journalEntry.deleteMany();
  await db.inboxItem.deleteMany();

  await db.knowledgeEntry.createMany({ data: [
    { title: "Why people buy status", type: "insight", topic: "Psychology", tags: "consumer behavior,status", content: "Status can shape perceived value and purchasing decisions." },
    { title: "Behavioral economics video", type: "source", topic: "Behavioral Economics", tags: "bias,decision-making", content: "Reference source for research into predictable decision patterns." },
    { title: "Digital product idea", type: "idea", topic: "Business", tags: "digital products,business", content: "A focused digital product built around a recurring user problem." }
  ]});

  await db.task.createMany({ data: [
    { title: "Review today's priorities", date: new Date("2026-09-25T00:00:00Z"), time: "08:00", duration: 20, priority: "high" },
    { title: "Research consumer psychology", date: new Date("2026-09-25T00:00:00Z"), time: "11:30", duration: 60, project: "Research", priority: "medium" },
    { title: "Develop content ideas", date: new Date("2026-09-25T00:00:00Z"), time: "16:00", duration: 90, project: "Content", priority: "medium" },
    { title: "Daily review", date: new Date("2026-09-25T00:00:00Z"), time: "20:00", duration: 20, priority: "high" }
  ]});

  await db.project.createMany({ data: [
    { name: "Research", description: "Active investigations and source collection.", progress: 42 },
    { name: "Content", description: "Turn research into publishable ideas and drafts.", progress: 28 },
    { name: "Business", description: "Build and validate useful digital products.", progress: 17 }
  ]});

  await db.inboxItem.create({ data: { text: "Connect research, knowledge, and content ideas inside NEXUM." } });
}

main().finally(() => db.$disconnect());
