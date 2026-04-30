const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function formatQuestion(question) {
  return {
    ...question,
    userName: question.user?.name || null,
    user: undefined
  };
}

router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
  const skip = (page - 1) * limit;

  const where = keyword
    ? {
        OR: [
          {
            question: {
              contains: keyword
            }
          },
          {
            answer: {
              contains: keyword
            }
          }
        ]
      }
    : {};

  const [filteredQuestions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        user: true
      },
      orderBy: {
        id: "asc"
      },
      skip,
      take: limit
    }),
    prisma.question.count({
      where
    })
  ]);

  res.json({
    data: filteredQuestions.map(formatQuestion),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  });
});

router.get("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  const question = await prisma.question.findUnique({
    where: {
      id: questionId
    },
    include: {
      user: true
    }
  });

  if (!question) {
    return res.status(404).json({
      message: "Question not found"
    });
  }

  res.json(formatQuestion(question));
});

router.post("/", authenticate, upload.single("image"), async (req, res) => {
  const { question, answer } = req.body || {};
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  const newQuestion = await prisma.question.create({
    data: {
      question,
      answer,
      imageUrl,
      userId: req.user.userId
    },
    include: {
      user: true
    }
  });

  res.status(201).json(formatQuestion(newQuestion));
});

router.post("/:questionId/play", authenticate, async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { submittedAnswer } = req.body || {};

  if (!submittedAnswer) {
    return res.status(400).json({
      message: "submittedAnswer is required"
    });
  }

  const question = await prisma.question.findUnique({
    where: {
      id: questionId
    }
  });

  if (!question) {
    return res.status(404).json({
      message: "Question not found"
    });
  }

  const correct =
    submittedAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();

  const attempt = await prisma.attempt.create({
    data: {
      submittedAnswer,
      correct,
      userId: req.user.userId,
      questionId
    }
  });

  res.status(201).json({
    id: attempt.id,
    correct: attempt.correct,
    submittedAnswer: attempt.submittedAnswer,
    correctAnswer: question.answer,
    createdAt: attempt.createdAt
  });
});

router.put(
  "/:questionId",
  authenticate,
  upload.single("image"),
  isOwner,
  async (req, res) => {
    const questionId = Number(req.params.questionId);
    const { question, answer } = req.body || {};

    if (!question || !answer) {
      return res.status(400).json({
        message: "question and answer are required"
      });
    }

    const data = {
      question,
      answer
    };

    if (req.file) {
      data.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedQuestion = await prisma.question.update({
      where: {
        id: questionId
      },
      data,
      include: {
        user: true
      }
    });

    res.json(formatQuestion(updatedQuestion));
  }
);

router.delete("/:questionId", authenticate, isOwner, async (req, res) => {
  const questionId = Number(req.params.questionId);

  await prisma.question.delete({
    where: {
      id: questionId
    }
  });

  res.json({
    message: "Question deleted successfully",
    question: formatQuestion(req.question)
  });
});

router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    err?.message === "Only image files are allowed"
  ) {
    return res.status(400).json({
      msg: err.message
    });
  }

  next(err);
});

module.exports = router;