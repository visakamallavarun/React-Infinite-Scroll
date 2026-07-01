import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Layout,
  Space,
  Tag,
  Button,
  ConfigProvider,
  theme,
  Typography,
} from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { useState } from "react";
import { InfiniteScrollTable } from "./components/InfiniteScrollTable";
import {
  FilterConfig,
  FilterType,
  GenericFilterBar,
} from "./components/GenericFilterBarProps";
import { useGenericInfiniteQuery } from "./hooks/useGenericInfiniteQuery";
import { fetchUsers, UserFilters, type User } from "./services/mockData";
import "./App.css";

export const DEFAULT_MAX_PAGES = 10;
export const DEFAULT_PAGE_SIZE = 20;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

const columns: TableProps<User>["columns"] = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 70,
  },
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    width: 150,
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 220,
  },
  {
    title: "Department",
    dataIndex: "department",
    key: "department",
    width: 140,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) => {
      const colors: Record<string, string> = {
        Active: "green",
        Inactive: "red",
        "On Leave": "orange",
      };
      return <Tag color={colors[status]}>{status}</Tag>;
    },
  },
];

const departmentOptions = [
  { id: 0, description: "All" },
  { id: 1, description: "Engineering" },
  { id: 2, description: "Sales" },
  { id: 3, description: "HR" },
  { id: 4, description: "Marketing" },
];

const statusOptions = [
  { id: 1, description: "Active" },
  { id: 2, description: "Inactive" },
  { id: 3, description: "On Leave" },
];

const filterConfig: FilterConfig<UserFilters>[] = [
  {
    type: FilterType.Text,
    name: "name",
    label: "Name",
    placeholder: "Search by name",
  },
  {
    type: FilterType.Text,
    name: "email",
    label: "Email",
    placeholder: "Search by email",
  },
  {
    type: FilterType.MultiSelect,
    name: "department",
    label: "Department",
    options: departmentOptions,
  },
  {
    type: FilterType.Select,
    name: "status",
    label: "Status",
    options: statusOptions,
  },
];

const defaultFilters: UserFilters = {
  name: "",
  email: "",
  department: "0",
  status: "",
};

function AppContent() {
  const [isDark, setIsDark] = useState(true);
  const [filterValues, setFilterValues] = useState<UserFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<UserFilters>(defaultFilters);

  const selectedDepartment = departmentOptions.find(
    (item) => item.id.toString() === appliedFilters.department,
  )?.description;

  const selectedStatus = statusOptions.find(
    (item) => item.id.toString() === appliedFilters.status,
  )?.description;

  const query = useGenericInfiniteQuery({
    queryKey: ["users", appliedFilters],
    fetchFn: (pageParam, signal) =>
      fetchUsers(pageParam, signal, DEFAULT_PAGE_SIZE, {
        name: appliedFilters.name,
        email: appliedFilters.email,
        department:
          selectedDepartment && selectedDepartment !== "All"
            ? selectedDepartment
            : "",
        status:
          selectedStatus && selectedStatus !== "All" ? selectedStatus : "",
      }),
    enabled: true,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isFetchingPreviousPage,
    hasPreviousPage,
    fetchPreviousPage,
  } = query;

  const themeConfig = isDark
    ? {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#4f46e5",
          borderRadius: 10,
        },
      }
    : {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#4f46e5",
          borderRadius: 10,
        },
      };

  return (
    <ConfigProvider theme={themeConfig}>
      <Layout className={`app-page ${isDark ? "theme-dark" : "theme-light"}`}>
        <Layout.Header className="app-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography.Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.9,
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              Dashboard
            </Typography.Text>
            <Typography.Title
              level={4}
              className="app-title"
              style={{ margin: 0, color: isDark ? "#f3f4f6" : "#111827" }}
            >
              User Management
            </Typography.Title>
            <Typography.Text
              className="app-subtitle"
              style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
            >
              Infinite scroll with quick filters
            </Typography.Text>
          </div>
          <Button
            type="default"
            icon={<BgColorsOutlined />}
            onClick={() => setIsDark(!isDark)}
            className="mode-button"
          >
            {isDark ? "Light mode" : "Dark mode"}
          </Button>
        </Layout.Header>

        <Layout.Content className="app-main">
          <Space
            direction="vertical"
            style={{ width: "100%", display: "flex", minHeight: 0 }}
            size="large"
          >
            <GenericFilterBar<UserFilters>
              config={filterConfig}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              getFilterValues={(values) => setAppliedFilters(values)}
              onRefresh={() => query.refetch()}
              onReset={() => {
                setFilterValues(defaultFilters);
                setAppliedFilters(defaultFilters);
              }}
            />
            <InfiniteScrollTable<User>
              data={data}
              loading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingPreviousPage={isFetchingPreviousPage}
              hasPreviousPage={hasPreviousPage}
              fetchPreviousPage={fetchPreviousPage}
              columns={columns}
              rowKey="id"
              filterParams={JSON.stringify(appliedFilters)}
            />
          </Space>
        </Layout.Content>
      </Layout>
      <ReactQueryDevtools initialIsOpen={false} />
    </ConfigProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
