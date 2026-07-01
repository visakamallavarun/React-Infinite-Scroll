import React from "react";
import { Select, Typography, Flex, Checkbox } from "antd";
import { lookup } from "./GenericFilterBarProps";

const { Text } = Typography;

// Base props shared between single and multi mode
export interface LookupSelectBaseProps<T> {
  label: string;
  options: T[] | undefined;
  style?: React.CSSProperties;
  width?: number;
}

// Single-select variant
interface LookupSelectSingleProps<T> extends LookupSelectBaseProps<T> {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

// Multi-select variant
interface LookupSelectMultiProps<T> extends LookupSelectBaseProps<T> {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

// Combined discriminated union type
type LookupSelectProps<T> =
  | LookupSelectSingleProps<T>
  | LookupSelectMultiProps<T>;

const LookupSelect = <T extends string | lookup>(
  props: LookupSelectProps<T>,
) => {
  const { label, options, style, multiple, value, onChange } = props;

  const getKey = (item: T): string =>
    typeof item === "string" ? item : item.id.toString();

  const getValue = (item: T): string =>
    typeof item === "string" ? item : item.id.toString();

  const getLabel = (item: T): string =>
    typeof item === "string" ? item : item.description;

  const isSelected = (item: T): boolean => {
    const itemValue = getValue(item);
    return Array.isArray(value)
      ? value.includes(itemValue)
      : value === itemValue;
  };

  const handleChange = (val: string | string[]) => {
    if (multiple) {
      // TypeScript knows this is LookupSelectMultiProps
      (onChange as (v: string[]) => void)(val as string[]);
    } else {
      // TypeScript knows this is LookupSelectSingleProps
      (onChange as (v: string) => void)(val as string);
    }
  };

  return (
    <Flex vertical style={style}>
      <Text>{label}</Text>
      <Select
        mode={multiple ? "multiple" : undefined}
        placeholder={`Select ${label}`}
        value={value !== "" ? value : undefined}
        onChange={handleChange}
        optionLabelProp="label"
        menuItemSelectedIcon={null}
        showSearch
        popupMatchSelectWidth={false}
        filterOption={(input, option) =>
          typeof option?.label === "string" &&
          option.label.toLowerCase().includes(input.toLowerCase())
        }
      >
        {options?.map((item) => (
          <Select.Option
            key={getKey(item)}
            value={getValue(item)}
            label={getLabel(item)}
          >
            {multiple ? (
              <Checkbox checked={isSelected(item)}>{getLabel(item)}</Checkbox>
            ) : (
              getLabel(item)
            )}
          </Select.Option>
        ))}
      </Select>
    </Flex>
  );
};

export default LookupSelect;
