import React, { useLayoutEffect, useRef } from "react";
import { Col, Row, Spin, Table, Typography } from "antd";
import type { TableProps } from "antd";
import type {
  InfiniteData,
  InfiniteQueryObserverResult,
  FetchNextPageOptions,
} from "@tanstack/react-query";
import useDynamicTableHeight from "../hooks/useDynamicTableHeight";
import type { ColumnGroupType, ColumnType } from "antd/es/table";
import { DEFAULT_MAX_PAGES } from "../App";

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

type TableColumn<T> = ColumnType<T> | ColumnGroupType<T>;

type InfiniteScrollTableProps<TItem extends object> = {
  data: InfiniteData<PaginatedResponse<TItem>, unknown> | undefined;
  loading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: (
    options?: FetchNextPageOptions,
  ) => Promise<
    InfiniteQueryObserverResult<
      InfiniteData<PaginatedResponse<TItem>, unknown>,
      Error
    >
  >;
  isFetchingPreviousPage: boolean;
  hasPreviousPage: boolean;
  fetchPreviousPage: (
    options?: FetchNextPageOptions,
  ) => Promise<
    InfiniteQueryObserverResult<
      InfiniteData<PaginatedResponse<TItem>, unknown>,
      Error
    >
  >;
  columns: TableProps<TItem>["columns"];
  rowKey: TableProps<TItem>["rowKey"];
  filterParams?: string;
  minHeight?: number;
  scrollX?: number | string;
} & Omit<
  TableProps<TItem>,
  "dataSource" | "columns" | "loading" | "pagination"
>;

const hideScrollbarThumbStyle = `
    .ant-table-tbody-virtual-scrollbar-horizontal {
      display: none !important;
    }
  `;

function getTableScrollX<T>(columns: TableColumn<T>[]): number {
  return columns.reduce((sum, column) => {
    if ("children" in column && column.children?.length) {
      return sum + getTableScrollX(column.children as TableColumn<T>[]);
    }

    const { width } = column;
    return typeof width === "number" ? sum + width : sum;
  }, 0);
}

export function InfiniteScrollTable<TItem extends object>({
  data,
  loading,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  fetchNextPage,
  fetchPreviousPage,
  columns,
  rowKey,
  filterParams,
  minHeight = 340,
  scrollX,
}: InfiniteScrollTableProps<TItem>) {
  const tableHeight = useDynamicTableHeight(minHeight);
  const resolvedScrollX =
    scrollX ?? (getTableScrollX(columns ?? []) || undefined);
  const tableBodyRef = useRef<HTMLDivElement | null>(null);
  const prevPageParams = useRef<number[]>([]);
  const scrollHeightRef = useRef<number>(0);
  const prevFilterParams = useRef<string | undefined>(undefined);

  const flattenedData = React.useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  useLayoutEffect(() => {
    if (
      !tableBodyRef.current ||
      filterParams != prevFilterParams.current ||
      prevFilterParams.current !== undefined
    ) {
      tableBodyRef.current = document.querySelector(
        ".ant-table-tbody-virtual-holder",
      ) as HTMLDivElement | null;
    }

    const tableBody = tableBodyRef.current;
    const pageParams = data?.pageParams as number[] | undefined;

    if (
      tableBody &&
      prevFilterParams.current !== undefined &&
      filterParams != prevFilterParams.current
    ) {
      tableBody.scrollTop = 0;
    }

    if (
      tableBody &&
      pageParams &&
      pageParams.length === DEFAULT_MAX_PAGES &&
      prevPageParams.current.length === DEFAULT_MAX_PAGES &&
      !isFetchingPreviousPage &&
      !isFetchingNextPage &&
      pageParams[0] !== prevPageParams.current[0]
    ) {
      const onePageScrollHeight = scrollHeightRef.current / DEFAULT_MAX_PAGES;
      if (pageParams[0] < prevPageParams.current[0]) {
        // Scroll restored after loading previous page
        tableBody.scrollTop = onePageScrollHeight;
      } else if (pageParams[0] > prevPageParams.current[0]) {
        // Scroll stays near bottom after loading next page
        tableBody.scrollTop =
          onePageScrollHeight * (DEFAULT_MAX_PAGES - 1) - 50;
      }
    }

    prevPageParams.current = pageParams ?? [];
    prevFilterParams.current = filterParams;
  }, [
    data?.pageParams,
    isFetchingNextPage,
    isFetchingPreviousPage,
    filterParams,
  ]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    scrollHeightRef.current = scrollHeight;

    if (
      scrollHeight - scrollTop - clientHeight < 50 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }

    if (scrollTop < 50 && hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  };

  return (
    <div className="infinite-table-container">
      {resolvedScrollX === undefined && (
        <style>{hideScrollbarThumbStyle}</style>
      )}
      <Table<TItem>
        virtual
        size="middle"
        bordered={true}
        rowKey={rowKey}
        columns={columns}
        dataSource={flattenedData}
        loading={loading}
        pagination={false}
        scroll={{ x: resolvedScrollX, y: tableHeight }}
        onScroll={handleTableScroll}
        footer={() => (
          <Row justify="space-between" align="middle">
            <Col>
              <Typography.Text>
                Total Records:{" "}
                {data?.pages?.[0]?.totalCount.toLocaleString() ?? 0}
              </Typography.Text>
            </Col>
            <Col>
              {(isFetchingNextPage || isFetchingPreviousPage) && (
                <Spin size="small"></Spin>
              )}
            </Col>
            <Col>
              <Typography.Text></Typography.Text>
            </Col>
          </Row>
        )}
      />
    </div>
  );
}
