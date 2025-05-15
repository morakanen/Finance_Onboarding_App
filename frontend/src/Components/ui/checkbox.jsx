import React from "react";

/**
 * Simple controlled checkbox component compatible with react-hook-form
 * Props: checked (boolean), onCheckedChange (function), ...rest
 */
export const Checkbox = React.forwardRef(({ checked, onCheckedChange, ...rest }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    checked={!!checked}
    onChange={e => onCheckedChange?.(e.target.checked)}
    {...rest}
  />
));

Checkbox.displayName = "Checkbox";

export default Checkbox;
