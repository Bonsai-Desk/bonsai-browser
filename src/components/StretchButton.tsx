import styled from 'styled-components';

export const ButtonBase = styled.div`
  transition-duration: 0.1s;
  background-color: rgba(0, 0, 0, 0.25);
  color: rgba(0, 0, 0, 0.9);
  :hover {
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
  }
  :active {
    background-color: rgba(0, 0, 0, 0.75);
  }
`;

export const InertButtonStyle = {
  color: 'rgba(0, 0, 0, 0.25)',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  cursor: 'default',
};

export const Button = styled(ButtonBase)`
  border-radius: 10px;
  padding: 0 1.5rem 0 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  cursor: pointer;
  -webkit-user-select: none; /* Chrome all / Safari all */
  user-select: none; /* Likely future */
  height: 3rem;
  width: 4rem;
  justify-content: center;
`;

export const BlueButton = styled(Button)`
  color: white;
  background-color: #209756;
  :hover {
    background-color: hsla(147, 65%, 29%, 1);
  }
  :active {
    background-color: hsla(147, 65%, 22%, 1);
  }
`;
