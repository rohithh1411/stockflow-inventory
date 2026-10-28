import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { AppError } from "./errors.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Compared against when the email is unknown, so "no such user" and
// "wrong password" take about the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const cleanEmail = (email) => String(email ?? "").trim().toLowerCase();

// Creates an organization and its first user together.
export async function createAccount({ email, password, orgName }) {
  email = cleanEmail(email);
  password = String(password ?? "");
  orgName = String(orgName ?? "").trim();

  if (!EMAIL_RE.test(email)) throw new AppError(400, "Enter a valid email");
  if (password.length < 8) throw new AppError(400, "Password must be at least 8 characters");
  if (password.length > 72) throw new AppError(400, "Password must be 72 characters or fewer");
  if (!orgName) throw new AppError(400, "Organization name is required");
  if (orgName.length > 100) throw new AppError(400, "Organization name must be 100 characters or fewer");

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const org = await prisma.organization.create({
      data: { name: orgName, users: { create: { email, passwordHash } } },
      include: { users: true },
    });
    return org.users[0];
  } catch (e) {
    if (e?.code === "P2002") throw new AppError(409, "An account with this email already exists");
    throw e;
  }
}

export async function verifyLogin({ email, password }) {
  email = cleanEmail(email);
  password = String(password ?? "");
  if (!email || !password) throw new AppError(400, "Email and password are required");

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, "Invalid email or password");
  return user;
}
