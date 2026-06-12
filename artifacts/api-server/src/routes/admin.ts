import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { isAdminUser } from "../lib/adminGuard";

const router: IRouter = Router();

// Lets the frontend know whether the signed-in user may view the dashboard.
router.get("/admin/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.json({ admin: false });
    return;
  }
  const admin = await isAdminUser(userId).catch(() => false);
  res.json({ admin });
});

export default router;
