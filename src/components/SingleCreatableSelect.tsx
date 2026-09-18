import { type ReactNode, useMemo, useState } from "react";
import { Select } from "antd";

export type ValueOption = {
  label: string;
  value: string;
};

type SingleCreatableSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options: ValueOption[];
  placeholder: string;
  optionMode: "baseUrl" | "model";
  customLabel: string;
  prefixIcon?: ReactNode;
};

function SingleCreatableSelect({
  value,
  onChange,
  options,
  placeholder,
  optionMode,
  customLabel,
  prefixIcon,
}: SingleCreatableSelectProps) {
  const [searchValue, setSearchValue] = useState("");
  const normalizedValue = value?.trim();
  const mergedOptions = useMemo(() => {
    const next = [...options];
    const typed = searchValue.trim();
    const customValue = typed || normalizedValue;
    if (customValue && !next.some((option) => option.value === customValue)) {
      next.unshift({
        label: optionMode === "baseUrl" ? customLabel : customValue,
        value: customValue,
      });
    }
    return next;
  }, [customLabel, normalizedValue, optionMode, options, searchValue]);

  return (
    <div className="single-creatable-control">
      {prefixIcon && (
        <span className="single-creatable-prefix">{prefixIcon}</span>
      )}
      <Select
        showSearch
        allowClear
        size="large"
        value={value || undefined}
        searchValue={searchValue}
        placeholder={placeholder}
        optionFilterProp="value"
        optionLabelProp="value"
        onSearch={setSearchValue}
        onChange={(nextValue) => {
          onChange?.(nextValue || "");
          setSearchValue("");
        }}
        onInputKeyDown={(event) => {
          if (event.key !== "Enter") return;
          const typed = searchValue.trim();
          if (!typed) return;
          event.preventDefault();
          onChange?.(typed);
          setSearchValue("");
        }}
        onBlur={() => {
          const typed = searchValue.trim();
          if (typed) onChange?.(typed);
          setSearchValue("");
        }}
        options={mergedOptions}
        className="single-creatable-select"
        popupClassName="single-creatable-dropdown"
        optionRender={(option) => {
          const item = option.data as ValueOption;
          return (
            <div className="single-creatable-option">
              <span className="single-creatable-option-label">
                {optionMode === "baseUrl" ? item.label : item.value}
              </span>
              {optionMode === "baseUrl" && (
                <span className="single-creatable-option-value">
                  {item.value}
                </span>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

export default SingleCreatableSelect;
