const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const seedQuestions = [
  {
    question: "Which programming language is mainly used to style web pages?",
    answer: "CSS",
    difficulty: "easy"
  },
  {
    question: "Which programming language is commonly used to add interactivity to websites?",
    answer: "JavaScript",
    difficulty: "easy"
  },
  {
    question: "Which programming language is known for using indentation instead of curly braces?",
    answer: "Python",
    difficulty: "easy"
  },
  {
    question: "Which programming language is famous for the slogan 'Write once, run anywhere'?",
    answer: "Java",
    difficulty: "medium"
  },
  {
    question: "Which programming language was created by Apple for iOS app development?",
    answer: "Swift",
    difficulty: "medium"
  },
  {
    question: "Which programming language is often used for server-side scripting and can be embedded in HTML?",
    answer: "PHP",
    difficulty: "medium"
  },
  {
    question: "Which programming language is widely used for system programming and is known for manual memory management?",
    answer: "C",
    difficulty: "hard"
  },
  {
    question: "Which programming language is an extension of C and is widely used in game development?",
    answer: "C++",
    difficulty: "hard"
  },
  {
    question: "Which programming language was developed by Microsoft and is commonly used with .NET?",
    answer: "C#",
    difficulty: "medium"
  },
  {
    question: "Which programming language is widely used for data analysis, machine learning, and AI?",
    answer: "Python",
    difficulty: "easy"
  }
];

async function main() {
  const hashedPassword = await bcrypt.hash("1234", 10);

  const user = await prisma.user.upsert({
    where: {
      email: "admin@example.com"
    },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User"
    }
  });

  for (const item of seedQuestions) {
    const existingQuestion = await prisma.question.findFirst({
      where: {
        question: item.question
      }
    });

    if (existingQuestion) {
      await prisma.question.update({
        where: {
          id: existingQuestion.id
        },
        data: {
          difficulty: item.difficulty
        }
      });
    } else {
      await prisma.question.create({
        data: {
          question: item.question,
          answer: item.answer,
          difficulty: item.difficulty,
          userId: user.id
        }
      });
    }
  }

  console.log("Seeded admin user and demo questions without deleting existing data");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });