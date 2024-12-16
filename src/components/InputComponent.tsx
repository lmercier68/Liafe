import React from 'react';
import useStore from './store';

const InputComponent = ({ cardId }) => {
  const addConnection = useStore((state) => state.addConnection);

  const handleClick = () => {
    addConnection(cardId);
  };

  return (
    <div
      style={{ width: '50px', height: '50px', backgroundColor: 'lightblue', margin: '10px' }}
      onClick={handleClick}
    >
      Input
    </div>
  );
};

export default InputComponent;
