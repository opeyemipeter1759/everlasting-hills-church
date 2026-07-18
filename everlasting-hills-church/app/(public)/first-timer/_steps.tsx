"use client";

import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Select } from "@/components/ui/select";

export type FormValues = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  gender: string;
  attendance_type: string; // "In-Person" | "Online"
  how_did_you_learn: string;
  invited_by?: string;
  located_in_ibadan: string; // "true" | "false" — only for In-Person
  membership_interest: string; // "Yes" | "Maybe" | "No"
  address: string;
  birth_month: string;
  birth_day: string;
  occupation: string;
  born_again: string;
  service_experience: string;
  prayer_point?: string;
  whatsapp_interest: string; // "true" | "false"
};

export type StepProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  control: Control<FormValues>;
};

export type Step2Props = StepProps & {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
};

export type Step3Props = StepProps & {
  isOnline: boolean;
  firstName: string;
  lastName: string;
};

// ── Class helpers (no wrapper components → ref reaches native DOM) ────────────

function ic(hasError?: boolean) {
  return (
    "w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-white " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-150 " +
    "[color-scheme:light] " +
    (hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-200/50"
      : "border-gray-200 focus:border-church-maroon focus:ring-church-maroon/20")
  );
}

function tc(hasError?: boolean) {
  return (
    "w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-white resize-none " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-150 " +
    (hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-200/50"
      : "border-gray-200 focus:border-church-maroon focus:ring-church-maroon/20")
  );
}

