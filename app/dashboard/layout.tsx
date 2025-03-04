import { DataProvider } from './DataContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  );
}
