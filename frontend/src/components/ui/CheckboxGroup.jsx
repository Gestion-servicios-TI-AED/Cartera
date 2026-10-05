import { useId } from 'react';
import { Checkbox } from './Checkbox.jsx';
import styles from './CheckboxGroup.module.css';

export function CheckboxGroup({ label, hint, options, value, onChange, selectAllLabel }) {
  const groupId = useId();
  const allSelected = options.length > 0 && options.every((option) => value.includes(option.value));

  function toggle(optionValue) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  }

  function toggleAll() {
    onChange(allSelected ? [] : options.map((option) => option.value));
  }

  return (
    <div className={styles.group} role="group" aria-labelledby={label ? `${groupId}-label` : undefined}>
      {(label || (selectAllLabel && options.length > 1)) && (
        <div className={styles.header}>
          <div>
            {label && (
              <span id={`${groupId}-label`} className={styles.label}>
                {label}
              </span>
            )}
            {hint && <p className={styles.hint}>{hint}</p>}
          </div>
          {selectAllLabel && options.length > 1 && (
            <Checkbox label={selectAllLabel} checked={allSelected} onChange={toggleAll} />
          )}
        </div>
      )}
      <div className={styles.grid}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            checked={value.includes(option.value)}
            onChange={() => toggle(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
