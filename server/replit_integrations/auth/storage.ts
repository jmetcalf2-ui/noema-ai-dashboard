import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Emails that get permanent Pro status
const PERMANENT_PRO_EMAILS = [
  'jmetcalf2@fordham.edu',
];

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this email gets permanent Pro status
    const isPermanentPro = userData.email && PERMANENT_PRO_EMAILS.includes(userData.email.toLowerCase());
    
    const valuesToInsert = isPermanentPro 
      ? { ...userData, subscriptionStatus: 'active' as const }
      : userData;
    
    const setValues = isPermanentPro
      ? { ...userData, subscriptionStatus: 'active' as const, updatedAt: new Date() }
      : { ...userData, updatedAt: new Date() };
    
    const [user] = await db
      .insert(users)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: users.id,
        set: setValues,
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
