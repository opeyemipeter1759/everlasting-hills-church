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

type FormValues = {
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

type StepProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

type Step2Props = StepProps & {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
};

/**
 * Step 1
 */
export const Step1PersonalInfo = ({
  register,
  errors,
}: StepProps): JSX.Element => {
  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h1 className="text-[#24244e] dark:text-white text-xl md:text-2xl font-bold mb-3">
          We are glad to have you.
        </h1>

        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p className="leading-relaxed">
            Welcome Home! <br />
            Here at <strong>Glory Centre Community Church, Ibadan,</strong> we
            are focused on propagating and normalizing Kingdom Culture.
          </p>

          <p className="leading-relaxed">
            Kindly fill in your information below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputForm
          label="First Name"
          name="first_name"
          register={register}
          error={errors.first_name?.message}
          required
        />

        <InputForm
          label="Last Name"
          name="last_name"
          register={register}
          error={errors.last_name?.message}
          required
        />
      </div>

      <InputForm
        label="Phone Number"
        name="phone_number"
        register={register}
        error={errors.phone_number?.message}
        required
      />

      <InputForm
        label="Email"
        name="email"
        type="email"
        register={register}
        error={errors.email?.message}
      />

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
  );
};

/**
 * Step 2
 */
export const Step2FriendFamilyLocation = ({
  watch,
  register,
  errors,
  setValue,
}: Step2Props): JSX.Element => {
  const howDidYouLearn = watch("how_did_you_learn");

  return (
    <div className="space-y-5">
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

      {howDidYouLearn === "Friend/Family" && (
        <InputForm
          label="Who invited you?"
          name="invited_by"
          register={register}
          error={errors.invited_by?.message}
          required
        />
      )}
    </div>
  );
};

/**
 * Step 3
 */
export const Step3Interest = ({
  register,
  errors,
}: StepProps): JSX.Element => {
  return (
    <div className="space-y-5">
      <RadioForm
        label="Do you reside in Ibadan?"
        name="located_in_ibadan"
        register={register}
        error={errors.located_in_ibadan?.message}
        required
        layout="grid"
        options={[
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ]}
      />

      <RadioForm
        label="Membership interest"
        name="membership_interest"
        register={register}
        error={errors.membership_interest?.message}
        required
        options={[
          { label: "Yes", value: "Yes" },
          { label: "Maybe", value: "Maybe" },
          { label: "No", value: "No" },
        ]}
      />
    </div>
  );
};

/**
 * Step 4
 */
export const Step4Details = ({
  register,
  errors,
}: StepProps): JSX.Element => {
  return (
    <div className="space-y-5">
      <InputForm
        label="Address"
        name="address"
        register={register}
        error={errors.address?.message}
        required
      />

      <InputForm
        label="Date of Birth"
        name="date_of_birth"
        register={register}
        error={errors.date_of_birth?.message}
        required
      />

      <InputForm
        label="Occupation"
        name="occupation"
        register={register}
        error={errors.occupation?.message}
        required
      />

      <RadioForm
        label="Born again?"
        name="born_again"
        register={register as any}
        error={errors.born_again?.message}
        required
        options={[
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
          { label: "Not sure", value: "I'm not sure" },
        ]}
      />
    </div>
  );
};

/**
 * Step 5
 */
export const Step5Experience = ({
  register,
  errors,
}: StepProps): JSX.Element => {
  return (
    <div className="space-y-5">
      <TextAreaForm
        label="Service experience"
        name="service_experience"
        register={register}
        error={errors.service_experience?.message}
        required
      />

      <TextAreaForm
        label="Prayer point"
        name="prayer_point"
        register={register}
        error={errors.prayer_point?.message}
      />

      <RadioForm
        label="WhatsApp community?"
        name="whatsapp_interest"
        register={register}
        error={errors.whatsapp_interest?.message}
        required
        layout="grid"
        options={[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ]}
      />
    </div>
  );
};