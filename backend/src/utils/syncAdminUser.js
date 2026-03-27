import User from "../models/User.js";
import { getAdminEmail, getAdminName, getAdminPassword } from "../config/runtime.js";

export async function syncAdminUser() {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  const adminName = getAdminName();

  if (!adminEmail || !adminPassword) {
    return;
  }

  let adminUser = await User.findOne({ email: adminEmail }).select("+password");

  if (!adminUser) {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword
    });
    console.log(`Admin user created for ${adminEmail}`);
    return;
  }

  let shouldSave = false;

  if (adminUser.name !== adminName) {
    adminUser.name = adminName;
    shouldSave = true;
  }

  const passwordMatches = await adminUser.matchPassword(adminPassword);
  if (!passwordMatches) {
    adminUser.password = adminPassword;
    shouldSave = true;
  }

  if (shouldSave) {
    await adminUser.save();
    console.log(`Admin user synced for ${adminEmail}`);
  }
}