// ── Small shared pieces ───────────────────────────────────────────────────────

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && (
        <span className="text-red-500 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function GroupLabel({
  required,
  children,
}: {
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p className="block text-sm font-medium text-gray-700 mb-2">
      {children}
      {required && (
        <span className="text-red-500 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5" role="alert">
      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-6 mb-6 border-b border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

// Radio card: has-[:checked] for card highlight, native input for ref safety
function RadioCard({
  value,
  label,
  description,
  fieldName,
  register: reg,
  validation,
  hasError,
}: {
  value: string;
  label: string;
  description?: string;
  fieldName: keyof FormValues;
  register: UseFormRegister<FormValues>;
  validation?: object;
  hasError?: boolean;
}) {
  return (
    <label
      className={
        "relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer select-none " +
        "transition-all duration-150 " +
        "has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6] " +
        "hover:border-gray-300 " +
        (hasError ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white")
      }
    >
      <input
        type="radio"
        value={value}
        className="w-4 h-4 accent-church-maroon flex-shrink-0 cursor-pointer"
        {...reg(fieldName as any, validation)}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </label>
  );
}

// ── Step 1 — Personal Info ────────────────────────────────────────────────────

export function Step1PersonalInfo({ register, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Welcome Home! 👋"
        subtitle="We're thrilled to have you at Everlasting Hills Church. Tell us a bit about yourself."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name" required>First Name</Label>
          <input
            id="first_name"
            type="text"
            placeholder="e.g. John"
            className={ic(!!errors.first_name)}
            {...register("first_name", {
              required: "First name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
          />
          <FieldError message={errors.first_name?.message} />
        </div>

        <div>
          <Label htmlFor="last_name" required>Last Name</Label>
          <input
            id="last_name"
            type="text"
            placeholder="e.g. Adebowale"
            className={ic(!!errors.last_name)}
            {...register("last_name", {
              required: "Last name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
          />
          <FieldError message={errors.last_name?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="phone_number" required>Phone Number</Label>
        <input
          id="phone_number"
          type="tel"
          placeholder="e.g. 08012345678"
          className={ic(!!errors.phone_number)}
          {...register("phone_number", {
            required: "Phone number is required",
            minLength: { value: 7, message: "At least 7 digits" },
            pattern: {
              value: /^[\d\s\-\+\(\)]+$/,
              message: "Please enter a valid phone number",
            },
          })}
        />
        <FieldError message={errors.phone_number?.message} />
      </div>

      <div>
        <Label htmlFor="email" required>Email Address</Label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className={ic(!!errors.email)}
          {...register("email", {
            required: "Email address is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Please enter a valid email address",
            },
          })}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <GroupLabel required>How are you joining us today?</GroupLabel>
        <div className="grid grid-cols-2 gap-3">
          <RadioCard
            value="In-Person"
            label="In-Person"
            description="I'm physically at church"
            fieldName="attendance_type"
            register={register}
            validation={{ required: "Please select how you're attending" }}
            hasError={!!errors.attendance_type}
          />
          <RadioCard
            value="Online"
            label="Online / Livestream"
            description="I'm streaming the service"
            fieldName="attendance_type"
            register={register}
            validation={{ required: "Please select how you're attending" }}
            hasError={!!errors.attendance_type}
          />
        </div>
        <FieldError message={errors.attendance_type?.message} />
      </div>

      <div>
        <GroupLabel required>Gender</GroupLabel>
        <div className="grid grid-cols-2 gap-3">
          {(["Male", "Female"] as const).map((g) => (
            <RadioCard
              key={g}
              value={g}
              label={g}
              fieldName="gender"
              register={register}
              validation={{ required: "Please select your gender" }}
              hasError={!!errors.gender}
            />
          ))}
        </div>
        <FieldError message={errors.gender?.message} />
      </div>
    </div>
  );
}

// ── Step 2 — How You Found Us ─────────────────────────────────────────────────

const HOW_OPTIONS = [
  { id: "Social Media", label: "Social Media", description: "Instagram, Facebook, Twitter…" },
  { id: "Friend/Family", label: "Friend or Family", description: "Someone personally invited me" },
  { id: "Google Search", label: "Google Search", description: "Found us online" },
  { id: "Website", label: "Church Website", description: "Visited everlastinghills.org" },
  { id: "Flyer", label: "Flyer / Poster", description: "Physical or digital flyer" },
  { id: "Other", label: "Other", description: "Another way" },
];

export function Step2FriendFamilyLocation({ register, errors, watch }: Step2Props) {
  const howDidYouLearn = watch("how_did_you_learn");
  const isFriendFamily = howDidYouLearn === "Friend/Family";

  return (
    <div className="space-y-5">
      <StepHeader
        title="How Did You Find Us? 🔍"
        subtitle="Help us understand how you came across Everlasting Hills Church."
      />

      <div>
        <GroupLabel required>How did you learn about us?</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOW_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.id}
              value={opt.id}
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

      {isFriendFamily && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Label htmlFor="invited_by" required>Who invited you?</Label>
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
    </div>
  );
}

// ── Step 3 — Interest ─────────────────────────────────────────────────────────

export function Step3Interest({ register, errors, isOnline, firstName, lastName }: Step3Props) {
  const fullName = [firstName, lastName].map((s) => s?.trim()).filter(Boolean).join(" ") || "Friend";

  return (
    <div className="space-y-6">
      <StepHeader
        title="Your Interest 💭"
        subtitle="Tell us a bit more about your situation and church interest."
      />

      {/* Personalised online welcome */}
      {isOnline && (
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
          <p className="text-base font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🫂</span>
            Welcome to Everlasting Hills, {fullName}!
          </p>
          <p className="text-sm text-blue-700 leading-relaxed">
            Wherever you're watching from, you're part of this family.
            We're glad you found us. Pull up a seat, this is your church too.
          </p>
        </div>
      )}

      {/* Only for in-person attendees */}
      {!isOnline && (
        <div>
          <GroupLabel required>Do you reside in Ibadan?</GroupLabel>
          <div className="grid grid-cols-2 gap-3">
            <RadioCard
              value="true"
              label="Yes, I do"
              fieldName="located_in_ibadan"
              register={register}
              validation={{ required: "Please answer this question" }}
              hasError={!!errors.located_in_ibadan}
            />
            <RadioCard
              value="false"
              label="No, I'm visiting"
              fieldName="located_in_ibadan"
              register={register}
              validation={{ required: "Please answer this question" }}
              hasError={!!errors.located_in_ibadan}
            />
          </div>
          <FieldError message={errors.located_in_ibadan?.message} />
        </div>
      )}

      <div>
        <GroupLabel required>
          Would you like to attend another service with us?
        </GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: "Yes", label: "Yes!", description: "I'd love to come back" },
            { value: "Maybe", label: "Maybe", description: "I'm still deciding" },
            { value: "No", label: "Not for now", description: "Thanks for having me" },
          ].map((opt) => (
            <RadioCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              description={opt.description}
              fieldName="membership_interest"
              register={register}
              validation={{ required: "Please make a selection" }}
              hasError={!!errors.membership_interest}
            />
          ))}
        </div>
        <FieldError message={errors.membership_interest?.message} />
      </div>
    </div>
  );
}

// ── Step 4 — Details ─────────────────────────────────────────────────────────

export function Step5Details({ register, errors, control }: StepProps) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Tell Us More 📋"
        subtitle="Help us understand your background and spiritual journey."
      />

      <div>
        <Label htmlFor="address" required>Home Address</Label>
        <input
          id="address"
          type="text"
          placeholder="e.g. No. 5 Bodija, Ibadan"
          className={ic(!!errors.address)}
          {...register("address", { required: "Address is required" })}
        />
        <FieldError message={errors.address?.message} />
      </div>

      <div>
        <GroupLabel required>Date of Birth</GroupLabel>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="birth_month"
            defaultValue=""
            rules={{ required: "Month is required" }}
            render={({ field }) => (
              <Select
                aria-label="Birth month"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Month"
                className={ic(!!errors.birth_month)}
                options={["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => ({ value: m, label: m }))}
              />
            )}
          />
          <Controller
            control={control}
            name="birth_day"
            defaultValue=""
            rules={{ required: "Day is required" }}
            render={({ field }) => (
              <Select
                aria-label="Birth day"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Day"
                className={ic(!!errors.birth_day)}
                options={Array.from({ length: 31 }, (_, i) => i + 1).map((d) => ({ value: String(d), label: String(d) }))}
              />
            )}
          />
        </div>
        <FieldError message={errors.birth_month?.message ?? errors.birth_day?.message} />
      </div>

      <div>
        <Label htmlFor="occupation" required>Occupation</Label>
        <input
          id="occupation"
          type="text"
          placeholder="e.g. Software Engineer, Student, Teacher…"
          className={ic(!!errors.occupation)}
          {...register("occupation", { required: "Occupation is required" })}
        />
        <FieldError message={errors.occupation?.message} />
      </div>

      <div>
        <GroupLabel required>Are you born again?</GroupLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: "Yes", label: "Yes" },
            { value: "No", label: "No" },
            { value: "I'm not sure", label: "Not sure" },
          ].map((opt) => (
            <RadioCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              fieldName="born_again"
              register={register}
              validation={{ required: "Please make a selection" }}
              hasError={!!errors.born_again}
            />
          ))}
        </div>
        <FieldError message={errors.born_again?.message} />
      </div>
    </div>
  );
}

// ── Step 6 — Experience ───────────────────────────────────────────────────────

export function Step6Experience({ register, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Your Experience 🙏"
        subtitle="Tell us about today's service and how we can support you going forward."
      />

      <div>
        <Label htmlFor="service_experience" required>
          How was today's service for you?
        </Label>
        <textarea
          id="service_experience"
          rows={4}
          placeholder="Tell us about your experience at today's service — what stood out to you, how it made you feel, what you're taking away from it…"
          className={tc(!!errors.service_experience)}
          {...register("service_experience", {
            required: "Please share your experience",
            minLength: {
              value: 5,
              message: "Please share a bit more (at least 5 characters)",
            },
          })}
        />
        <FieldError message={errors.service_experience?.message} />
      </div>

      <div>
        <Label htmlFor="prayer_point">
          Prayer Request{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <textarea
          id="prayer_point"
          rows={3}
          placeholder="Is there anything specific you'd like us to pray about for you?"
          className={tc(!!errors.prayer_point)}
          {...register("prayer_point")}
        />
        <FieldError message={errors.prayer_point?.message} />
      </div>

      <div>
        <GroupLabel required>
          Would you like to join our WhatsApp community?
        </GroupLabel>
        <div className="grid grid-cols-2 gap-3">
          <RadioCard
            value="true"
            label="Yes, add me"
            fieldName="whatsapp_interest"
            register={register}
            validation={{ required: "Please make a selection" }}
            hasError={!!errors.whatsapp_interest}
          />
          <RadioCard
            value="false"
            label="No, thank you"
            fieldName="whatsapp_interest"
            register={register}
            validation={{ required: "Please make a selection" }}
            hasError={!!errors.whatsapp_interest}
          />
        </div>
        <FieldError message={errors.whatsapp_interest?.message} />
      </div>

      <div className="p-4 bg-[#F0FDF4] border border-green-200 rounded-xl">
        <p className="text-sm text-green-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Almost done! Review your answers then hit Submit below.
        </p>
      </div>
    </div>
  );
}
