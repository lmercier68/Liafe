import React from 'react';
import InputComponent from './InputComponent';
import OutputComponent from './OutputComponent';

const CardT = ({ id }) => {
  return (
    <div style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
      <h3>Card {id}</h3>
      <InputComponent cardId={id} />
      <OutputComponent cardId={id} />
    </div>
  );
};

export default CardT;
