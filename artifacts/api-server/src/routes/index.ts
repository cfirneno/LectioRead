import { Router, type IRouter } from "express";
import healthRouter from "./health";
import textsRouter from "./texts";
import paragraphsRouter from "./paragraphs";
import progressRouter from "./progress";
import subscriptionRouter from "./subscription";
import donateRouter from "./donate";
import subscribeRouter from "./subscribe";
import lookupRouter from "./lookup";
import quizRouter from "./quiz";
import flashcardsRouter from "./flashcards";
import visitsRouter from "./visits";
import outreachRouter from "./outreach";
import adminRouter from "./admin";

const router: IRouter = Router();

// Public routers (no blanket auth guard) must be mounted before any router that
// applies a router-level guard (e.g. requireAuthed) at "/", so the guard can't
// 401 a public path before it matches its own handler.
router.use(healthRouter);
router.use(visitsRouter);
router.use(outreachRouter);
router.use(adminRouter);
router.use(subscriptionRouter);
router.use(donateRouter);
router.use(subscribeRouter);
router.use(lookupRouter);
router.use(textsRouter);
router.use(paragraphsRouter);
router.use(progressRouter);
router.use(quizRouter);
router.use(flashcardsRouter);

export default router;
