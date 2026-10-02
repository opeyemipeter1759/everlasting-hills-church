-- An optional cover image per series episode; the series' own image stands in when empty.
ALTER TABLE "SermonEpisode" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
