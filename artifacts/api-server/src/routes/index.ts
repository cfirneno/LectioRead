import { Router, type IRouter } from "express";
import healthRouter from "./health";
import textsRouter from "./texts";
import paragraphsRouter from "./paragraphs";
import progressRouter from "./progress";
import subscriptionRouter from "./subscription";
import lookupRouter from "./lookup";
import quizRouter from "./quiz";
import flashcardsRouter from "./flashcards";
import visitsRouter from "./visits";

const router: IRouter = Router();

// Public routers (no blanket auth guard) must be mounted before the guarded
// routers below. A sub-router mounted at "/" runs its router-level
// requireSubscribedUser for every request that reaches it, so a guarded router
// placed earlier would 401 these public paths before they match.
router.use(healthRouter);
router.use(visitsRouter);
router.use(subscriptionRouter);
router.use(lookupRouter);
router.use(textsRouter);
router.use(paragraphsRouter);
router.use(progressRouter);
router.use(quizRouter);
router.use(flashcardsRouter);

export default router;
