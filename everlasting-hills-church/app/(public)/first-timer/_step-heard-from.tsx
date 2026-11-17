"use client";

import { FRIEND_OR_FAMILY, HEARD_OTHER, HOW_DID_YOU_LEARN_OPTIONS, fieldLabel } from "@/lib/first-timer/fields";
import { FieldError, GroupLabel, Label, RadioCard, StepHeader, ic, type Step2Props } from "./_steps";

/**
 * Step 2: how they found us. The options and labels come from the shared
 * first-timer field definitions, so the Overview and profiles word them the
 * same way. Friend or family asks who invited them; Other asks how.
 */
export function Step2FriendFamilyLocation({ register, errors, watch }: Step2Props) {
  const howDidYouLearn = watch("how_did_you_learn");

  return (
    <div className="space-y-5">
      <StepHeader title="How Did You Find Us? 🔍" subtitle="Help us understand how you came across Everlasting Hills Church." />

      <div>
        <GroupLabel required>{fieldLabel("howDidYouLearn")}</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOW_DID_YOU_LEARN_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              description={opt.description}
              fieldName="how_did_you_learn"
              register={register}
              validation={{ required: "Please let us know how you found us" }}
              hasError={!!errors.how_did_you_learn}
            />
          ))}
        </div>
        <FieldError message={errors.how_did_you_learn?.message} />
      </div>

      {howDidYouLearn === FRIEND_OR_FAMILY && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Label htmlFor="invited_by" required>{fieldLabel("invitedBy")}</Label>
          <input
            id="invited_by"
            type="text"
            placeholder="Enter their name"
            className={ic(!!errors.invited_by)}
            {...register("invited_by", {
              required: "Please tell us who invited you",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
          />
          <FieldError message={errors.invited_by?.message} />
        </div>
      )}

      {howDidYouLearn === HEARD_OTHER && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Label htmlFor="heard_from_other" required>{fieldLabel("heardFromOther")}</Label>
          <input
            id="heard_from_other"
            type="text"
            placeholder="A few words is enough"
            className={ic(!!errors.heard_from_other)}
            {...register("heard_from_other", {
              required: "Please tell us how you heard about us",
              maxLength: { value: 200, message: "Keep it under 200 characters" },
            })}
          />
          <FieldError message={errors.heard_from_other?.message} />
        </div>
      )}
    </div>
  );
}
