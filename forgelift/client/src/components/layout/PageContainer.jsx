const sizes = {
  default: "max-w-7xl",
  wide: "max-w-[1500px]",
  full: "max-w-none"
};

const PageContainer = ({ children, size = "wide", className = "" }) => (
  <div className={`mx-auto w-full ${sizes[size] || sizes.wide} px-3 pb-28 pt-4 sm:px-5 sm:pt-6 lg:px-8 lg:pb-8 ${className}`}>
    {children}
  </div>
);

export default PageContainer;
