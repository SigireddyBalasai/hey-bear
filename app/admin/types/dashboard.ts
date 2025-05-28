
export interface TimeSeriesDataPoint {
  date: string;
  interactions: number;
  tokens: number;
  costs: number;
  errors: number;
  activeUsers: number;
  inputTokens: number;
  outputTokens: number;
}

export interface SystemStats {
  interactions: number;
  tokens: number;
  costs: number;
  errors: number;
  activeUsers: number;
  inputTokens: number;
  outputTokens: number;
}

export interface DashboardStats {
  users: {
    total: number;
    activeToday: number;
    activeThisWeek: number;
  };
  usage: {
    totalMessages: number;
    tokensUsed: number;
    costEstimate: number;
  };
  usageChart: UsageChartDataPoint[];
}

export interface UsageChartDataPoint {
  date: string;
  count: number;
  tokens: number;
  cost: number;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension?: number;
  fill?: boolean;
  yAxisID?: string;
  borderRadius?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  scales: {
    y?: {
      beginAtZero: boolean;
      ticks?: {
        callback?: (value: number) => string;
      };
      title?: {
        display: boolean;
        text: string;
      };
    };
    y1?: {
      display: boolean;
      position: 'left' | 'right';
      grid?: {
        drawOnChartArea: boolean;
      };
      title?: {
        display: boolean;
        text: string;
      };
    };
  };
  plugins?: {
    legend?: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      callbacks?: {
        label?: (context: { raw: number }) => string | string[];
      };
      backgroundColor?: string;
      padding?: number;
      cornerRadius?: number;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  interaction?: {
    mode: 'index' | 'dataset' | 'nearest' | 'point' | 'x' | 'y';
    intersect: boolean;
  };
}

export interface UsageStats {
  totalStats: SystemStats;
  timeSeriesData: TimeSeriesDataPoint[];
  userStats: UserStat[];
}

export interface UserStat {
  userId: string;
  email: string;
  fullName: string;
  interactions: number;
  tokens: number;
  costs: number;
  percentage: number;
}
