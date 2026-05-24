import { createClerkClient } from "@clerk/backend";
import { db, userSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const USERNAME = process.argv[2] ?? "Charles1";
const PASSWORD = process.argv[3] ?? "Akiko1977!";

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY missing");
  const clerk = createClerkClient({ secretKey });

  let user;
  const existing = await clerk.users.getUserList({ username: [USERNAME] });
  if (existing.data.length > 0) {
    user = existing.data[0]!;
    console.log(`User ${USERNAME} already exists (id=${user.id}); updating password.`);
    await clerk.users.updateUser(user.id, { password: PASSWORD, skipPasswordChecks: true });
  } else {
    user = await clerk.users.createUser({
      username: USERNAME,
      emailAddress: [`${USERNAME.toLowerCase()}@lectioread.com`],
      password: PASSWORD,
      skipPasswordChecks: true,
    });
    console.log(`Created user ${USERNAME} (id=${user.id}).`);
  }

  const [row] = await db
    .select()
    .from(userSubscriptionsTable)
    .where(eq(userSubscriptionsTable.userId, user.id));
  const farFuture = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
  if (row) {
    await db
      .update(userSubscriptionsTable)
      .set({ status: "active", currentPeriodEnd: farFuture })
      .where(eq(userSubscriptionsTable.userId, user.id));
    console.log("Updated existing subscription row to active.");
  } else {
    await db.insert(userSubscriptionsTable).values({
      userId: user.id,
      email: null,
      status: "active",
      currentPeriodEnd: farFuture,
    });
    console.log("Inserted comp subscription row (status=active).");
  }
  console.log("Done.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
