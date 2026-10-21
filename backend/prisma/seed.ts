import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/config/env.js";

const SALT_ROUNDS = 12;

async function main() {
  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      name: env.ADMIN_NAME,
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: true,
    },
    create: {
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: true,
    },
  });
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
