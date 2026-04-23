const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

// GET /questions - list all questions or filter by keyword
router.get("/", async (req, res) => {
  const { keyword } = req.query;

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

  const questions = await prisma.question.findMany({
    where,
    orderBy: {
      id: "asc"
    }
  });

  res.json(questions);
});

// GET /questions/:questionId
// Show a specific question by its ID
router.get("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  const question = await prisma.question.findUnique({
    where: {
      id: questionId
    }
  });

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  res.json(question);
});

// POST /questions
// Create a new question
router.post("/", authenticate, async (req, res) => {
  const { question, answer } = req.body || {};

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  const newQuestion = await prisma.question.create({
    data: {
      question,
      answer,
      userId: req.user.userId
    }
  });

  res.status(201).json(newQuestion);
});

// PUT /questions/:questionId
// Edit a question by its ID
router.put("/:questionId", authenticate, isOwner, async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { question, answer } = req.body || {};

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and answer are required"
    });
  }

  const updatedQuestion = await prisma.question.update({
    where: {
      id: questionId
    },
    data: {
      question,
      answer
    }
  });

  res.json(updatedQuestion);
});

// DELETE /questions/:questionId
// Delete a question by its ID
router.delete("/:questionId", authenticate, isOwner, async (req, res) => {
  const questionId = Number(req.params.questionId);

  await prisma.question.delete({
    where: {
      id: questionId
    }
  });

  res.json({
    message: "Question deleted successfully",
    question: req.question
  });
});

module.exports = router;