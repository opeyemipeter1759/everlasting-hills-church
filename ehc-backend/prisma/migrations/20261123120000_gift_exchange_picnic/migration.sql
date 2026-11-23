-- Deploy through prisma migrate deploy only.
-- The gift exchange is now "gift exchange & picnic": a member says which of the two
-- they want to join (either or both). Everyone already signed up joined the gift
-- exchange, so they keep it and start with picnic off. Adds two columns only.

ALTER TABLE "GiftExchangeEntry"
    ADD COLUMN "giftExchange" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "picnic" BOOLEAN NOT NULL DEFAULT false;
