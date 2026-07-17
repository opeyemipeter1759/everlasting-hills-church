import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

interface DepartmentOption {
  id: string;
  name: string;
}

interface DepartmentsResponse {
  departments: DepartmentOption[];
}

export function useDepartmentOptions() {
  const { data } = useQuery({
    queryKey: ["departments", "options"],
    queryFn: () => api.get<DepartmentsResponse>("/departments"),
  });
  return data?.departments ?? [];
}
