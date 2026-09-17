import BookReader from "@/components/dashboard/member/books/BookReader";

export const metadata = { title: "Book — Dashboard" };

export default function BookPage({ params }: { params: { id: string } }) {
  return <BookReader id={params.id} />;
}
