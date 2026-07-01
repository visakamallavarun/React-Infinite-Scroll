import { PaginatedResponse } from "../components/InfiniteScrollTable";

export interface User {
    id: number;
    name: string;
    email: string;
    department: string;
    status: "Active" | "Inactive" | "On Leave";
}

export interface UserFilters {
    name?: string;
    email?: string;
    department?: string;
    status?: string;
}

// Simple mock data
const users: User[] = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    department: ["Engineering", "Sales", "HR", "Marketing"][i % 4],
    status: ["Active", "Inactive", "On Leave"][i % 3] as "Active" | "Inactive" | "On Leave",
}));

// Mock API call - simple pagination
export const fetchUsers = async (
    page: number,
    signal: AbortSignal,
    pageSize: number = 15,
    filters: UserFilters = {}
): Promise<PaginatedResponse<User>> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (signal.aborted) throw new Error("Request cancelled");

    const filteredUsers = users.filter((user) => {
        const byName = !filters.name || user.name.toLowerCase().includes(filters.name.toLowerCase());
        const byEmail = !filters.email || user.email.toLowerCase().includes(filters.email.toLowerCase());
        const byDepartment = !filters.department || user.department === filters.department;
        const byStatus = !filters.status || user.status === filters.status;
        return byName && byEmail && byDepartment && byStatus;
    });

    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const items = filteredUsers.slice(startIdx, endIdx);

    return {
        items,
        page,
        pageSize,
        totalCount: filteredUsers.length,
        hasNextPage: endIdx < filteredUsers.length,
        hasPreviousPage: page > 1,
    };
};
