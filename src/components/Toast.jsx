import React from 'react';
import './Toast.css';

// The status region stays mounted so screen readers announce content as it appears.
const Toast = ({ children }) => (
  <div className="toast-region" role="status">
    {children && <div className="toast">{children}</div>}
  </div>
);

export default Toast;
