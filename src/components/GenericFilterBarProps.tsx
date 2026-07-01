import { Card, Col, Flex, Input, Row, Typography, DatePicker } from "antd";
import { ReactNode } from "react";
import dayjs, { Dayjs } from "dayjs";
import React from "react";
import { ColProps, InputProps } from "antd";
import LookupSelect from "./LookupSelected";
import FilterActions from "./FilterButton";

export interface lookup {
  id: number;
  description: string;
}

export enum FilterType {
  Text = "text",
  Select = "select",
  MultiSelect = "multi-select",
  DateRange = "date-range",
}

export type FilterValue = string | string[] | undefined;

type BaseFilterConfig<T> = {
  name: Extract<keyof T, string>;
  label: string;
  placeholder?: string;
  style?: React.CSSProperties;
  colSpan?: ColProps;
};

type TextFilterConfig<T> = BaseFilterConfig<T> & {
  type: FilterType.Text;
  inputProps?: Partial<InputProps>;
};
type SelectFilterConfig<T> = BaseFilterConfig<T> & {
  type: FilterType.Select;
  options: (string | lookup)[];
};
type MultiSelectFilterConfig<T> = BaseFilterConfig<T> & {
  type: FilterType.MultiSelect;
  options: (string | lookup)[];
};
type DateRangeFilterConfig<T> = BaseFilterConfig<{
  [FilterType.DateRange]: string;
}> & {
  type: FilterType.DateRange;
  startDateName: keyof T;
  endDateName: keyof T;
};

export type FilterConfig<T> =
  | TextFilterConfig<T>
  | SelectFilterConfig<T>
  | MultiSelectFilterConfig<T>
  | DateRangeFilterConfig<T>;

const { RangePicker } = DatePicker;

const defaultColSpans = {
  [FilterType.Text]: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 3 },
  [FilterType.Select]: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 3 },
  [FilterType.MultiSelect]: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 3 },
  [FilterType.DateRange]: { xs: 24, sm: 12, md: 8, lg: 8, xl: 5, xxl: 4 }, // More space for DateRange
};

interface GenericFilterBarProps<T> {
  config: FilterConfig<T>[];
  filterValues: T;
  setFilterValues: React.Dispatch<React.SetStateAction<T>>;
  getFilterValues: (values: T) => void;
  onRefresh: () => void;
  onReset: () => void;
  customElements?: ReactNode[];
}

export function GenericFilterBar<T>({
  config,
  filterValues,
  setFilterValues,
  getFilterValues,
  onRefresh,
  onReset,
  customElements,
}: GenericFilterBarProps<T>) {
  const renderFilterInput = (item: FilterConfig<T>) => {
    switch (item.type) {
      case FilterType.Text:
        return (
          <Flex vertical>
            <Typography.Text>{item.label}</Typography.Text>
            <Input
              placeholder={item.placeholder || `Search ${item.label}`}
              value={filterValues[item.name as keyof T] as string | number}
              onChange={(e) =>
                onFilterChange(item.name as keyof T, e.target.value)
              }
              allowClear
              {...item.inputProps}
            />
          </Flex>
        );

      case FilterType.Select:
        return (
          <LookupSelect<lookup>
            label={item.label}
            value={filterValues[item.name as keyof T] as string}
            onChange={(value) => onFilterChange(item.name as keyof T, value)}
            options={item.options as lookup[]}
          />
        );

      case FilterType.MultiSelect: {
        const isStringArray = typeof item.options?.[0] === "string";
        return isStringArray ? (
          <LookupSelect<string>
            label={item.label}
            value={filterValues[item.name as keyof T] as string[]}
            onChange={(value) =>
              onFilterChange(
                item.name as keyof T,
                applySelectionRules(value, "All"),
              )
            }
            options={item.options as string[]}
            multiple
          />
        ) : (
          <LookupSelect<lookup>
            label={item.label}
            value={filterValues[item.name as keyof T] as string[]}
            onChange={(value) =>
              onFilterChange(
                item.name as keyof T,
                applySelectionRules(value, "0"),
              )
            }
            options={item.options as lookup[]}
            multiple
          />
        );
      }
      case FilterType.DateRange: {
        const startDate = filterValues[item.startDateName as keyof T]
          ? dayjs(filterValues[item.startDateName as keyof T] as string)
          : null;
        const endDate = filterValues[item.endDateName as keyof T]
          ? dayjs(filterValues[item.endDateName as keyof T] as string)
          : null;
        const dateRangeValue: [Dayjs | null, Dayjs | null] = [
          startDate,
          endDate,
        ];

        return (
          <Flex vertical>
            <Typography.Text>{item.label}</Typography.Text>
            <RangePicker
              value={dateRangeValue}
              onChange={(dates) => {
                const [start, end] = dates || [null, null];
                onFilterChange(
                  item.startDateName as keyof T,
                  start ? start.format("MM-DD-YYYY") : "",
                );
                onFilterChange(
                  item.endDateName as keyof T,
                  end ? end.format("MM-DD-YYYY") : "",
                );
              }}
            />
          </Flex>
        );
      }
    }
  };

  function applySelectionRules(value: string[], allValue: string): string[] {
    if (value.length === 0 || value[value.length - 1] === allValue) {
      return [allValue];
    } else if (value.length > 1 && value.includes(allValue)) {
      return value.filter((v) => v !== allValue);
    } else {
      return value;
    }
  }

  const onFilterChange = (name: keyof T, value: FilterValue) => {
    setFilterValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onApply = () => {
    const apiFilterValues = Object.entries(
      filterValues as Record<string, FilterValue>,
    ).reduce((item, [key, value]) => {
      if (Array.isArray(value)) {
        const filtered = value
          .filter((v) => v !== "All" && v !== "0")
          .join(",");
        item[key as keyof T] = filtered as T[keyof T];
      } else if (typeof value === "string") {
        item[key as keyof T] = (
          value === "All" || value === "0" ? "" : value
        ) as T[keyof T];
      }
      return item;
    }, {} as T);

    getFilterValues(apiFilterValues);
    setFilterValues({ ...filterValues });
  };

  const isCustomPresent = !!customElements;

  const leftColSpan = {
    xs: 24,
    sm: 24,
    md: isCustomPresent ? 20 : 24,
    lg: isCustomPresent ? 20 : 24,
  };

  const rightColSpan = {
    xs: 24,
    sm: 24,
    md: 4,
    lg: 4,
  };

  return (
    <Card className="card-style">
      <Row gutter={4} align="bottom">
        <Col {...leftColSpan}>
          <Row gutter={[8, 8]}>
            {config.map((item, index) => (
              <Col
                {...(item.colSpan ||
                  defaultColSpans[item.type] || {
                    xs: 24,
                    sm: 12,
                    md: 8,
                    lg: 6,
                    xl: 4,
                  })}
                key={index}
                style={item.style}
              >
                {renderFilterInput(item)}
              </Col>
            ))}
            <Col>
              <FilterActions
                onApply={onApply}
                onRefresh={onRefresh}
                onReset={onReset}
              />
            </Col>
          </Row>
        </Col>
        {isCustomPresent && (
          <Col {...rightColSpan}>
            <Flex justify="flex-end" align="center" gap="small">
              {customElements.map((element, index) => (
                <React.Fragment key={index}>{element}</React.Fragment>
              ))}
            </Flex>
          </Col>
        )}
      </Row>
    </Card>
  );
}
