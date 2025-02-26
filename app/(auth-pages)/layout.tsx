export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex flex-col gap-12 items-center justify-center w-full">
        {children}
      </div>
    </div>
  );
}
