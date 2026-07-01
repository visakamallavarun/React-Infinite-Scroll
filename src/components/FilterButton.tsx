import React from "react";
import { Button, Flex, Tooltip } from "antd";
import { AiOutlineReload } from "react-icons/ai";
import { TbFilterPlus } from "react-icons/tb";
import { LuFilterX } from "react-icons/lu";

type FilterActionsProps = {
  onApply: () => void;
  onRefresh: () => void;
  onReset: () => void;
};

const FilterActions: React.FC<FilterActionsProps> = ({
  onApply,
  onRefresh,
  onReset,
}) => {
  return (
    <Flex
      data-testid="filter-actions"
      justify="start"
      align="center"
      gap="very-small"
    >
      <Tooltip title="Apply Filters">
        <Button
          aria-label="Apply"
          onClick={onApply}
          style={{ marginTop: 20 }}
          icon={<TbFilterPlus />}
          data-testid="apply-button"
        />
      </Tooltip>
      <Tooltip title="Refresh">
        <Button
          aria-label="Refresh"
          onClick={onRefresh}
          style={{ marginTop: 20, marginLeft: 8 }}
          icon={<AiOutlineReload />}
          data-testid="refresh-button"
        />
      </Tooltip>
      <Tooltip title="Reset">
        <Button
          aria-label="Reset"
          onClick={onReset}
          style={{ marginTop: 20, marginLeft: 8 }}
          icon={<LuFilterX />}
          data-testid="reset-button"
        />
      </Tooltip>
    </Flex>
  );
};

export default FilterActions;
