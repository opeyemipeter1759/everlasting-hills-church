import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import TextAreaForm from "@/components/form/TextAreaForm";

type QuestionFormValues = {
  message: string;
};

export default function QuestionForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionFormValues>();

  const onSubmit = (data: QuestionFormValues) => {
    console.log(data);
  };

  return (
    <div className="space-y-5 mt-5 text-gray-800 dark:text-gray-100">
      <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
        Dear Friend
      </h3>

      <h3 className="text-sm mt-2 text-gray-700 dark:text-gray-300">
        Feel free to ask as many questions as you have — Bible questions, life
        questions, or anything you haven’t gotten answers to. Just ask them all.
      </h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm"
      >
        <TextAreaForm
          label="What are your questions?"
          name="message"
          register={register}
          rows={6}
          required
          placeholder="Type your message here..."
          error={errors.message?.message}
        />

        <Button
          className="mt-5 w-full md:w-auto"
          type="submit"
          variant="primary"
        >
          Submit
        </Button>
      </form>
    </div>
  );
}