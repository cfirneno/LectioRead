import { Router, type IRouter } from "express";
import { OUTREACH_RECIPIENTS } from "../data/outreach-recipients";
import { requireAdmin } from "../lib/adminGuard";

const router: IRouter = Router();

// Admin only — discloses the harvested recipient email list and send times.
router.get("/outreach/recipients", requireAdmin, (_req, res): void => {
  const recipients = [...OUTREACH_RECIPIENTS].sort((a, b) =>
    a.sentAt.localeCompare(b.sentAt),
  );
  res.json({ recipients });
});

export default router;
