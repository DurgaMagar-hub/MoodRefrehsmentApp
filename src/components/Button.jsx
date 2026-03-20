import styled from "styled-components";

const StyledButton = styled.button`
  border: none;
  outline: none;
  font-family: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  letter-spacing: -0.01em;
  
  /* Variant Styles */
  background: ${props =>
    props.$variant === 'secondary' ? 'var(--card-bg)' :
      props.$variant === 'ghost' ? 'transparent' :
        props.$variant === 'danger' ? '#ff7675' :
          'linear-gradient(135deg, var(--primary) 0%, #ff6b6b 100%)'
  };
  
  color: ${props =>
    props.$variant === 'secondary' ? 'var(--text-main)' :
      props.$variant === 'ghost' ? 'var(--text-main)' :
        'white'
  };

  padding: ${props => props.$size === 'small' ? '12px 24px' : '16px 32px'};
  border-radius: ${props => props.$fullRounded ? '50px' : '24px'};
  font-size: ${props => props.$size === 'small' ? '0.95rem' : '1.1rem'};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  
  /* Spatial Shadow & Border */
  box-shadow: ${props => props.$variant === 'primary' ? '0 10px 25px -5px rgba(255, 126, 95, 0.3)' : 'var(--shadow-sm)'};
  border: ${props => props.$variant === 'secondary' ? '1px solid var(--glass-border)' : 'none'};

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: ${props => props.$variant === 'primary' ? '0 20px 35px -8px rgba(255, 126, 95, 0.5)' : 'var(--shadow-lg)'};
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(-2px) scale(0.96);
    transition: all 0.2s ease-out;
  }

  /* Inner light reflection */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:hover::after {
    opacity: 1;
  }
`;

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  fullRounded = false,
  onClick,
  ...props
}) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $fullRounded={fullRounded}
      onClick={onClick}
      {...props}
    >
      {/* Shine effect on click could go here */}
      {children}
    </StyledButton>
  );
}
