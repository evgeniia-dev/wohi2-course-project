const {
  resetDb,
  registerAndLogin,
  createQuestion,
  request,
  app,
  prisma
} = require("./helpers");

beforeEach(resetDb);

describe("question tests", () => {
  it("returns 200 list with pagination shape", async () => {
    const token = await registerAndLogin();
    await createQuestion(token);

    const res = await request(app)
      .get("/api/questions?page=1&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.total).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it("returns 404 for unknown question", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .get("/api/questions/99999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found");
  });

  it("returns 401 when creating without token", async () => {
    const res = await request(app)
      .post("/api/questions")
      .send({
        question: "Which language styles web pages?",
        answer: "CSS"
      });

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid question body", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        question: ""
      });

    expect(res.status).toBe(400);
  });

  it("creates a question", async () => {
    const token = await registerAndLogin();

    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        question: "Which language styles web pages?",
        answer: "CSS"
      });

    expect(res.status).toBe(201);
    expect(res.body.question).toBe("Which language styles web pages?");
    expect(res.body.answer).toBe("CSS");
    expect(res.body.userName).toBe("A");
  });

  it("updates own question", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token);

    const res = await request(app)
      .put(`/api/questions/${question.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        question: "Which language adds interactivity?",
        answer: "JavaScript"
      });

    expect(res.status).toBe(200);
    expect(res.body.question).toBe("Which language adds interactivity?");
    expect(res.body.answer).toBe("JavaScript");
  });

  it("deletes own question", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token);

    const res = await request(app)
      .delete(`/api/questions/${question.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const after = await prisma.question.findUnique({
      where: {
        id: question.id
      }
    });

    expect(after).toBe(null);
  });

  it("returns 403 when editing someone else's question", async () => {
    const aliceToken = await registerAndLogin("alice@test.io", "Alice");
    const question = await createQuestion(aliceToken, {
      question: "Alice question",
      answer: "CSS"
    });

    const bobToken = await registerAndLogin("bob@test.io", "Bob");

    const res = await request(app)
      .put(`/api/questions/${question.id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({
        question: "Hijacked question",
        answer: "HTML"
      });

    expect(res.status).toBe(403);

    const after = await prisma.question.findUnique({
      where: {
        id: question.id
      }
    });

    expect(after.question).toBe("Alice question");
  });

  it("returns 403 when deleting someone else's question", async () => {
    const aliceToken = await registerAndLogin("alice@test.io", "Alice");
    const question = await createQuestion(aliceToken);

    const bobToken = await registerAndLogin("bob@test.io", "Bob");

    const res = await request(app)
      .delete(`/api/questions/${question.id}`)
      .set("Authorization", `Bearer ${bobToken}`);

    expect(res.status).toBe(403);

    const after = await prisma.question.findUnique({
      where: {
        id: question.id
      }
    });

    expect(after).not.toBe(null);
  });
});