import { db } from "@/db";
import { user } from "@/db/schemas/user"; // Adjust schema import if needed

export async function seedUser() {
  console.log("Seeding User...");
  
  // TODO: Insert your dummy data here
  // await db.insert(user).values([
  //   { name: "Dummy 1" },
  //   { name: "Dummy 2" },
  // ]);
  
  console.log("✓ User seeded successfully");
}
