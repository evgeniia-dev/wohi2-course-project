const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      attempts: {
        where: {
          correct: true
        }
      }
    }
  });

  const leaderboard = users
    .map((user) => ({
      userId: user.id,
      name: user.name,
      correctAttempts: user.attempts.length
    }))
    .sort((a, b) => b.correctAttempts - a.correctAttempts)
    .slice(0, 5);

  res.json({
    data: leaderboard
  });
});

module.exports = router;