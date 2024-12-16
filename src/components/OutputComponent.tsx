import React from 'react';
import useStore from './store';

const OutputComponent = ({ cardId }) => {
  const setActiveOutput = useStore((state) => state.setActiveOutput);

  const handleClick = () => {
    setActiveOutput(cardId);
  };

  return (
    <div
      style={{ width: '50px', height: '50px', backgroundColor: 'lightcoral', margin: '10px' }}
      onClick={handleClick}
    >
      Output
    </div>
  );
};

export default OutputComponent;
