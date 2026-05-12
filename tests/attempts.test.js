const {
  resetDb,
  registerAndLogin,
  createQuestion,
  request,
  app,
  prisma
} = require("./helpers");

beforeEach(resetDb);

describe("attempt tests", () => {
  it("creates a correct attempt", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, {
      question: "Which language styles web pages?",
      answer: "CSS"
    });

    const res = await request(app)
      .post(`/api/questions/${question.id}/play`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        submittedAnswer: "CSS"
      });

    expect(res.status).toBe(201);
    expect(res.body.correct).toBe(true);
    expect(res.body.submittedAnswer).toBe("CSS");
    expect(res.body.correctAnswer).toBe("CSS");

    const attempts = await prisma.attempt.findMany();
    expect(attempts.length).toBe(1);
    expect(attempts[0].correct).toBe(true);
  });

  it("creates an incorrect attempt", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, {
      question: "Which language styles web pages?",
      answer: "CSS"
    });

    const res = await request(app)
      .post(`/api/questions/${question.id}/play`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        submittedAnswer: "HTML"
      });

    expect(res.status).toBe(201);
    expect(res.body.correct).toBe(false);
    expect(res.body.correctAnswer).toBe("CSS");
  });

  it("returns 400 when submittedAnswer is missing", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token);

    const res = await request(app)
      .post(`/api/questions/${question.id}/play`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 when playing unknown question", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post("/api/questions/99999/play")
      .set("Authorization", `Bearer ${token}`)
      .send({
        submittedAnswer: "CSS"
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found");
  });

  it("returns 401 without token", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token);

    const res = await request(app)
      .post(`/api/questions/${question.id}/play`)
      .send({
        submittedAnswer: "CSS"
      });

    expect(res.status).toBe(401);
  });
});