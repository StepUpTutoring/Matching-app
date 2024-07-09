import React, { useState, useEffect } from 'react';

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const backgroundColor = type === 'error' ? 'bg-red-500' : 
                          type === 'success' ? 'bg-green-500' : 
                          'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${backgroundColor} text-white px-4 py-2 rounded shadow-lg`}>
      {message}
    </div>
  );
};

export default Notification;