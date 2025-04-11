interface ContainerProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  fullWidth = false,
}) => {
  return (
    <div className={`mx-auto ${fullWidth ? "w-full" : "max-w-7xl"}`}>
      {children}
    </div>
  );
};

export default Container;
