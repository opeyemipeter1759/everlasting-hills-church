"use client";

import { useForm } from "react-hook-form";
import InputForm from "@/components/form/useForm/InputForm";
import Button from "../ui/Button";
import TextAreaForm from "@/components/form/TextAreaForm";

export default function TestimonyForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  return (
    <div className="mt-5 space-y-5 text-gray-800 dark:text-gray-100">
      <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
        Hi Friend
      </h3>

      <h3 className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        At the GCCC Ibadan, we have a culture of sharing with the family of God
        what the Lord has done.
      </h3>

      <form className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-2 mt-4">
          <InputForm
            label="Name"
            name="name"
            type="text"
            register={register}
            placeholder="Enter Your Name"
          />

          <InputForm
            label="Phone Number"
            name="phone_number"
            type="text"
            register={register}
            placeholder="Enter Your Phone Number"
          />

          <div className="md:col-span-2">
            <TextAreaForm
              label="What are your testimonies?"
              name="content"
              register={register}
              rows={6}
              placeholder="Type your testimonies here..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
              Do you want to share your testimony physically?{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col space-y-2">
              {["Yes", "No"].map((value) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    value={value}
                    {...register("sharePhysically")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            variant="primary"
            className="w-full md:w-auto"
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}