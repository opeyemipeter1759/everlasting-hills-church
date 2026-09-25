-- Two separate consents: reading a testimony out live during a gathering, and
-- publishing it on the church's platforms. Somebody may give one and withhold
-- the other, so they cannot share a column. NULL means not asked, which is not
-- the same as refused — existing rows keep that distinction.
ALTER TABLE "Testimonial" ADD COLUMN "shareLive" BOOLEAN;
ALTER TABLE "Testimonial" ADD COLUMN "shareOnline" BOOLEAN;
