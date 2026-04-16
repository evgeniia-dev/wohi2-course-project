const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
  {
    question: "Which programming language is mainly used to style web pages?",
    answer: "CSS",
  },
  {
    question: "Which programming language is commonly used to add interactivity to websites?",
    answer: "JavaScript",
  },
  {
    question: "Which programming language is known for using indentation instead of curly braces?",
    answer: "Python",
  },
  {
    question: "Which programming language is famous for the slogan 'Write once, run anywhere'?",
    answer: "Java",
  },
  {
    question: "Which programming language was created by Apple for iOS app development?",
    answer: "Swift",
  },
  {
    question: "Which programming language is often used for server-side scripting and can be embedded in HTML?",
    answer: "PHP",
  },
  {
    question: "Which programming language is widely used for system programming and is known for manual memory management?",
    answer: "C",
  },
  {
    question: "Which programming language is an extension of C and is widely used in game development?",
    answer: "C++",
  },
  {
    question: "Which programming language was developed by Microsoft and is commonly used with .NET?",
    answer: "C#",
  },
  {
    question: "Which programming language is widely used for data analysis, machine learning, and AI?",
    answer: "Python",
  },
];

async function main() {
  await prisma.question.deleteMany();

  for (const question of seedQuestions) {
    await prisma.question.create({
      data: {
        question: question.question,
        answer: question.answer,
      },
    });
  }

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());