import { Router, type IRouter } from "express";
import healthRouter from "./health";
import textsRouter from "./texts";
import paragraphsRouter from "./paragraphs";
import progressRouter from "./progress";

const router: IRouter = Router();

router.use(healthRouter);
router.use(textsRouter);
router.use(paragraphsRouter);
router.use(progressRouter);

export default router;
