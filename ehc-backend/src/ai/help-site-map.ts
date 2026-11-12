/**
 * Grounding text for HillsBot (the in-app help assistant, POST /ai/help-chat).
 * What each dashboard page is for, by who can reach it. This is the only
 * thing standing between an accurate answer and a confident guess, so keep
 * it in sync as pages are added, renamed, or moved.
 */
export const HELP_SITE_MAP = `
MEMBER PAGES (every signed-in member):
- /dashboard — home/overview: a snapshot of what's new.
- /dashboard/sermon — browse and watch/listen to past sermons, leave comments.
- /dashboard/reading — the daily Bible reading plan: today's portion, mark as read, streak. /dashboard/reading/plans to switch plans.
- /dashboard/prayer-watch — sign up for an overnight prayer watch hour ("Prayer Watchmen Family"), request a different hour.
- /dashboard/classes — apply to and attend a class (a cohort with weekly lessons).
- /dashboard/courses and /dashboard/explore-courses — self-paced courses: enroll, watch lessons, take exams, get certificates.
- /dashboard/calendar — upcoming church events and services.
- /dashboard/giving — give (tithe, offering, project giving); view giving history/receipts.
- /dashboard/attendance — check in to a service/program that's open for check-in.
- /dashboard/family — manage your household/family members.
- /dashboard/unit — the ministries/units you belong to or can join; shows unit leader contact.
- /dashboard/one-on-one — request a private session with a pastor.
- /dashboard/articles — write, submit, and read member-written articles/blog posts.
- /dashboard/books — read books from the church's library.
- /dashboard/profile — edit your own details, photo, email/phone, notification preferences.

ADMIN PAGES (Admin, Admin Head, Pastor, Super Admin):
- /dashboard/admin — admin home.
- /dashboard/admin/members — the member directory.
- /dashboard/admin/first-timers (+/funnel) — track first-time visitors through follow-up.
- /dashboard/admin/attendance (+/ushers-report) — attendance records and usher reports.
- /dashboard/admin/reading — manage reading plans.
- /dashboard/admin/prayer-watch — manage prayer watch sign-ups, slots, and slot leaders.
- /dashboard/admin/calendar and /dashboard/admin/events — manage church events.
- /dashboard/admin/classes and /dashboard/admin/courses — manage classes/courses, cohorts, enrollments.
- /dashboard/admin/finance — the finance ledger: tithe/offering/other income & expenses (Pastor and Finance Head only, others are redirected).
- /dashboard/admin/roles and /dashboard/admin/permissions — assign roles (Admin, Admin Head, Finance Head, etc.) to members.
- /dashboard/admin/departments, /dashboard/admin/units, /dashboard/admin/service-teams, /dashboard/admin/home-cell — manage ministries/departments/units.
- /dashboard/admin/announcements — post announcements members see.
- /dashboard/admin/emails — compose and send emails to members.
- /dashboard/admin/articles and /dashboard/admin/books — manage published articles and the book library.
- /dashboard/admin/inventory — track church assets/equipment.
- /dashboard/admin/pledges — manage giving pledges.
- /dashboard/admin/usher, /dashboard/admin/online-audience, /dashboard/admin/gatherings, /dashboard/admin/services — service-day operations, online attendance.

PASTOR PAGES (Pastor):
- /dashboard/pastor/sermons (+/new, +/analytics) — upload sermons and view engagement.
- /dashboard/pastor/testimonials — review member-submitted testimonies.
- /dashboard/pastor/follow-ups — pastoral follow-up on members.
- /dashboard/pastor/salvation — track salvation/decision records.
- /dashboard/pastor/reports (+/new) — pastoral reports.

UNIT LEAD PAGES (Unit Lead, HOD):
- /dashboard/unit-lead — the units you lead.
- /dashboard/unit-lead/[unitId] — a specific unit's overview and members.
- /dashboard/unit-lead/[unitId]/tasks — assign and track tasks for the unit.
- /dashboard/unit-lead/[unitId]/expenses — record unit expenses.
- /dashboard/unit-lead/[unitId]/roles — manage roles within the unit.
- /dashboard/unit-lead/[unitId]/reports (+/new) — submit unit reports.

GROWTH & OUTREACH / MEMBERSHIP ASSIMILATION LEADS:
- /dashboard/growth-outreach/[unitId] — the Growth & Outreach unit's dashboard.
- /dashboard/membership-assimilation/[unitId] — the Membership Assimilation unit's dashboard.

ACCOUNT (everyone):
- Forgotten password: use "Forgot password" on the sign-in page, not inside the dashboard.
- Change email/phone/photo/notification preferences: /dashboard/profile.
`.trim();
