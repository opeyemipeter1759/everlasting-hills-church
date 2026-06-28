"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const supabase_js_1 = require("@supabase/supabase-js");
async function main() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    const prisma = new client_1.PrismaClient();
    const admin = (0, supabase_js_1.createClient)(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const profiles = await prisma.profile.findMany({ select: { userId: true, role: true } });
    let ok = 0;
    let failed = 0;
    for (const p of profiles) {
        try {
            const { data: current } = await admin.auth.admin.getUserById(p.userId);
            const existing = current?.user?.app_metadata ?? {};
            const { error } = await admin.auth.admin.updateUserById(p.userId, {
                app_metadata: { ...existing, role: p.role },
            });
            if (error) {
                failed++;
                console.warn(`  fail ${p.userId} (${p.role}): ${error.message}`);
            }
            else {
                ok++;
            }
        }
        catch (err) {
            failed++;
            console.warn(`  err  ${p.userId} (${p.role}): ${err.message}`);
        }
    }
    console.log(`Backfilled app_metadata.role: ${ok} ok, ${failed} failed (of ${profiles.length}).`);
    await prisma.$disconnect();
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=backfill-role-claims.js.map