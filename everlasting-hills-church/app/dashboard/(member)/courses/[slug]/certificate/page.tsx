"use client";

import { useParams } from "next/navigation";
import CourseCertificateClient from "@/components/dashboard/member/courses/CourseCertificateClient";

export default function CourseCertificatePage() {
  const params = useParams();
  const slug = params.slug as string;

  return <CourseCertificateClient slug={slug} />;
}
