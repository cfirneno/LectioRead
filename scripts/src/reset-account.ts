import { createClerkClient } from "@clerk/backend";
import { db, userSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const USERNAME = process.argv[2]!;

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const list = await clerk.users.getUserList({ username: [USERNAME] });
  for (const u of list.data) {
    await db.delete(userSubscriptionsTable).where(eq(userSubscriptionsTable.userId, u.id));
    await clerk.users.deleteUser(u.id);
    console.log(`Deleted ${USERNAME} (${u.id}).`);
  }
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
