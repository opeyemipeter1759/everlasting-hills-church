import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = process.env.DEFAULT_TENANT_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      phone_number,
      email,
      gender,
      how_did_you_learn,
      invited_by,
      located_in_ibadan,
      membership_interest,
      address,
      date_of_birth,
      occupation,
      born_again,
      service_experience,
      prayer_point,
      whatsapp_interest,
    } = body;

    if (!first_name || !last_name || !phone_number) {
      return NextResponse.json(
        { error: "First name, last name, and phone number are required." },
        { status: 400 }
      );
    }

    await db.visitor.create({
      data: {
        tenantId: TENANT_ID,
        firstName: String(first_name).trim(),
        lastName: String(last_name).trim(),
        phone: String(phone_number).trim(),
        email: email ? String(email).trim() : null,
        gender: gender ?? null,
        howDidYouLearn: how_did_you_learn ?? null,
        invitedBy: invited_by ?? null,
        locatedInIbadan:
          located_in_ibadan === true || located_in_ibadan === "true",
        membershipInterest: membership_interest ?? null,
        address: address ?? null,
        dateOfBirth: date_of_birth ?? null,
        occupation: occupation ?? null,
        bornAgain: born_again ?? null,
        serviceExperience: service_experience ?? null,
        prayerPoint: prayer_point ?? null,
        whatsappInterest:
          whatsapp_interest === true || whatsapp_interest === "true",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/first-timer]", error);
    return NextResponse.json(
      { error: "Failed to save. Please try again." },
      { status: 500 }
    );
  }
}
