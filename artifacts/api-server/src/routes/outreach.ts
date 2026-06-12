import { Router, type IRouter } from "express";
import { OUTREACH_RECIPIENTS } from "../data/outreach-recipients";

const router: IRouter = Router();

// Public — read-only list of educator outreach recipients and send times.
router.get("/outreach/recipients", (_req, res): void => {
  const recipients = [...OUTREACH_RECIPIENTS].sort((a, b) =>
    a.sentAt.localeCompare(b.sentAt),
  );
  res.json({ recipients });
});

export default router;
