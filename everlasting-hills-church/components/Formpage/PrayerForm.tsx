import Button from "@/components/ui/Button";
import TextAreaForm from "@/components/form/TextAreaForm";

export default function PrayerForm() {
  return (
    <div className="space-y-5 mt-5 text-gray-800 dark:text-gray-100">
      <h3 className="text-[24px] font-bold text-[#24244e] dark:text-gray-100">
        Prayer Request
      </h3>

      <h3 className="text-sm mt-2 text-gray-700 dark:text-gray-300">
        Send your prayer request(s), knowing that whatever we ask in His name,
        He will do it. Let's together glorify the Father through the power of
        prayer.
      </h3>

      <form className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
        <TextAreaForm
          label="What is your prayer request?"
          name="message"
          rows={6}
          placeholder="Type your message here..."
        />

        <Button
          className="mt-5 w-full md:w-auto"
          type="button"
          variant="primary"
        >
          Submit
        </Button>
      </form>
    </div>
  );
}