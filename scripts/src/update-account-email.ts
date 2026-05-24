import { createClerkClient } from "@clerk/backend";

const USERNAME = process.argv[2]!;
const NEW_EMAIL = process.argv[3]!;

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const list = await clerk.users.getUserList({ username: [USERNAME] });
  const user = list.data[0];
  if (!user) throw new Error(`User ${USERNAME} not found`);

  // Add new email first (must keep at least one on the account)
  const added = await clerk.emailAddresses.createEmailAddress({
    userId: user.id,
    emailAddress: NEW_EMAIL,
    verified: true,
    primary: true,
  });
  // Then remove the others
  for (const e of user.emailAddresses) {
    if (e.id !== added.id) {
      await clerk.emailAddresses.deleteEmailAddress(e.id);
    }
  }
  console.log(`Set ${USERNAME} primary email to ${NEW_EMAIL} (id=${added.id}).`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
