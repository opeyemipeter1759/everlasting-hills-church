"use client";

import RadioSelectForm from "@/components/form/useForm/RadioSelectForm";
import TextAreaForm from "@/components/form/TextAreaForm";
import InputForm from "@/components/form/useForm/InputForm";
import RadioForm from "@/components/form/useForm/RadioForm";
import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

export type FormValues = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  gender: string;
  how_did_you_learn: string;
  invited_by?: string;
  located_in_ibadan: boolean;
  membership_interest: string;
  address: string;
  date_of_birth: string;
  occupation: string;
  born_again: string;
  service_experience: string;
  prayer_point?: string;
  whatsapp_interest: boolean;
};

export type StepProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

export type Step2Props = StepProps & {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
};

export function Step1PersonalInfo({ register, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-[#24244e] text-2xl sm:text-3xl font-bold mb-4">
          Welcome Home! 👋
        </h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed text-base">
            We're thrilled to have you join us at{" "}
            <span className="font-bold text-church-maroon">
              Everlasting Hills Church, Ibadan
            </span>
            . We're focused on propagating and normalizing Kingdom Culture.
          </p>
          <p className="leading-relaxed text-sm text-gray-600">
            Let's start by getting to know you better.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InputForm
            label="First Name"
            name="first_name"
            register={register}
            error={errors.first_name?.message}
            placeholder="Enter your first name"
            required
            validationRules={{
              minLength: { value: 2, message: "First name must be at least 2 characters" },
            }}
          />
          <InputForm
            label="Last Name"
            name="last_name"
            register={register}
            error={errors.last_name?.message}
            placeholder="Enter your last name"
            required
            validationRules={{
              minLength: { value: 2, message: "Last name must be at least 2 characters" },
            }}
          />
        </div>

        <InputForm
          label="Phone Number"
          name="phone_number"
          type="tel"
          register={register}
          error={errors.phone_number?.message}
          placeholder="+234 800 000 0000"
          required
          validationRules={{
            pattern: {
              value: /^[\d\s\-\+\(\)]+$/,
              message: "Please enter a valid phone number",
            },
            minLength: { value: 7, message: "Phone number must be at least 7 digits" },
          }}
        />

        <InputForm
          label="Email Address (Optional)"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message}
          placeholder="you@example.com"
        />

        <div>
          <RadioForm
            label="Gender"
            name="gender"
            register={register}
            error={errors.gender?.message}
            required
            layout="grid"
            options={[
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export function Step2FriendFamilyLocation({
  watch,
  register,
  errors,
  setValue,
}: Step2Props) {
  const howDidYouLearn = watch("how_did_you_learn");

  return (
    <div className="space-y-6">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-[#24244e] text-2xl sm:text-3xl font-bold mb-3">
          How Did You Find Us? 🔍
        </h2>
        <p className="text-gray-600 text-sm">
          Help us understand how you came across Everlasting Hills Church.
        </p>
      </div>

      <div>
        <RadioSelectForm
          label="How did you learn about us?"
          name="how_did_you_learn"
          register={register as any}
          setValue={setValue}
          watch={watch}
          error={errors.how_did_you_learn?.message}
          required
          options={[
            { id: "Social Media", name: "Social Media", description: "Found us online" },
            { id: "Friend/Family", name: "Friend/Family", description: "Invited by someone" },
            { id: "Google Search", name: "Google Search", description: "Search engine" },
            { id: "Website", name: "Church Website", description: "Website visit" },
            { id: "Flyer", name: "Flyer/Poster", description: "Offline invite" },
          ]}
          enableOther
          otherLabel="Other"
          otherPlaceholder="Please specify"
        />
      </div>

      {howDidYouLearn === "Friend/Family" && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <InputForm
            label="Who invited you?"
            name="invited_by"
            register={register}
            error={errors.invited_by?.message}
            placeholder="Enter their name"
            required
          />
        </div>
      )}
    </div>
  );
}

export function Step3Interest({ register, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-[#24244e] text-2xl sm:text-3xl font-bold mb-3">
          Your Interest 💭
        </h2>
        <p className="text-gray-600 text-sm">
          Tell us a bit more about your situation and interests.
        </p>
      </div>

      <div className="space-y-5">
        <RadioForm
          label="Do you reside in Ibadan?"
          name="located_in_ibadan"
          register={register}
          error={errors.located_in_ibadan?.message}
          required
          layout="grid"
          options={[
            { value: true, label: "Yes, I'm local" },
            { value: false, label: "No, I'm visiting" },
          ]}
        />

        <RadioForm
          label="Are you interested in church membership?"
          name="membership_interest"
          register={register}
          error={errors.membership_interest?.message}
          required
          layout="grid"
          options={[
            { label: "Yes", value: "Yes" },
            { label: "Maybe", value: "Maybe" },
            { label: "No", value: "No" },
          ]}
        />
      </div>
    </div>
  );
}

export function Step4Details({ register, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-[#24244e] text-2xl sm:text-3xl font-bold mb-3">
          Tell Us More 📋
        </h2>
        <p className="text-gray-600 text-sm">
          Help us understand your background and spiritual journey.
        </p>
      </div>

      <div className="space-y-5">
        <InputForm
          label="Home Address"
          name="address"
          register={register}
          error={errors.address?.message}
          placeholder="Enter your address"
          required
        />
        
        <InputForm
          label="Date of Birth"
          name="date_of_birth"
          type="date"
          register={register}
          error={errors.date_of_birth?.message}
          required
        />
        
        <InputForm
          label="Occupation"
          name="occupation"
          register={register}
          error={errors.occupation?.message}
          placeholder="What do you do?"
          required
        />
        
        <RadioForm
          label="Are you born again?"
          name="born_again"
          register={register as any}
          error={errors.born_again?.message}
          required
          layout="grid"
          options={[
            { label: "Yes", value: "Yes" },
            { label: "No", value: "No" },
            { label: "Not sure", value: "I'm not sure" },
          ]}
        />
      </div>
    </div>
  );
}

export function Step5Experience({ register, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-[#24244e] text-2xl sm:text-3xl font-bold mb-3">
          Final Steps 🙏
        </h2>
        <p className="text-gray-600 text-sm">
          Share your spiritual journey and let us know how we can support you.
        </p>
      </div>

      <div className="space-y-5">
        <TextAreaForm
          label="Tell us about your church/service experience"
          name="service_experience"
          register={register}
          error={errors.service_experience?.message}
          rows={4}
          placeholder="Share your background and experience with church services..."
          required
        />
        
        <TextAreaForm
          label="Prayer Requests (Optional)"
          name="prayer_point"
          register={register}
          error={errors.prayer_point?.message}
          rows={3}
          placeholder="Is there anything specific you'd like us to pray about?"
        />
        
        <RadioForm
          label="Would you like to join our WhatsApp community?"
          name="whatsapp_interest"
          register={register}
          error={errors.whatsapp_interest?.message}
          required
          layout="grid"
          options={[
            { label: "Yes, add me", value: true },
            { label: "No, thank you", value: false },
          ]}
        />
      </div>

      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-sm text-green-800">
          ✓ You're almost done! Review your information and submit to complete your registration.
        </p>
      </div>
    </div>
  );
}
