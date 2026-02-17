export interface SpendProfile {
  id: string;
  name: string;
  monthlySpend: Record<string, number>;
}
